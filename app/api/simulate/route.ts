import { NextRequest, NextResponse } from "next/server";
import { sha256 } from "@/lib/hash";
import { consumeRateLimit, type RateLimitResult } from "@/lib/rate-limit";
import {
  KEYED_SIM_RATE_LIMIT_MAX,
  PUBLIC_SIM_RATE_LIMIT_MAX,
  validateApiKey,
} from "@/lib/api-keys";
import { recordUsage } from "@/lib/usage-meter";
import { isSimRequest, normalizeSimRequest, type SimRequest } from "@/lib/simulator";

const MAX_BODY_BYTES = 32 * 1024;
const FIREWALL_TIMEOUT_MS = 8_000;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

type ApproveResponse = {
  decision?: string;
  reasons?: string[];
  content_hash?: string;
  receipt_hash?: string;
  policy_hash?: string;
  params?: Record<string, unknown>;
  [key: string]: unknown;
};

function rateLimitHeaders(rateLimit: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(rateLimit.limit),
    "X-RateLimit-Remaining": String(rateLimit.remaining),
    "X-RateLimit-Reset": String(rateLimit.resetEpochSeconds),
  };
}

function methodNotAllowed(rateLimit: RateLimitResult) {
  return NextResponse.json(
    {
      ok: false,
      error: "method_not_allowed",
      message: "Only POST is supported for this endpoint.",
    },
    {
      status: 405,
      headers: {
        ...NO_STORE_HEADERS,
        ...rateLimitHeaders(rateLimit),
      },
    },
  );
}

function getRequestIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
}

function getPublicRateLimit(request: NextRequest): RateLimitResult {
  const ipKey = `simulate:public:${sha256(getRequestIp(request))}`;
  return consumeRateLimit(ipKey, {
    max: PUBLIC_SIM_RATE_LIMIT_MAX,
    windowMs: 60_000,
  });
}

function getKeyedRateLimit(apiKeyId: string): RateLimitResult {
  return consumeRateLimit(`simulate:key:${apiKeyId}`, {
    max: KEYED_SIM_RATE_LIMIT_MAX,
    windowMs: 60_000,
  });
}

function getFirewallApiBaseUrl(): string | null {
  const baseUrl = process.env.FIREWALL_API_BASE_URL?.trim();
  if (!baseUrl) {
    return null;
  }

  return baseUrl.replace(/\/+$/, "");
}

function mapDecisionToStatus(decision: string | undefined): "allowed" | "denied" {
  if (!decision) {
    return "denied";
  }

  return decision.toLowerCase() === "approve" || decision.toLowerCase() === "allowed" ? "allowed" : "denied";
}

function buildApproveRequest(input: SimRequest): Record<string, unknown> {
  const normalized = normalizeSimRequest(input);

  return {
    action: normalized.action,
    token_in: normalized.token_in,
    token_out: normalized.token_out,
    amount: normalized.amount,
    max_slippage_bps: normalized.max_slippage_bps,
    ttl_seconds: normalized.ttl_seconds,
  };
}

function parseBodySize(contentLengthValue: string | null): number | null {
  if (!contentLengthValue) {
    return null;
  }

  const parsed = Number(contentLengthValue);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

async function parseJsonBody(request: NextRequest): Promise<{ body: unknown } | { error: string; message: string }> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return {
      error: "invalid_content_type",
      message: "Content-Type must be application/json.",
    };
  }

  const contentLength = parseBodySize(request.headers.get("content-length"));
  if (contentLength !== null && contentLength > MAX_BODY_BYTES) {
    return {
      error: "payload_too_large",
      message: "Request body exceeds the 32KB limit.",
    };
  }

  let text = "";
  try {
    text = await request.text();
  } catch {
    return {
      error: "invalid_json",
      message: "Request body must be valid JSON.",
    };
  }

  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    return {
      error: "payload_too_large",
      message: "Request body exceeds the 32KB limit.",
    };
  }

  try {
    return {
      body: JSON.parse(text),
    };
  } catch {
    return {
      error: "invalid_json",
      message: "Request body must be valid JSON.",
    };
  }
}

async function callFirewallApprove(payload: Record<string, unknown>): Promise<
  { ok: true; response: ApproveResponse } | { ok: false; status: number; error: string; message: string }
> {
  const baseUrl = getFirewallApiBaseUrl();
  if (!baseUrl) {
    return {
      ok: false,
      status: 503,
      error: "firewall_api_unconfigured",
      message: "Firewall API base URL is not configured.",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FIREWALL_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const firewallApiKey = process.env.FIREWALL_API_API_KEY?.trim();
    if (firewallApiKey) {
      headers.Authorization = `Bearer ${firewallApiKey}`;
      headers["x-api-key"] = firewallApiKey;
    }

    const response = await fetch(`${baseUrl}/v1/intents/approve`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: "no-store",
    });

    let responseBody: unknown = null;
    try {
      responseBody = await response.json();
    } catch {
      responseBody = null;
    }

    if (!response.ok) {
      const message =
        typeof responseBody === "object" && responseBody && typeof (responseBody as { message?: unknown }).message === "string"
          ? String((responseBody as { message?: string }).message)
          : "Firewall API request failed.";
      return {
        ok: false,
        status: 502,
        error: "firewall_api_error",
        message,
      };
    }

    return {
      ok: true,
      response: (responseBody ?? {}) as ApproveResponse,
    };
  } catch {
    return {
      ok: false,
      status: 502,
      error: "firewall_api_unreachable",
      message: "Unable to reach firewall API.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: NextRequest) {
  let usageApiKeyId: string | null = null;
  const endpoint = "/api/simulate";
  let activeRateLimit = getPublicRateLimit(request);
  let retryAfterSeconds: number | null = null;

  const respond = async (
    status: number,
    body: {
      ok: boolean;
      error?: string;
      message?: string;
      retry_after_seconds?: number;
      input?: unknown;
      result?: unknown;
      decision?: string;
      reasons?: string[];
      content_hash?: string;
      receipt_hash?: string;
      policy_hash?: string;
      params?: Record<string, unknown>;
    },
  ) => {
    await recordUsage({ apiKeyId: usageApiKeyId, endpoint });
    return NextResponse.json(body, {
      status,
      headers: {
        ...NO_STORE_HEADERS,
        ...rateLimitHeaders(activeRateLimit),
        ...(retryAfterSeconds ? { "Retry-After": String(retryAfterSeconds) } : {}),
      },
    });
  };

  const rawApiKey = request.headers.get("x-api-key")?.trim();

  if (rawApiKey) {
    const keyRecord = await validateApiKey(rawApiKey);
    if (keyRecord) {
      usageApiKeyId = keyRecord.id;
      activeRateLimit = getKeyedRateLimit(usageApiKeyId);
    }
  }

  if (activeRateLimit.exceeded) {
    retryAfterSeconds = Math.max(activeRateLimit.resetEpochSeconds - Math.floor(Date.now() / 1000), 1);
    return respond(429, {
      ok: false,
      error: "rate_limited",
      message: "Rate limit exceeded. Please retry after the reset window.",
      retry_after_seconds: retryAfterSeconds,
    });
  }

  if (rawApiKey && !usageApiKeyId) {
    return respond(401, {
      ok: false,
      error: "invalid_api_key",
      message: "The provided API key is invalid.",
    });
  }

  const parsed = await parseJsonBody(request);
  if ("error" in parsed) {
    return respond(parsed.error === "payload_too_large" ? 413 : 400, {
      ok: false,
      error: parsed.error,
      message: parsed.message,
    });
  }

  const body = parsed.body;

  if (!isSimRequest(body)) {
    return respond(400, {
      ok: false,
      error: "invalid_request",
      message: "Request body does not match the simulator schema.",
    });
  }

  const requestBody = normalizeSimRequest(body);
  const approveRequest = buildApproveRequest(requestBody);
  const firewallResponse = await callFirewallApprove(approveRequest);

  if (!firewallResponse.ok) {
    return respond(firewallResponse.status, {
      ok: false,
      error: firewallResponse.error,
      message: firewallResponse.message,
      input: requestBody,
    });
  }

  const decision = firewallResponse.response.decision;
  const reasons = Array.isArray(firewallResponse.response.reasons) ? firewallResponse.response.reasons : [];
  const receiptHash =
    typeof firewallResponse.response.receipt_hash === "string" ? firewallResponse.response.receipt_hash : undefined;

  const result = {
    status: mapDecisionToStatus(decision),
    reason: reasons[0] ?? (decision ? `Decision: ${decision}` : "Decision returned by firewall API."),
    invariant_checks: reasons,
    receipt_hash: receiptHash ?? "",
    decision,
    reasons,
    content_hash:
      typeof firewallResponse.response.content_hash === "string" ? firewallResponse.response.content_hash : undefined,
    policy_hash: typeof firewallResponse.response.policy_hash === "string" ? firewallResponse.response.policy_hash : undefined,
    params:
      typeof firewallResponse.response.params === "object" && firewallResponse.response.params
        ? firewallResponse.response.params
        : undefined,
  };

  return respond(200, {
    ok: true,
    input: requestBody,
    result,
    decision,
    reasons,
    content_hash:
      typeof firewallResponse.response.content_hash === "string" ? firewallResponse.response.content_hash : undefined,
    receipt_hash: receiptHash,
    policy_hash: typeof firewallResponse.response.policy_hash === "string" ? firewallResponse.response.policy_hash : undefined,
    params:
      typeof firewallResponse.response.params === "object" && firewallResponse.response.params
        ? firewallResponse.response.params
        : undefined,
  });
}

export async function GET() {
  return methodNotAllowed({
    limit: PUBLIC_SIM_RATE_LIMIT_MAX,
    remaining: PUBLIC_SIM_RATE_LIMIT_MAX,
    resetEpochSeconds: Math.ceil((Date.now() + 60_000) / 1000),
    exceeded: false,
  });
}

export async function PUT() {
  return methodNotAllowed({
    limit: PUBLIC_SIM_RATE_LIMIT_MAX,
    remaining: PUBLIC_SIM_RATE_LIMIT_MAX,
    resetEpochSeconds: Math.ceil((Date.now() + 60_000) / 1000),
    exceeded: false,
  });
}

export async function PATCH() {
  return methodNotAllowed({
    limit: PUBLIC_SIM_RATE_LIMIT_MAX,
    remaining: PUBLIC_SIM_RATE_LIMIT_MAX,
    resetEpochSeconds: Math.ceil((Date.now() + 60_000) / 1000),
    exceeded: false,
  });
}

export async function DELETE() {
  return methodNotAllowed({
    limit: PUBLIC_SIM_RATE_LIMIT_MAX,
    remaining: PUBLIC_SIM_RATE_LIMIT_MAX,
    resetEpochSeconds: Math.ceil((Date.now() + 60_000) / 1000),
    exceeded: false,
  });
}
import { NextRequest, NextResponse } from "next/server";
import { sha256 } from "@/lib/hash";
import { consumeRateLimit, type RateLimitResult } from "@/lib/rate-limit";
import {
  KEYED_SIM_RATE_LIMIT_MAX,
  PUBLIC_SIM_RATE_LIMIT_MAX,
  validateApiKey,
} from "@/lib/api-keys";
import { recordUsage } from "@/lib/usage-meter";
import { isSimRequest, normalizeSimRequest, simulatePolicy } from "@/lib/simulator";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return respond(400, {
      ok: false,
      error: "invalid_json",
      message: "Request body must be valid JSON.",
    });
  }

  if (!isSimRequest(body)) {
    return respond(400, {
      ok: false,
      error: "invalid_request",
      message: "Request body does not match the simulator schema.",
    });
  }

  const requestBody = normalizeSimRequest(body);
  const result = simulatePolicy(requestBody);
  return respond(200, {
    ok: true,
    input: requestBody,
    result,
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
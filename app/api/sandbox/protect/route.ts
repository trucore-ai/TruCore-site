import { NextRequest, NextResponse } from "next/server";
import { sha256 } from "@/lib/hash";
import { consumeRateLimit } from "@/lib/rate-limit";
import { logSecurityEvent, shouldTriggerRouteFailureAlert, getCustomerRouteFailureCounts } from "@/lib/security-log";
import { sendRouteFailureAlert } from "@/lib/ops-alerts";

const TIMEOUT_MS = 8_000;
const RATE_LIMIT_MAX = 20; // per IP per minute
const MAX_BODY_BYTES = 32 * 1024;
const NO_STORE = { "Cache-Control": "no-store" };

function getAtfApiBase(): string {
  return (
    process.env.FIREWALL_API_BASE_URL?.replace(/\/+$/, "") ??
    process.env.NEXT_PUBLIC_ATF_API_URL?.replace(/\/+$/, "") ??
    "https://api.trucore.xyz"
  );
}

function getRequestIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: NextRequest) {
  const ip = getRequestIp(req);
  const rl = consumeRateLimit(`sandbox:protect:${sha256(ip)}`, {
    max: RATE_LIMIT_MAX,
    windowMs: 60_000,
  });

  if (rl.exceeded) {
    return NextResponse.json(
      {
        error: "rate_limited",
        message: "Rate limit reached. Please wait a moment and try again.",
      },
      { status: 429, headers: NO_STORE },
    );
  }

  const ct = req.headers.get("content-type") ?? "";
  if (!ct.toLowerCase().includes("application/json")) {
    return NextResponse.json(
      {
        error: "invalid_content_type",
        message: "Content-Type must be application/json.",
      },
      { status: 400, headers: NO_STORE },
    );
  }

  let bodyText: string;
  try {
    bodyText = await req.text();
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Could not read request body." },
      { status: 400, headers: NO_STORE },
    );
  }

  if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      {
        error: "payload_too_large",
        message: "Request body exceeds the 32KB limit.",
      },
      { status: 413, headers: NO_STORE },
    );
  }

  try {
    JSON.parse(bodyText);
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Request body must be valid JSON." },
      { status: 400, headers: NO_STORE },
    );
  }

  const upstream = `${getAtfApiBase()}/sandbox/protect`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(upstream, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: bodyText,
      signal: controller.signal,
    });
    clearTimeout(timer);
    const body = await res.text();
    if (!res.ok) {
      const failureClass = res.status >= 500 ? "upstream_5xx" : "upstream_4xx";
      logSecurityEvent("customer_route_failure", {
        ip,
        meta: {
          route: "sandbox/protect",
          upstream_target: "atf-api",
          failure_class: failureClass,
          status: res.status,
          environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
        },
      });
      if (shouldTriggerRouteFailureAlert("sandbox/protect")) {
        try {
          const counts = getCustomerRouteFailureCounts();
          await sendRouteFailureAlert("sandbox/protect", failureClass, {
            countInWindow: counts["sandbox/protect"] ?? 0,
          });
        } catch {
          console.error("[ops-alert] alert send failed for sandbox/protect");
        }
      }
    }
    return new NextResponse(body, {
      status: res.status,
      headers: {
        "Content-Type":
          res.headers.get("content-type") ?? "application/json",
        ...NO_STORE,
      },
    });
  } catch {
    clearTimeout(timer);
    logSecurityEvent("customer_route_failure", {
      ip,
      meta: {
        route: "sandbox/protect",
        upstream_target: "atf-api",
        failure_class: "network_error",
        environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
      },
    });
    if (shouldTriggerRouteFailureAlert("sandbox/protect")) {
      try {
        const counts = getCustomerRouteFailureCounts();
        await sendRouteFailureAlert("sandbox/protect", "network_error", {
          countInWindow: counts["sandbox/protect"] ?? 0,
        });
      } catch {
        console.error("[ops-alert] alert send failed for sandbox/protect");
      }
    }
    return NextResponse.json(
      {
        error: "upstream_unavailable",
        message: "The ATF sandbox API is temporarily unavailable.",
      },
      { status: 502, headers: NO_STORE },
    );
  }
}

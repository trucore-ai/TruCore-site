import { NextRequest, NextResponse } from "next/server";
import { sha256 } from "@/lib/hash";
import { consumeRateLimit } from "@/lib/rate-limit";
import { logSecurityEvent, shouldTriggerRouteFailureAlert, getCustomerRouteFailureCounts } from "@/lib/security-log";
import { sendRouteFailureAlert } from "@/lib/ops-alerts";

const TIMEOUT_MS = 8_000;
const RATE_LIMIT_MAX = 20; // per IP per minute
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

export async function GET(req: NextRequest) {
  const ip = getRequestIp(req);
  const rl = consumeRateLimit(`sandbox:sample-intent:${sha256(ip)}`, {
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

  const upstream = `${getAtfApiBase()}/sandbox/sample-intent`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(upstream, { signal: controller.signal });
    clearTimeout(timer);
    const body = await res.text();
    if (!res.ok) {
      const failureClass = res.status >= 500 ? "upstream_5xx" : "upstream_4xx";
      logSecurityEvent("customer_route_failure", {
        ip,
        meta: {
          route: "sandbox/sample-intent",
          upstream_target: "atf-api",
          failure_class: failureClass,
          status: res.status,
          environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
        },
      });
      if (shouldTriggerRouteFailureAlert("sandbox/sample-intent")) {
        try {
          const counts = getCustomerRouteFailureCounts();
          await sendRouteFailureAlert("sandbox/sample-intent", failureClass, {
            countInWindow: counts["sandbox/sample-intent"] ?? 0,
          });
        } catch {
          console.error("[ops-alert] alert send failed for sandbox/sample-intent");
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
        route: "sandbox/sample-intent",
        upstream_target: "atf-api",
        failure_class: "network_error",
        environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
      },
    });
    if (shouldTriggerRouteFailureAlert("sandbox/sample-intent")) {
      try {
        const counts = getCustomerRouteFailureCounts();
        await sendRouteFailureAlert("sandbox/sample-intent", "network_error", {
          countInWindow: counts["sandbox/sample-intent"] ?? 0,
        });
      } catch {
        console.error("[ops-alert] alert send failed for sandbox/sample-intent");
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

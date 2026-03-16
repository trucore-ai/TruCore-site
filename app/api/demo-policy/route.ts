import { NextRequest, NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/rate-limit";
import { sha256 } from "@/lib/hash";
import { logSecurityEvent } from "@/lib/security-log";

const DEMO_POLICY = {
  version: "demo-v1",
  constraints: {
    max_amount: 1000,
    max_slippage_bps: 300,
    max_ttl_seconds: 300,
  },
};

const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 60_000;

function getRequestIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
}

export async function GET(request: NextRequest) {
  const ip = getRequestIp(request);
  const rl = consumeRateLimit(`demo-policy:${sha256(ip)}`, {
    max: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });

  if (rl.exceeded) {
    logSecurityEvent("public_route_rate_limited", {
      ip,
      meta: { route: "demo-policy" },
    });
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(Math.max(1, rl.resetEpochSeconds - Math.floor(Date.now() / 1000))),
        },
      },
    );
  }

  return NextResponse.json(DEMO_POLICY, {
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=60",
      "Content-Type": "application/json",
    },
  });
}

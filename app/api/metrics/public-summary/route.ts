import { NextRequest, NextResponse } from "next/server";
import { fetchPublicMetrics } from "@/lib/public-metrics";
import { consumeRateLimit } from "@/lib/rate-limit";
import { sha256 } from "@/lib/hash";
import { logSecurityEvent } from "@/lib/security-log";

/* ────────────────────────────────────────────────────────────────
 *  GET /api/metrics/public-summary
 *
 *  Lightweight proxy for the ATF public metrics endpoint.
 *  Adds a 60 s s-maxage so the Vercel edge caches the response,
 *  keeping the marketing site snappy without hammering ATF.
 *  stale-while-revalidate lets visitors see slightly stale data
 *  while the cache refreshes in the background.
 * ──────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic";

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

function getRequestIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
}

export async function GET(request: NextRequest) {
  const ip = getRequestIp(request);
  const rl = consumeRateLimit(`metrics-public-summary:${sha256(ip)}`, {
    max: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });

  if (rl.exceeded) {
    logSecurityEvent("public_route_rate_limited", {
      ip,
      meta: { route: "metrics/public-summary" },
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

  const result = await fetchPublicMetrics();

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }

  return NextResponse.json(result.data, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}

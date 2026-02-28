import { NextRequest, NextResponse } from "next/server";
import { buildDemoLivePayload } from "@/lib/demo-live";
import { sha256 } from "@/lib/hash";
import { consumeRateLimit, type RateLimitResult } from "@/lib/rate-limit";

const LIVE_RATE_LIMIT_MAX = 60;
const LIVE_RATE_LIMIT_WINDOW_MS = 60_000;

function getRequestIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
}

function getRateLimit(request: NextRequest): RateLimitResult {
  return consumeRateLimit(`demo-live:${sha256(getRequestIp(request))}`, {
    max: LIVE_RATE_LIMIT_MAX,
    windowMs: LIVE_RATE_LIMIT_WINDOW_MS,
  });
}

function rateLimitHeaders(rateLimit: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(rateLimit.limit),
    "X-RateLimit-Remaining": String(rateLimit.remaining),
    "X-RateLimit-Reset": String(rateLimit.resetEpochSeconds),
  };
}

export async function GET(request: NextRequest) {
  const rateLimit = getRateLimit(request);

  if (rateLimit.exceeded) {
    return NextResponse.json(
      {
        ok: false,
        error: "rate_limited",
      },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          ...rateLimitHeaders(rateLimit),
        },
      },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      ...buildDemoLivePayload(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        ...rateLimitHeaders(rateLimit),
      },
    },
  );
}

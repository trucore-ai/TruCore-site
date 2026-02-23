import { NextRequest, NextResponse } from "next/server";
import { assertRateLimit } from "@/lib/rate-limit";
import { sha256 } from "@/lib/hash";

function getRequestIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
}

export async function GET(request: NextRequest) {
  const ipKey = `status:${sha256(getRequestIp(request))}`;

  try {
    assertRateLimit(ipKey, { max: 60, windowMs: 60_000 });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "rate_limited",
      },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      ts: new Date().toISOString(),
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      env: process.env.VERCEL_ENV ?? null,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
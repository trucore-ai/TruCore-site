import { NextRequest, NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/rate-limit";
import { sha256 } from "@/lib/hash";
import { logSecurityEvent } from "@/lib/security-log";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

/**
 * Safe, machine-readable build provenance endpoint.
 *
 * Returns the commit SHA, build time, and deployment environment so
 * operators can verify which commit is actually serving production.
 * No secrets, tokens, or PII are exposed.
 */

function safeString(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

function resolveEnvironment(): string {
  return safeString(process.env.VERCEL_ENV) ?? safeString(process.env.NODE_ENV) ?? "unknown";
}

export interface VersionPayload {
  app: "trucore-site";
  environment: string;
  git_commit: string | null;
  build_time: string | null;
  vercel_env: string | null;
  deployment_id: string | null;
}

function getRequestIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
}

export async function GET(request: NextRequest) {
  const ip = getRequestIp(request);
  const rl = consumeRateLimit(`version:${sha256(ip)}`, {
    max: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });

  if (rl.exceeded) {
    logSecurityEvent("public_route_rate_limited", {
      ip,
      meta: { route: "version" },
    });
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      {
        status: 429,
        headers: {
          ...NO_STORE_HEADERS,
          "Retry-After": String(Math.max(1, rl.resetEpochSeconds - Math.floor(Date.now() / 1000))),
        },
      },
    );
  }

  const payload: VersionPayload = {
    app: "trucore-site",
    environment: resolveEnvironment(),
    git_commit: safeString(process.env.NEXT_PUBLIC_GIT_COMMIT) ?? safeString(process.env.VERCEL_GIT_COMMIT_SHA),
    build_time: safeString(process.env.NEXT_PUBLIC_BUILD_TIME),
    vercel_env: safeString(process.env.VERCEL_ENV),
    deployment_id: safeString(process.env.VERCEL_DEPLOYMENT_ID),
  };

  return NextResponse.json(payload, {
    status: 200,
    headers: NO_STORE_HEADERS,
  });
}

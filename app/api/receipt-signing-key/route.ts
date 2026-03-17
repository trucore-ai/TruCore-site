import { NextRequest, NextResponse } from "next/server";
import { getReceiptSigningPublicKeyB64 } from "@/lib/receipt-signature";
import { consumeRateLimit } from "@/lib/rate-limit";
import { sha256 } from "@/lib/hash";
import { logSecurityEvent } from "@/lib/security-log";

export const runtime = "nodejs";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

function getRequestIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
}

export async function GET(request: NextRequest) {
  const ip = getRequestIp(request);
  const rl = consumeRateLimit(`receipt-signing-key:${sha256(ip)}`, {
    max: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });

  if (rl.exceeded) {
    logSecurityEvent("public_route_rate_limited", {
      ip,
      meta: { route: "receipt-signing-key" },
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

  try {
    const publicKey = getReceiptSigningPublicKeyB64();

    return NextResponse.json(
      {
        ok: true,
        available: Boolean(publicKey),
        public_key: publicKey,
        alg: "Ed25519",
        encoding: "base64",
      },
      {
        status: 200,
        headers: NO_STORE_HEADERS,
      },
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "temporarily_unavailable" },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
}

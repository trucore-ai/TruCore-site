import { NextRequest, NextResponse } from "next/server";
import { isReceiptHashFormatValid } from "@/lib/receipt-verification";
import { verifyReceiptHashSignature } from "@/lib/receipt-signature";
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

type VerifyReceiptSignatureRequest = {
  receipt_hash?: unknown;
  signature?: unknown;
  public_key?: unknown;
};

function getRequestIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);
  const rl = consumeRateLimit(`verify-receipt-sig:${sha256(ip)}`, {
    max: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });

  if (rl.exceeded) {
    logSecurityEvent("public_route_rate_limited", {
      ip,
      meta: { route: "verify-receipt-signature" },
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

  let body: VerifyReceiptSignatureRequest;

  try {
    body = (await request.json()) as VerifyReceiptSignatureRequest;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_json",
      },
      {
        status: 400,
        headers: NO_STORE_HEADERS,
      },
    );
  }

  if (
    typeof body.receipt_hash !== "string" ||
    !isReceiptHashFormatValid(body.receipt_hash) ||
    typeof body.signature !== "string" ||
    typeof body.public_key !== "string"
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_request",
      },
      {
        status: 400,
        headers: NO_STORE_HEADERS,
      },
    );
  }

  const isValid = verifyReceiptHashSignature(body.receipt_hash.toLowerCase(), body.signature, body.public_key);

  return NextResponse.json(
    {
      ok: true,
      verified: isValid,
    },
    {
      status: 200,
      headers: NO_STORE_HEADERS,
    },
  );
}

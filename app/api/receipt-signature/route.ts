import { NextRequest, NextResponse } from "next/server";
import { isReceiptHashFormatValid } from "@/lib/receipt-verification";
import { signReceiptHash } from "@/lib/receipt-signature";
import { consumeRateLimit } from "@/lib/rate-limit";
import { sha256 } from "@/lib/hash";
import { logSecurityEvent } from "@/lib/security-log";

export const runtime = "nodejs";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

type ReceiptSignatureRequest = {
  receipt_hash?: unknown;
};

function getRequestIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);
  const rl = consumeRateLimit(`receipt-signature:${sha256(ip)}`, { max: 30, windowMs: 60_000 });

  if (rl.exceeded) {
    logSecurityEvent("public_route_rate_limited", {
      ip,
      meta: { route: "receipt-signature" },
    });
    return NextResponse.json(
      {
        ok: false,
        error: "rate_limited",
      },
      {
        status: 429,
        headers: {
          ...NO_STORE_HEADERS,
          "Retry-After": String(Math.max(1, rl.resetEpochSeconds - Math.floor(Date.now() / 1000))),
        },
      },
    );
  }

  let body: ReceiptSignatureRequest;

  try {
    body = (await request.json()) as ReceiptSignatureRequest;
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

  if (typeof body.receipt_hash !== "string" || !isReceiptHashFormatValid(body.receipt_hash)) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_receipt_hash",
      },
      {
        status: 400,
        headers: NO_STORE_HEADERS,
      },
    );
  }

  const receiptHash = body.receipt_hash.toLowerCase();

  try {
    const signed = signReceiptHash(receiptHash);

    return NextResponse.json(
      {
        ok: true,
        receipt_hash: receiptHash,
        signature: signed.signatureB64,
        public_key: signed.publicKeyB64,
        alg: "Ed25519",
      },
      {
        status: 200,
        headers: NO_STORE_HEADERS,
      },
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "signature_unavailable",
      },
      {
        status: 503,
        headers: NO_STORE_HEADERS,
      },
    );
  }
}

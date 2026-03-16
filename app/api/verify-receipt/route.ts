import { NextRequest, NextResponse } from "next/server";
import {
  getReceiptVersion,
  isReceiptHashFormatValid,
  isSupportedReceiptVersion,
  recomputeDemoReceiptHash,
} from "@/lib/receipt-verification";
import { consumeRateLimit } from "@/lib/rate-limit";
import { sha256 } from "@/lib/hash";
import { logSecurityEvent } from "@/lib/security-log";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

type VerifyReceiptRequest = {
  receipt_hash?: unknown;
  receipt?: unknown;
};

function getRequestIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);
  const rl = consumeRateLimit(`verify-receipt:${sha256(ip)}`, {
    max: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });

  if (rl.exceeded) {
    logSecurityEvent("public_route_rate_limited", {
      ip,
      meta: { route: "verify-receipt" },
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

  let body: VerifyReceiptRequest;

  try {
    body = (await request.json()) as VerifyReceiptRequest;
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

  if (typeof body.receipt_hash !== "string") {
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

  const providedHash = body.receipt_hash.trim();
  const formatValid = isReceiptHashFormatValid(providedHash);

  if (typeof body.receipt === "undefined") {
    return NextResponse.json(
      {
        valid_format: formatValid,
        supported_version: true,
        version: null,
      },
      {
        headers: NO_STORE_HEADERS,
      },
    );
  }

  const receiptVersion = getReceiptVersion(body.receipt);
  if (receiptVersion && !isSupportedReceiptVersion(receiptVersion)) {
    return NextResponse.json(
      {
        ok: true,
        format_valid: formatValid,
        supported_version: false,
        version: receiptVersion,
      },
      {
        headers: NO_STORE_HEADERS,
      },
    );
  }

  const recomputedHash = recomputeDemoReceiptHash(body.receipt);

  if (!recomputedHash) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_receipt",
      },
      {
        status: 400,
        headers: NO_STORE_HEADERS,
      },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      format_valid: formatValid,
      supported_version: true,
      version: receiptVersion,
      recomputed_hash: recomputedHash,
      matches: formatValid && recomputedHash === providedHash.toLowerCase(),
    },
    {
      headers: NO_STORE_HEADERS,
    },
  );
}
import { NextRequest, NextResponse } from "next/server";
import {
  getReceiptVersion,
  isReceiptHashFormatValid,
  isSupportedReceiptVersion,
  recomputeDemoReceiptHash,
} from "@/lib/receipt-verification";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

type VerifyReceiptRequest = {
  receipt_hash?: unknown;
  receipt?: unknown;
};

export async function POST(request: NextRequest) {
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
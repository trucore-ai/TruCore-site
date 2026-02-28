import { NextRequest, NextResponse } from "next/server";
import { isReceiptHashFormatValid } from "@/lib/receipt-verification";
import { verifyReceiptHashSignature } from "@/lib/receipt-signature";

export const runtime = "nodejs";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

type VerifyReceiptSignatureRequest = {
  receipt_hash?: unknown;
  signature?: unknown;
  public_key?: unknown;
};

export async function POST(request: NextRequest) {
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

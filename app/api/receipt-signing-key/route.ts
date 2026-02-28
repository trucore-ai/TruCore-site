import { NextResponse } from "next/server";
import { getReceiptSigningPublicKeyB64 } from "@/lib/receipt-signature";

export const runtime = "nodejs";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

export async function GET() {
  const publicKey = getReceiptSigningPublicKeyB64();

  return NextResponse.json(
    {
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
}

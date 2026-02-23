import { NextResponse } from "next/server";
import { getWhitepaperIntegrityProof } from "@/lib/security-signature";

export const runtime = "nodejs";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

export async function GET() {
  try {
    const proof = await getWhitepaperIntegrityProof();

    return NextResponse.json(proof, {
      status: 200,
      headers: NO_STORE_HEADERS,
    });
  } catch {
    return NextResponse.json(
      { error: "Signature unavailable" },
      {
        status: 500,
        headers: NO_STORE_HEADERS,
      },
    );
  }
}
import { NextResponse } from "next/server";
import { sha256Hex } from "@/lib/sha256";
import { generateWhitepaperPdfBytes } from "@/lib/whitepaper-pdf";

export const runtime = "nodejs";

export async function GET() {
  const pdfBytes = await generateWhitepaperPdfBytes();
  const sha256 = sha256Hex(pdfBytes);

  return NextResponse.json(
    { sha256 },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=86400",
      },
    },
  );
}

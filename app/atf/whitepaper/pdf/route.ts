import { NextResponse } from "next/server";
import { generateWhitepaperPdfBytes } from "@/lib/whitepaper-pdf";

export const runtime = "nodejs";

export async function GET() {
  const pdfBytes = await generateWhitepaperPdfBytes();

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="ATF-Security-Whitepaper-Preview.pdf"',
      "Cache-Control": "public, max-age=86400",
    },
  });
}

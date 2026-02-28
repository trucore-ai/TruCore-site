import { NextResponse } from "next/server";
import { demoReceipts } from "@/lib/demo-receipts";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      receipts: demoReceipts,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

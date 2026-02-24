import { NextResponse } from "next/server";

const DEMO_POLICY = {
  version: "demo-v1",
  constraints: {
    max_amount: 1000,
    max_slippage_bps: 300,
    max_ttl_seconds: 300,
  },
};

export async function GET() {
  return NextResponse.json(DEMO_POLICY, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json",
    },
  });
}

/**
 * Test-only route: reset login-throttle state.
 *
 * POST /api/test/login-throttle/reset
 *
 * Gated behind ATF_E2E_TEST_SECRET — returns 404 in production.
 */

import { NextResponse } from "next/server";
import { denyUnlessTestMode } from "@/lib/test-gate";
import { _resetThrottleStore } from "@/lib/login-throttle";

export async function POST(request: Request) {
  const denied = denyUnlessTestMode(request);
  if (denied) return denied;

  _resetThrottleStore();

  return NextResponse.json({ ok: true });
}

/* All other methods → 404 */
export async function GET() {
  return new NextResponse(null, { status: 404 });
}

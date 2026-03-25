/**
 * Test-only route: advance login-throttle internal clock.
 *
 * POST /api/test/login-throttle/advance
 * Body: { "ms": <positive-integer> }
 *
 * Gated behind ATF_E2E_TEST_SECRET - returns 404 in production.
 */

import { NextResponse } from "next/server";
import { denyUnlessTestMode } from "@/lib/test-gate";
import { _advanceTime, _getTimeOffset } from "@/lib/login-throttle";

export async function POST(request: Request) {
  const denied = denyUnlessTestMode(request);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const ms =
    typeof body === "object" && body !== null && "ms" in body
      ? (body as { ms: unknown }).ms
      : undefined;

  if (typeof ms !== "number" || !Number.isFinite(ms) || ms <= 0) {
    return NextResponse.json(
      { error: "ms must be a positive number" },
      { status: 400 },
    );
  }

  _advanceTime(ms);

  return NextResponse.json({ ok: true, offsetMs: _getTimeOffset() });
}

/* All other methods → 404 */
export async function GET() {
  return new NextResponse(null, { status: 404 });
}

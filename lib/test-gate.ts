/**
 * Shared gating helper for test-only API routes.
 *
 * Fail-closed: returns a generic 404 unless ALL of:
 *   1. ATF_E2E_TEST_SECRET env var is set and non-empty.
 *   2. The request's `x-test-secret` header matches that value.
 *
 * Production deployments never set ATF_E2E_TEST_SECRET, so the routes
 * are unreachable even if the compiled code is present in the bundle.
 */

import { NextResponse } from "next/server";

const NOT_FOUND = () => new NextResponse(null, { status: 404 });

/**
 * Verify the request is allowed to use test-only controls.
 * Returns null if allowed, or a 404 NextResponse if denied.
 */
export function denyUnlessTestMode(
  request: Request,
): NextResponse | null {
  const secret = process.env.ATF_E2E_TEST_SECRET;

  // Gate 1 — env var must be present and non-empty
  if (!secret) return NOT_FOUND();

  // Gate 2 — request header must match
  const header = request.headers.get("x-test-secret");
  if (!header || header !== secret) return NOT_FOUND();

  return null; // allowed
}

/**
 * Shared server-only helpers for Origin / CSRF validation and IP extraction.
 *
 * Centralises logic previously duplicated across:
 * - /admin/login  route.ts
 * - /admin/logout route.ts
 * - lib/admin-api-auth.ts
 *
 * Fail-closed: missing, unparseable, or mismatched Origin → denied.
 */

import type { NextRequest } from "next/server";

/* ---------- mutation detection ---------- */

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Verify that the request's Origin header matches the request URL origin.
 *
 * Behaviour:
 * - Non-mutation methods (GET, HEAD, OPTIONS) → always returns true.
 * - Mutation methods with missing Origin → fail closed (false).
 * - Mutation methods with malformed/mismatched Origin → fail closed (false).
 */
export function isOriginValid(request: NextRequest): boolean {
  if (!MUTATION_METHODS.has(request.method)) {
    return true;
  }

  const origin = request.headers.get("origin");

  /* Missing Origin on a mutation → fail closed */
  if (!origin) {
    return false;
  }

  try {
    return origin === request.nextUrl.origin;
  } catch {
    /* Malformed URL → fail closed */
    return false;
  }
}

/* ---------- IP extraction ---------- */

/**
 * Extract the client IP from trusted proxy headers.
 * Returns "unknown" when no header is present — callers must never
 * log the raw result without hashing.
 */
export function getRequestIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

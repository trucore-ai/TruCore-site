/**
 * Lightweight admin authentication helper.
 *
 * Gates admin pages behind an HttpOnly cookie session.
 * The cookie value is validated against the ADMIN_DASHBOARD_KEY env var
 * using constant-time comparison.
 *
 * Security notes:
 * - If the session is missing or invalid, callers should return a 404 (not 401).
 * - The key value is never logged or exposed in URLs.
 */

import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "admin_session";
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

/* ---------- constant-time compare ---------- */

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/* ---------- key validation (used by login route) ---------- */

export function isAdminKeyValid(key: string | null | undefined): boolean {
  const expected = process.env.ADMIN_DASHBOARD_KEY;
  if (!expected || !key) return false;
  return constantTimeEqual(key, expected);
}

/* ---------- cookie-based session helpers ---------- */

/**
 * Read the admin session cookie and validate it.
 * Returns true if the cookie matches the expected key.
 */
export async function getAdminSessionFromCookies(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return isAdminKeyValid(token);
}

/**
 * Assert that the current request has a valid admin session.
 * Throws if the session is missing or invalid (callers should catch and return 404).
 */
export async function assertAdminSession(): Promise<void> {
  const valid = await getAdminSessionFromCookies();
  if (!valid) {
    throw new Error("unauthorized");
  }
}

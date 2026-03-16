/**
 * Lightweight admin authentication helper.
 *
 * Gates admin pages behind a short-lived signed session cookie.
 * On login the admin key is validated once; subsequent requests
 * are authenticated via an HMAC-signed session token stored in an
 * HttpOnly cookie and tracked in an in-memory session store.
 *
 * Security notes:
 * - The admin key is used only at login — never stored in the cookie.
 * - If the session is missing or invalid, callers should return a 404 (not 401).
 * - The token is never logged or exposed in URLs.
 */

import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { logSecurityEvent } from "./security-log";
import { ADMIN_COOKIE_NAME } from "./admin-constants";

export { ADMIN_COOKIE_NAME };
export const ADMIN_COOKIE_MAX_AGE = 60 * 60; // 1 hour (absolute session lifetime)
export const IDLE_TIMEOUT_SECONDS = 15 * 60; // 15 min idle timeout
export const LAST_SEEN_THROTTLE_SECONDS = 60; // throttle lastSeenAt writes
export const SESSION_GC_INTERVAL_SECONDS = 300; // 5 min between GC sweeps
export const SESSION_GC_RETENTION_MULTIPLIER = 2; // keep revoked sessions 2× max age

type AdminCookieOptions = Pick<
  ResponseCookie,
  "httpOnly" | "secure" | "sameSite" | "path" | "maxAge"
>;

/** Shape of a tracked admin session. */
export interface SessionRecord {
  issuedAt: number; // ms epoch — set once at login
  lastSeenAt: number; // ms epoch — updated on authenticated use
  revokedAt?: number; // ms epoch — set on logout/revocation
}

/* ---------- constant-time compare ---------- */

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/* ---------- in-memory session store ---------- */

/** token → session record */
const sessionStore = new Map<string, SessionRecord>();

/** Timestamp of last GC run (ms epoch). */
let lastGcRun = 0;

/** Exposed for tests only. */
export function _getSessionStore(): Map<string, SessionRecord> {
  return sessionStore;
}

/** Exposed for tests only — reset GC timer. */
export function _resetGcTimer(): void {
  lastGcRun = 0;
}

/* ---------- session garbage collection ---------- */

/**
 * Opportunistic GC sweep. Removes:
 * - expired sessions (older than ADMIN_COOKIE_MAX_AGE)
 * - revoked sessions older than retention threshold
 * - malformed records
 *
 * Runs at most once per SESSION_GC_INTERVAL_SECONDS.
 * Never throws — logs session_gc_error on failure.
 */
function sweepSessions(): void {
  try {
    const now = Date.now();
    if ((now - lastGcRun) / 1000 < SESSION_GC_INTERVAL_SECONDS) return;
    lastGcRun = now;

    const retentionMs =
      ADMIN_COOKIE_MAX_AGE * SESSION_GC_RETENTION_MULTIPLIER * 1000;

    for (const [token, record] of sessionStore) {
      /* Malformed record */
      if (
        !record ||
        typeof record.issuedAt !== "number" ||
        typeof record.lastSeenAt !== "number"
      ) {
        sessionStore.delete(token);
        continue;
      }

      const age = now - record.issuedAt;

      /* Expired session (absolute lifetime exceeded) */
      if (age > ADMIN_COOKIE_MAX_AGE * 1000) {
        /* Revoked sessions get extra retention for reuse detection */
        if (record.revokedAt !== undefined) {
          if (age > retentionMs) {
            sessionStore.delete(token);
          }
          continue;
        }
        sessionStore.delete(token);
        continue;
      }

      /* Revoked session within retention — keep for reuse detection */
    }
  } catch {
    logSecurityEvent("session_gc_error");
  }
}

/* ---------- key validation (used by login route) ---------- */

export function isAdminKeyValid(key: string | null | undefined): boolean {
  const expected = process.env.ADMIN_DASHBOARD_KEY;
  if (!expected || !key) return false;
  return constantTimeEqual(key, expected);
}

/* ---------- signed token helpers ---------- */

/**
 * Create an HMAC-signed session token and register it in the store.
 * Combines a timestamp with a cryptographic random nonce so that
 * tokens are unique even if two logins occur at the same millisecond.
 */
export function createSessionToken(): string {
  const secret = process.env.ADMIN_DASHBOARD_KEY;
  if (!secret) throw new Error("ADMIN_DASHBOARD_KEY is not set");

  sweepSessions();

  const now = Date.now();
  const nonce = randomBytes(16).toString("hex");
  const token = createHmac("sha256", secret)
    .update(`${now}:${nonce}`)
    .digest("hex");

  sessionStore.set(token, { issuedAt: now, lastSeenAt: now });
  return token;
}

/**
 * Validate a session token against the store.
 * Checks: existence, structure, revocation, absolute expiry, idle timeout.
 * Fail-closed on any ambiguity.
 */
export function isValidSessionToken(
  token: string | null | undefined,
): boolean {
  if (!token) return false;
  const record = sessionStore.get(token);
  if (record === undefined) return false;

  /* Malformed record — fail closed */
  if (
    typeof record.issuedAt !== "number" ||
    typeof record.lastSeenAt !== "number"
  ) {
    logSecurityEvent("invalid_session_rejected", {
      meta: { reason: "malformed" },
    });
    sessionStore.delete(token);
    return false;
  }

  /* Revoked session */
  if (record.revokedAt !== undefined) {
    logSecurityEvent("revoked_session_rejected");
    return false;
  }

  const now = Date.now();

  /* Absolute session lifetime exceeded */
  const absoluteAge = (now - record.issuedAt) / 1000;
  if (absoluteAge > ADMIN_COOKIE_MAX_AGE) {
    logSecurityEvent("session_expired");
    sessionStore.delete(token);
    return false;
  }

  /* Idle timeout exceeded */
  const idleAge = (now - record.lastSeenAt) / 1000;
  if (idleAge > IDLE_TIMEOUT_SECONDS) {
    logSecurityEvent("session_idle_timeout");
    sessionStore.delete(token);
    return false;
  }

  return true;
}

/**
 * Mark a session as revoked. The record is retained so that reuse
 * attempts are detected and logged as revoked_session_rejected.
 */
export function revokeSessionToken(
  token: string | null | undefined,
): void {
  if (!token) return;
  const record = sessionStore.get(token);
  if (record) {
    record.revokedAt = Date.now();
  }
}

/**
 * Update lastSeenAt on an active session.
 * Writes are throttled to at most once per LAST_SEEN_THROTTLE_SECONDS
 * to avoid write amplification.
 * Returns true if the session is still valid, false otherwise.
 */
export function touchSession(token: string): boolean {
  sweepSessions();

  const record = sessionStore.get(token);
  if (!record || record.revokedAt !== undefined) return false;

  const now = Date.now();
  const elapsed = (now - record.lastSeenAt) / 1000;
  if (elapsed >= LAST_SEEN_THROTTLE_SECONDS) {
    record.lastSeenAt = now;
  }
  return true;
}

/**
 * Shared admin session cookie options.
 * Scope cookie to /admin and only enable Secure in production.
 */
export function getAdminSessionCookieOptions(
  maxAge: number = ADMIN_COOKIE_MAX_AGE,
): AdminCookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge,
  };
}

/* ---------- cookie-based session helpers ---------- */

/**
 * Read the admin session cookie and validate it against the session store.
 * Returns true if the token is present and has not expired.
 */
export async function getAdminSessionFromCookies(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const valid = isValidSessionToken(token);
  if (!valid || !token) return false;

  /* Touch session — fail closed if state became invalid */
  if (!touchSession(token)) {
    logSecurityEvent("invalid_session_rejected", {
      meta: { reason: "touch_failed" },
    });
    return false;
  }
  return true;
}

/**
 * Assert that the current request has a valid admin session.
 * Throws if the session is missing or invalid (callers should catch and return 404).
 */
export async function assertAdminSession(): Promise<void> {
  sweepSessions();

  const valid = await getAdminSessionFromCookies();
  if (!valid) {
    logSecurityEvent("invalid_session_rejected");
    throw new Error("unauthorized");
  }
}

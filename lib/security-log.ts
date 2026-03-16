/**
 * Structured security event logger for admin auth surfaces.
 *
 * Emits concise, grep-friendly lines to stdout/stderr.
 * NEVER logs secrets, raw keys, or full tokens.
 *
 * Format: [security] <event> | key=value | key=value ...
 */

import { sha256 } from "./hash";

export type SecurityEvent =
  | "login_success"
  | "login_failure"
  | "login_rate_limited"
  | "logout"
  | "invalid_session_rejected"
  | "session_expired"
  | "session_idle_timeout"
  | "revoked_session_rejected"
  | "admin_route_denied"
  | "admin_api_denied"
  | "admin_action_denied"
  | "csrf_origin_rejected"
  | "session_gc_error"
  | "admin_page_degraded"
  | "metrics_route_rate_limited";

export interface SecurityLogContext {
  /** Raw IP string — will be hashed before logging. */
  ip?: string;
  /** Optional request identifier for correlation. */
  requestId?: string;
  /** Optional extra fields (must not contain secrets). */
  meta?: Record<string, string | number | boolean>;
}

/**
 * Truncated IP hash: first 12 hex chars of SHA-256.
 * Enough for correlation, not enough to reverse.
 */
function ipFingerprint(ip: string | undefined): string {
  if (!ip || ip === "unknown") return "unknown";
  return sha256(ip).slice(0, 12);
}

/**
 * Log a security-relevant event to stdout.
 */
export function logSecurityEvent(
  event: SecurityEvent,
  ctx: SecurityLogContext = {},
): void {
  const parts: string[] = [
    `event=${event}`,
    `ip_hash=${ipFingerprint(ctx.ip)}`,
  ];

  if (ctx.requestId) {
    parts.push(`req=${ctx.requestId}`);
  }

  if (ctx.meta) {
    for (const [k, v] of Object.entries(ctx.meta)) {
      parts.push(`${k}=${v}`);
    }
  }

  const ts = new Date().toISOString();
  // Use console.warn so it goes to stderr in production — visible in log aggregators
  console.warn(`[security] ${ts} | ${parts.join(" | ")}`);

  /* ── Increment event counter ── */
  securityEventCounters.set(
    event,
    (securityEventCounters.get(event) ?? 0) + 1,
  );
}

/* ---------- security event counters ---------- */

/** In-memory counters for security events. Lazily initialized on first increment. */
const securityEventCounters = new Map<string, number>();

/**
 * Return a snapshot of all security event counters.
 * Never throws. Never exposes tokens/IPs.
 */
export function getSecurityEventCounters(): Record<string, number> {
  try {
    const result: Record<string, number> = {};
    for (const [key, val] of securityEventCounters) {
      result[key] = val;
    }
    return result;
  } catch {
    return {};
  }
}

/** Exposed for tests only — reset all counters. */
export function _resetSecurityEventCounters(): void {
  securityEventCounters.clear();
}

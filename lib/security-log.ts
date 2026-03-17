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
  | "admin_action_degraded"
  | "admin_api_degraded"
  | "csrf_origin_rejected"
  | "session_gc_error"
  | "admin_page_degraded"
  | "metrics_route_rate_limited"
  | "agent_route_rate_limited"
  | "public_route_rate_limited";

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

  /* ── Track per-page degraded counts ── */
  if (event === "admin_page_degraded" && ctx.meta?.page) {
    const page = String(ctx.meta.page);
    if (KNOWN_ADMIN_PAGES.has(page)) {
      adminPageDegradedCounts.set(
        page,
        (adminPageDegradedCounts.get(page) ?? 0) + 1,
      );
    }
  }

  /* ── Track per-action degraded mutation counts ── */
  if (event === "admin_action_degraded" && ctx.meta?.action) {
    const action = String(ctx.meta.action);
    if (KNOWN_ADMIN_ACTIONS.has(action)) {
      adminActionDegradedCounts.set(
        action,
        (adminActionDegradedCounts.get(action) ?? 0) + 1,
      );
    }
  }

  /* ── Track per-route degraded API counts ── */
  if (event === "admin_api_degraded" && ctx.meta?.route) {
    const route = String(ctx.meta.route);
    if (KNOWN_ADMIN_API_ROUTES.has(route)) {
      adminApiDegradedCounts.set(
        route,
        (adminApiDegradedCounts.get(route) ?? 0) + 1,
      );
    }
  }

  /* ── Track per-route agent-route rate-limited counts ── */
  if (event === "agent_route_rate_limited" && ctx.meta?.route) {
    const route = String(ctx.meta.route);
    if (KNOWN_AGENT_ROUTES.has(route)) {
      agentRouteRateLimitedCounts.set(
        route,
        (agentRouteRateLimitedCounts.get(route) ?? 0) + 1,
      );
    }
  }

  /* ── Track per-route public-route rate-limited counts ── */
  if (event === "public_route_rate_limited" && ctx.meta?.route) {
    const route = String(ctx.meta.route);
    if (KNOWN_PUBLIC_ROUTES.has(route)) {
      publicRouteRateLimitedCounts.set(
        route,
        (publicRouteRateLimitedCounts.get(route) ?? 0) + 1,
      );
    }
  }
}

/* ---------- security event counters ---------- */

/** In-memory counters for security events. Lazily initialized on first increment. */
const securityEventCounters = new Map<string, number>();

/* ---------- per-page degraded counters ---------- */

/** Allowed page names — only these are tracked. Anything else is ignored. */
const KNOWN_ADMIN_PAGES = new Set([
  "waitlist",
  "csp",
  "usage",
  "metrics",
  "audit",
  "acquisition",
  "keys",
]);

/**
 * Process-local aggregate counters for admin_page_degraded events, keyed by
 * page name. Only safe static page labels from KNOWN_ADMIN_PAGES are stored.
 */
const adminPageDegradedCounts = new Map<string, number>();

/* ---------- per-action degraded mutation counters ---------- */

/** Allowed action names — only these are tracked. Anything else is ignored. */
const KNOWN_ADMIN_ACTIONS = new Set([
  "set_signup_status",
  "update_admin_notes",
  "export_design_partners_csv",
]);

/* ---------- per-route degraded API counters ---------- */

/** Allowed route names — only these are tracked. Anything else is ignored. */
const KNOWN_ADMIN_API_ROUTES = new Set([
  "keys/create",
  "keys/revoke",
  "keys/issue-for-partner",
  "portal/token/create",
  "portal/token/revoke",
  "dashboard/refresh",
  "dashboard/tenant",
  "admin/security",
  "agent/dashboard",
  "agent/tenant",
]);

const adminApiDegradedCounts = new Map<string, number>();

/* ---------- per-route agent-route rate-limited counters ---------- */

/** Allowed agent route labels — only these are tracked in breakdowns. */
const KNOWN_AGENT_ROUTES = new Set([
  "agent/dashboard",
  "agent/tenant",
  "agent/stream",
]);

/**
 * Process-local aggregate counters for agent_route_rate_limited events,
 * keyed by route label. Only safe static labels from KNOWN_AGENT_ROUTES stored.
 */
const agentRouteRateLimitedCounts = new Map<string, number>();

/* ---------- per-route public-route rate-limited counters ---------- */

/** Allowed public route labels — only these are tracked in breakdowns. */
const KNOWN_PUBLIC_ROUTES = new Set([
  "verify-receipt",
  "verify-receipt-signature",
  "public-metrics",
  "public-receipts",
  "demo-policy",
  "demo-live",
  "metrics/public-summary",
  "receipt-signing-key",
  "status",
  "health",
]);

/**
 * Process-local aggregate counters for public_route_rate_limited events,
 * keyed by route label. Only safe static labels from KNOWN_PUBLIC_ROUTES stored.
 */
const publicRouteRateLimitedCounts = new Map<string, number>();

/**
 * Process-local aggregate counters for admin_action_degraded events, keyed
 * by action label. Only safe static labels from KNOWN_ADMIN_ACTIONS stored.
 */
const adminActionDegradedCounts = new Map<string, number>();

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

/**
 * Return a snapshot of per-page degraded admin render counts.
 * Keys are safe static page names only. Never throws.
 */
export function getAdminPageDegradedCounts(): Record<string, number> {
  try {
    const result: Record<string, number> = {};
    for (const [key, val] of adminPageDegradedCounts) {
      result[key] = val;
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * Return a snapshot of per-action degraded admin mutation counts.
 * Keys are safe static action labels only. Never throws.
 */
export function getAdminActionDegradedCounts(): Record<string, number> {
  try {
    const result: Record<string, number> = {};
    for (const [key, val] of adminActionDegradedCounts) {
      result[key] = val;
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * Return a snapshot of per-route degraded admin API counts.
 * Keys are safe static route labels only. Never throws.
 */
export function getAdminApiDegradedCounts(): Record<string, number> {
  try {
    const result: Record<string, number> = {};
    for (const [key, val] of adminApiDegradedCounts) {
      result[key] = val;
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * Return a snapshot of per-route agent-route rate-limited counts.
 * Keys are safe static route labels only. Never throws.
 */
export function getAgentRouteRateLimitedCounts(): Record<string, number> {
  try {
    const result: Record<string, number> = {};
    for (const [key, val] of agentRouteRateLimitedCounts) {
      result[key] = val;
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * Return a snapshot of per-route public-route rate-limited counts.
 * Keys are safe static route labels only. Never throws.
 */
export function getPublicRouteRateLimitedCounts(): Record<string, number> {
  try {
    const result: Record<string, number> = {};
    for (const [key, val] of publicRouteRateLimitedCounts) {
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
  adminPageDegradedCounts.clear();
  adminActionDegradedCounts.clear();
  adminApiDegradedCounts.clear();
  agentRouteRateLimitedCounts.clear();
  publicRouteRateLimitedCounts.clear();
}

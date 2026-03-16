/**
 * Prometheus-compatible metrics serializer for admin/security telemetry.
 *
 * Maps the in-memory security event counters and session gauges to
 * Prometheus text exposition format (text/plain; version=0.0.4).
 *
 * Design rules:
 * - Zero external dependencies.
 * - Reuses the existing counter map from security-log.ts as source of truth.
 * - Never exposes secrets, IPs, cookies, tokens, or admin keys.
 * - Fail-closed: missing counters emit 0, never throws.
 */

import { getSecurityEventCounters } from "./security-log";
import { _getSessionStore } from "./admin-auth";

/* ── Process start time (ms epoch) ── */
const startedAt = Date.now();

/* ── Counter definitions ── */

interface MetricDef {
  /** Prometheus metric name. */
  name: string;
  /** HELP description. */
  help: string;
  /** Prometheus metric type. */
  type: "counter" | "gauge";
  /** Key in the security event counter map, or null for gauges. */
  counterKey: string | null;
}

const COUNTER_METRICS: MetricDef[] = [
  {
    name: "trucore_admin_login_success_total",
    help: "Successful admin logins",
    type: "counter",
    counterKey: "login_success",
  },
  {
    name: "trucore_admin_login_failure_total",
    help: "Failed admin login attempts",
    type: "counter",
    counterKey: "login_failure",
  },
  {
    name: "trucore_admin_login_rate_limited_total",
    help: "Admin logins rejected by rate limiter",
    type: "counter",
    counterKey: "login_rate_limited",
  },
  {
    name: "trucore_admin_csrf_origin_rejected_total",
    help: "Requests rejected due to CSRF origin mismatch",
    type: "counter",
    counterKey: "csrf_origin_rejected",
  },
  {
    name: "trucore_admin_route_denied_total",
    help: "Admin route access denials",
    type: "counter",
    counterKey: "admin_route_denied",
  },
  {
    name: "trucore_admin_api_denied_total",
    help: "Admin API access denials",
    type: "counter",
    counterKey: "admin_api_denied",
  },
  {
    name: "trucore_admin_action_denied_total",
    help: "Admin action denials",
    type: "counter",
    counterKey: "admin_action_denied",
  },
  {
    name: "trucore_admin_session_expired_total",
    help: "Admin sessions expired by absolute lifetime",
    type: "counter",
    counterKey: "session_expired",
  },
  {
    name: "trucore_admin_session_idle_timeout_total",
    help: "Admin sessions expired by idle timeout",
    type: "counter",
    counterKey: "session_idle_timeout",
  },
  {
    name: "trucore_admin_revoked_session_rejected_total",
    help: "Rejected reuse attempts of revoked sessions",
    type: "counter",
    counterKey: "revoked_session_rejected",
  },
];

/* ── Gauge helpers ── */

/** Count of sessions currently in the store. */
export function getSessionStoreSize(): number {
  try {
    return _getSessionStore().size;
  } catch {
    return 0;
  }
}

/** Count of revoked sessions still retained for reuse detection. */
export function getRevokedSessionCount(): number {
  try {
    let count = 0;
    for (const record of _getSessionStore().values()) {
      if (record.revokedAt !== undefined) count++;
    }
    return count;
  } catch {
    return 0;
  }
}

/** Process uptime in whole seconds. */
export function getUptimeSeconds(): number {
  return Math.floor((Date.now() - startedAt) / 1000);
}

/* ── Prometheus text serializer ── */

/**
 * Format a single metric block in Prometheus text exposition format.
 */
function formatMetric(
  name: string,
  help: string,
  type: string,
  value: number,
): string {
  return `# HELP ${name} ${help}\n# TYPE ${name} ${type}\n${name} ${value}\n`;
}

/**
 * Serialize all security metrics to Prometheus text exposition format.
 *
 * Never throws — returns a best-effort snapshot even if parts fail.
 * Missing counters default to 0.
 */
export function serializePrometheusMetrics(): string {
  const lines: string[] = [];

  try {
    const counters = getSecurityEventCounters();

    for (const def of COUNTER_METRICS) {
      const value = def.counterKey ? (counters[def.counterKey] ?? 0) : 0;
      lines.push(formatMetric(def.name, def.help, def.type, value));
    }

    // Gauges
    lines.push(
      formatMetric(
        "trucore_admin_session_store_size",
        "Current number of sessions in the in-memory store",
        "gauge",
        getSessionStoreSize(),
      ),
    );
    lines.push(
      formatMetric(
        "trucore_admin_revoked_session_count",
        "Current number of revoked sessions retained for reuse detection",
        "gauge",
        getRevokedSessionCount(),
      ),
    );
    lines.push(
      formatMetric(
        "trucore_security_uptime_seconds",
        "Seconds since the security metrics module started",
        "gauge",
        getUptimeSeconds(),
      ),
    );
  } catch {
    // Fail closed — return whatever we have
  }

  return lines.join("\n");
}

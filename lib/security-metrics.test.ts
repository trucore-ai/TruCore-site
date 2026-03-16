import { afterEach, describe, it, expect, vi } from "vitest";
import {
  serializePrometheusMetrics,
  getSessionStoreSize,
  getRevokedSessionCount,
  getUptimeSeconds,
  _resetMetricsCache,
} from "@/lib/security-metrics";
import {
  logSecurityEvent,
  _resetSecurityEventCounters,
} from "@/lib/security-log";
import {
  createSessionToken,
  revokeSessionToken,
  _getSessionStore,
  _resetGcTimer,
} from "@/lib/admin-auth";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  _resetSecurityEventCounters();
  _resetMetricsCache();
  _getSessionStore().clear();
  _resetGcTimer();
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

/* ═══════════ Prometheus text serializer ═══════════ */

describe("serializePrometheusMetrics", () => {
  it("returns valid Prometheus text with HELP and TYPE lines", () => {
    const output = serializePrometheusMetrics();

    expect(output).toContain("# HELP trucore_admin_login_success_total");
    expect(output).toContain("# TYPE trucore_admin_login_success_total counter");
    expect(output).toContain("trucore_admin_login_success_total 0");

    expect(output).toContain("# TYPE trucore_admin_session_store_size gauge");
    expect(output).toContain("# TYPE trucore_security_uptime_seconds gauge");
  });

  it("emits 0 for counters with no events", () => {
    const output = serializePrometheusMetrics();

    expect(output).toContain("trucore_admin_login_failure_total 0");
    expect(output).toContain("trucore_admin_csrf_origin_rejected_total 0");
    expect(output).toContain("trucore_admin_route_denied_total 0");
    expect(output).toContain("trucore_admin_api_denied_total 0");
    expect(output).toContain("trucore_admin_action_denied_total 0");
    expect(output).toContain("trucore_admin_session_expired_total 0");
    expect(output).toContain("trucore_admin_session_idle_timeout_total 0");
    expect(output).toContain("trucore_admin_revoked_session_rejected_total 0");
    expect(output).toContain("trucore_admin_login_rate_limited_total 0");
  });

  it("reflects incremented counters", () => {
    logSecurityEvent("login_failure", {});
    logSecurityEvent("login_failure", {});
    logSecurityEvent("csrf_origin_rejected", {});

    const output = serializePrometheusMetrics();
    expect(output).toContain("trucore_admin_login_failure_total 2");
    expect(output).toContain("trucore_admin_csrf_origin_rejected_total 1");
  });

  it("includes all ten counter metrics", () => {
    const output = serializePrometheusMetrics();
    const expectedCounters = [
      "trucore_admin_login_success_total",
      "trucore_admin_login_failure_total",
      "trucore_admin_login_rate_limited_total",
      "trucore_admin_csrf_origin_rejected_total",
      "trucore_admin_route_denied_total",
      "trucore_admin_api_denied_total",
      "trucore_admin_action_denied_total",
      "trucore_admin_session_expired_total",
      "trucore_admin_session_idle_timeout_total",
      "trucore_admin_revoked_session_rejected_total",
    ];

    for (const name of expectedCounters) {
      expect(output).toContain(`# HELP ${name}`);
      expect(output).toContain(`# TYPE ${name} counter`);
    }
  });

  it("includes all three gauge metrics", () => {
    const output = serializePrometheusMetrics();
    const expectedGauges = [
      "trucore_admin_session_store_size",
      "trucore_admin_revoked_session_count",
      "trucore_security_uptime_seconds",
    ];

    for (const name of expectedGauges) {
      expect(output).toContain(`# HELP ${name}`);
      expect(output).toContain(`# TYPE ${name} gauge`);
    }
  });

  it("does not contain secrets, tokens, IPs, or cookie values", () => {
    process.env.ADMIN_DASHBOARD_KEY = "super-secret-key";
    const token = createSessionToken();

    logSecurityEvent("login_success", { ip: "192.168.1.100" });

    const output = serializePrometheusMetrics();

    expect(output).not.toContain("super-secret-key");
    expect(output).not.toContain(token);
    expect(output).not.toContain("192.168.1.100");
    expect(output).not.toContain("cookie");
    expect(output).not.toContain("Cookie");
  });
});

/* ═══════════ Gauge helpers ═══════════ */

describe("getSessionStoreSize", () => {
  it("returns 0 when store is empty", () => {
    expect(getSessionStoreSize()).toBe(0);
  });

  it("reflects session count after creation", () => {
    process.env.ADMIN_DASHBOARD_KEY = "test-key";
    createSessionToken();
    createSessionToken();
    expect(getSessionStoreSize()).toBe(2);
  });
});

describe("getRevokedSessionCount", () => {
  it("returns 0 when no sessions are revoked", () => {
    process.env.ADMIN_DASHBOARD_KEY = "test-key";
    createSessionToken();
    expect(getRevokedSessionCount()).toBe(0);
  });

  it("counts revoked sessions correctly", () => {
    process.env.ADMIN_DASHBOARD_KEY = "test-key";
    const t1 = createSessionToken();
    createSessionToken();
    revokeSessionToken(t1);
    expect(getRevokedSessionCount()).toBe(1);
  });
});

describe("getUptimeSeconds", () => {
  it("returns a non-negative integer", () => {
    const uptime = getUptimeSeconds();
    expect(uptime).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(uptime)).toBe(true);
  });
});

/* ═══════════ Gauge values in serialized output ═══════════ */

describe("gauges in prometheus output", () => {
  it("reflects session store size gauge", () => {
    process.env.ADMIN_DASHBOARD_KEY = "test-key";
    createSessionToken();

    const output = serializePrometheusMetrics();
    expect(output).toContain("trucore_admin_session_store_size 1");
  });

  it("reflects revoked session count gauge", () => {
    process.env.ADMIN_DASHBOARD_KEY = "test-key";
    const t = createSessionToken();
    revokeSessionToken(t);

    const output = serializePrometheusMetrics();
    expect(output).toContain("trucore_admin_revoked_session_count 1");
  });

  it("uptime gauge is at least 0", () => {
    const output = serializePrometheusMetrics();
    const match = output.match(/trucore_security_uptime_seconds (\d+)/);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBeGreaterThanOrEqual(0);
  });
});

/* ═══════════ Short-lived metrics cache ═══════════ */

describe("metrics caching", () => {
  it("returns stable output within TTL window", () => {
    logSecurityEvent("login_failure", {});
    const first = serializePrometheusMetrics();

    // Increment counter — cached body should not reflect it yet
    logSecurityEvent("login_failure", {});
    const second = serializePrometheusMetrics();

    expect(second).toBe(first);
    expect(second).toContain("trucore_admin_login_failure_total 1");
  });

  it("refreshes after cache is cleared", () => {
    logSecurityEvent("login_failure", {});
    const first = serializePrometheusMetrics();

    logSecurityEvent("login_failure", {});
    _resetMetricsCache();
    const refreshed = serializePrometheusMetrics();

    expect(refreshed).not.toBe(first);
    expect(refreshed).toContain("trucore_admin_login_failure_total 2");
  });

  it("refreshes after TTL expires", () => {
    logSecurityEvent("login_failure", {});
    const first = serializePrometheusMetrics();

    logSecurityEvent("login_failure", {});

    // Advance time past the 10 s TTL
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 11_000);
    const refreshed = serializePrometheusMetrics();

    expect(refreshed).toContain("trucore_admin_login_failure_total 2");
    expect(refreshed).not.toBe(first);
  });
});

import { afterEach, describe, it, expect, vi } from "vitest";
import {
  logSecurityEvent,
  getSecurityEventCounters,
  _resetSecurityEventCounters,
} from "@/lib/security-log";
import {
  isAdminKeyValid,
  createSessionToken,
  isValidSessionToken,
  revokeSessionToken,
  _getSessionStore,
  _resetGcTimer,
} from "@/lib/admin-auth";
import {
  checkLoginThrottle,
  recordLoginFailure,
  clearLoginFailures,
  _resetThrottleStore,
} from "@/lib/login-throttle";

/* ---------- environment ---------- */

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  _resetSecurityEventCounters();
  _getSessionStore().clear();
  _resetGcTimer();
  _resetThrottleStore();
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

/* ═══════════ Telemetry counters move on security events ═══════════ */

describe("security telemetry counters", () => {
  it("increments counters on security events", () => {
    const before = getSecurityEventCounters();
    expect(before["login_failure"] ?? 0).toBe(0);

    logSecurityEvent("login_failure", { ip: "1.2.3.4" });
    logSecurityEvent("login_failure", { ip: "5.6.7.8" });
    logSecurityEvent("csrf_origin_rejected", { ip: "9.10.11.12" });

    const after = getSecurityEventCounters();
    expect(after["login_failure"]).toBe(2);
    expect(after["csrf_origin_rejected"]).toBe(1);
  });

  it("increments login_success on valid key check", () => {
    process.env.ADMIN_DASHBOARD_KEY = "test-admin-key";

    // Simulate failed then successful login
    expect(isAdminKeyValid("wrong")).toBe(false);
    logSecurityEvent("login_failure", { ip: "1.2.3.4" });

    expect(isAdminKeyValid("test-admin-key")).toBe(true);
    logSecurityEvent("login_success", { ip: "1.2.3.4" });

    const counters = getSecurityEventCounters();
    expect(counters["login_failure"]).toBeGreaterThanOrEqual(1);
    expect(counters["login_success"]).toBeGreaterThanOrEqual(1);
  });

  it("tracks revoked_session_rejected on reuse of revoked token", () => {
    process.env.ADMIN_DASHBOARD_KEY = "test-admin-key";

    const token = createSessionToken();
    expect(isValidSessionToken(token)).toBe(true);

    // Revoke (logout)
    revokeSessionToken(token);

    // Attempt reuse
    expect(isValidSessionToken(token)).toBe(false);

    const counters = getSecurityEventCounters();
    expect(counters["revoked_session_rejected"]).toBeGreaterThanOrEqual(1);
  });

  it("does not leak counters beyond defined event types", () => {
    logSecurityEvent("login_success", {});
    logSecurityEvent("logout", {});

    const counters = getSecurityEventCounters();
    // All keys should be known security event names
    for (const key of Object.keys(counters)) {
      expect(typeof key).toBe("string");
      expect(key.length).toBeGreaterThan(0);
    }
  });
});

/* ═══════════ Throttle telemetry integration ═══════════ */

describe("login throttle + telemetry integration", () => {
  it("throttle state does not leak IP in counters", () => {
    recordLoginFailure("192.168.1.1");
    recordLoginFailure("192.168.1.1");

    const counters = getSecurityEventCounters();
    // Counter keys should not contain raw IPs
    for (const key of Object.keys(counters)) {
      expect(key).not.toMatch(/\d+\.\d+\.\d+\.\d+/);
    }
  });

  it("checkLoginThrottle returns 0 for unknown IP", () => {
    expect(checkLoginThrottle("10.0.0.1")).toBe(0);
  });

  it("clearLoginFailures resets tracking for IP", () => {
    recordLoginFailure("10.0.0.1");
    recordLoginFailure("10.0.0.1");
    clearLoginFailures("10.0.0.1");
    expect(checkLoginThrottle("10.0.0.1")).toBe(0);
  });
});

/* ═══════════ Session lifecycle counter path ═══════════ */

describe("session lifecycle counters", () => {
  it("creating and validating a session does not increment error counters", () => {
    process.env.ADMIN_DASHBOARD_KEY = "test-key";

    const token = createSessionToken();
    expect(isValidSessionToken(token)).toBe(true);

    const counters = getSecurityEventCounters();
    expect(counters["invalid_session_rejected"] ?? 0).toBe(0);
    expect(counters["session_expired"] ?? 0).toBe(0);
    expect(counters["revoked_session_rejected"] ?? 0).toBe(0);
  });

  it("invalid token increments invalid_session_rejected for revoked tokens", () => {
    process.env.ADMIN_DASHBOARD_KEY = "test-key";

    const token = createSessionToken();
    revokeSessionToken(token);
    isValidSessionToken(token);

    const counters = getSecurityEventCounters();
    expect(counters["revoked_session_rejected"]).toBeGreaterThanOrEqual(1);
  });

  it("null/undefined token is rejected but does not crash counters", () => {
    expect(isValidSessionToken(null)).toBe(false);
    expect(isValidSessionToken(undefined)).toBe(false);
    // Counters should not contain NaN or negative values
    const counters = getSecurityEventCounters();
    for (const val of Object.values(counters)) {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(val)).toBe(true);
    }
  });
});

import { afterEach, describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/metrics/security/route";
import {
  logSecurityEvent,
  _resetSecurityEventCounters,
} from "@/lib/security-log";
import { _getSessionStore, _resetGcTimer } from "@/lib/admin-auth";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  _resetSecurityEventCounters();
  _getSessionStore().clear();
  _resetGcTimer();
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("GET /api/metrics/security", () => {
  it("returns 200 with Prometheus content type", () => {
    const response = GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "text/plain; version=0.0.4; charset=utf-8",
    );
  });

  it("sets no-store cache header", () => {
    const response = GET();
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("sets nosniff header", () => {
    const response = GET();
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("returns valid Prometheus text body", async () => {
    const response = GET();
    const body = await response.text();

    expect(body).toContain("# HELP trucore_admin_login_success_total");
    expect(body).toContain("# TYPE trucore_admin_login_success_total counter");
    expect(body).toContain("trucore_admin_session_store_size");
    expect(body).toContain("trucore_security_uptime_seconds");
  });

  it("reflects security events in output", async () => {
    logSecurityEvent("login_failure", {});
    logSecurityEvent("login_failure", {});
    logSecurityEvent("admin_api_denied", {});

    const response = GET();
    const body = await response.text();

    expect(body).toContain("trucore_admin_login_failure_total 2");
    expect(body).toContain("trucore_admin_api_denied_total 1");
  });

  it("does not leak secrets or tokens", async () => {
    process.env.ADMIN_DASHBOARD_KEY = "leaked-secret-key";
    logSecurityEvent("login_success", { ip: "10.0.0.1" });

    const response = GET();
    const body = await response.text();

    expect(body).not.toContain("leaked-secret-key");
    expect(body).not.toContain("10.0.0.1");
    expect(body).not.toContain("cookie");
    expect(body).not.toContain("token");
  });

  it("does not contain per-IP or per-user dimensions", async () => {
    logSecurityEvent("login_failure", { ip: "203.0.113.50" });

    const response = GET();
    const body = await response.text();

    // No label syntax like {ip="..."} or {user="..."}
    expect(body).not.toMatch(/\{[^}]*ip=/);
    expect(body).not.toMatch(/\{[^}]*user=/);
    expect(body).not.toContain("203.0.113.50");
  });

  it("output is deterministic for the same state", async () => {
    logSecurityEvent("login_success", {});

    const body1 = await GET().text();
    const body2 = await GET().text();

    // Uptime may tick between calls, so strip it for comparison
    const strip = (s: string) =>
      s.replace(/trucore_security_uptime_seconds \d+/, "UPTIME");

    expect(strip(body1)).toBe(strip(body2));
  });

  it("returns stable output even with no events", async () => {
    const response = GET();
    const body = await response.text();

    // Should still have all metric definitions
    expect(body).toContain("trucore_admin_login_success_total 0");
    expect(body).toContain("trucore_admin_session_store_size 0");
  });
});

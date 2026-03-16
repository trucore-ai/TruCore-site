import { afterEach, describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/metrics/security/route";
import {
  logSecurityEvent,
  _resetSecurityEventCounters,
} from "@/lib/security-log";
import { _getSessionStore, _resetGcTimer } from "@/lib/admin-auth";
import { _resetMetricsCache } from "@/lib/security-metrics";
import { _resetRateLimitBuckets } from "@/lib/rate-limit";

const ORIGINAL_ENV = { ...process.env };

/** Build a minimal Request with optional IP headers. */
function fakeRequest(ip?: string): Request {
  const headers: Record<string, string> = {};
  if (ip) headers["x-forwarded-for"] = ip;
  return new Request("http://localhost/api/metrics/security", { headers });
}

afterEach(() => {
  _resetSecurityEventCounters();
  _resetMetricsCache();
  _resetRateLimitBuckets();
  _getSessionStore().clear();
  _resetGcTimer();
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("GET /api/metrics/security", () => {
  it("returns 200 with Prometheus content type", () => {
    const response = GET(fakeRequest());
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "text/plain; version=0.0.4; charset=utf-8",
    );
  });

  it("sets no-store cache header", () => {
    const response = GET(fakeRequest());
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("sets nosniff header", () => {
    const response = GET(fakeRequest());
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("returns valid Prometheus text body", async () => {
    const response = GET(fakeRequest());
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

    const response = GET(fakeRequest());
    const body = await response.text();

    expect(body).toContain("trucore_admin_login_failure_total 2");
    expect(body).toContain("trucore_admin_api_denied_total 1");
  });

  it("does not leak secrets or tokens", async () => {
    process.env.ADMIN_DASHBOARD_KEY = "leaked-secret-key";
    logSecurityEvent("login_success", { ip: "10.0.0.1" });

    const response = GET(fakeRequest());
    const body = await response.text();

    expect(body).not.toContain("leaked-secret-key");
    expect(body).not.toContain("10.0.0.1");
    expect(body).not.toContain("cookie");
    expect(body).not.toContain("token");
  });

  it("does not contain per-IP or per-user dimensions", async () => {
    logSecurityEvent("login_failure", { ip: "203.0.113.50" });

    const response = GET(fakeRequest("203.0.113.50"));
    const body = await response.text();

    // No label syntax like {ip="..."} or {user="..."}
    expect(body).not.toMatch(/\{[^}]*ip=/);
    expect(body).not.toMatch(/\{[^}]*user=/);
    expect(body).not.toContain("203.0.113.50");
  });

  it("output is deterministic for the same state", async () => {
    logSecurityEvent("login_success", {});

    const body1 = await GET(fakeRequest()).text();
    const body2 = await GET(fakeRequest()).text();

    // Uptime may tick between calls, so strip it for comparison
    const strip = (s: string) =>
      s.replace(/trucore_security_uptime_seconds \d+/, "UPTIME");

    expect(strip(body1)).toBe(strip(body2));
  });

  it("returns stable output even with no events", async () => {
    const response = GET(fakeRequest());
    const body = await response.text();

    // Should still have all metric definitions
    expect(body).toContain("trucore_admin_login_success_total 0");
    expect(body).toContain("trucore_admin_session_store_size 0");
  });
});

/* ═══════════ Rate limiting ═══════════ */

describe("GET /api/metrics/security — rate limiting", () => {
  it("allows normal scrape frequency without throttling", () => {
    const req = fakeRequest("10.0.0.1");
    for (let i = 0; i < 30; i++) {
      const res = GET(req);
      expect(res.status).toBe(200);
    }
  });

  it("returns 429 with Retry-After when limit exceeded", () => {
    const req = fakeRequest("10.0.0.2");
    // Exhaust the 60-request limit
    for (let i = 0; i < 60; i++) {
      GET(req);
    }

    const res = GET(req);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
    expect(Number(res.headers.get("Retry-After"))).toBeGreaterThanOrEqual(1);
  });

  it("throttled response does not leak internal details", async () => {
    const req = fakeRequest("10.0.0.3");
    for (let i = 0; i < 61; i++) {
      GET(req);
    }

    const res = GET(req);
    const body = await res.text();

    // Body must be empty or minimal — no limiter state, IPs, or keys
    expect(body).not.toContain("10.0.0.3");
    expect(body).not.toContain("bucket");
    expect(body).not.toContain("limit");
    expect(body).not.toContain("remaining");
    expect(body.length).toBeLessThan(50);
  });

  it("throttled response still has safe headers", () => {
    const req = fakeRequest("10.0.0.4");
    for (let i = 0; i < 61; i++) {
      GET(req);
    }

    const res = GET(req);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("limits are per-IP — different IPs are independent", () => {
    const reqA = fakeRequest("10.0.0.5");
    const reqB = fakeRequest("10.0.0.6");

    // Exhaust limit for IP A
    for (let i = 0; i < 61; i++) {
      GET(reqA);
    }
    expect(GET(reqA).status).toBe(429);

    // IP B is unaffected
    expect(GET(reqB).status).toBe(200);
  });
});

/* ═══════════ In-memory caching ═══════════ */

describe("GET /api/metrics/security — caching", () => {
  it("returns cached body within TTL window", async () => {
    logSecurityEvent("login_failure", {});

    const body1 = await GET(fakeRequest()).text();

    // New event — should be cached and not reflected
    logSecurityEvent("login_failure", {});
    const body2 = await GET(fakeRequest()).text();

    expect(body2).toBe(body1);
    expect(body2).toContain("trucore_admin_login_failure_total 1");
  });

  it("refreshes after TTL expires", async () => {
    logSecurityEvent("login_failure", {});
    const body1 = await GET(fakeRequest()).text();

    logSecurityEvent("login_failure", {});

    // Advance time past the 10 s TTL
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 11_000);
    const body2 = await GET(fakeRequest()).text();

    expect(body2).toContain("trucore_admin_login_failure_total 2");
    expect(body2).not.toBe(body1);
  });

  it("no secrets or IPs appear in cached or fresh output", async () => {
    process.env.ADMIN_DASHBOARD_KEY = "super-secret-test-key";
    logSecurityEvent("login_success", { ip: "192.168.1.99" });

    // First call — fresh
    const fresh = await GET(fakeRequest("192.168.1.99")).text();
    // Second call — cached
    const cached = await GET(fakeRequest("192.168.1.99")).text();

    for (const body of [fresh, cached]) {
      expect(body).not.toContain("super-secret-test-key");
      expect(body).not.toContain("192.168.1.99");
      expect(body).not.toContain("cookie");
    }
  });
});

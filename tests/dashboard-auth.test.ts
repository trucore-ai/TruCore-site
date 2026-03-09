import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

/* ────────────────────────────────────────────────────────────────
 *  Dashboard Client - API key authentication tests
 *
 *  Verifies that the dashboard fetch helper attaches the
 *  server-only ATF_API_KEY as an x-api-key header when the env
 *  var is present, and omits it when absent.
 * ──────────────────────────────────────────────────────────── */

// ── Helpers ──────────────────────────────────────────────────

const DASHBOARD_URL = "https://atf.example.com";

/** Minimal valid /dashboard/health response. */
const healthPayload = {
  status: "healthy",
  uptime_seconds: 86400,
  version: "1.43.0",
  started_at: "2026-03-07T12:00:00Z",
  checks: [],
};

// ── Setup / teardown ─────────────────────────────────────────

const originalEnv = { ...process.env };

beforeAll(() => {
  process.env.NEXT_PUBLIC_ATF_DASHBOARD_URL = DASHBOARD_URL;
});

afterEach(() => {
  vi.restoreAllMocks();
  // Reset env to avoid leaking between tests
  delete process.env.ATF_API_KEY;
});

afterAll(() => {
  process.env = originalEnv;
});

// ── Tests ────────────────────────────────────────────────────

describe("dashboardFetch auth header", () => {
  it("attaches x-api-key header when ATF_API_KEY is set", async () => {
    process.env.ATF_API_KEY = "tk_live_test123";

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(healthPayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    // Dynamic import so env is read at call time
    const { fetchHealth } = await import("@/lib/dashboard-client");
    const result = await fetchHealth();

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe(`${DASHBOARD_URL}/dashboard/health`);

    const headers = init?.headers as Record<string, string>;
    expect(headers["x-api-key"]).toBe("tk_live_test123");
    expect(headers["Accept"]).toBe("application/json");
    expect(result.ok).toBe(true);
  });

  it("omits x-api-key header when ATF_API_KEY is not set", async () => {
    delete process.env.ATF_API_KEY;

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(healthPayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { fetchHealth } = await import("@/lib/dashboard-client");
    const result = await fetchHealth();

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [, init] = fetchSpy.mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers["x-api-key"]).toBeUndefined();
    expect(result.ok).toBe(true);
  });

  it("returns graceful error when ATF responds 401", async () => {
    process.env.ATF_API_KEY = "tk_live_expired";

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "invalid_api_key" }), {
        status: 401,
        statusText: "Unauthorized",
      }),
    );

    const { fetchHealth } = await import("@/lib/dashboard-client");
    const result = await fetchHealth();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("401");
    }
  });

  it("does not expose ATF_API_KEY via NEXT_PUBLIC prefix", () => {
    process.env.ATF_API_KEY = "tk_live_secret";
    // Env vars prefixed with NEXT_PUBLIC_ are exposed to the browser.
    // ATF_API_KEY must never have that prefix.
    expect(process.env.NEXT_PUBLIC_ATF_API_KEY).toBeUndefined();
  });
});

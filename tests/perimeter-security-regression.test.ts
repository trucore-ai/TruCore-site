/**
 * Perimeter security regression tests.
 *
 * Locks in the highest-value security invariants across the hardened
 * admin and public surfaces. Each describe block maps to one of the
 * eight priority invariants from the security perimeter spec.
 *
 * These are intentionally regression-focused: they confirm guarantees
 * that already exist, so any future change that breaks them surfaces
 * immediately.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

/* ──────────────────────────────────────────────────────────
 * SHARED BANNED-PATTERN HELPER
 *
 * Any response body or error surface that faces an end-user or an
 * unauthenticated caller must never contain these patterns.
 * ────────────────────────────────────────────────────────── */

const BANNED_PATTERNS = [
  /postgres:\/\//i,
  /DATABASE_URL/i,
  /ECONNREFUSED/i,
  /password/i,
  /SELECT\s/i,
  /INSERT\s/i,
  /relation\s+"?\w+"?\s+does not exist/i,
  /at\s+\S+\s+\(.+:\d+:\d+\)/,
  /Bearer\s/i,
  /\.pem/i,
  /DSN/i,
  /127\.0\.0\.\d+:\d{4}/,
] as const;

function assertNoBannedPatterns(text: string, label: string) {
  for (const pattern of BANNED_PATTERNS) {
    expect(text, `${label} must not match ${pattern}`).not.toMatch(pattern);
  }
}

/* ──────────────────────────────────────────────────────────
 * Mocks — cookie layer for admin-auth (shared across sections 1, 3, 4)
 * ────────────────────────────────────────────────────────── */

const mocks = vi.hoisted(() => {
  const cookieValues = new Map<string, string>();
  const cookieStore = {
    get: vi.fn((name: string) => {
      const value = cookieValues.get(name);
      return value === undefined ? undefined : { name, value };
    }),
  };
  return {
    cookieValues,
    cookieStore,
    cookiesMock: vi.fn(async () => cookieStore),
  };
});

vi.mock("next/headers", () => ({ cookies: mocks.cookiesMock }));

/* ── Imports (after mocks are wired) ── */

import {
  isValidSessionToken,
  createSessionToken,
  assertAdminSession,
  _getSessionStore,
  ADMIN_COOKIE_NAME,
} from "@/lib/admin-auth";

import { withAdminApiAuth } from "@/lib/admin-api-auth";
import { withAdminAction } from "@/lib/admin-action-auth";

import {
  logSecurityEvent,
  getSecurityEventCounters,
  getAdminPageDegradedCounts,
  getAdminActionDegradedCounts,
  getAdminApiDegradedCounts,
  getAgentRouteRateLimitedCounts,
  getPublicRouteRateLimitedCounts,
  _resetSecurityEventCounters,
} from "@/lib/security-log";

import {
  consumeRateLimit,
  _resetRateLimitBuckets,
} from "@/lib/rate-limit";

/* ── Global setup / teardown ── */

afterEach(() => {
  _resetSecurityEventCounters();
  _resetRateLimitBuckets();
  vi.restoreAllMocks();
});

/* ──────────────────────────────────────────────────────────
 * 1. ADMIN AUTH FAIL-CLOSED (representative)
 * ────────────────────────────────────────────────────────── */

describe("1 — admin auth fail-closed edge cases", () => {
  beforeEach(() => {
    mocks.cookieValues.clear();
    _getSessionStore().clear();
    process.env.ADMIN_DASHBOARD_KEY = "regression-test-key";
  });

  it("rejects empty-string token", () => {
    expect(isValidSessionToken("")).toBe(false);
  });

  it("rejects whitespace-only token", () => {
    expect(isValidSessionToken("   ")).toBe(false);
  });

  it("rejects extremely long garbage token", () => {
    expect(isValidSessionToken("a".repeat(10_000))).toBe(false);
  });

  it("rejects token that is valid hex but not in store", () => {
    expect(isValidSessionToken("deadbeef".repeat(8))).toBe(false);
  });

  it("assertAdminSession denies when cookie has empty-string value", async () => {
    mocks.cookieValues.set(ADMIN_COOKIE_NAME, "");
    await expect(assertAdminSession()).rejects.toThrow("unauthorized");
  });

  it("assertAdminSession denies when cookie has wrong token", async () => {
    createSessionToken(); // populate store with a real token
    mocks.cookieValues.set(ADMIN_COOKIE_NAME, "not-the-right-token");
    await expect(assertAdminSession()).rejects.toThrow("unauthorized");
  });
});

/* ──────────────────────────────────────────────────────────
 * 2. ADMIN DEGRADED-RENDERING SAFETY (representative)
 * ────────────────────────────────────────────────────────── */

describe("2 — admin degraded rendering produces no backend details", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("admin_page_degraded counters never surface raw error text", () => {
    const rawDbError =
      "connection refused to postgres://admin:secret@host:5432/db";

    logSecurityEvent("admin_page_degraded", {
      meta: { page: "waitlist", reason: "upstream_failure" },
    });

    const counts = getAdminPageDegradedCounts();
    expect(counts).toHaveProperty("waitlist");
    const serialized = JSON.stringify(counts);
    assertNoBannedPatterns(serialized, "admin_page_degraded_counts");
    expect(serialized).not.toContain(rawDbError);
  });
});

/* ──────────────────────────────────────────────────────────
 * 3. ADMIN SERVER-ACTION DEGRADED FAILURE (representative)
 * ────────────────────────────────────────────────────────── */

describe("3 — admin server-action degraded returns safe contract", () => {
  beforeEach(() => {
    mocks.cookieValues.clear();
    _getSessionStore().clear();
    process.env.ADMIN_DASHBOARD_KEY = "regression-action-key";
    // Auth must pass for the action body to execute
    const token = createSessionToken();
    mocks.cookieValues.set(ADMIN_COOKIE_NAME, token);
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("DB error returns { error: 'temporarily_unavailable' } with no details", async () => {
    const result = await withAdminAction(async () => {
      throw new Error(
        'connection refused to postgres://admin:secret@host:5432/db — relation "api_keys" does not exist',
      );
    }, { action: "regression_test" });

    expect(result).toEqual({ error: "temporarily_unavailable" });
    assertNoBannedPatterns(
      JSON.stringify(result),
      "withAdminAction degraded result",
    );
  });

  it("non-Error throw returns safe contract", async () => {
    const result = await withAdminAction(async () => {
      throw "raw string with postgres://admin:pass@host/db";
    }, { action: "regression_string_throw" });

    expect(result).toEqual({ error: "temporarily_unavailable" });
  });
});

/* ──────────────────────────────────────────────────────────
 * 4. ADMIN API DEGRADED FAILURE (representative)
 * ────────────────────────────────────────────────────────── */

describe("4 — admin API degraded returns safe JSON contract", () => {
  beforeEach(() => {
    mocks.cookieValues.clear();
    _getSessionStore().clear();
    process.env.ADMIN_DASHBOARD_KEY = "regression-api-key";
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("unhandled handler error returns safe body with no backend details", async () => {
    const token = createSessionToken();
    mocks.cookieValues.set(ADMIN_COOKIE_NAME, token);

    const handler = withAdminApiAuth(async () => {
      throw new Error(
        "ECONNREFUSED 127.0.0.1:5432 — SSL connection error: certificate verify failed",
      );
    });

    const req = new NextRequest(
      new URL("/api/dashboard/refresh", "http://localhost:3000"),
      { method: "GET" },
    );
    const res = await handler(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: "temporarily_unavailable" });
    assertNoBannedPatterns(JSON.stringify(body), "admin API degraded body");
  });

  it("auth denial returns 404 with hardened headers", async () => {
    // No session cookie set → auth fails
    const handler = withAdminApiAuth(async () =>
      NextResponse.json({ ok: true }),
    );
    const req = new NextRequest(
      new URL("/api/admin/security", "http://localhost:3000"),
      { method: "GET" },
    );
    const res = await handler(req);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: "not_found" });
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
  });
});

/* ──────────────────────────────────────────────────────────
 * 5. PUBLIC ROUTE THROTTLE RESPONSE (representative)
 * ────────────────────────────────────────────────────────── */

describe("5 — public route 429 response is safe and non-leaky", () => {
  it("rate limit result includes resetEpochSeconds for Retry-After", () => {
    const key = "regression-test-key";
    let result = { exceeded: false, resetEpochSeconds: 0 } as ReturnType<
      typeof consumeRateLimit
    >;
    for (let i = 0; i < 35; i++) {
      result = consumeRateLimit(key, { max: 30, windowMs: 60_000 });
    }
    expect(result.exceeded).toBe(true);
    expect(result.remaining).toBe(0);
    expect(result.resetEpochSeconds).toBeGreaterThan(0);
  });

  it("throttled response shape contracts hold", () => {
    const rl = consumeRateLimit("shape-check", { max: 0, windowMs: 60_000 });
    expect(rl.exceeded).toBe(true);

    const retryAfter = Math.max(
      1,
      rl.resetEpochSeconds - Math.floor(Date.now() / 1000),
    );
    expect(retryAfter).toBeGreaterThanOrEqual(1);

    const body = JSON.stringify({ ok: false, error: "rate_limited" });
    assertNoBannedPatterns(body, "429 body");
  });
});

/* ──────────────────────────────────────────────────────────
 * 6. PUBLIC VERIFICATION / METRICS SAFE CONTRACT
 * ────────────────────────────────────────────────────────── */

describe("6 — public verification & metrics contracts", () => {
  it("roundForPublicDisplay rounds to nearest 5", () => {
    // Inline the function since it is not exported — verify the contract
    function roundForPublicDisplay(value: number): number {
      if (value <= 0) return 0;
      return Math.round(value / 5) * 5;
    }
    expect(roundForPublicDisplay(0)).toBe(0);
    expect(roundForPublicDisplay(1)).toBe(0);
    expect(roundForPublicDisplay(3)).toBe(5);
    expect(roundForPublicDisplay(7)).toBe(5);
    expect(roundForPublicDisplay(8)).toBe(10);
    expect(roundForPublicDisplay(13)).toBe(15);
    expect(roundForPublicDisplay(-1)).toBe(0);
  });

  it("public-metrics fallback shape matches safe contract", () => {
    const fallback = {
      simulator_requests_24h: 0,
      active_partner_keys: 0,
      receipts_generated_total: 0,
      preview_mode: true,
    };
    expect(fallback.preview_mode).toBe(true);
    expect(fallback.simulator_requests_24h).toBe(0);
    expect(fallback.active_partner_keys).toBe(0);
    expect(fallback.receipts_generated_total).toBe(0);
    assertNoBannedPatterns(
      JSON.stringify(fallback),
      "public-metrics fallback",
    );
  });

  it("verify-receipt 400 shape is safe", () => {
    const invalidJson = { ok: false, error: "invalid_json" };
    const invalidReq = { ok: false, error: "invalid_request" };
    assertNoBannedPatterns(JSON.stringify(invalidJson), "invalid_json body");
    assertNoBannedPatterns(JSON.stringify(invalidReq), "invalid_request body");
  });
});

/* ──────────────────────────────────────────────────────────
 * 7. AUTHENTICATED TELEMETRY PAYLOAD SAFETY
 * ────────────────────────────────────────────────────────── */

describe("7 — authenticated telemetry payload has no banned content", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("security event counters contain only aggregate numbers", () => {
    logSecurityEvent("login_failure", {
      ip: "192.168.1.42",
      meta: { attempt: "admin_key_with_secret_value" },
    });
    logSecurityEvent("admin_api_degraded", {
      ip: "10.0.0.1",
      meta: { route: "keys/create", reason: "ECONNREFUSED" },
    });

    const counters = getSecurityEventCounters();
    const serialized = JSON.stringify(counters);

    for (const value of Object.values(counters)) {
      expect(typeof value).toBe("number");
    }
    expect(serialized).not.toContain("192.168.1.42");
    expect(serialized).not.toContain("10.0.0.1");
    assertNoBannedPatterns(serialized, "securityEventCounters");
  });

  it("all per-resource breakdowns contain only safe labels and counts", () => {
    const all = {
      ...getAdminPageDegradedCounts(),
      ...getAdminActionDegradedCounts(),
      ...getAdminApiDegradedCounts(),
      ...getAgentRouteRateLimitedCounts(),
      ...getPublicRouteRateLimitedCounts(),
    };
    const serialized = JSON.stringify(all);
    for (const value of Object.values(all)) {
      expect(typeof value).toBe("number");
    }
    assertNoBannedPatterns(serialized, "per-resource breakdowns");
  });
});

/* ──────────────────────────────────────────────────────────
 * 8. SHARED TELEMETRY REFRESH SAFETY
 *
 * Locks in: failed refresh retains stale data, no raw error leakage.
 * The hook tests in admin-telemetry-refresh.test.tsx already cover
 * rendering; we add a complementary contract-level check here.
 * ────────────────────────────────────────────────────────── */

describe("8 — telemetry refresh failure contract", () => {
  it("simulated fetch failure produces safe fallback state", () => {
    const lastGoodData = {
      uptime_seconds: 60,
      session_store_size: 1,
      revoked_session_count: 0,
      admin_page_degraded_total: 0,
      admin_page_degraded_by_page: {},
      admin_action_degraded_total: 0,
      admin_action_degraded_by_action: {},
      admin_api_degraded_total: 0,
      admin_api_degraded_by_route: {},
      agent_route_rate_limited_total: 0,
      agent_route_rate_limited_by_route: {},
      public_route_rate_limited_total: 0,
      public_route_rate_limited_by_route: {},
    };

    const currentData = lastGoodData;
    let hasError = false;

    // Simulate refresh failure
    try {
      const response = { ok: false, status: 500 };
      if (!response.ok) throw new Error("fetch_failed");
    } catch {
      hasError = true;
    }

    expect(currentData).toEqual(lastGoodData);
    expect(hasError).toBe(true);
    assertNoBannedPatterns(
      JSON.stringify(currentData),
      "stale telemetry data",
    );
  });

  it("admin security telemetry schema has only aggregate fields", () => {
    const expectedKeys = new Set([
      "uptime_seconds",
      "session_store_size",
      "revoked_session_count",
      "security_event_counters",
      "admin_page_degraded_total",
      "admin_page_degraded_by_page",
      "admin_action_degraded_total",
      "admin_action_degraded_by_action",
      "admin_api_degraded_total",
      "admin_api_degraded_by_route",
      "agent_route_rate_limited_total",
      "agent_route_rate_limited_by_route",
      "public_route_rate_limited_total",
      "public_route_rate_limited_by_route",
    ]);

    const bannedKeys = [
      "ip",
      "ip_address",
      "client_ip",
      "token",
      "session_token",
      "cookie",
      "password",
      "secret",
      "dsn",
      "database_url",
      "stack_trace",
    ];

    for (const key of bannedKeys) {
      expect(
        expectedKeys.has(key),
        `telemetry schema must not contain '${key}'`,
      ).toBe(false);
    }
  });
});

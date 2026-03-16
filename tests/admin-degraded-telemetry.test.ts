import { afterEach, describe, expect, it, vi } from "vitest";
import {
  logSecurityEvent,
  getSecurityEventCounters,
  getAdminPageDegradedCounts,
  _resetSecurityEventCounters,
} from "@/lib/security-log";

afterEach(() => {
  _resetSecurityEventCounters();
  vi.restoreAllMocks();
});

/* ═══════════ Per-page degraded counters ═══════════ */

describe("adminPageDegradedCounts tracking", () => {
  it("tracks per-page degraded counts for known pages", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    logSecurityEvent("admin_page_degraded", {
      meta: { page: "waitlist", reason: "db_unavailable" },
    });
    logSecurityEvent("admin_page_degraded", {
      meta: { page: "waitlist", reason: "db_unavailable" },
    });
    logSecurityEvent("admin_page_degraded", {
      meta: { page: "csp", reason: "db_unavailable" },
    });
    logSecurityEvent("admin_page_degraded", {
      meta: { page: "metrics", reason: "fetch_failed" },
    });

    const byPage = getAdminPageDegradedCounts();
    expect(byPage["waitlist"]).toBe(2);
    expect(byPage["csp"]).toBe(1);
    expect(byPage["metrics"]).toBe(1);

    // aggregate also tracks
    const counters = getSecurityEventCounters();
    expect(counters["admin_page_degraded"]).toBe(4);
  });

  it("ignores unknown page names", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    logSecurityEvent("admin_page_degraded", {
      meta: { page: "unknown_page", reason: "db_unavailable" },
    });

    const byPage = getAdminPageDegradedCounts();
    expect(Object.keys(byPage)).toHaveLength(0);

    // aggregate still counts
    const counters = getSecurityEventCounters();
    expect(counters["admin_page_degraded"]).toBe(1);
  });

  it("ignores events without page metadata", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    logSecurityEvent("admin_page_degraded", {
      meta: { reason: "db_unavailable" },
    });

    const byPage = getAdminPageDegradedCounts();
    expect(Object.keys(byPage)).toHaveLength(0);
  });

  it("does not track per-page for non-degraded events", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    logSecurityEvent("login_failure", {
      meta: { page: "waitlist" },
    });

    const byPage = getAdminPageDegradedCounts();
    expect(Object.keys(byPage)).toHaveLength(0);
  });

  it("reset clears per-page counters", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    logSecurityEvent("admin_page_degraded", {
      meta: { page: "audit", reason: "db_unavailable" },
    });

    expect(getAdminPageDegradedCounts()["audit"]).toBe(1);

    _resetSecurityEventCounters();

    expect(Object.keys(getAdminPageDegradedCounts())).toHaveLength(0);
    expect(Object.keys(getSecurityEventCounters())).toHaveLength(0);
  });

  it("per-page keys contain only safe static page names", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const safePages = [
      "waitlist",
      "csp",
      "usage",
      "metrics",
      "audit",
      "acquisition",
      "keys",
    ];

    for (const page of safePages) {
      logSecurityEvent("admin_page_degraded", {
        meta: { page, reason: "db_unavailable" },
      });
    }

    const byPage = getAdminPageDegradedCounts();
    const keys = Object.keys(byPage);

    expect(keys).toHaveLength(safePages.length);
    for (const key of keys) {
      expect(safePages).toContain(key);
      // Must not contain IPs, secrets, or SQL
      expect(key).not.toMatch(/\d+\.\d+\.\d+\.\d+/);
      expect(key).not.toContain("DATABASE_URL");
      expect(key).not.toContain("ADMIN_DASHBOARD_KEY");
      expect(key).not.toContain("SELECT ");
    }
  });
});

/* ═══════════ API payload shape ═══════════ */

describe("admin security API degraded telemetry payload", () => {
  /* ── mock next/headers cookies for withAdminApiAuth ── */
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

  vi.mock("next/headers", () => ({
    cookies: mocks.cookiesMock,
  }));

  // Lazy imports after mock setup
  const getModules = async () => {
    const { NextRequest } = await import("next/server");
    const {
      ADMIN_COOKIE_NAME,
      createSessionToken,
      _getSessionStore,
      _resetGcTimer,
    } = await import("@/lib/admin-auth");
    const { GET } = await import("@/app/api/admin/security/route");
    return {
      NextRequest,
      ADMIN_COOKIE_NAME,
      createSessionToken,
      _getSessionStore,
      _resetGcTimer,
      GET,
    };
  };

  afterEach(() => {
    mocks.cookieValues.clear();
  });

  it("includes degraded telemetry fields in authenticated response", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    process.env.ADMIN_DASHBOARD_KEY = "test-admin-key";

    const {
      NextRequest,
      ADMIN_COOKIE_NAME,
      createSessionToken,
      _getSessionStore,
      _resetGcTimer,
      GET,
    } = await getModules();

    _getSessionStore().clear();
    _resetGcTimer();

    logSecurityEvent("admin_page_degraded", {
      meta: { page: "waitlist", reason: "db_unavailable" },
    });
    logSecurityEvent("admin_page_degraded", {
      meta: { page: "csp", reason: "db_unavailable" },
    });

    const token = createSessionToken();
    mocks.cookieValues.set(ADMIN_COOKIE_NAME, token);

    const req = new NextRequest(
      new URL("/api/admin/security", "http://localhost:3000"),
      { method: "GET" },
    );
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.admin_page_degraded_total).toBe(2);
    expect(body.admin_page_degraded_by_page).toEqual({
      waitlist: 1,
      csp: 1,
    });
  });

  it("returns zero counters when no degraded events occurred", async () => {
    process.env.ADMIN_DASHBOARD_KEY = "test-admin-key";

    const {
      NextRequest,
      ADMIN_COOKIE_NAME,
      createSessionToken,
      _getSessionStore,
      _resetGcTimer,
      GET,
    } = await getModules();

    _getSessionStore().clear();
    _resetGcTimer();

    const token = createSessionToken();
    mocks.cookieValues.set(ADMIN_COOKIE_NAME, token);

    const req = new NextRequest(
      new URL("/api/admin/security", "http://localhost:3000"),
      { method: "GET" },
    );
    const res = await GET(req);
    const body = await res.json();

    expect(body.admin_page_degraded_total).toBe(0);
    expect(body.admin_page_degraded_by_page).toEqual({});
  });

  it("does not leak secrets or raw backend details in degraded payload", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    process.env.ADMIN_DASHBOARD_KEY = "test-admin-key";

    const {
      NextRequest,
      ADMIN_COOKIE_NAME,
      createSessionToken,
      _getSessionStore,
      _resetGcTimer,
      GET,
    } = await getModules();

    _getSessionStore().clear();
    _resetGcTimer();

    logSecurityEvent("admin_page_degraded", {
      meta: { page: "audit", reason: "db_unavailable" },
    });

    const token = createSessionToken();
    mocks.cookieValues.set(ADMIN_COOKIE_NAME, token);

    const req = new NextRequest(
      new URL("/api/admin/security", "http://localhost:3000"),
      { method: "GET" },
    );
    const res = await GET(req);
    const raw = await res.text();

    expect(raw).not.toContain(token);
    expect(raw).not.toContain("test-admin-key");
    expect(raw).not.toContain("DATABASE_URL");
    expect(raw).not.toContain("POSTGRES");
    expect(raw).not.toContain("cookie");
    expect(raw).not.toContain("ECONNREFUSED");
    expect(raw).not.toContain("stack");
    expect(raw).not.toContain("SELECT ");
  });

  it("denies unauthenticated access (fail-closed)", async () => {
    process.env.ADMIN_DASHBOARD_KEY = "test-admin-key";

    const { NextRequest, _getSessionStore, _resetGcTimer, GET } =
      await getModules();

    _getSessionStore().clear();
    _resetGcTimer();

    const req = new NextRequest(
      new URL("/api/admin/security", "http://localhost:3000"),
      { method: "GET" },
    );
    const res = await GET(req);
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.admin_page_degraded_total).toBeUndefined();
    expect(body.admin_page_degraded_by_page).toBeUndefined();
  });
});

/* ═══════════ AdminDegradedTelemetry component ═══════════ */

describe("AdminDegradedTelemetry component render", () => {
  it("is exported as a client component module", async () => {
    const mod = await import(
      "@/components/dashboard/admin-degraded-telemetry"
    );
    expect(typeof mod.AdminDegradedTelemetry).toBe("function");
  });
});

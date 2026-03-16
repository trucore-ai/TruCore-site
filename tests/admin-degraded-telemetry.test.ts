import { afterEach, describe, expect, it, vi } from "vitest";
import {
  logSecurityEvent,
  getSecurityEventCounters,
  getAdminPageDegradedCounts,
  getAdminActionDegradedCounts,
  getAdminApiDegradedCounts,
  getAgentRouteRateLimitedCounts,
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

/* ═══════════ Per-action degraded mutation counters ═══════════ */

describe("adminActionDegradedCounts tracking", () => {
  it("tracks per-action degraded counts for known actions", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    logSecurityEvent("admin_action_degraded", {
      meta: { action: "set_signup_status", failure: "Error" },
    });
    logSecurityEvent("admin_action_degraded", {
      meta: { action: "set_signup_status", failure: "Error" },
    });
    logSecurityEvent("admin_action_degraded", {
      meta: { action: "update_admin_notes", failure: "TypeError" },
    });

    const byAction = getAdminActionDegradedCounts();
    expect(byAction["set_signup_status"]).toBe(2);
    expect(byAction["update_admin_notes"]).toBe(1);

    const counters = getSecurityEventCounters();
    expect(counters["admin_action_degraded"]).toBe(3);
  });

  it("ignores unknown action names", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    logSecurityEvent("admin_action_degraded", {
      meta: { action: "unknown_evil_action", failure: "Error" },
    });

    const byAction = getAdminActionDegradedCounts();
    expect(Object.keys(byAction)).toHaveLength(0);

    // aggregate still counts
    const counters = getSecurityEventCounters();
    expect(counters["admin_action_degraded"]).toBe(1);
  });

  it("ignores events without action metadata", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    logSecurityEvent("admin_action_degraded", {
      meta: { failure: "Error" },
    });

    const byAction = getAdminActionDegradedCounts();
    expect(Object.keys(byAction)).toHaveLength(0);
  });

  it("does not track per-action for non-action-degraded events", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    logSecurityEvent("login_failure", {
      meta: { action: "set_signup_status" },
    });

    const byAction = getAdminActionDegradedCounts();
    expect(Object.keys(byAction)).toHaveLength(0);
  });

  it("reset clears per-action counters", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    logSecurityEvent("admin_action_degraded", {
      meta: { action: "export_design_partners_csv", failure: "Error" },
    });

    expect(getAdminActionDegradedCounts()["export_design_partners_csv"]).toBe(1);

    _resetSecurityEventCounters();

    expect(Object.keys(getAdminActionDegradedCounts())).toHaveLength(0);
    expect(Object.keys(getSecurityEventCounters())).toHaveLength(0);
  });

  it("per-action keys contain only safe static action labels", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const safeActions = [
      "set_signup_status",
      "update_admin_notes",
      "export_design_partners_csv",
    ];

    for (const action of safeActions) {
      logSecurityEvent("admin_action_degraded", {
        meta: { action, failure: "Error" },
      });
    }

    const byAction = getAdminActionDegradedCounts();
    const keys = Object.keys(byAction);

    expect(keys).toHaveLength(safeActions.length);
    for (const key of keys) {
      expect(safeActions).toContain(key);
      expect(key).not.toMatch(/\d+\.\d+\.\d+\.\d+/);
      expect(key).not.toContain("DATABASE_URL");
      expect(key).not.toContain("ADMIN_DASHBOARD_KEY");
      expect(key).not.toContain("SELECT ");
    }
  });
});

/* ═══════════ Per-route degraded API counters ═══════════ */

describe("adminApiDegradedCounts tracking", () => {
  it("tracks per-route degraded counts for known routes", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    logSecurityEvent("admin_api_degraded", {
      meta: { route: "keys/create", reason: "upstream_timeout" },
    });
    logSecurityEvent("admin_api_degraded", {
      meta: { route: "keys/create", reason: "upstream_timeout" },
    });
    logSecurityEvent("admin_api_degraded", {
      meta: { route: "dashboard/refresh", reason: "upstream_error" },
    });

    const byRoute = getAdminApiDegradedCounts();
    expect(byRoute["keys/create"]).toBe(2);
    expect(byRoute["dashboard/refresh"]).toBe(1);

    const counters = getSecurityEventCounters();
    expect(counters["admin_api_degraded"]).toBe(3);
  });

  it("ignores unknown route names", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    logSecurityEvent("admin_api_degraded", {
      meta: { route: "unknown/evil/route", reason: "upstream_error" },
    });

    const byRoute = getAdminApiDegradedCounts();
    expect(Object.keys(byRoute)).toHaveLength(0);

    // aggregate still counts
    const counters = getSecurityEventCounters();
    expect(counters["admin_api_degraded"]).toBe(1);
  });

  it("ignores events without route metadata", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    logSecurityEvent("admin_api_degraded", {
      meta: { reason: "upstream_error" },
    });

    const byRoute = getAdminApiDegradedCounts();
    expect(Object.keys(byRoute)).toHaveLength(0);
  });

  it("does not track per-route for non-api-degraded events", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    logSecurityEvent("login_failure", {
      meta: { route: "keys/create" },
    });

    const byRoute = getAdminApiDegradedCounts();
    expect(Object.keys(byRoute)).toHaveLength(0);
  });

  it("reset clears per-route counters", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    logSecurityEvent("admin_api_degraded", {
      meta: { route: "portal/token/create", reason: "upstream_error" },
    });

    expect(getAdminApiDegradedCounts()["portal/token/create"]).toBe(1);

    _resetSecurityEventCounters();

    expect(Object.keys(getAdminApiDegradedCounts())).toHaveLength(0);
    expect(Object.keys(getSecurityEventCounters())).toHaveLength(0);
  });

  it("per-route keys contain only safe static route labels", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const safeRoutes = [
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
    ];

    for (const route of safeRoutes) {
      logSecurityEvent("admin_api_degraded", {
        meta: { route, reason: "upstream_error" },
      });
    }

    const byRoute = getAdminApiDegradedCounts();
    const keys = Object.keys(byRoute);

    expect(keys).toHaveLength(safeRoutes.length);
    for (const key of keys) {
      expect(safeRoutes).toContain(key);
      expect(key).not.toMatch(/\d+\.\d+\.\d+\.\d+/);
      expect(key).not.toContain("DATABASE_URL");
      expect(key).not.toContain("ADMIN_DASHBOARD_KEY");
      expect(key).not.toContain("SELECT ");
    }
  });

  it("tracks agent routes correctly", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    logSecurityEvent("admin_api_degraded", {
      meta: { route: "agent/dashboard", reason: "upstream_error" },
    });
    logSecurityEvent("admin_api_degraded", {
      meta: { route: "agent/tenant", reason: "upstream_error" },
    });

    const byRoute = getAdminApiDegradedCounts();
    expect(byRoute["agent/dashboard"]).toBe(1);
    expect(byRoute["agent/tenant"]).toBe(1);
  });
});

/* ═══════════ Per-route agent-route rate-limited counters ═══════════ */

describe("agentRouteRateLimitedCounts tracking", () => {
  it("tracks per-route rate-limited counts for known agent routes", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    logSecurityEvent("agent_route_rate_limited", {
      ip: "1.2.3.4",
      meta: { route: "agent/dashboard" },
    });
    logSecurityEvent("agent_route_rate_limited", {
      ip: "1.2.3.4",
      meta: { route: "agent/dashboard" },
    });
    logSecurityEvent("agent_route_rate_limited", {
      ip: "5.6.7.8",
      meta: { route: "agent/tenant" },
    });
    logSecurityEvent("agent_route_rate_limited", {
      ip: "9.10.11.12",
      meta: { route: "agent/stream" },
    });

    const byRoute = getAgentRouteRateLimitedCounts();
    expect(byRoute["agent/dashboard"]).toBe(2);
    expect(byRoute["agent/tenant"]).toBe(1);
    expect(byRoute["agent/stream"]).toBe(1);

    const counters = getSecurityEventCounters();
    expect(counters["agent_route_rate_limited"]).toBe(4);
  });

  it("ignores unknown route labels", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    logSecurityEvent("agent_route_rate_limited", {
      meta: { route: "evil/injected/route" },
    });

    const byRoute = getAgentRouteRateLimitedCounts();
    expect(Object.keys(byRoute)).toHaveLength(0);

    // aggregate still counts
    const counters = getSecurityEventCounters();
    expect(counters["agent_route_rate_limited"]).toBe(1);
  });

  it("ignores events without route metadata", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    logSecurityEvent("agent_route_rate_limited", {
      meta: { reason: "test" },
    });

    const byRoute = getAgentRouteRateLimitedCounts();
    expect(Object.keys(byRoute)).toHaveLength(0);
  });

  it("does not track per-route for non-agent-rate-limited events", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    logSecurityEvent("login_failure", {
      meta: { route: "agent/dashboard" },
    });

    const byRoute = getAgentRouteRateLimitedCounts();
    expect(Object.keys(byRoute)).toHaveLength(0);
  });

  it("reset clears agent-route rate-limited counters", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    logSecurityEvent("agent_route_rate_limited", {
      meta: { route: "agent/stream" },
    });

    expect(getAgentRouteRateLimitedCounts()["agent/stream"]).toBe(1);

    _resetSecurityEventCounters();

    expect(Object.keys(getAgentRouteRateLimitedCounts())).toHaveLength(0);
    expect(Object.keys(getSecurityEventCounters())).toHaveLength(0);
  });

  it("per-route keys contain only safe static agent route labels", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const safeRoutes = [
      "agent/dashboard",
      "agent/tenant",
      "agent/stream",
    ];

    for (const route of safeRoutes) {
      logSecurityEvent("agent_route_rate_limited", {
        meta: { route },
      });
    }

    const byRoute = getAgentRouteRateLimitedCounts();
    const keys = Object.keys(byRoute);

    expect(keys).toHaveLength(safeRoutes.length);
    for (const key of keys) {
      expect(safeRoutes).toContain(key);
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
    logSecurityEvent("admin_action_degraded", {
      meta: { action: "set_signup_status", failure: "Error" },
    });
    logSecurityEvent("admin_api_degraded", {
      meta: { route: "keys/create", reason: "upstream_timeout" },
    });
    logSecurityEvent("admin_api_degraded", {
      meta: { route: "agent/dashboard", reason: "upstream_error" },
    });
    logSecurityEvent("agent_route_rate_limited", {
      meta: { route: "agent/dashboard" },
    });
    logSecurityEvent("agent_route_rate_limited", {
      meta: { route: "agent/stream" },
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
    expect(body.admin_action_degraded_total).toBe(1);
    expect(body.admin_action_degraded_by_action).toEqual({
      set_signup_status: 1,
    });
    expect(body.admin_api_degraded_total).toBe(2);
    expect(body.admin_api_degraded_by_route).toEqual({
      "keys/create": 1,
      "agent/dashboard": 1,
    });
    expect(body.agent_route_rate_limited_total).toBe(2);
    expect(body.agent_route_rate_limited_by_route).toEqual({
      "agent/dashboard": 1,
      "agent/stream": 1,
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
    expect(body.admin_action_degraded_total).toBe(0);
    expect(body.admin_action_degraded_by_action).toEqual({});
    expect(body.admin_api_degraded_total).toBe(0);
    expect(body.admin_api_degraded_by_route).toEqual({});
    expect(body.agent_route_rate_limited_total).toBe(0);
    expect(body.agent_route_rate_limited_by_route).toEqual({});
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
    expect(body.admin_action_degraded_total).toBeUndefined();
    expect(body.admin_action_degraded_by_action).toBeUndefined();
    expect(body.admin_api_degraded_total).toBeUndefined();
    expect(body.admin_api_degraded_by_route).toBeUndefined();
    expect(body.agent_route_rate_limited_total).toBeUndefined();
    expect(body.agent_route_rate_limited_by_route).toBeUndefined();
  });

  it("includes API degraded data with per-route breakdown in payload", async () => {
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

    logSecurityEvent("admin_api_degraded", {
      meta: { route: "keys/create", reason: "upstream_timeout" },
    });
    logSecurityEvent("admin_api_degraded", {
      meta: { route: "keys/create", reason: "upstream_timeout" },
    });
    logSecurityEvent("admin_api_degraded", {
      meta: { route: "portal/token/revoke", reason: "upstream_error" },
    });
    logSecurityEvent("admin_api_degraded", {
      meta: { route: "agent/tenant", reason: "upstream_error" },
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
    expect(body.admin_api_degraded_total).toBe(4);
    expect(body.admin_api_degraded_by_route).toEqual({
      "keys/create": 2,
      "portal/token/revoke": 1,
      "agent/tenant": 1,
    });
  });

  it("filters unknown route labels from API degraded breakdown", async () => {
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

    logSecurityEvent("admin_api_degraded", {
      meta: { route: "keys/create", reason: "upstream_timeout" },
    });
    // Unknown route — should not appear in breakdown
    logSecurityEvent("admin_api_degraded", {
      meta: { route: "evil/injected/route", reason: "upstream_error" },
    });

    const token = createSessionToken();
    mocks.cookieValues.set(ADMIN_COOKIE_NAME, token);

    const req = new NextRequest(
      new URL("/api/admin/security", "http://localhost:3000"),
      { method: "GET" },
    );
    const res = await GET(req);
    const body = await res.json();

    // Total counts all events, but breakdown only has known routes
    expect(body.admin_api_degraded_total).toBe(2);
    expect(body.admin_api_degraded_by_route).toEqual({
      "keys/create": 1,
    });
    expect(body.admin_api_degraded_by_route["evil/injected/route"]).toBeUndefined();
  });

  it("does not leak backend details in API degraded payload", async () => {
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

    logSecurityEvent("admin_api_degraded", {
      meta: { route: "dashboard/refresh", reason: "upstream_error" },
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
    expect(raw).not.toContain("upstream_error");
    expect(raw).not.toContain("upstream_timeout");
  });

  it("includes agent-route rate-limited data with per-route breakdown", async () => {
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

    logSecurityEvent("agent_route_rate_limited", {
      meta: { route: "agent/dashboard" },
    });
    logSecurityEvent("agent_route_rate_limited", {
      meta: { route: "agent/dashboard" },
    });
    logSecurityEvent("agent_route_rate_limited", {
      meta: { route: "agent/tenant" },
    });
    logSecurityEvent("agent_route_rate_limited", {
      meta: { route: "agent/stream" },
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
    expect(body.agent_route_rate_limited_total).toBe(4);
    expect(body.agent_route_rate_limited_by_route).toEqual({
      "agent/dashboard": 2,
      "agent/tenant": 1,
      "agent/stream": 1,
    });
  });

  it("filters unknown route labels from agent-route rate-limited breakdown", async () => {
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

    logSecurityEvent("agent_route_rate_limited", {
      meta: { route: "agent/dashboard" },
    });
    // Unknown route — should not appear in breakdown
    logSecurityEvent("agent_route_rate_limited", {
      meta: { route: "evil/injected/route" },
    });

    const token = createSessionToken();
    mocks.cookieValues.set(ADMIN_COOKIE_NAME, token);

    const req = new NextRequest(
      new URL("/api/admin/security", "http://localhost:3000"),
      { method: "GET" },
    );
    const res = await GET(req);
    const body = await res.json();

    // Total counts all events, but breakdown only has known routes
    expect(body.agent_route_rate_limited_total).toBe(2);
    expect(body.agent_route_rate_limited_by_route).toEqual({
      "agent/dashboard": 1,
    });
    expect(body.agent_route_rate_limited_by_route["evil/injected/route"]).toBeUndefined();
  });

  it("does not leak IPs or secrets in agent-route rate-limited payload", async () => {
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

    logSecurityEvent("agent_route_rate_limited", {
      ip: "192.168.1.100",
      meta: { route: "agent/stream" },
    });

    const token = createSessionToken();
    mocks.cookieValues.set(ADMIN_COOKIE_NAME, token);

    const req = new NextRequest(
      new URL("/api/admin/security", "http://localhost:3000"),
      { method: "GET" },
    );
    const res = await GET(req);
    const raw = await res.text();

    expect(raw).not.toContain("192.168.1.100");
    expect(raw).not.toContain(token);
    expect(raw).not.toContain("test-admin-key");
    expect(raw).not.toContain("cookie");
    expect(raw).not.toContain("DATABASE_URL");
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

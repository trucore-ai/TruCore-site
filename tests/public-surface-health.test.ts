import { afterEach, describe, expect, it, vi } from "vitest";
import {
  logSecurityEvent,
  _resetSecurityEventCounters,
} from "@/lib/security-log";

afterEach(() => {
  _resetSecurityEventCounters();
  vi.restoreAllMocks();
});

/* ═══════════ Public Surface Health panel — API payload shape ═══════════ */

describe("public surface health panel API payload", () => {
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

  it("returns zero surface counters when no throttles occurred", async () => {
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

    expect(body.public_route_rate_limited_total).toBe(0);
    expect(body.public_route_rate_limited_by_route).toEqual({});
    expect(body.agent_route_rate_limited_total).toBe(0);
    expect(body.agent_route_rate_limited_by_route).toEqual({});
  });

  it("returns non-zero surface counters when throttles present", async () => {
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

    logSecurityEvent("public_route_rate_limited", {
      meta: { route: "verify-receipt" },
    });
    logSecurityEvent("public_route_rate_limited", {
      meta: { route: "status" },
    });
    logSecurityEvent("agent_route_rate_limited", {
      meta: { route: "agent/dashboard" },
    });

    const token = createSessionToken();
    mocks.cookieValues.set(ADMIN_COOKIE_NAME, token);

    const req = new NextRequest(
      new URL("/api/admin/security", "http://localhost:3000"),
      { method: "GET" },
    );
    const res = await GET(req);
    const body = await res.json();

    expect(body.public_route_rate_limited_total).toBe(2);
    expect(body.public_route_rate_limited_by_route).toEqual({
      "verify-receipt": 1,
      status: 1,
    });
    expect(body.agent_route_rate_limited_total).toBe(1);
    expect(body.agent_route_rate_limited_by_route).toEqual({
      "agent/dashboard": 1,
    });
  });

  it("does not leak secrets or raw backend details in surface payload", async () => {
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

    logSecurityEvent("public_route_rate_limited", {
      meta: { route: "verify-receipt" },
    });
    logSecurityEvent("agent_route_rate_limited", {
      meta: { route: "agent/dashboard" },
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
    // Surface health fields must not appear in unauthenticated response
    expect(body.public_route_rate_limited_total).toBeUndefined();
    expect(body.public_route_rate_limited_by_route).toBeUndefined();
    expect(body.agent_route_rate_limited_total).toBeUndefined();
    expect(body.agent_route_rate_limited_by_route).toBeUndefined();
  });
});

/* ═══════════ Panel rendering (unit-level logic checks) ═══════════ */

describe("public surface health panel rendering logic", () => {
  it("derives healthy status when both totals are zero", () => {
    const data = {
      public_route_rate_limited_total: 0,
      public_route_rate_limited_by_route: {},
      agent_route_rate_limited_total: 0,
      agent_route_rate_limited_by_route: {},
    };
    const totalThrottles =
      data.public_route_rate_limited_total +
      data.agent_route_rate_limited_total;
    const status = totalThrottles > 0 ? "degraded" : "healthy";
    expect(status).toBe("healthy");
    expect(totalThrottles).toBe(0);
  });

  it("derives degraded status when public throttles are non-zero", () => {
    const data = {
      public_route_rate_limited_total: 3,
      public_route_rate_limited_by_route: { "verify-receipt": 2, status: 1 },
      agent_route_rate_limited_total: 0,
      agent_route_rate_limited_by_route: {},
    };
    const totalThrottles =
      data.public_route_rate_limited_total +
      data.agent_route_rate_limited_total;
    const status = totalThrottles > 0 ? "degraded" : "healthy";
    expect(status).toBe("degraded");
    expect(totalThrottles).toBe(3);
  });

  it("derives degraded status when agent throttles are non-zero", () => {
    const data = {
      public_route_rate_limited_total: 0,
      public_route_rate_limited_by_route: {},
      agent_route_rate_limited_total: 5,
      agent_route_rate_limited_by_route: { "agent/dashboard": 3, "agent/stream": 2 },
    };
    const totalThrottles =
      data.public_route_rate_limited_total +
      data.agent_route_rate_limited_total;
    const status = totalThrottles > 0 ? "degraded" : "healthy";
    expect(status).toBe("degraded");
    expect(totalThrottles).toBe(5);
  });

  it("derives degraded status when both are non-zero", () => {
    const data = {
      public_route_rate_limited_total: 2,
      public_route_rate_limited_by_route: { "demo-policy": 2 },
      agent_route_rate_limited_total: 4,
      agent_route_rate_limited_by_route: { "agent/tenant": 4 },
    };
    const totalThrottles =
      data.public_route_rate_limited_total +
      data.agent_route_rate_limited_total;
    const status = totalThrottles > 0 ? "degraded" : "healthy";
    expect(status).toBe("degraded");
    expect(totalThrottles).toBe(6);
  });

  it("route breakdown keys contain only safe static labels", () => {
    const data = {
      public_route_rate_limited_by_route: {
        "verify-receipt": 1,
        "demo-policy": 2,
        status: 1,
      },
      agent_route_rate_limited_by_route: {
        "agent/dashboard": 3,
        "agent/stream": 1,
      },
    };

    const allKeys = [
      ...Object.keys(data.public_route_rate_limited_by_route),
      ...Object.keys(data.agent_route_rate_limited_by_route),
    ];

    for (const key of allKeys) {
      // Must not contain IPs, secrets, or SQL
      expect(key).not.toMatch(/\d+\.\d+\.\d+\.\d+/);
      expect(key).not.toContain("DATABASE_URL");
      expect(key).not.toContain("ADMIN_DASHBOARD_KEY");
      expect(key).not.toContain("SELECT ");
      expect(key).not.toContain("cookie");
    }
  });
});

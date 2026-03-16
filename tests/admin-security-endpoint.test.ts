import { beforeEach, describe, expect, it, vi } from "vitest";

/* ── mock next/headers cookies used by assertAdminSession ── */
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

import { NextRequest } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createSessionToken,
  revokeSessionToken,
  _getSessionStore,
  _resetGcTimer,
} from "@/lib/admin-auth";
import {
  logSecurityEvent,
  _resetSecurityEventCounters,
} from "@/lib/security-log";

const ORIGINAL_ADMIN_KEY = process.env.ADMIN_DASHBOARD_KEY;

function makeGetRequest(pathname: string): NextRequest {
  const url = new URL(pathname, "http://localhost:3000");
  return new NextRequest(url, { method: "GET" });
}

describe("admin security telemetry endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cookieValues.clear();
    _getSessionStore().clear();
    _resetGcTimer();
    _resetSecurityEventCounters();
    process.env.ADMIN_DASHBOARD_KEY = "test-admin-key";
  });

  afterAll(() => {
    if (ORIGINAL_ADMIN_KEY === undefined) {
      delete process.env.ADMIN_DASHBOARD_KEY;
      return;
    }
    process.env.ADMIN_DASHBOARD_KEY = ORIGINAL_ADMIN_KEY;
  });

  it("denies unauthorized access with 404", async () => {
    const { GET } = await import(
      "@/app/api/admin/security/route"
    );

    const req = makeGetRequest("/api/admin/security");
    const res = await GET(req);
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body).toEqual({ error: "not_found" });
    // Must not leak telemetry data
    expect(body.session_store_size).toBeUndefined();
  });

  it("returns telemetry for authorized request", async () => {
    const token = createSessionToken();
    mocks.cookieValues.set(ADMIN_COOKIE_NAME, token);

    const { GET } = await import(
      "@/app/api/admin/security/route"
    );

    const req = makeGetRequest("/api/admin/security");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(typeof body.uptime_seconds).toBe("number");
    expect(body.uptime_seconds).toBeGreaterThanOrEqual(0);
    expect(typeof body.session_store_size).toBe("number");
    expect(typeof body.revoked_session_count).toBe("number");
    expect(typeof body.security_event_counters).toBe("object");

    // Must contain Cache-Control: no-store
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("session_store_size reflects store contents", async () => {
    // Create 3 sessions
    const t1 = createSessionToken();
    createSessionToken();
    createSessionToken();
    mocks.cookieValues.set(ADMIN_COOKIE_NAME, t1);

    const { GET } = await import(
      "@/app/api/admin/security/route"
    );

    const req = makeGetRequest("/api/admin/security");
    const res = await GET(req);
    const body = await res.json();
    expect(body.session_store_size).toBe(3);
  });

  it("revoked_session_count reflects revoked sessions", async () => {
    const t1 = createSessionToken();
    const t2 = createSessionToken();
    createSessionToken();
    revokeSessionToken(t2);
    mocks.cookieValues.set(ADMIN_COOKIE_NAME, t1);

    const { GET } = await import(
      "@/app/api/admin/security/route"
    );

    const req = makeGetRequest("/api/admin/security");
    const res = await GET(req);
    const body = await res.json();
    expect(body.revoked_session_count).toBe(1);
  });

  it("event counters included in response", async () => {
    // Suppress console.warn from logSecurityEvent
    vi.spyOn(console, "warn").mockImplementation(() => {});

    logSecurityEvent("login_success");
    logSecurityEvent("login_failure");
    logSecurityEvent("login_failure");

    const token = createSessionToken();
    mocks.cookieValues.set(ADMIN_COOKIE_NAME, token);

    const { GET } = await import(
      "@/app/api/admin/security/route"
    );

    const req = makeGetRequest("/api/admin/security");
    const res = await GET(req);
    const body = await res.json();
    expect(body.security_event_counters.login_success).toBe(1);
    expect(body.security_event_counters.login_failure).toBe(2);
  });

  it("never exposes tokens, IPs, or cookies in response", async () => {
    const token = createSessionToken();
    mocks.cookieValues.set(ADMIN_COOKIE_NAME, token);

    const { GET } = await import(
      "@/app/api/admin/security/route"
    );

    const req = makeGetRequest("/api/admin/security");
    const res = await GET(req);
    const raw = await res.text();
    expect(raw).not.toContain(token);
    expect(raw).not.toContain("test-admin-key");
    expect(raw).not.toContain("cookie");
  });
});

import { afterAll } from "vitest";

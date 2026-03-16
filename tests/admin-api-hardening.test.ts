import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/* ═══════════ Mocks ═══════════ */

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
    assertAdminSessionMock: vi.fn(),
    assertRateLimitMock: vi.fn(),
    logAdminActionMock: vi.fn(),
    createApiKeyMock: vi.fn(),
    revokeApiKeyMock: vi.fn(),
    createKeyForOwnerMock: vi.fn(),
    createPartnerPortalAccessMock: vi.fn(),
    revokePartnerPortalTokenMock: vi.fn(),
    fetchFullDashboardMock: vi.fn(),
    fetchTenantDetailMock: vi.fn(),
  };
});

vi.mock("next/headers", () => ({
  cookies: mocks.cookiesMock,
}));

vi.mock("@/lib/admin-auth", () => ({
  assertAdminSession: mocks.assertAdminSessionMock,
  _getSessionStore: () => new Map(),
}));

vi.mock("@/lib/rate-limit", () => ({
  assertRateLimit: mocks.assertRateLimitMock,
}));

vi.mock("@/lib/audit-log", () => ({
  logAdminAction: mocks.logAdminActionMock,
}));

vi.mock("@/lib/api-keys", () => ({
  createApiKey: mocks.createApiKeyMock,
  revokeApiKey: mocks.revokeApiKeyMock,
  createKeyForOwner: mocks.createKeyForOwnerMock,
}));

vi.mock("@/lib/partner-portal", () => ({
  PARTNER_PORTAL_TOKEN_TTL_SECONDS_DEFAULT: 86400,
  createPartnerPortalAccess: mocks.createPartnerPortalAccessMock,
}));

vi.mock("@/lib/db", () => ({
  revokePartnerPortalToken: mocks.revokePartnerPortalTokenMock,
}));

vi.mock("@/lib/dashboard-client", () => ({
  fetchFullDashboard: mocks.fetchFullDashboardMock,
  fetchTenantDetail: mocks.fetchTenantDetailMock,
}));

import {
  getSecurityEventCounters,
  _resetSecurityEventCounters,
} from "@/lib/security-log";

/* ═══════════ Helpers ═══════════ */

function makeRequest(
  method: string,
  pathname: string,
  options?: { body?: string; contentType?: string },
): NextRequest {
  const url = new URL(pathname, "http://localhost:3000");
  const headers = new Headers();
  headers.set("origin", "http://localhost:3000");
  if (options?.contentType) {
    headers.set("content-type", options.contentType);
  }
  return new NextRequest(url, {
    method,
    headers,
    ...(options?.body ? { body: options.body } : {}),
  });
}

const DB_ERROR_MESSAGES = [
  "connection refused to postgres://admin:secret@host:5432/db",
  "ECONNREFUSED 127.0.0.1:5432",
  'relation "api_keys" does not exist',
  "SSL connection error: certificate verify failed",
  "database system is starting up",
];

/* ═══════════ Setup / Teardown ═══════════ */

beforeEach(() => {
  vi.clearAllMocks();
  _resetSecurityEventCounters();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  mocks.assertAdminSessionMock.mockResolvedValue(undefined);
  mocks.logAdminActionMock.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

const ORIGINAL_ADMIN_KEY = process.env.ADMIN_DASHBOARD_KEY;

beforeEach(() => {
  process.env.ADMIN_DASHBOARD_KEY = "test-admin-key";
});

afterAll(() => {
  if (ORIGINAL_ADMIN_KEY === undefined) {
    delete process.env.ADMIN_DASHBOARD_KEY;
  } else {
    process.env.ADMIN_DASHBOARD_KEY = ORIGINAL_ADMIN_KEY;
  }
});

/* ═══════════ keys/create ═══════════ */

describe("keys/create hardening", () => {
  it("returns success on normal create", async () => {
    mocks.createApiKeyMock.mockResolvedValue({
      rawKey: "tk_live_abc123",
      record: { id: "k1", name: "Test Key", created_at: "now", revoked_at: null },
    });

    const { POST } = await import("@/app/api/keys/create/route");
    const res = await POST(
      makeRequest("POST", "/api/keys/create", {
        body: JSON.stringify({ name: "Test Key" }),
        contentType: "application/json",
      }),
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("returns safe error on DB failure — no raw details leaked", async () => {
    for (const errMsg of DB_ERROR_MESSAGES) {
      mocks.createApiKeyMock.mockRejectedValueOnce(new Error(errMsg));
      _resetSecurityEventCounters();

      const { POST } = await import("@/app/api/keys/create/route");
      const res = await POST(
        makeRequest("POST", "/api/keys/create", {
          body: JSON.stringify({ name: "Test" }),
          contentType: "application/json",
        }),
      );

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("temporarily_unavailable");
      const json = JSON.stringify(body);
      expect(json).not.toContain("postgres://");
      expect(json).not.toContain("ECONNREFUSED");
      expect(json).not.toContain("secret");
      expect(json).not.toContain("api_keys");
    }
  });

  it("logs admin_api_degraded on DB failure", async () => {
    mocks.createApiKeyMock.mockRejectedValue(new Error("ECONNREFUSED"));

    const { POST } = await import("@/app/api/keys/create/route");
    await POST(
      makeRequest("POST", "/api/keys/create", {
        body: JSON.stringify({ name: "Test" }),
        contentType: "application/json",
      }),
    );

    const counters = getSecurityEventCounters();
    expect(counters["admin_api_degraded"]).toBeGreaterThanOrEqual(1);
  });
});

/* ═══════════ keys/revoke ═══════════ */

describe("keys/revoke hardening", () => {
  it("returns success on normal revoke", async () => {
    mocks.revokeApiKeyMock.mockResolvedValue(true);

    const { POST } = await import("@/app/api/keys/revoke/route");
    const res = await POST(
      makeRequest("POST", "/api/keys/revoke", {
        body: JSON.stringify({ id: "key-1" }),
        contentType: "application/json",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.revoked).toBe(true);
  });

  it("returns safe error on DB failure — no raw details leaked", async () => {
    mocks.revokeApiKeyMock.mockRejectedValue(
      new Error("connection refused to postgres://admin:secret@host:5432/db"),
    );

    const { POST } = await import("@/app/api/keys/revoke/route");
    const res = await POST(
      makeRequest("POST", "/api/keys/revoke", {
        body: JSON.stringify({ id: "key-1" }),
        contentType: "application/json",
      }),
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("temporarily_unavailable");
    const json = JSON.stringify(body);
    expect(json).not.toContain("postgres://");
    expect(json).not.toContain("connection refused");
    expect(json).not.toContain("secret");
  });

  it("logs admin_api_degraded on DB failure", async () => {
    mocks.revokeApiKeyMock.mockRejectedValue(new Error("ECONNREFUSED"));

    const { POST } = await import("@/app/api/keys/revoke/route");
    await POST(
      makeRequest("POST", "/api/keys/revoke", {
        body: JSON.stringify({ id: "key-1" }),
        contentType: "application/json",
      }),
    );

    const counters = getSecurityEventCounters();
    expect(counters["admin_api_degraded"]).toBeGreaterThanOrEqual(1);
  });

  it("fails closed on auth failure before DB call", async () => {
    mocks.assertAdminSessionMock.mockRejectedValue(new Error("no session"));

    const { POST } = await import("@/app/api/keys/revoke/route");
    const res = await POST(
      makeRequest("POST", "/api/keys/revoke", {
        body: JSON.stringify({ id: "key-1" }),
        contentType: "application/json",
      }),
    );

    expect(res.status).toBe(404);
    expect(mocks.revokeApiKeyMock).not.toHaveBeenCalled();
  });
});

/* ═══════════ keys/issue-for-partner ═══════════ */

describe("keys/issue-for-partner hardening", () => {
  it("returns success on normal issue", async () => {
    mocks.createKeyForOwnerMock.mockResolvedValue({
      rawKey: "tk_live_partner123",
      record: {
        id: "k2",
        label: "Test",
        owner_email: "partner@example.com",
        owner_project: "Project",
        created_at: "now",
        revoked_at: null,
      },
    });

    const { POST } = await import("@/app/api/keys/issue-for-partner/route");
    const res = await POST(
      makeRequest("POST", "/api/keys/issue-for-partner", {
        body: JSON.stringify({ email: "partner@example.com", project_name: "Project" }),
        contentType: "application/json",
      }),
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("returns safe error on DB failure", async () => {
    mocks.createKeyForOwnerMock.mockRejectedValue(
      new Error("SSL connection error: certificate verify failed"),
    );

    const { POST } = await import("@/app/api/keys/issue-for-partner/route");
    const res = await POST(
      makeRequest("POST", "/api/keys/issue-for-partner", {
        body: JSON.stringify({ email: "partner@example.com" }),
        contentType: "application/json",
      }),
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("temporarily_unavailable");
    expect(JSON.stringify(body)).not.toContain("SSL");
    expect(JSON.stringify(body)).not.toContain("certificate");
  });

  it("logs admin_api_degraded on DB failure", async () => {
    mocks.createKeyForOwnerMock.mockRejectedValue(new Error("timeout"));

    const { POST } = await import("@/app/api/keys/issue-for-partner/route");
    await POST(
      makeRequest("POST", "/api/keys/issue-for-partner", {
        body: JSON.stringify({ email: "partner@example.com" }),
        contentType: "application/json",
      }),
    );

    const counters = getSecurityEventCounters();
    expect(counters["admin_api_degraded"]).toBeGreaterThanOrEqual(1);
  });
});

/* ═══════════ portal/token/create ═══════════ */

describe("portal/token/create hardening", () => {
  it("returns success on normal create", async () => {
    mocks.createPartnerPortalAccessMock.mockResolvedValue({
      rawToken: "pt_live_abc",
      record: {
        id: "t1",
        owner_email: "p@example.com",
        owner_project: "Proj",
        created_at: "now",
        expires_at: "later",
        revoked_at: null,
      },
    });

    const { POST } = await import("@/app/api/portal/token/create/route");
    const res = await POST(
      makeRequest("POST", "/api/portal/token/create", {
        body: JSON.stringify({ owner_email: "p@example.com" }),
        contentType: "application/json",
      }),
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("returns safe error on DB failure", async () => {
    mocks.createPartnerPortalAccessMock.mockRejectedValue(
      new Error("connection refused to postgres://admin:secret@host:5432/db"),
    );

    const { POST } = await import("@/app/api/portal/token/create/route");
    const res = await POST(
      makeRequest("POST", "/api/portal/token/create", {
        body: JSON.stringify({ owner_email: "p@example.com" }),
        contentType: "application/json",
      }),
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("temporarily_unavailable");
    expect(JSON.stringify(body)).not.toContain("postgres://");
  });
});

/* ═══════════ portal/token/revoke ═══════════ */

describe("portal/token/revoke hardening", () => {
  it("returns success on normal revoke", async () => {
    mocks.revokePartnerPortalTokenMock.mockResolvedValue(true);

    const { POST } = await import("@/app/api/portal/token/revoke/route");
    const res = await POST(
      makeRequest("POST", "/api/portal/token/revoke", {
        body: JSON.stringify({ id: "tok-1" }),
        contentType: "application/json",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.revoked).toBe(true);
  });

  it("returns safe error on DB failure — no raw details leaked", async () => {
    mocks.revokePartnerPortalTokenMock.mockRejectedValue(
      new Error("database system is starting up"),
    );

    const { POST } = await import("@/app/api/portal/token/revoke/route");
    const res = await POST(
      makeRequest("POST", "/api/portal/token/revoke", {
        body: JSON.stringify({ id: "tok-1" }),
        contentType: "application/json",
      }),
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("temporarily_unavailable");
    expect(JSON.stringify(body)).not.toContain("database system");
    expect(JSON.stringify(body)).not.toContain("starting up");
  });

  it("logs admin_api_degraded on DB failure", async () => {
    mocks.revokePartnerPortalTokenMock.mockRejectedValue(new Error("timeout"));

    const { POST } = await import("@/app/api/portal/token/revoke/route");
    await POST(
      makeRequest("POST", "/api/portal/token/revoke", {
        body: JSON.stringify({ id: "tok-1" }),
        contentType: "application/json",
      }),
    );

    const counters = getSecurityEventCounters();
    expect(counters["admin_api_degraded"]).toBeGreaterThanOrEqual(1);
  });

  it("fails closed on auth failure before DB call", async () => {
    mocks.assertAdminSessionMock.mockRejectedValue(new Error("no session"));

    const { POST } = await import("@/app/api/portal/token/revoke/route");
    const res = await POST(
      makeRequest("POST", "/api/portal/token/revoke", {
        body: JSON.stringify({ id: "tok-1" }),
        contentType: "application/json",
      }),
    );

    expect(res.status).toBe(404);
    expect(mocks.revokePartnerPortalTokenMock).not.toHaveBeenCalled();
  });
});

/* ═══════════ dashboard/refresh ═══════════ */

describe("dashboard/refresh hardening", () => {
  it("returns dashboard bundle on success", async () => {
    const mockBundle = { health: { ok: true }, tenants: { ok: true } };
    mocks.fetchFullDashboardMock.mockResolvedValue(mockBundle);

    const { GET } = await import("@/app/api/dashboard/refresh/route");
    const res = await GET(makeRequest("GET", "/api/dashboard/refresh"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockBundle);
  });

  it("returns safe error on upstream failure", async () => {
    mocks.fetchFullDashboardMock.mockRejectedValue(
      new Error("fetch failed: ECONNREFUSED 127.0.0.1:8080"),
    );

    const { GET } = await import("@/app/api/dashboard/refresh/route");
    const res = await GET(makeRequest("GET", "/api/dashboard/refresh"));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("temporarily_unavailable");
    expect(JSON.stringify(body)).not.toContain("ECONNREFUSED");
    expect(JSON.stringify(body)).not.toContain("127.0.0.1");
  });

  it("logs admin_api_degraded on upstream failure", async () => {
    mocks.fetchFullDashboardMock.mockRejectedValue(new Error("timeout"));

    const { GET } = await import("@/app/api/dashboard/refresh/route");
    await GET(makeRequest("GET", "/api/dashboard/refresh"));

    const counters = getSecurityEventCounters();
    expect(counters["admin_api_degraded"]).toBeGreaterThanOrEqual(1);
  });
});

/* ═══════════ dashboard/tenant ═══════════ */

describe("dashboard/tenant hardening", () => {
  it("returns tenant detail on success", async () => {
    const mockResult = { ok: true, data: { id: "t1", name: "Tenant 1" } };
    mocks.fetchTenantDetailMock.mockResolvedValue(mockResult);

    const { GET } = await import("@/app/api/dashboard/tenant/route");
    const req = new NextRequest("http://localhost:3000/api/dashboard/tenant?id=t1", {
      method: "GET",
      headers: { origin: "http://localhost:3000" },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("returns safe error on upstream failure", async () => {
    mocks.fetchTenantDetailMock.mockRejectedValue(
      new Error("Internal Server Error: database \"atf\" does not exist"),
    );

    const { GET } = await import("@/app/api/dashboard/tenant/route");
    const req = new NextRequest("http://localhost:3000/api/dashboard/tenant?id=t1", {
      method: "GET",
      headers: { origin: "http://localhost:3000" },
    });
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("temporarily_unavailable");
    expect(JSON.stringify(body)).not.toContain("database");
    expect(JSON.stringify(body)).not.toContain("atf");
  });

  it("logs admin_api_degraded on upstream failure", async () => {
    mocks.fetchTenantDetailMock.mockRejectedValue(new Error("timeout"));

    const { GET } = await import("@/app/api/dashboard/tenant/route");
    const req = new NextRequest("http://localhost:3000/api/dashboard/tenant?id=t1", {
      method: "GET",
      headers: { origin: "http://localhost:3000" },
    });
    await GET(req);

    const counters = getSecurityEventCounters();
    expect(counters["admin_api_degraded"]).toBeGreaterThanOrEqual(1);
  });

  it("fails closed on auth failure", async () => {
    mocks.assertAdminSessionMock.mockRejectedValue(new Error("no session"));

    const { GET } = await import("@/app/api/dashboard/tenant/route");
    const req = new NextRequest("http://localhost:3000/api/dashboard/tenant?id=t1", {
      method: "GET",
      headers: { origin: "http://localhost:3000" },
    });
    const res = await GET(req);

    expect(res.status).toBe(404);
    expect(mocks.fetchTenantDetailMock).not.toHaveBeenCalled();
  });
});

/* ═══════════ withAdminApiAuth blanket catch ═══════════ */

describe("withAdminApiAuth blanket handler catch", () => {
  it("catches unhandled handler errors and returns safe JSON", async () => {
    const { withAdminApiAuth } = await import("@/lib/admin-api-auth");
    const handler = withAdminApiAuth(async () => {
      throw new Error("unexpected: SELECT * FROM secrets WHERE dsn='postgres://root:pass@db'");
    }, { csrf: false });

    const req = makeRequest("GET", "/api/test-blanket");
    const res = await handler(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("temporarily_unavailable");
    const json = JSON.stringify(body);
    expect(json).not.toContain("postgres://");
    expect(json).not.toContain("secrets");
    expect(json).not.toContain("SELECT");
  });

  it("logs admin_api_degraded for unhandled handler errors", async () => {
    const { withAdminApiAuth } = await import("@/lib/admin-api-auth");
    const handler = withAdminApiAuth(async () => {
      throw new Error("boom");
    }, { csrf: false });

    await handler(makeRequest("GET", "/api/test-blanket"));

    const counters = getSecurityEventCounters();
    expect(counters["admin_api_degraded"]).toBeGreaterThanOrEqual(1);
  });
});

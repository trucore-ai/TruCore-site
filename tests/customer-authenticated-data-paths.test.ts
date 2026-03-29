import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * Targeted tests for authenticated customer data paths.
 *
 * Coverage:
 * 1. fetchReceipts routes through /api/customer/receipts proxy with bearer token
 * 2. fetchReceipts empty response maps to clean empty state (not service error)
 * 3. fetchReceipts records response maps to populated receipt list
 * 4. fetchReceipts throws upstream_5xx only on genuine upstream failure
 * 5. fetchDashboard routes through /api/dashboard/me proxy with bearer token
 * 6. fetchDashboard returns plan/usage data on authenticated success
 * 7. fetchDashboard scoped error set only on genuine upstream/service failure
 * 8. /api/customer/receipts proxy forwards bearer token to upstream
 * 9. /api/dashboard/me proxy forwards bearer token to upstream
 * 10. Proxy routes return 401 when no bearer token is provided
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ATF_API_BASE = "https://api.trucore.xyz";

function makeRequest(
  url: string,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest(url, { headers });
}

// ---------------------------------------------------------------------------
// 1-4: fetchReceipts client helper via proxy
// ---------------------------------------------------------------------------

describe("fetchReceipts client helper", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => {
        if (key === "atf_customer_token") return "tok_test_123";
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    // Stub window so getToken resolves
    vi.stubGlobal("window", { localStorage: globalThis.localStorage });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("routes through /api/customer/receipts and attaches bearer token", async () => {
    const mockResponse = { receipts: [], count: 0, offset: 0, limit: 20 };
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { fetchReceipts } = await import("@/lib/customer-auth");
    await fetchReceipts({ limit: 20 });

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toContain("/api/customer/receipts");
    const headers = init?.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer tok_test_123");
  });

  it("returns empty receipts array without throwing for an authenticated empty response", async () => {
    const mockResponse = { receipts: [], count: 0, offset: 0, limit: 20 };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { fetchReceipts } = await import("@/lib/customer-auth");
    const result = await fetchReceipts({ limit: 20 });
    const data = result as { receipts: unknown[]; count: number };
    expect(data.receipts).toEqual([]);
    expect(data.count).toBe(0);
  });

  it("returns populated receipts array on authenticated success", async () => {
    const mockReceipt = {
      receipt_id: "r_abc123",
      created_at: 1711000000,
      decision: "ALLOW",
      dry_run: false,
      content_hash: "abc123",
      protected_by: "policy_a",
      summary: "Token swap",
      intent_type: "swap",
    };
    const mockResponse = { receipts: [mockReceipt], count: 1, offset: 0, limit: 20 };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { fetchReceipts } = await import("@/lib/customer-auth");
    const result = await fetchReceipts({ limit: 20 });
    const data = result as { receipts: typeof mockReceipt[]; count: number };
    expect(data.receipts).toHaveLength(1);
    expect(data.receipts[0].receipt_id).toBe("r_abc123");
    expect(data.count).toBe(1);
  });

  it("throws upstream_5xx ApiError only on genuine upstream server failure (5xx)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "internal_error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { fetchReceipts } = await import("@/lib/customer-auth");
    await expect(fetchReceipts({ limit: 20 })).rejects.toMatchObject({
      code: "upstream_5xx",
    });
  });

  it("does not throw for a 200 with empty receipts - preserves clean empty state", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ receipts: [], count: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { fetchReceipts } = await import("@/lib/customer-auth");
    // Must not throw
    const result = await fetchReceipts();
    expect(result).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 5-7: fetchDashboard client helper via proxy
// ---------------------------------------------------------------------------

describe("fetchDashboard client helper", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => {
        if (key === "atf_customer_token") return "tok_dashboard_456";
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    vi.stubGlobal("window", { localStorage: globalThis.localStorage });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("routes through /api/dashboard/me and attaches bearer token", async () => {
    const mockDashboard = {
      user_id: "u_1",
      email: "test@example.com",
      tenant_id: "t_1",
      email_verified: true,
      tenant: { plan_tier: "free", status: "active" },
      api_keys: [],
      activation: { onboarding_completed: false, steps_completed: [], first_receipt_id: null },
      receipt_count: 0,
      plan: { tier: "free", limits: { protect_calls_per_day: 10 }, usage: { protect_calls: { used: 0, limit: 10 } } },
    };
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockDashboard), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { fetchDashboard } = await import("@/lib/customer-auth");
    await fetchDashboard();

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toContain("/api/dashboard/me");
    const headers = init?.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer tok_dashboard_456");
  });

  it("returns plan and usage data on authenticated success", async () => {
    const mockDashboard = {
      user_id: "u_1",
      email: "test@example.com",
      tenant_id: "t_1",
      email_verified: true,
      tenant: { plan_tier: "pro", status: "active" },
      api_keys: [{ key_id: "k_1", label: "Main", status: "active", created_at: 1711000000 }],
      activation: { onboarding_completed: true, steps_completed: ["sample_generated", "dry_run_completed", "execution_completed"], first_receipt_id: "r_1" },
      receipt_count: 3,
      plan: {
        tier: "pro",
        limits: { protect_calls_per_day: 1000, execution_calls_per_day: 100, receipt_storage_limit: 500 },
        usage: {
          protect_calls: { used: 42, limit: 1000 },
          execution_calls: { used: 5, limit: 100 },
          receipts_created: { used: 3, limit: 500 },
        },
      },
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockDashboard), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { fetchDashboard } = await import("@/lib/customer-auth");
    const result = await fetchDashboard();
    const data = result as typeof mockDashboard;
    expect(data.plan.tier).toBe("pro");
    expect(data.plan.usage.protect_calls.used).toBe(42);
    expect(data.receipt_count).toBe(3);
  });

  it("returns safe new-user empty state when api_keys and receipts are empty", async () => {
    const newUserDashboard = {
      user_id: "u_new",
      email: "new@example.com",
      tenant_id: "t_new",
      email_verified: false,
      tenant: { plan_tier: "free", status: "active" },
      api_keys: [],
      activation: { onboarding_completed: false, steps_completed: [], first_receipt_id: null },
      receipt_count: 0,
      plan: {
        tier: "free",
        limits: { protect_calls_per_day: 10, execution_calls_per_day: 10, receipt_storage_limit: 50 },
        usage: {
          protect_calls: { used: 0, limit: 10 },
          execution_calls: { used: 0, limit: 10 },
          receipts_created: { used: 0, limit: 50 },
        },
      },
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(newUserDashboard), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { fetchDashboard } = await import("@/lib/customer-auth");
    // Must not throw - empty account is valid state
    const result = await fetchDashboard();
    expect(result).toBeDefined();
    const data = result as typeof newUserDashboard;
    expect(data.receipt_count).toBe(0);
    expect(data.api_keys).toHaveLength(0);
  });

  it("throws upstream_5xx ApiError only on genuine upstream server failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "internal_error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { fetchDashboard } = await import("@/lib/customer-auth");
    await expect(fetchDashboard()).rejects.toMatchObject({
      code: "upstream_5xx",
    });
  });
});

// ---------------------------------------------------------------------------
// 8-10: Proxy route auth forwarding
// ---------------------------------------------------------------------------

describe("/api/customer/receipts proxy auth forwarding", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("returns 401 when no bearer token is present in request", async () => {
    vi.resetModules();
    vi.mock("@/lib/rate-limit", () => ({
      consumeRateLimit: vi.fn(() => ({ exceeded: false })),
    }));
    vi.mock("@/lib/hash", () => ({
      sha256: vi.fn((s: string) => s),
    }));
    vi.mock("@/lib/security-log", () => ({
      logSecurityEvent: vi.fn(),
    }));
    vi.mock("@/lib/server/upstream", () => ({
      getAtfApiBaseUrl: vi.fn(() => "https://api.trucore.xyz"),
      joinUpstreamUrl: vi.fn((base: string, path: string) => `${base}${path}`),
      getRequestIp: vi.fn(() => "127.0.0.1"),
      classifyUpstreamStatus: vi.fn(() => "upstream_4xx"),
    }));

    const { GET } = await import("@/app/api/customer/receipts/route");
    const req = makeRequest("http://localhost/api/customer/receipts");
    const response = await GET(req);
    expect(response.status).toBe(401);
  });

  it("forwards bearer token to upstream when present", async () => {
    vi.resetModules();
    vi.mock("@/lib/rate-limit", () => ({
      consumeRateLimit: vi.fn(() => ({ exceeded: false })),
    }));
    vi.mock("@/lib/hash", () => ({
      sha256: vi.fn((s: string) => s),
    }));
    vi.mock("@/lib/security-log", () => ({
      logSecurityEvent: vi.fn(),
    }));
    vi.mock("@/lib/server/upstream", () => ({
      getAtfApiBaseUrl: vi.fn(() => ATF_API_BASE),
      joinUpstreamUrl: vi.fn((base: string, path: string) => `${base}${path}`),
      getRequestIp: vi.fn(() => "127.0.0.1"),
      classifyUpstreamStatus: vi.fn(() => "upstream_4xx"),
    }));

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ receipts: [], count: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { GET } = await import("@/app/api/customer/receipts/route");
    const req = makeRequest("http://localhost/api/customer/receipts", {
      authorization: "Bearer tok_forwarded_789",
    });
    await GET(req);

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe(`${ATF_API_BASE}/customer/receipts`);
    const headers = init?.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer tok_forwarded_789");
  });
});

describe("/api/dashboard/me proxy auth forwarding", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("returns 401 when no bearer token is present in request", async () => {
    vi.resetModules();
    vi.mock("@/lib/rate-limit", () => ({
      consumeRateLimit: vi.fn(() => ({ exceeded: false })),
    }));
    vi.mock("@/lib/hash", () => ({
      sha256: vi.fn((s: string) => s),
    }));
    vi.mock("@/lib/security-log", () => ({
      logSecurityEvent: vi.fn(),
    }));
    vi.mock("@/lib/server/upstream", () => ({
      getAtfApiBaseUrl: vi.fn(() => "https://api.trucore.xyz"),
      joinUpstreamUrl: vi.fn((base: string, path: string) => `${base}${path}`),
      getRequestIp: vi.fn(() => "127.0.0.1"),
      classifyUpstreamStatus: vi.fn(() => "upstream_4xx"),
    }));

    const { GET } = await import("@/app/api/dashboard/me/route");
    const req = makeRequest("http://localhost/api/dashboard/me");
    const response = await GET(req);
    expect(response.status).toBe(401);
  });

  it("forwards bearer token to upstream and returns plan/usage data", async () => {
    vi.resetModules();
    vi.mock("@/lib/rate-limit", () => ({
      consumeRateLimit: vi.fn(() => ({ exceeded: false })),
    }));
    vi.mock("@/lib/hash", () => ({
      sha256: vi.fn((s: string) => s),
    }));
    vi.mock("@/lib/security-log", () => ({
      logSecurityEvent: vi.fn(),
    }));
    vi.mock("@/lib/server/upstream", () => ({
      getAtfApiBaseUrl: vi.fn(() => ATF_API_BASE),
      joinUpstreamUrl: vi.fn((base: string, path: string) => `${base}${path}`),
      getRequestIp: vi.fn(() => "127.0.0.1"),
      classifyUpstreamStatus: vi.fn(() => "upstream_4xx"),
    }));

    const mockDashboard = {
      user_id: "u_1",
      tenant_id: "t_1",
      plan: { tier: "free", limits: {}, usage: {} },
    };
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockDashboard), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { GET } = await import("@/app/api/dashboard/me/route");
    const req = makeRequest("http://localhost/api/dashboard/me", {
      authorization: "Bearer tok_dashboard_fwd",
    });
    const response = await GET(req);

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe(`${ATF_API_BASE}/dashboard/me`);
    const headers = init?.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer tok_dashboard_fwd");
    expect(response.status).toBe(200);
  });
});

/**
 * Integration tests for the first-use customer flow hardening.
 *
 * Covers:
 * - Canonical upstream URL resolver (lib/server/upstream.ts)
 * - Proxy routes for dashboard & onboarding (server-side proxies)
 * - No raw error / URL leakage to client
 * - Rate limiting, auth gating, network failure envelopes
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { _resetRateLimitBuckets } from "@/lib/rate-limit";
import { _resetSecurityEventCounters, getCustomerRouteFailureCounts } from "@/lib/security-log";
import {
  getAtfApiBaseUrl,
  getFirewallApiBaseUrl,
  getSandboxApiBaseUrl,
  joinUpstreamUrl,
  classifyUpstreamStatus,
  networkErrorEnvelope,
  configErrorEnvelope,
} from "@/lib/server/upstream";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const IP = "203.0.113.50";

function makeReq(
  url: string,
  opts: { method?: string; headers?: Record<string, string>; body?: string } = {},
): NextRequest {
  const init = {
    method: opts.method ?? "GET",
    headers: {
      "x-forwarded-for": IP,
      ...(opts.headers ?? {}),
    },
  } satisfies RequestInit;
  if (opts.body) (init as RequestInit & { body?: string }).body = opts.body;
  return new NextRequest(`http://localhost${url}`, init);
}

function authedReq(
  url: string,
  opts: { method?: string; body?: string } = {},
): NextRequest {
  return makeReq(url, {
    ...opts,
    headers: { Authorization: "Bearer test-jwt-token" },
  });
}

// ---------------------------------------------------------------------------
// § 1  Canonical upstream URL resolver
// ---------------------------------------------------------------------------

describe("lib/server/upstream", () => {
  const origEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...origEnv };
  });

  describe("getAtfApiBaseUrl()", () => {
    it("prefers ATF_API_BASE_URL when set", () => {
      process.env.ATF_API_BASE_URL = "http://atf.local:4000/";
      process.env.NEXT_PUBLIC_ATF_API_URL = "http://fallback.local";
      expect(getAtfApiBaseUrl()).toBe("http://atf.local:4000");
    });

    it("falls back to NEXT_PUBLIC_ATF_API_URL", () => {
      delete process.env.ATF_API_BASE_URL;
      process.env.NEXT_PUBLIC_ATF_API_URL = "http://pub.local:3000/";
      expect(getAtfApiBaseUrl()).toBe("http://pub.local:3000");
    });

    it("falls back to default when no env set", () => {
      delete process.env.ATF_API_BASE_URL;
      delete process.env.NEXT_PUBLIC_ATF_API_URL;
      expect(getAtfApiBaseUrl()).toBe("https://api.trucore.xyz");
    });

    it("strips trailing slashes", () => {
      process.env.ATF_API_BASE_URL = "http://host///";
      expect(getAtfApiBaseUrl()).toBe("http://host");
    });

    it("trims whitespace", () => {
      process.env.ATF_API_BASE_URL = "  http://host  ";
      expect(getAtfApiBaseUrl()).toBe("http://host");
    });
  });

  describe("getFirewallApiBaseUrl()", () => {
    it("returns FIREWALL_API_BASE_URL when set", () => {
      process.env.FIREWALL_API_BASE_URL = "http://fw.local:8080/";
      expect(getFirewallApiBaseUrl()).toBe("http://fw.local:8080");
    });

    it("returns null when not configured", () => {
      delete process.env.FIREWALL_API_BASE_URL;
      expect(getFirewallApiBaseUrl()).toBeNull();
    });
  });

  describe("getSandboxApiBaseUrl()", () => {
    it("prefers firewall URL when available", () => {
      process.env.FIREWALL_API_BASE_URL = "http://fw.local";
      expect(getSandboxApiBaseUrl()).toBe("http://fw.local");
    });

    it("falls back to ATF URL", () => {
      delete process.env.FIREWALL_API_BASE_URL;
      process.env.ATF_API_BASE_URL = "http://atf.local";
      expect(getSandboxApiBaseUrl()).toBe("http://atf.local");
    });
  });

  describe("joinUpstreamUrl()", () => {
    it("joins base and path", () => {
      expect(joinUpstreamUrl("http://host", "/api/v1")).toBe("http://host/api/v1");
    });

    it("handles missing leading slash", () => {
      expect(joinUpstreamUrl("http://host", "api/v1")).toBe("http://host/api/v1");
    });

    it("handles trailing slash on base", () => {
      expect(joinUpstreamUrl("http://host/", "/api")).toBe("http://host/api");
    });
  });

  describe("classifyUpstreamStatus()", () => {
    it("classifies 500+ as upstream_5xx", () => {
      expect(classifyUpstreamStatus(500)).toBe("upstream_5xx");
      expect(classifyUpstreamStatus(502)).toBe("upstream_5xx");
      expect(classifyUpstreamStatus(503)).toBe("upstream_5xx");
    });

    it("classifies 400-499 as upstream_4xx", () => {
      expect(classifyUpstreamStatus(400)).toBe("upstream_4xx");
      expect(classifyUpstreamStatus(404)).toBe("upstream_4xx");
      expect(classifyUpstreamStatus(429)).toBe("upstream_4xx");
    });
  });

  describe("error envelope helpers", () => {
    it("networkErrorEnvelope includes service name", () => {
      const env = networkErrorEnvelope("Dashboard");
      expect(env.error).toBe("upstream_unavailable");
      expect(env.message).toContain("Dashboard");
      expect(env.failure_class).toBe("network_error");
    });

    it("configErrorEnvelope includes detail", () => {
      const env = configErrorEnvelope("Missing ATF_API_BASE_URL");
      expect(env.error).toBe("upstream_unconfigured");
      expect(env.message).toContain("ATF_API_BASE_URL");
      expect(env.failure_class).toBe("config_error");
    });
  });
});

// ---------------------------------------------------------------------------
// § 2  Dashboard /me proxy route
// ---------------------------------------------------------------------------

describe("/api/dashboard/me proxy", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    _resetRateLimitBuckets();
    _resetSecurityEventCounters();
    process.env.ATF_API_BASE_URL = "http://atf.test";
  });

  afterEach(() => {
    _resetRateLimitBuckets();
    _resetSecurityEventCounters();
  });

  async function route() {
    return await import("@/app/api/dashboard/me/route");
  }

  it("proxies 200 from upstream with body intact", async () => {
    const upstream = { email: "a@b.com", tenant: { plan_tier: "free" } };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(upstream), { status: 200, headers: { "Content-Type": "application/json" } }),
    );

    const { GET } = await route();
    const res = await GET(authedReq("/api/dashboard/me"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email).toBe("a@b.com");
  });

  it("rejects unauthenticated requests", async () => {
    const { GET } = await route();
    const res = await GET(makeReq("/api/dashboard/me"));

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("unauthorized");
  });

  it("returns 502 on network failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNREFUSED"));

    const { GET } = await route();
    const res = await GET(authedReq("/api/dashboard/me"));

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe("upstream_unavailable");
    expect(body.message).not.toContain("ECONNREFUSED");
    expect(body.message).not.toContain("atf.test");
  });

  it("forwards upstream 4xx status without leaking URL", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "not_found" }), { status: 404 }),
    );

    const { GET } = await route();
    const res = await GET(authedReq("/api/dashboard/me"));
    const text = await res.text();

    expect(res.status).toBe(404);
    expect(text).not.toContain("atf.test");
  });

  it("logs security event on upstream failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("timeout"));

    const { GET } = await route();
    await GET(authedReq("/api/dashboard/me"));

    const counts = getCustomerRouteFailureCounts();
    expect(counts["dashboard/me"]).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// § 3  Dashboard /activation proxy route
// ---------------------------------------------------------------------------

describe("/api/dashboard/activation proxy", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    _resetRateLimitBuckets();
    _resetSecurityEventCounters();
    process.env.ATF_API_BASE_URL = "http://atf.test";
  });

  afterEach(() => {
    _resetRateLimitBuckets();
    _resetSecurityEventCounters();
  });

  async function route() {
    return await import("@/app/api/dashboard/activation/route");
  }

  it("GET proxies activation state", async () => {
    const upstream = { onboarding_completed: false, steps: [] };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(upstream), { status: 200, headers: { "Content-Type": "application/json" } }),
    );

    const { GET } = await route();
    const res = await GET(authedReq("/api/dashboard/activation"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.onboarding_completed).toBe(false);
  });

  it("POST forwards step mark body to upstream", async () => {
    const resBody = { onboarding_completed: false, last_step: "sample_generated" };
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(resBody), { status: 200 }),
    );

    const { POST } = await route();
    const reqBody = JSON.stringify({ step: "sample_generated" });
    const res = await POST(
      authedReq("/api/dashboard/activation", { method: "POST", body: reqBody }),
    );

    expect(res.status).toBe(200);
    // Verify upstream received the body
    const [, fetchInit] = fetchSpy.mock.calls[0];
    expect(fetchInit?.body).toBe(reqBody);
  });

  it("GET rejects unauthenticated", async () => {
    const { GET } = await route();
    const res = await GET(makeReq("/api/dashboard/activation"));
    expect(res.status).toBe(401);
  });

  it("POST rejects unauthenticated", async () => {
    const { POST } = await route();
    const res = await POST(makeReq("/api/dashboard/activation", { method: "POST" }));
    expect(res.status).toBe(401);
  });

  it("returns 502 envelope on GET network error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNREFUSED"));

    const { GET } = await route();
    const res = await GET(authedReq("/api/dashboard/activation"));

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe("upstream_unavailable");
    expect(body.message).not.toContain("ECONNREFUSED");
  });
});

// ---------------------------------------------------------------------------
// § 4  Onboarding /sample-intent proxy route
// ---------------------------------------------------------------------------

describe("/api/onboarding/sample-intent proxy", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    _resetRateLimitBuckets();
    _resetSecurityEventCounters();
    process.env.ATF_API_BASE_URL = "http://atf.test";
  });

  afterEach(() => {
    _resetRateLimitBuckets();
    _resetSecurityEventCounters();
  });

  async function route() {
    return await import("@/app/api/onboarding/sample-intent/route");
  }

  it("proxies sample intent from upstream", async () => {
    const intent = { input_mint: "So11…", output_mint: "EPjF…", amount_lamports: 1000000 };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ intent }), { status: 200 }),
    );

    const { GET } = await route();
    const res = await GET(authedReq("/api/onboarding/sample-intent"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.intent).toBeDefined();
  });

  it("returns 502 on network failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("timeout"));

    const { GET } = await route();
    const res = await GET(authedReq("/api/onboarding/sample-intent"));

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe("upstream_unavailable");
  });

  it("rejects unauthenticated requests", async () => {
    const { GET } = await route();
    const res = await GET(makeReq("/api/onboarding/sample-intent"));
    expect(res.status).toBe(401);
  });

  it("logs failure on upstream 5xx", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Internal Server Error", { status: 500 }),
    );

    const { GET } = await route();
    await GET(authedReq("/api/onboarding/sample-intent"));

    const counts = getCustomerRouteFailureCounts();
    expect(counts["onboarding/sample-intent"]).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// § 5  Cross-cutting: no upstream URL leakage
// ---------------------------------------------------------------------------

describe("first-use proxy routes: no URL leakage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    _resetRateLimitBuckets();
    _resetSecurityEventCounters();
    process.env.ATF_API_BASE_URL = "http://secret-backend.internal:4000";
  });

  afterEach(() => {
    _resetRateLimitBuckets();
    _resetSecurityEventCounters();
  });

  const proxyRoutes = [
    { path: "/api/dashboard/me", mod: "@/app/api/dashboard/me/route", method: "GET" },
    { path: "/api/dashboard/activation", mod: "@/app/api/dashboard/activation/route", method: "GET" },
    { path: "/api/onboarding/sample-intent", mod: "@/app/api/onboarding/sample-intent/route", method: "GET" },
  ] as const;

  for (const { path, mod, method } of proxyRoutes) {
    it(`${path} 502 body does not leak upstream host`, async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNREFUSED"));

      const routeMod = await import(mod);
      const handler = routeMod[method];
      const res = await handler(authedReq(path));
      const text = await res.text();

      expect(text).not.toContain("secret-backend.internal");
      expect(text).not.toContain("4000");
      expect(text).not.toContain("ECONNREFUSED");
      expect(text).not.toMatch(/stack|trace|sql|dsn|secret|password/i);
    });
  }
});

// ---------------------------------------------------------------------------
// § 6  Rate limiting across proxy routes
// ---------------------------------------------------------------------------

describe("first-use proxy routes: rate limiting", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    _resetRateLimitBuckets();
    process.env.ATF_API_BASE_URL = "http://atf.test";
  });

  afterEach(() => {
    _resetRateLimitBuckets();
  });

  it("/api/dashboard/me returns 429 after per-IP limit", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 200 }),
    );

    const { GET } = await import("@/app/api/dashboard/me/route");
    // Exhaust limit (30/min)
    for (let i = 0; i < 31; i++) {
      await GET(authedReq("/api/dashboard/me"));
    }

    const res = await GET(authedReq("/api/dashboard/me"));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe("rate_limited");
  });

  it("/api/onboarding/sample-intent returns 429 after per-IP limit", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 200 }),
    );

    const { GET } = await import("@/app/api/onboarding/sample-intent/route");
    // Exhaust limit (20/min)
    for (let i = 0; i < 21; i++) {
      await GET(authedReq("/api/onboarding/sample-intent"));
    }

    const res = await GET(authedReq("/api/onboarding/sample-intent"));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe("rate_limited");
  });
});

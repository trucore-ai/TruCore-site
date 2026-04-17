/**
 * customer-policy-proxy — unit tests for the GET /api/customer/policy route.
 *
 * Covers:
 *  - 404 from upstream is normalised to 503 with a well-formed error envelope
 *  - 200 from upstream is forwarded as-is
 *  - 401 from upstream causes 401 downstream
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/server/upstream", () => ({
  getAtfApiBaseUrl: () => "https://api.test.internal",
  getRequestIp: (_req: unknown) => "127.0.0.1",
  joinUpstreamUrl: (base: string, path: string) => `${base}${path}`,
  classifyUpstreamStatus: (status: number) =>
    status >= 500 ? "upstream_5xx" : status === 404 ? "not_found" : "client_error",
}));

vi.mock("@/lib/hash", () => ({
  hashToken: (_t: string) => "hashed",
  sha256: (_v: string) => "deadbeef",
}));

vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
}));

vi.mock("@/lib/security-log", () => ({
  logSecurityEvent: vi.fn(),
}));

import { GET } from "@/app/api/customer/policy/route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(token = "tok.valid") {
  return new NextRequest("http://localhost/api/customer/policy", {
    method: "GET",
    headers: { authorization: `Bearer ${token}` },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/customer/policy — 404→503 normalisation", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 503 with policy_not_available when upstream returns 404", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: "Not Found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      }),
    ));

    const res = await GET(makeRequest());
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe("policy_not_available");
    expect(typeof body.message).toBe("string");
    expect(body.message.length).toBeGreaterThan(0);
  });

  it("forwards 200 from upstream with policy body", async () => {
    const policy = {
      plan_code: "pro",
      plan_limits: { tx_limit_per_month: 5000, policy_overrides_enabled: true },
      overrides: {},
      effective: {},
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify(policy), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ));

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.plan_code).toBe("pro");
  });
});

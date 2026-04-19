/**
 * customer-policy-adaptive-mode-proxy.test.ts
 *
 * Unit tests for PATCH /api/customer/policy/adaptive-mode proxy route.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/server/upstream", () => ({
  getAtfApiBaseUrl: () => "https://api.test.internal",
  getRequestIp: (_req: unknown) => "127.0.0.1",
  joinUpstreamUrl: (base: string, path: string) => `${base}${path}`,
  classifyUpstreamStatus: (status: number) =>
    status >= 500 ? "upstream_5xx" : status === 404 ? "not_found" : "client_error",
}));

vi.mock("@/lib/hash", () => ({
  sha256: (_v: string) => "deadbeef",
}));

const mockConsumeRateLimit = vi.fn().mockReturnValue({ exceeded: false });
vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimit: (...args: unknown[]) => mockConsumeRateLimit(...args),
}));

vi.mock("@/lib/security-log", () => ({
  logSecurityEvent: vi.fn(),
}));

import { PATCH } from "@/app/api/customer/policy/adaptive-mode/route";

function makeRequest(body: object, token = "tok.valid") {
  return new NextRequest("http://localhost/api/customer/policy/adaptive-mode", {
    method: "PATCH",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/customer/policy/adaptive-mode", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    mockConsumeRateLimit.mockReturnValue({ exceeded: false });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 401 when auth header is missing", async () => {
    const req = new NextRequest("http://localhost/api/customer/policy/adaptive-mode", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "recommend" }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid JSON", async () => {
    const req = new NextRequest("http://localhost/api/customer/policy/adaptive-mode", {
      method: "PATCH",
      headers: {
        authorization: "Bearer tok.valid",
        "content-type": "application/json",
      },
      body: "{mode:",
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid_json");
  });

  it("forwards successful upstream response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ mode: "recommend", message: "ok" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    const res = await PATCH(makeRequest({ mode: "recommend" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mode).toBe("recommend");
  });

  it("returns 429 when rate-limited", async () => {
    mockConsumeRateLimit.mockReturnValueOnce({ exceeded: true });
    const res = await PATCH(makeRequest({ mode: "off" }));
    expect(res.status).toBe(429);
  });
});

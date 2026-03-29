/**
 * Integration tests for customer surface proxy hardening.
 *
 * Covers:
 * - Receipts proxy route (list, detail, verify)
 * - Keys proxy route (list, create, revoke, rotate)
 * - Password reset proxy routes (request, confirm, validate)
 * - Verification status proxy route
 * - Upgrade requests proxy routes
 * - No raw error / URL leakage to client
 * - Rate limiting, auth gating, network failure envelopes
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { _resetRateLimitBuckets } from "@/lib/rate-limit";
import { _resetSecurityEventCounters, getCustomerRouteFailureCounts } from "@/lib/security-log";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const IP = "203.0.113.50";

function makeReq(
  url: string,
  opts: { method?: string; headers?: Record<string, string>; body?: string } = {},
): NextRequest {
  const init: RequestInit & { headers: Record<string, string> } = {
    method: opts.method ?? "GET",
    headers: {
      "x-forwarded-for": IP,
      ...(opts.headers ?? {}),
    },
  };
  if (opts.body) init.body = opts.body;
  return new NextRequest(`http://localhost${url}`, init);
}

function authedReq(
  url: string,
  opts: { method?: string; body?: string; contentType?: string } = {},
): NextRequest {
  const headers: Record<string, string> = { Authorization: "Bearer test-jwt-token" };
  if (opts.body && opts.contentType !== "none") {
    headers["Content-Type"] = opts.contentType ?? "application/json";
  }
  return makeReq(url, {
    ...opts,
    headers,
  });
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  _resetRateLimitBuckets();
  _resetSecurityEventCounters();
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// § 1  Receipts proxy routes
// ---------------------------------------------------------------------------

describe("app/api/receipts/route", () => {
  describe("GET /api/receipts", () => {
    it("returns 401 without auth header", async () => {
      const { GET } = await import("@/app/api/receipts/route");
      const req = makeReq("/api/receipts");
      const res = await GET(req);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("unauthorized");
    });

    it("proxies to upstream on success", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        new Response(JSON.stringify({ receipts: [], total: 0 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const { GET } = await import("@/app/api/receipts/route");
      const req = authedReq("/api/receipts");
      const res = await GET(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.receipts).toEqual([]);
    });

    it("returns 502 on network error", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("ENOTFOUND"));

      const { GET } = await import("@/app/api/receipts/route");
      const req = authedReq("/api/receipts");
      const res = await GET(req);
      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body.error).toBe("upstream_unavailable");
    });

    it("logs customer_route_failure on upstream error", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "server_error" }), { status: 500 }),
      );

      const { GET } = await import("@/app/api/receipts/route");
      const req = authedReq("/api/receipts");
      await GET(req);

      const counts = getCustomerRouteFailureCounts();
      expect(counts["receipts"]).toBeGreaterThan(0);
    });
  });

  describe("POST /api/receipts", () => {
    it("returns 401 without auth header", async () => {
      const { POST } = await import("@/app/api/receipts/route");
      const req = makeReq("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt_id: "r_123" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("returns 400 for invalid content type", async () => {
      const { POST } = await import("@/app/api/receipts/route");
      const req = authedReq("/api/receipts", {
        method: "POST",
        body: "plain text",
        contentType: "text/plain",
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("invalid_content_type");
    });
  });
});

describe("app/api/receipts/[id]/route", () => {
  it("returns 401 without auth header", async () => {
    const { GET } = await import("@/app/api/receipts/[id]/route");
    const req = makeReq("/api/receipts/r_123");
    const res = await GET(req, { params: Promise.resolve({ id: "r_123" }) });
    expect(res.status).toBe(401);
  });

  it("proxies receipt detail to upstream", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ receipt_id: "r_123", status: "verified" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { GET } = await import("@/app/api/receipts/[id]/route");
    const req = authedReq("/api/receipts/r_123");
    const res = await GET(req, { params: Promise.resolve({ id: "r_123" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.receipt_id).toBe("r_123");
  });
});

// ---------------------------------------------------------------------------
// § 2  Keys proxy routes
// ---------------------------------------------------------------------------

describe("app/api/customer/keys/route", () => {
  describe("GET /api/customer/keys", () => {
    it("returns 401 without auth header", async () => {
      const { GET } = await import("@/app/api/customer/keys/route");
      const req = makeReq("/api/customer/keys");
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it("proxies key list to upstream", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        new Response(JSON.stringify({ keys: [], count: 0 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const { GET } = await import("@/app/api/customer/keys/route");
      const req = authedReq("/api/customer/keys");
      const res = await GET(req);
      expect(res.status).toBe(200);
    });
  });

  describe("POST /api/customer/keys", () => {
    it("returns 401 without auth header", async () => {
      const { POST } = await import("@/app/api/customer/keys/route");
      const req = makeReq("/api/customer/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: "test-key" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("proxies key creation to upstream", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        new Response(JSON.stringify({ key_id: "k_abc", raw_secret: "secret" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const { POST } = await import("@/app/api/customer/keys/route");
      const req = authedReq("/api/customer/keys", {
        method: "POST",
        body: JSON.stringify({ label: "test-key" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.key_id).toBe("k_abc");
    });
  });
});

describe("app/api/customer/keys/[id]/revoke/route", () => {
  it("returns 401 without auth header", async () => {
    const { POST } = await import("@/app/api/customer/keys/[id]/revoke/route");
    const req = makeReq("/api/customer/keys/k_abc/revoke", { method: "POST" });
    const res = await POST(req, { params: Promise.resolve({ id: "k_abc" }) });
    expect(res.status).toBe(401);
  });

  it("proxies key revoke to upstream", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "revoked" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { POST } = await import("@/app/api/customer/keys/[id]/revoke/route");
    const req = authedReq("/api/customer/keys/k_abc/revoke", { method: "POST" });
    const res = await POST(req, { params: Promise.resolve({ id: "k_abc" }) });
    expect(res.status).toBe(200);
  });
});

describe("app/api/customer/keys/[id]/rotate/route", () => {
  it("returns 401 without auth header", async () => {
    const { POST } = await import("@/app/api/customer/keys/[id]/rotate/route");
    const req = makeReq("/api/customer/keys/k_abc/rotate", { method: "POST" });
    const res = await POST(req, { params: Promise.resolve({ id: "k_abc" }) });
    expect(res.status).toBe(401);
  });

  it("proxies key rotate to upstream", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ key_id: "k_new", raw_secret: "new-secret", rotated_from: "k_abc" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { POST } = await import("@/app/api/customer/keys/[id]/rotate/route");
    const req = authedReq("/api/customer/keys/k_abc/rotate", { method: "POST" });
    const res = await POST(req, { params: Promise.resolve({ id: "k_abc" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.rotated_from).toBe("k_abc");
  });
});

// ---------------------------------------------------------------------------
// § 3  Verification status proxy route
// ---------------------------------------------------------------------------

describe("app/api/customer/auth/verify-email/status/route", () => {
  it("returns 401 without auth header", async () => {
    const { GET } = await import("@/app/api/customer/auth/verify-email/status/route");
    const req = makeReq("/api/customer/auth/verify-email/status");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("proxies verification status to upstream", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          email: "user@example.com",
          email_verified: true,
          email_verified_at: 1711843200,
          verification_pending: false,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const { GET } = await import("@/app/api/customer/auth/verify-email/status/route");
    const req = authedReq("/api/customer/auth/verify-email/status");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email_verified).toBe(true);
  });

  it("returns 502 on network error", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("ENOTFOUND"));

    const { GET } = await import("@/app/api/customer/auth/verify-email/status/route");
    const req = authedReq("/api/customer/auth/verify-email/status");
    const res = await GET(req);
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe("upstream_unavailable");
  });
});

// ---------------------------------------------------------------------------
// § 4  Password reset proxy routes
// ---------------------------------------------------------------------------

describe("app/api/customer/auth/password-reset/request/route", () => {
  it("accepts request without auth (unauthenticated route)", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "ok", message: "If account exists, email sent." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { POST } = await import("@/app/api/customer/auth/password-reset/request/route");
    const req = makeReq("/api/customer/auth/password-reset/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@example.com" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });

  it("returns 400 for invalid content type", async () => {
    const { POST } = await import("@/app/api/customer/auth/password-reset/request/route");
    const req = makeReq("/api/customer/auth/password-reset/request", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "email=user@example.com",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid_content_type");
  });

  it("rate limits password reset requests", async () => {
    const { POST } = await import("@/app/api/customer/auth/password-reset/request/route");

    // Make 6 requests (limit is 5)
    for (let i = 0; i < 6; i++) {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
      );
      const req = makeReq("/api/customer/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: `user${i}@example.com` }),
      });
      const res = await POST(req);
      if (i >= 5) {
        expect(res.status).toBe(429);
      }
    }
  });
});

describe("app/api/customer/auth/password-reset/confirm/route", () => {
  it("accepts confirm request without auth (token-based)", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "ok", message: "Password reset." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { POST } = await import("@/app/api/customer/auth/password-reset/confirm/route");
    const req = makeReq("/api/customer/auth/password-reset/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "reset-token-xyz", new_password: "newP@ssw0rd!" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});

describe("app/api/customer/auth/password-reset/validate/route", () => {
  it("accepts validate request without auth (token-based)", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ valid: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { POST } = await import("@/app/api/customer/auth/password-reset/validate/route");
    const req = makeReq("/api/customer/auth/password-reset/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "reset-token-xyz" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// § 5  Upgrade requests proxy routes
// ---------------------------------------------------------------------------

describe("app/api/customer/upgrades/route", () => {
  describe("GET /api/customer/upgrades", () => {
    it("returns 401 without auth header", async () => {
      const { GET } = await import("@/app/api/customer/upgrades/route");
      const req = makeReq("/api/customer/upgrades");
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it("proxies upgrade list to upstream", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        new Response(JSON.stringify({ requests: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const { GET } = await import("@/app/api/customer/upgrades/route");
      const req = authedReq("/api/customer/upgrades");
      const res = await GET(req);
      expect(res.status).toBe(200);
    });
  });

  describe("POST /api/customer/upgrades", () => {
    it("returns 401 without auth header", async () => {
      const { POST } = await import("@/app/api/customer/upgrades/route");
      const req = makeReq("/api/customer/upgrades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requested_plan: "pro" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("proxies upgrade request to upstream", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        new Response(JSON.stringify({ request: { request_id: "u_123", status: "pending" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const { POST } = await import("@/app/api/customer/upgrades/route");
      const req = authedReq("/api/customer/upgrades", {
        method: "POST",
        body: JSON.stringify({ requested_plan: "pro" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
    });
  });
});

describe("app/api/customer/upgrades/[id]/cancel/route", () => {
  it("returns 401 without auth header", async () => {
    const { POST } = await import("@/app/api/customer/upgrades/[id]/cancel/route");
    const req = makeReq("/api/customer/upgrades/u_123/cancel", { method: "POST" });
    const res = await POST(req, { params: Promise.resolve({ id: "u_123" }) });
    expect(res.status).toBe(401);
  });

  it("proxies cancel request to upstream", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ request: { request_id: "u_123", status: "cancelled" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { POST } = await import("@/app/api/customer/upgrades/[id]/cancel/route");
    const req = authedReq("/api/customer/upgrades/u_123/cancel", { method: "POST" });
    const res = await POST(req, { params: Promise.resolve({ id: "u_123" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.request.status).toBe("cancelled");
  });
});

// ---------------------------------------------------------------------------
// § 6  No URL leakage assertions
// ---------------------------------------------------------------------------

describe("No backend URL leakage", () => {
  it("receipts route does not expose backend URL", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("ENOTFOUND"));

    const { GET } = await import("@/app/api/receipts/route");
    const req = authedReq("/api/receipts");
    const res = await GET(req);
    const body = await res.json();

    const bodyStr = JSON.stringify(body);
    expect(bodyStr).not.toContain("api.trucore.xyz");
    expect(bodyStr).not.toContain("ATF_API_BASE");
    expect(bodyStr).not.toContain("NEXT_PUBLIC_ATF_API_URL");
  });

  it("keys route does not expose backend URL", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("ENOTFOUND"));

    const { GET } = await import("@/app/api/customer/keys/route");
    const req = authedReq("/api/customer/keys");
    const res = await GET(req);
    const body = await res.json();

    const bodyStr = JSON.stringify(body);
    expect(bodyStr).not.toContain("api.trucore.xyz");
    expect(bodyStr).not.toContain("ATF_API_BASE");
  });

  it("password reset route does not expose backend URL", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("ENOTFOUND"));

    const { POST } = await import("@/app/api/customer/auth/password-reset/request/route");
    const req = makeReq("/api/customer/auth/password-reset/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@example.com" }),
    });
    const res = await POST(req);
    const body = await res.json();

    const bodyStr = JSON.stringify(body);
    expect(bodyStr).not.toContain("api.trucore.xyz");
    expect(bodyStr).not.toContain("ATF_API_BASE");
  });
});

// ---------------------------------------------------------------------------
// § 7  Cache headers
// ---------------------------------------------------------------------------

describe("Cache headers", () => {
  it("receipts route sets no-store", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ receipts: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { GET } = await import("@/app/api/receipts/route");
    const req = authedReq("/api/receipts");
    const res = await GET(req);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("keys route sets no-store", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ keys: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { GET } = await import("@/app/api/customer/keys/route");
    const req = authedReq("/api/customer/keys");
    const res = await GET(req);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
});

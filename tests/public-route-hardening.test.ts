import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { _resetRateLimitBuckets } from "@/lib/rate-limit";
import {
  getSecurityEventCounters,
  getPublicRouteRateLimitedCounts,
  _resetSecurityEventCounters,
} from "@/lib/security-log";

/* ═══════════ Mocks ═══════════ */

vi.mock("@/lib/receipt-verification", () => ({
  isReceiptHashFormatValid: (h: string) => /^[0-9a-f]{64}$/i.test(h),
  getReceiptVersion: () => "v1",
  isSupportedReceiptVersion: () => true,
  recomputeDemoReceiptHash: () => "abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234",
}));

vi.mock("@/lib/receipt-signature", () => ({
  verifyReceiptHashSignature: () => true,
  getReceiptSigningPublicKeyB64: () => "dGVzdC1wdWJsaWMta2V5",
}));

vi.mock("@/lib/demo-receipts", () => ({
  demoReceipts: [{ id: "r1", hash: "abc" }],
}));

vi.mock("@/lib/public-metrics", () => ({
  fetchPublicMetrics: vi.fn().mockResolvedValue({
    ok: true,
    data: { transactions: 100 },
  }),
}));

vi.mock("@/lib/db", () => ({
  ensureApiKeyTables: vi.fn().mockResolvedValue(undefined),
  getSQL: vi.fn().mockReturnValue(
    Object.assign(
      () =>
        Promise.resolve([
          {
            simulator_requests_24h: 42,
            active_partner_keys: 3,
            receipts_generated_total: 100,
          },
        ]),
      // Tagged template literal support
      {
        [Symbol.toPrimitive]: () => "sql",
      },
    ),
  ),
}));

/* ── Lazy route imports (after mocks) ── */
const verifyReceiptRoute = () => import("@/app/api/verify-receipt/route");
const verifyReceiptSigRoute = () => import("@/app/api/verify-receipt-signature/route");
const demoPolicyRoute = () => import("@/app/api/demo-policy/route");
const publicReceiptsRoute = () => import("@/app/api/public-receipts/route");
const receiptSigningKeyRoute = () => import("@/app/api/receipt-signing-key/route");
const metricsPublicSummaryRoute = () => import("@/app/api/metrics/public-summary/route");

/* ═══════════ Helpers ═══════════ */

function makeGet(path: string, ip = "10.0.0.1"): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"), {
    headers: { "x-forwarded-for": ip },
  });
}

function makePost(path: string, body: unknown, ip = "10.0.0.1"): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"), {
    method: "POST",
    headers: {
      "x-forwarded-for": ip,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  _resetRateLimitBuckets();
  _resetSecurityEventCounters();
  vi.restoreAllMocks();
});

/* ═══════════════════════════════════════════════════════════
 *  /api/verify-receipt
 * ═══════════════════════════════════════════════════════════ */

describe("POST /api/verify-receipt", () => {
  it("returns 200 on valid request", async () => {
    const { POST } = await verifyReceiptRoute();
    const res = await POST(
      makePost("/api/verify-receipt", {
        receipt_hash: "abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234",
        receipt: { action: "swap" },
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("returns 400 on invalid JSON", async () => {
    const { POST } = await verifyReceiptRoute();
    const req = new NextRequest("http://localhost:3000/api/verify-receipt", {
      method: "POST",
      headers: {
        "x-forwarded-for": "10.0.0.2",
        "content-type": "application/json",
      },
      body: "not-json{{{",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid_json");
  });

  it("returns 429 after rate limit exceeded", async () => {
    const { POST } = await verifyReceiptRoute();
    const ip = "10.99.0.1";

    for (let i = 0; i < 30; i++) {
      await POST(
        makePost("/api/verify-receipt", { receipt_hash: "x" }, ip),
      );
    }

    const res = await POST(
      makePost("/api/verify-receipt", { receipt_hash: "x" }, ip),
    );
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe("rate_limited");
    expect(res.headers.get("Retry-After")).toBeTruthy();
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("logs public_route_rate_limited event on throttle", async () => {
    const { POST } = await verifyReceiptRoute();
    const ip = "10.99.0.2";

    for (let i = 0; i < 31; i++) {
      await POST(makePost("/api/verify-receipt", { receipt_hash: "x" }, ip));
    }

    const counters = getSecurityEventCounters();
    expect(counters.public_route_rate_limited).toBeGreaterThanOrEqual(1);

    const routeCounts = getPublicRouteRateLimitedCounts();
    expect(routeCounts["verify-receipt"]).toBeGreaterThanOrEqual(1);
  });

  it("does not leak backend details on invalid input", async () => {
    const { POST } = await verifyReceiptRoute();
    const res = await POST(
      makePost("/api/verify-receipt", { receipt_hash: 12345 }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid_request");
    expect(JSON.stringify(body)).not.toMatch(/stack|trace|sql|dsn|secret/i);
  });
});

/* ═══════════════════════════════════════════════════════════
 *  /api/verify-receipt-signature
 * ═══════════════════════════════════════════════════════════ */

describe("POST /api/verify-receipt-signature", () => {
  const validBody = {
    receipt_hash: "abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234",
    signature: "dGVzdHNpZw==",
    public_key: "dGVzdGtleQ==",
  };

  it("returns 200 on valid request", async () => {
    const { POST } = await verifyReceiptSigRoute();
    const res = await POST(makePost("/api/verify-receipt-signature", validBody));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.verified).toBe(true);
  });

  it("returns 429 after rate limit exceeded", async () => {
    const { POST } = await verifyReceiptSigRoute();
    const ip = "10.99.1.1";

    for (let i = 0; i < 30; i++) {
      await POST(makePost("/api/verify-receipt-signature", validBody, ip));
    }

    const res = await POST(
      makePost("/api/verify-receipt-signature", validBody, ip),
    );
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe("rate_limited");
  });

  it("logs public_route_rate_limited with route label", async () => {
    const { POST } = await verifyReceiptSigRoute();
    const ip = "10.99.1.2";

    for (let i = 0; i < 31; i++) {
      await POST(makePost("/api/verify-receipt-signature", validBody, ip));
    }

    const routeCounts = getPublicRouteRateLimitedCounts();
    expect(routeCounts["verify-receipt-signature"]).toBeGreaterThanOrEqual(1);
  });

  it("returns 400 on missing fields without leaking details", async () => {
    const { POST } = await verifyReceiptSigRoute();
    const res = await POST(
      makePost("/api/verify-receipt-signature", { receipt_hash: "short" }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid_request");
    expect(JSON.stringify(body)).not.toMatch(/stack|trace|sql|secret/i);
  });
});

/* ═══════════════════════════════════════════════════════════
 *  /api/demo-policy
 * ═══════════════════════════════════════════════════════════ */

describe("GET /api/demo-policy", () => {
  it("returns 200 with policy data", async () => {
    const { GET } = await demoPolicyRoute();
    const res = await GET(makeGet("/api/demo-policy"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.version).toBe("demo-v1");
  });

  it("sets public cache header for static data", async () => {
    const { GET } = await demoPolicyRoute();
    const res = await GET(makeGet("/api/demo-policy", "10.0.1.1"));
    expect(res.headers.get("Cache-Control")).toContain("public");
    expect(res.headers.get("Cache-Control")).toContain("max-age=60");
  });

  it("returns 429 after rate limit exceeded", async () => {
    const { GET } = await demoPolicyRoute();
    const ip = "10.99.2.1";

    for (let i = 0; i < 60; i++) {
      await GET(makeGet("/api/demo-policy", ip));
    }

    const res = await GET(makeGet("/api/demo-policy", ip));
    expect(res.status).toBe(429);
  });
});

/* ═══════════════════════════════════════════════════════════
 *  /api/public-receipts
 * ═══════════════════════════════════════════════════════════ */

describe("GET /api/public-receipts", () => {
  it("returns 200 with receipts", async () => {
    const { GET } = await publicReceiptsRoute();
    const res = await GET(makeGet("/api/public-receipts"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.receipts)).toBe(true);
  });

  it("sets public cache header for static data", async () => {
    const { GET } = await publicReceiptsRoute();
    const res = await GET(makeGet("/api/public-receipts", "10.0.2.1"));
    expect(res.headers.get("Cache-Control")).toContain("public");
  });

  it("returns 429 after rate limit exceeded", async () => {
    const { GET } = await publicReceiptsRoute();
    const ip = "10.99.3.1";

    for (let i = 0; i < 60; i++) {
      await GET(makeGet("/api/public-receipts", ip));
    }

    const res = await GET(makeGet("/api/public-receipts", ip));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe("rate_limited");
  });
});

/* ═══════════════════════════════════════════════════════════
 *  /api/receipt-signing-key
 * ═══════════════════════════════════════════════════════════ */

describe("GET /api/receipt-signing-key", () => {
  it("returns 200 with key info", async () => {
    const { GET } = await receiptSigningKeyRoute();
    const res = await GET(makeGet("/api/receipt-signing-key"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.available).toBe(true);
    expect(body.alg).toBe("Ed25519");
  });

  it("returns no-store cache header", async () => {
    const { GET } = await receiptSigningKeyRoute();
    const res = await GET(makeGet("/api/receipt-signing-key", "10.0.3.1"));
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("returns 429 after rate limit exceeded", async () => {
    const { GET } = await receiptSigningKeyRoute();
    const ip = "10.99.4.1";

    for (let i = 0; i < 30; i++) {
      await GET(makeGet("/api/receipt-signing-key", ip));
    }

    const res = await GET(makeGet("/api/receipt-signing-key", ip));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe("rate_limited");
  });
});

/* ═══════════════════════════════════════════════════════════
 *  /api/metrics/public-summary
 * ═══════════════════════════════════════════════════════════ */

describe("GET /api/metrics/public-summary", () => {
  it("returns 200 with metrics data", async () => {
    const { GET } = await metricsPublicSummaryRoute();
    const res = await GET(makeGet("/api/metrics/public-summary"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.transactions).toBe(100);
  });

  it("sets edge-cache headers for public summary", async () => {
    const { GET } = await metricsPublicSummaryRoute();
    const res = await GET(makeGet("/api/metrics/public-summary", "10.0.4.1"));
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=60");
  });

  it("returns 429 after rate limit exceeded", async () => {
    const { GET } = await metricsPublicSummaryRoute();
    const ip = "10.99.5.1";

    for (let i = 0; i < 30; i++) {
      await GET(makeGet("/api/metrics/public-summary", ip));
    }

    const res = await GET(makeGet("/api/metrics/public-summary", ip));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe("rate_limited");
  });
});

/* ═══════════════════════════════════════════════════════════
 *  Cross-cutting: no secrets/details leak on 429
 * ═══════════════════════════════════════════════════════════ */

describe("Rate-limit responses never leak details", () => {
  it("verify-receipt 429 body is minimal", async () => {
    const { POST } = await verifyReceiptRoute();
    const ip = "10.99.9.1";
    for (let i = 0; i < 31; i++) {
      await POST(makePost("/api/verify-receipt", { receipt_hash: "x" }, ip));
    }
    const res = await POST(makePost("/api/verify-receipt", { receipt_hash: "x" }, ip));
    const text = await res.text();
    expect(text).not.toMatch(/stack|trace|sql|dsn|secret|token|cookie|password/i);
  });
});

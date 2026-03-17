import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { _resetRateLimitBuckets } from "@/lib/rate-limit";
import {
  getPublicRouteRateLimitedCounts,
  _resetSecurityEventCounters,
} from "@/lib/security-log";

/* ═══════════ Mocks ═══════════ */

vi.mock("@/lib/receipt-signature", () => ({
  getReceiptSigningPublicKeyB64: () => "dGVzdC1wdWJsaWMta2V5",
}));

vi.mock("@/lib/demo-live", () => ({
  buildDemoLivePayload: () => ({
    policy: { version: "demo-v1" },
    receipt_hash: "abc123",
  }),
}));

vi.mock("@/lib/public-metrics", () => ({
  fetchPublicMetrics: vi.fn().mockResolvedValue({
    ok: true,
    data: { transactions: 100, active_keys: 5 },
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
      { [Symbol.toPrimitive]: () => "sql" },
    ),
  ),
}));

/* ── Lazy route imports (after mocks) ── */
const healthRoute = () => import("@/app/api/health/route");
const statusRoute = () => import("@/app/api/status/route");
const demoLiveRoute = () => import("@/app/api/demo-live/route");
const publicMetricsRoute = () => import("@/app/api/public-metrics/route");
const metricsPublicSummaryRoute = () => import("@/app/api/metrics/public-summary/route");
const receiptSigningKeyRoute = () => import("@/app/api/receipt-signing-key/route");
const cspReportRoute = () => import("@/app/api/csp-report/route");

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
 *  /api/health — telemetry + response consistency
 * ═══════════════════════════════════════════════════════════ */

describe("GET /api/health — consistency", () => {
  it("returns ok:true and no-store cache header", async () => {
    const { GET } = await healthRoute();
    const res = await GET(makeGet("/api/health"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.ts).toBeTruthy();
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("429 includes Retry-After and logged telemetry", async () => {
    const { GET } = await healthRoute();
    const ip = "10.88.0.1";
    for (let i = 0; i < 60; i++) {
      await GET(makeGet("/api/health", ip));
    }
    const res = await GET(makeGet("/api/health", ip));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("rate_limited");
    expect(res.headers.get("Retry-After")).toBeTruthy();
    expect(res.headers.get("Cache-Control")).toBe("no-store");

    const routeCounts = getPublicRouteRateLimitedCounts();
    expect(routeCounts["health"]).toBeGreaterThanOrEqual(1);
  });

  it("429 body has no backend details", async () => {
    const { GET } = await healthRoute();
    const ip = "10.88.0.2";
    for (let i = 0; i < 61; i++) {
      await GET(makeGet("/api/health", ip));
    }
    const res = await GET(makeGet("/api/health", ip));
    const text = await res.text();
    expect(text).not.toMatch(/stack|trace|sql|dsn|secret|token|cookie|password/i);
  });
});

/* ═══════════════════════════════════════════════════════════
 *  /api/status — telemetry + response consistency
 * ═══════════════════════════════════════════════════════════ */

describe("GET /api/status — consistency", () => {
  it("429 includes Retry-After and logged telemetry", async () => {
    const { GET } = await statusRoute();
    const ip = "10.88.1.1";
    for (let i = 0; i < 60; i++) {
      await GET(makeGet("/api/status", ip));
    }
    const res = await GET(makeGet("/api/status", ip));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("rate_limited");
    expect(res.headers.get("Retry-After")).toBeTruthy();

    const routeCounts = getPublicRouteRateLimitedCounts();
    expect(routeCounts["status"]).toBeGreaterThanOrEqual(1);
  });
});

/* ═══════════════════════════════════════════════════════════
 *  /api/demo-live — telemetry + try/catch
 * ═══════════════════════════════════════════════════════════ */

describe("GET /api/demo-live — consistency", () => {
  it("returns ok:true on success", async () => {
    const { GET } = await demoLiveRoute();
    const res = await GET(makeGet("/api/demo-live"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("429 includes Retry-After and telemetry", async () => {
    const { GET } = await demoLiveRoute();
    const ip = "10.88.2.1";
    for (let i = 0; i < 60; i++) {
      await GET(makeGet("/api/demo-live", ip));
    }
    const res = await GET(makeGet("/api/demo-live", ip));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("rate_limited");
    expect(res.headers.get("Retry-After")).toBeTruthy();

    const routeCounts = getPublicRouteRateLimitedCounts();
    expect(routeCounts["demo-live"]).toBeGreaterThanOrEqual(1);
  });
});

/* ═══════════════════════════════════════════════════════════
 *  /api/public-metrics — ok:true envelope
 * ═══════════════════════════════════════════════════════════ */

describe("GET /api/public-metrics — consistency", () => {
  it("success response includes ok:true", async () => {
    const { GET } = await publicMetricsRoute();
    const res = await GET(makeGet("/api/public-metrics"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.simulator_requests_24h).toBeDefined();
  });

  it("returns no-store cache header", async () => {
    const { GET } = await publicMetricsRoute();
    const res = await GET(makeGet("/api/public-metrics", "10.88.3.1"));
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});

/* ═══════════════════════════════════════════════════════════
 *  /api/metrics/public-summary — failure shape
 * ═══════════════════════════════════════════════════════════ */

describe("GET /api/metrics/public-summary — consistency", () => {
  it("502 failure includes ok:false", async () => {
    const { fetchPublicMetrics } = await import("@/lib/public-metrics");
    vi.mocked(fetchPublicMetrics).mockResolvedValueOnce({
      ok: false,
      error: "upstream_error",
    } as never);
    const { GET } = await metricsPublicSummaryRoute();
    const res = await GET(makeGet("/api/metrics/public-summary"));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("temporarily_unavailable");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("does not leak upstream error details in failure", async () => {
    const { fetchPublicMetrics } = await import("@/lib/public-metrics");
    vi.mocked(fetchPublicMetrics).mockResolvedValueOnce({
      ok: false,
      error: "ConnectionError: ECONNREFUSED 10.0.0.1:5432",
    } as never);
    const { GET } = await metricsPublicSummaryRoute();
    const res = await GET(makeGet("/api/metrics/public-summary", "10.88.4.1"));
    const text = await res.text();
    expect(text).not.toContain("ECONNREFUSED");
    expect(text).not.toContain("5432");
  });
});

/* ═══════════════════════════════════════════════════════════
 *  /api/receipt-signing-key — ok:true added
 * ═══════════════════════════════════════════════════════════ */

describe("GET /api/receipt-signing-key — consistency", () => {
  it("success includes ok:true", async () => {
    const { GET } = await receiptSigningKeyRoute();
    const res = await GET(makeGet("/api/receipt-signing-key"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.available).toBe(true);
    expect(body.alg).toBe("Ed25519");
  });
});

/* ═══════════════════════════════════════════════════════════
 *  /api/csp-report — JSON error bodies
 * ═══════════════════════════════════════════════════════════ */

describe("POST /api/csp-report — consistency", () => {
  it("returns JSON body on 429", async () => {
    const { POST } = await cspReportRoute();
    const ip = "10.88.5.1";
    for (let i = 0; i < 30; i++) {
      await POST(makePost("/api/csp-report", { type: "csp-report" }, ip));
    }
    const res = await POST(makePost("/api/csp-report", { type: "csp-report" }, ip));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("rate_limited");
  });

  it("returns JSON body on 400 for invalid JSON", async () => {
    const { POST } = await cspReportRoute();
    const req = new NextRequest("http://localhost:3000/api/csp-report", {
      method: "POST",
      headers: {
        "x-forwarded-for": "10.88.5.2",
        "content-type": "application/json",
      },
      body: "not-json{{{",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("invalid_json");
  });
});

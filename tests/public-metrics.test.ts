import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  VerificationSummarySchema,
  PublicMetricsSchema,
} from "@/lib/public-metrics";

/* ────────────────────────────────────────────────────────────────
 *  Public Metrics Client - schema + envelope tests
 *
 *  Validates that the Zod schemas match the live ATF
 *  /metrics/public-summary contract and that the fetch helper
 *  correctly unwraps ATF response envelopes.
 * ──────────────────────────────────────────────────────────── */

// ── Fixtures ─────────────────────────────────────────────────

const validVerificationSummary = {
  receipts_written: 5_000,
  receipts_verified: 4_800,
  permits_issued: 3_200,
  intents_approved: 2_100,
};

const validPublicMetrics = {
  protected_requests_total: 142_500,
  receipts_verified_total: 9_800,
  enforcement_events_total: 3_200,
  active_tenants: 18,
  uptime_percent: 99.98,
  avg_request_latency_ms: 4.2,
  last_updated: "2026-03-08T12:00:00Z",
  receipts_written_total: 12_000,
  uptime_seconds: 86400,
  requests_last_hour: 5_200,
  receipts_written_last_hour: 600,
  verification_summary: validVerificationSummary,
};

/** Envelope-wrapped response as ATF production returns it. */
const publicMetricsEnvelope = {
  status: "ok",
  summary: "Public metrics retrieved",
  result: validPublicMetrics,
  _meta: { timestamp: "2026-03-08T12:00:00Z", cache_hit: true },
};

const METRICS_BASE = "https://atf.example.com";

// ── Setup / teardown ─────────────────────────────────────────

const originalEnv = { ...process.env };

beforeAll(() => {
  process.env.NEXT_PUBLIC_ATF_DASHBOARD_URL = METRICS_BASE;
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(() => {
  process.env = originalEnv;
});

// ── Schema tests ─────────────────────────────────────────────

describe("VerificationSummarySchema", () => {
  it("accepts valid verification summary with live ATF field names", () => {
    const result = VerificationSummarySchema.safeParse(validVerificationSummary);
    expect(result.success).toBe(true);
  });

  it("rejects the old field names (verified, failed, pending)", () => {
    const old = { verified: 100, failed: 5, pending: 3 };
    const result = VerificationSummarySchema.safeParse(old);
    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const partial = { receipts_written: 100, receipts_verified: 90 };
    const result = VerificationSummarySchema.safeParse(partial);
    expect(result.success).toBe(false);
  });
});

describe("PublicMetricsSchema", () => {
  it("accepts a full valid payload", () => {
    const result = PublicMetricsSchema.safeParse(validPublicMetrics);
    expect(result.success).toBe(true);
  });

  it("accepts a minimal payload (only required fields)", () => {
    const minimal = {
      protected_requests_total: 0,
      receipts_verified_total: 0,
      enforcement_events_total: 0,
      active_tenants: 0,
      uptime_percent: 99.99,
      avg_request_latency_ms: 0,
      last_updated: "2026-03-08T00:00:00Z",
    };
    const result = PublicMetricsSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const result = PublicMetricsSchema.safeParse({ uptime_percent: 99.99 });
    expect(result.success).toBe(false);
  });
});

// ── Envelope unwrapping tests ────────────────────────────────

describe("fetchPublicMetrics envelope handling", () => {
  it("unwraps ATF envelope and parses result", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(publicMetricsEnvelope), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { fetchPublicMetrics } = await import("@/lib/public-metrics");
    const result = await fetchPublicMetrics();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.protected_requests_total).toBe(142_500);
      expect(result.data.verification_summary?.receipts_verified).toBe(4_800);
      expect(result.data.verification_summary?.permits_issued).toBe(3_200);
    }
  });

  it("handles raw (non-envelope) response for backward compat", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(validPublicMetrics), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { fetchPublicMetrics } = await import("@/lib/public-metrics");
    const result = await fetchPublicMetrics();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.protected_requests_total).toBe(142_500);
    }
  });

  it("returns graceful error on HTTP failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Not Found", { status: 404, statusText: "Not Found" }),
    );

    const { fetchPublicMetrics } = await import("@/lib/public-metrics");
    const result = await fetchPublicMetrics();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("404");
    }
  });

  it("does not send x-api-key (public endpoint)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(publicMetricsEnvelope), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { fetchPublicMetrics } = await import("@/lib/public-metrics");
    await fetchPublicMetrics();

    const [, init] = fetchSpy.mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers["x-api-key"]).toBeUndefined();
  });
});

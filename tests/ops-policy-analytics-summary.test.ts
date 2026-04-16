import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/ops/policy-analytics-summary/route";
import {
  recordPolicyEvent,
  _resetForTesting,
} from "@/lib/server/policy-analytics-store";
import { NextRequest } from "next/server";

const ORIGINAL_ENV = { ...process.env };

function fakeRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(
    "http://localhost/api/ops/policy-analytics-summary",
    { headers },
  );
}

beforeEach(() => {
  _resetForTesting();
  process.env = { ...ORIGINAL_ENV, ATF_OPS_KEY: "test-ops-key-123" };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("GET /api/ops/policy-analytics-summary", () => {
  /* ── Access control ── */

  it("returns 403 without x-ops-key header", async () => {
    const res = await GET(fakeRequest());
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("forbidden");
  });

  it("returns 403 with wrong x-ops-key", async () => {
    const res = await GET(fakeRequest({ "x-ops-key": "wrong-key" }));
    expect(res.status).toBe(403);
  });

  it("returns 503 when ATF_OPS_KEY is not configured", async () => {
    delete process.env.ATF_OPS_KEY;
    const res = await GET(fakeRequest({ "x-ops-key": "anything" }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe("endpoint_not_configured");
  });

  /* ── Happy path — empty state ── */

  it("returns empty summary when no events recorded", async () => {
    const res = await GET(
      fakeRequest({ "x-ops-key": "test-ops-key-123" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.summary.total_events).toBe(0);
    expect(body.summary.by_event_type).toEqual({});
    expect(body.summary.derived.expand_rate).toBeNull();
  });

  /* ── Happy path — with events ── */

  it("returns aggregated summary after events", async () => {
    recordPolicyEvent("policy_recommendation_impression", {
      recommendation_source: "Policy Intelligence",
      recommendation_priority: "high",
      recommendation_display_section: "featured",
    });
    recordPolicyEvent("policy_recommendation_expand", {
      recommendation_source: "Policy Intelligence",
      recommendation_priority: "high",
      recommendation_display_section: "featured",
    });

    const res = await GET(
      fakeRequest({ "x-ops-key": "test-ops-key-123" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.summary.total_events).toBe(2);
    expect(
      body.summary.by_event_type["policy_recommendation_impression"].total,
    ).toBe(1);
    expect(
      body.summary.by_event_type["policy_recommendation_expand"].total,
    ).toBe(1);
    expect(body.summary.derived.expand_rate).toBeCloseTo(1.0);
    expect(body.summary.derived.featured_impressions.total).toBe(1);
    expect(body.summary.derived.featured_expands.total).toBe(1);
  });

  /* ── Privacy — no sensitive data in response ── */

  it("does not expose raw policy values or customer info", async () => {
    recordPolicyEvent("policy_recommendation_impression", {
      recommendation_source: "Policy Intelligence",
      recommendation_priority: "high",
      recommendation_display_section: "featured",
      recommendation_id: "rec-secret-abc",
      plan_tier: "enterprise",
    });

    const res = await GET(
      fakeRequest({ "x-ops-key": "test-ops-key-123" }),
    );
    const body = await res.json();
    const json = JSON.stringify(body);

    expect(json).not.toContain("rec-secret-abc");
    expect(json).not.toContain("enterprise");
    expect(body.summary.by_source).toBeDefined();
    expect(body.summary.by_priority).toBeDefined();
  });

  /* ── Cache-Control ── */

  it("sets Cache-Control: no-store", async () => {
    const res = await GET(
      fakeRequest({ "x-ops-key": "test-ops-key-123" }),
    );
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});

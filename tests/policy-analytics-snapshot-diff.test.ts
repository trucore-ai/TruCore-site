/**
 * Tests for snapshot comparison and diff helpers.
 *
 * Covers:
 * - computeSnapshotDiff — correctness for up/down/flat/new directions
 * - computeSnapshotDiff — handles null rates cleanly
 * - getSnapshotPair — returns null for both when 0 rows exist
 * - getSnapshotPair — returns latest only when 1 row exists
 * - getSnapshotPair — returns latest + previous when 2+ rows exist
 * - getLatestTwoAnalyticsSnapshots DB helper (mocked)
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

// ── mock @/lib/db ─────────────────────────────────────────────────────────────

const mockGetLatestTwoAnalyticsSnapshots = vi.fn();

vi.mock("@/lib/db", () => ({
  getLatestTwoAnalyticsSnapshots: (...args: unknown[]) =>
    mockGetLatestTwoAnalyticsSnapshots(...args),
  ensureAnalyticsSnapshotTable: vi.fn().mockResolvedValue(undefined),
}));

// ── import under test ─────────────────────────────────────────────────────────

import {
  computeSnapshotDiff,
  getSnapshotPair,
  _resetForTesting,
  type SnapshotPayloadStored,
} from "@/lib/server/policy-analytics-store";

// ── helpers ───────────────────────────────────────────────────────────────────

function makeSummary(overrides: Record<string, unknown> = {}) {
  return {
    instance_started_at: "2026-04-15T00:00:00.000Z",
    generated_at: "2026-04-15T01:00:00.000Z",
    total_events: 100,
    by_event_type: {
      policy_recommendation_impression: { total: 80, last_7d: 30, last_30d: 70 },
      policy_recommendation_expand: { total: 32, last_7d: 12, last_30d: 28 },
    },
    by_source: {
      "Policy Intelligence": { total: 60, last_7d: 22, last_30d: 50 },
      "Compliance Scan": { total: 40, last_7d: 15, last_30d: 35 },
    },
    by_priority: {},
    by_display_section: {
      featured: { total: 60, last_7d: 22, last_30d: 50 },
      more: { total: 40, last_7d: 15, last_30d: 35 },
    },
    by_source_and_section: {},
    teaser_performance: {
      views_by_dominant_source: {
        "Policy Intelligence": { total: 40, last_7d: 15, last_30d: 35 },
        "External context": { total: 20, last_7d: 8, last_30d: 18 },
      },
      clicks_by_dominant_source: {
        "Policy Intelligence": { total: 10, last_7d: 4, last_30d: 9 },
      },
      views_by_tier: {
        Pro: { total: 50, last_7d: 18, last_30d: 42 },
        Enterprise: { total: 10, last_7d: 5, last_30d: 8 },
      },
      clicks_by_tier: {
        Pro: { total: 12, last_7d: 5, last_30d: 11 },
      },
      clicks_by_mix: { single: { total: 8, last_7d: 3, last_30d: 7 } },
      views_by_mix: { single: { total: 20, last_7d: 8, last_30d: 18 } },
    },
    derived: {
      expand_rate: 0.4,
      view_setting_click_rate: 0.15,
      upgrade_teaser_click_rate: 0.08,
      featured_impressions: { total: 40, last_7d: 15, last_30d: 35 },
      featured_expands: { total: 16, last_7d: 6, last_30d: 14 },
      featured_view_setting_clicks: { total: 6, last_7d: 2, last_30d: 5 },
      more_engagement: { total: 30, last_7d: 10, last_30d: 25 },
    },
    ...overrides,
  };
}

function makePayload(
  capturedAt: string,
  summaryOverrides: Record<string, unknown> = {},
): SnapshotPayloadStored & { row_id: string } {
  return {
    captured_at: capturedAt,
    summary_version: "1",
    summary: makeSummary(summaryOverrides) as never,
    row_id: capturedAt,
  };
}

// ── computeSnapshotDiff ───────────────────────────────────────────────────────

describe("computeSnapshotDiff", () => {
  beforeEach(() => {
    _resetForTesting();
  });

  it("returns correct captured_at timestamps", () => {
    const latest = makePayload("2026-04-16T12:00:00.000Z");
    const previous = makePayload("2026-04-15T12:00:00.000Z");
    const diff = computeSnapshotDiff(latest, previous);

    expect(diff.latest_captured_at).toBe("2026-04-16T12:00:00.000Z");
    expect(diff.previous_captured_at).toBe("2026-04-15T12:00:00.000Z");
  });

  it("computes 'up' direction when latest > previous for total_events", () => {
    const latest = makePayload("2026-04-16T12:00:00.000Z", { total_events: 150 });
    const previous = makePayload("2026-04-15T12:00:00.000Z", { total_events: 100 });
    const diff = computeSnapshotDiff(latest, previous);

    const totalEventsDelta = diff.headline.find((d) => d.label === "Total Events");
    expect(totalEventsDelta).toBeDefined();
    expect(totalEventsDelta!.direction).toBe("up");
    expect(totalEventsDelta!.delta).toBe(50);
    expect(totalEventsDelta!.latest).toBe(150);
    expect(totalEventsDelta!.previous).toBe(100);
    expect(totalEventsDelta!.pct_delta).toBeCloseTo(0.5);
  });

  it("computes 'down' direction when latest < previous for total_events", () => {
    const latest = makePayload("2026-04-16T12:00:00.000Z", { total_events: 80 });
    const previous = makePayload("2026-04-15T12:00:00.000Z", { total_events: 100 });
    const diff = computeSnapshotDiff(latest, previous);

    const d = diff.headline.find((d) => d.label === "Total Events");
    expect(d!.direction).toBe("down");
    expect(d!.delta).toBe(-20);
  });

  it("computes 'flat' direction when values are equal", () => {
    const latest = makePayload("2026-04-16T12:00:00.000Z", { total_events: 100 });
    const previous = makePayload("2026-04-15T12:00:00.000Z", { total_events: 100 });
    const diff = computeSnapshotDiff(latest, previous);

    const d = diff.headline.find((d) => d.label === "Total Events");
    expect(d!.direction).toBe("flat");
    expect(d!.delta).toBe(0);
    expect(d!.pct_delta).toBe(0);
  });

  it("handles null expand_rate in previous snapshot", () => {
    const latest = makePayload("2026-04-16T12:00:00.000Z", {
      derived: {
        ...makeSummary().derived,
        expand_rate: 0.4,
      },
    });
    const previous = makePayload("2026-04-15T12:00:00.000Z", {
      derived: {
        ...makeSummary().derived,
        expand_rate: null,
      },
    });
    const diff = computeSnapshotDiff(latest, previous);

    const d = diff.headline.find((d) => d.label === "Expand Rate");
    // previous is null → pct_delta is null, direction is "new"
    expect(d!.direction).toBe("new");
    expect(d!.pct_delta).toBeNull();
  });

  it("sets pct_delta to null when previous total is 0", () => {
    const latest = makePayload("2026-04-16T12:00:00.000Z", { total_events: 20 });
    const previous = makePayload("2026-04-15T12:00:00.000Z", { total_events: 0 });
    const diff = computeSnapshotDiff(latest, previous);

    const d = diff.headline.find((d) => d.label === "Total Events");
    expect(d!.pct_delta).toBeNull();
    expect(d!.delta).toBe(20);
  });

  it("returns up to 5 source deltas sorted by absolute delta descending", () => {
    const latestSources = {
      A: { total: 100, last_7d: 0, last_30d: 0 },
      B: { total: 50, last_7d: 0, last_30d: 0 },
      C: { total: 30, last_7d: 0, last_30d: 0 },
      D: { total: 10, last_7d: 0, last_30d: 0 },
      E: { total: 5, last_7d: 0, last_30d: 0 },
      F: { total: 1, last_7d: 0, last_30d: 0 },
    };
    const prevSources = {
      A: { total: 10, last_7d: 0, last_30d: 0 },  // delta +90
      B: { total: 60, last_7d: 0, last_30d: 0 },  // delta -10
      C: { total: 28, last_7d: 0, last_30d: 0 },  // delta +2
      D: { total: 10, last_7d: 0, last_30d: 0 },  // delta 0
      E: { total: 5, last_7d: 0, last_30d: 0 },   // delta 0
      F: { total: 1, last_7d: 0, last_30d: 0 },   // delta 0
    };
    const latest = makePayload("2026-04-16T12:00:00.000Z", { by_source: latestSources });
    const previous = makePayload("2026-04-15T12:00:00.000Z", { by_source: prevSources });
    const diff = computeSnapshotDiff(latest, previous);

    expect(diff.by_source_top_deltas.length).toBeLessThanOrEqual(5);
    // A has biggest absolute delta (90), should be first
    expect(diff.by_source_top_deltas[0].key).toBe("A");
    expect(diff.by_source_top_deltas[0].delta).toBe(90);
  });

  it("returns empty arrays for dimension deltas when no source data", () => {
    const latest = makePayload("2026-04-16T12:00:00.000Z", { by_source: {} });
    const previous = makePayload("2026-04-15T12:00:00.000Z", { by_source: {} });
    const diff = computeSnapshotDiff(latest, previous);

    expect(diff.by_source_top_deltas).toEqual([]);
  });

  it("includes all 7 headline metrics", () => {
    const diff = computeSnapshotDiff(
      makePayload("2026-04-16T12:00:00.000Z"),
      makePayload("2026-04-15T12:00:00.000Z"),
    );

    const labels = diff.headline.map((d) => d.label);
    expect(labels).toContain("Total Events");
    expect(labels).toContain("Expand Rate");
    expect(labels).toContain("View-Setting Rate");
    expect(labels).toContain("Teaser Click Rate");
    expect(labels).toContain("Featured Impressions");
    expect(labels).toContain("Featured Expands");
    expect(labels).toContain("More-Section Engagement");
    expect(diff.headline).toHaveLength(7);
  });
});

// ── getSnapshotPair ───────────────────────────────────────────────────────────

describe("getSnapshotPair", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetForTesting();
  });

  function makeRow(id: string, capturedAt: string) {
    const payload = makePayload(capturedAt);
    return {
      id,
      created_at: capturedAt,
      summary_version: "1",
      snapshot: payload,
    };
  }

  it("returns both null when no snapshots exist", async () => {
    mockGetLatestTwoAnalyticsSnapshots.mockResolvedValue([]);
    const pair = await getSnapshotPair();
    expect(pair.latest).toBeNull();
    expect(pair.previous).toBeNull();
  });

  it("returns latest only when exactly one snapshot exists", async () => {
    const row = makeRow("r1", "2026-04-16T12:00:00.000Z");
    mockGetLatestTwoAnalyticsSnapshots.mockResolvedValue([row]);
    const pair = await getSnapshotPair();
    expect(pair.latest).not.toBeNull();
    expect(pair.latest!.row_id).toBe("r1");
    expect(pair.previous).toBeNull();
  });

  it("returns latest and previous when two snapshots exist", async () => {
    const row1 = makeRow("r1", "2026-04-16T12:00:00.000Z");
    const row2 = makeRow("r2", "2026-04-15T12:00:00.000Z");
    mockGetLatestTwoAnalyticsSnapshots.mockResolvedValue([row1, row2]);
    const pair = await getSnapshotPair();
    expect(pair.latest!.row_id).toBe("r1");
    expect(pair.previous!.row_id).toBe("r2");
  });

  it("preserves captured_at from payload", async () => {
    const row = makeRow("r1", "2026-04-16T12:00:00.000Z");
    mockGetLatestTwoAnalyticsSnapshots.mockResolvedValue([row]);
    const pair = await getSnapshotPair();
    expect(pair.latest!.captured_at).toBe("2026-04-16T12:00:00.000Z");
  });
});

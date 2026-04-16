import { beforeEach, describe, expect, it, vi } from "vitest";

/* ── mock the analytics store ──────────────────────────────────────── */

const mockSummarise = vi.fn();
const mockGetLatestSnapshotMeta = vi.fn();
const mockGetSnapshotPair = vi.fn();
const mockComputeSnapshotDiff = vi.fn();
vi.mock("@/lib/server/policy-analytics-store", () => ({
  summarise: (...args: unknown[]) => mockSummarise(...args),
  getLatestSnapshotMeta: (...args: unknown[]) => mockGetLatestSnapshotMeta(...args),
  getSnapshotPair: (...args: unknown[]) => mockGetSnapshotPair(...args),
  computeSnapshotDiff: (...args: unknown[]) => mockComputeSnapshotDiff(...args),
}));

import PolicyAnalyticsPage from "@/app/admin/policy-analytics/page";

function zeroBucket() {
  return { total: 0, last_7d: 0, last_30d: 0 };
}

function makeSummary(overrides: Record<string, unknown> = {}) {
  return {
    instance_started_at: "2026-04-15T00:00:00.000Z",
    generated_at: "2026-04-15T01:00:00.000Z",
    total_events: 42,
    by_event_type: {
      policy_recommendation_impression: { total: 30, last_7d: 10, last_30d: 25 },
      policy_recommendation_expand: { total: 12, last_7d: 4, last_30d: 10 },
    },
    by_source: {
      "Policy Intelligence": { total: 25, last_7d: 8, last_30d: 20 },
      "Compliance Scan": { total: 17, last_7d: 5, last_30d: 12 },
    },
    by_priority: {
      high: { total: 20, last_7d: 7, last_30d: 15 },
      medium: { total: 22, last_7d: 8, last_30d: 18 },
    },
    by_display_section: {
      featured: { total: 25, last_7d: 9, last_30d: 20 },
      more: { total: 17, last_7d: 5, last_30d: 12 },
    },
    by_source_and_section: {
      "Policy Intelligence::featured": { total: 15, last_7d: 5, last_30d: 12 },
      "Compliance Scan::more": { total: 10, last_7d: 3, last_30d: 8 },
    },
    teaser_performance: {
      views_by_dominant_source: {
        "Policy Intelligence": { total: 40, last_7d: 15, last_30d: 35 },
        "External context": { total: 20, last_7d: 8, last_30d: 18 },
      },
      clicks_by_dominant_source: {
        "Policy Intelligence": { total: 10, last_7d: 4, last_30d: 9 },
        "External context": { total: 4, last_7d: 2, last_30d: 4 },
      },
      views_by_tier: {
        Pro: { total: 50, last_7d: 18, last_30d: 42 },
        Enterprise: { total: 10, last_7d: 5, last_30d: 8 },
      },
      clicks_by_tier: {
        Pro: { total: 12, last_7d: 5, last_30d: 11 },
        Enterprise: { total: 2, last_7d: 1, last_30d: 2 },
      },
      clicks_by_mix: {
        single: { total: 8, last_7d: 3, last_30d: 7 },
        few: { total: 5, last_7d: 2, last_30d: 4 },
        many: { total: 1, last_7d: 0, last_30d: 1 },
      },
      views_by_mix: {
        single: { total: 20, last_7d: 8, last_30d: 18 },
        few: { total: 35, last_7d: 12, last_30d: 30 },
        many: { total: 5, last_7d: 1, last_30d: 4 },
      },
    },
    derived: {
      expand_rate: 0.4,
      view_setting_click_rate: 0.15,
      upgrade_teaser_click_rate: 0.08,
      featured_impressions: { total: 20, last_7d: 7, last_30d: 16 },
      featured_expands: { total: 8, last_7d: 3, last_30d: 6 },
      featured_view_setting_clicks: { total: 3, last_7d: 1, last_30d: 2 },
      more_engagement: { total: 14, last_7d: 4, last_30d: 10 },
    },
    ...overrides,
  };
}

describe("PolicyAnalyticsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no persisted snapshot
    mockGetLatestSnapshotMeta.mockResolvedValue(null);
    // Default: no snapshot pair (only one or zero snapshots)
    mockGetSnapshotPair.mockResolvedValue({ latest: null, previous: null });
    mockComputeSnapshotDiff.mockReturnValue(null);
  });

  it("renders headline metrics when data is present", async () => {
    mockSummarise.mockReturnValue(makeSummary());
    const node = await PolicyAnalyticsPage();
    const html = renderToString(node);

    expect(html).toContain("Policy Analytics Summary");
    expect(html).toContain("42"); // total events
    expect(html).toContain("40.0%"); // expand rate
    expect(html).toContain("15.0%"); // view-setting rate
    expect(html).toContain("8.0%"); // teaser click rate
  });

  it("renders empty state when no events recorded", async () => {
    mockSummarise.mockReturnValue(
      makeSummary({
        total_events: 0,
        by_event_type: {},
        by_source: {},
        by_priority: {},
        by_display_section: {},
        by_source_and_section: {},
        derived: {
          expand_rate: null,
          view_setting_click_rate: null,
          upgrade_teaser_click_rate: null,
          featured_impressions: zeroBucket(),
          featured_expands: zeroBucket(),
          featured_view_setting_clicks: zeroBucket(),
          more_engagement: zeroBucket(),
        },
      }),
    );
    const node = await PolicyAnalyticsPage();
    const html = renderToString(node);

    expect(html).toContain("No analytics events recorded yet");
    // Should NOT contain metric cards or tables
    expect(html).not.toContain("Expand Rate");
  });

  it("renders source and section tables", async () => {
    mockSummarise.mockReturnValue(makeSummary());
    const node = await PolicyAnalyticsPage();
    const html = renderToString(node);

    expect(html).toContain("By Source");
    expect(html).toContain("Policy Intelligence");
    expect(html).toContain("Compliance Scan");
    expect(html).toContain("By Display Section");
    expect(html).toContain("Source × Section Cross-Tab");
    expect(html).toContain("Policy Intelligence::featured");
  });

  it("renders featured and more engagement tables", async () => {
    mockSummarise.mockReturnValue(makeSummary());
    const node = await PolicyAnalyticsPage();
    const html = renderToString(node);

    expect(html).toContain("Featured Engagement");
    expect(html).toContain("More-Suggestions Engagement");
  });

  it("shows instance-local snapshot warning", async () => {
    mockSummarise.mockReturnValue(makeSummary());
    const node = await PolicyAnalyticsPage();
    const html = renderToString(node);

    expect(html).toContain("Instance-local snapshot");
    expect(html).toContain("may reset on deployment");
  });

  it("shows durable snapshot status banner with no-snapshot message when none persisted", async () => {
    mockSummarise.mockReturnValue(makeSummary());
    mockGetLatestSnapshotMeta.mockResolvedValue(null);
    const node = await PolicyAnalyticsPage();
    const html = renderToString(node);

    expect(html).toContain("Durable snapshot:");
    expect(html).toContain("No snapshot persisted yet");
    expect(html).toContain("Export snapshot");
  });

  it("shows durable snapshot timestamp when a snapshot exists", async () => {
    mockSummarise.mockReturnValue(makeSummary());
    mockGetLatestSnapshotMeta.mockResolvedValue({
      id: "abc-123",
      captured_at: "2026-04-16T12:00:00.000Z",
      summary_version: "1",
    });
    const node = await PolicyAnalyticsPage();
    const html = renderToString(node);

    expect(html).toContain("Durable snapshot:");
    expect(html).toContain("Last persisted");
    expect(html).toContain("v1");
  });

  it("degrades gracefully when getLatestSnapshotMeta throws", async () => {
    mockSummarise.mockReturnValue(makeSummary());
    mockGetLatestSnapshotMeta.mockRejectedValue(new Error("DB unavailable"));
    const node = await PolicyAnalyticsPage();
    const html = renderToString(node);

    // Page still renders; snapshot banner shows no-snapshot fallback
    expect(html).toContain("Policy Analytics Summary");
    expect(html).toContain("Durable snapshot:");
    expect(html).toContain("No snapshot persisted yet");
  });

  it("renders null rates as em-dash", async () => {
    mockSummarise.mockReturnValue(
      makeSummary({
        derived: {
          expand_rate: null,
          view_setting_click_rate: null,
          upgrade_teaser_click_rate: null,
          featured_impressions: zeroBucket(),
          featured_expands: zeroBucket(),
          featured_view_setting_clicks: zeroBucket(),
          more_engagement: zeroBucket(),
        },
      }),
    );
    const node = await PolicyAnalyticsPage();
    const html = renderToString(node);

    // em-dash for null rates
    expect(html).toContain("—");
  });

  it("renders the teaser performance panel with source, tier, and mix data", async () => {
    mockSummarise.mockReturnValue(makeSummary());
    const node = await PolicyAnalyticsPage();
    const html = renderToString(node);

    expect(html).toContain("Gated-Source Teaser Performance");
    // dominant source breakdown
    expect(html).toContain("By Dominant Gated Source");
    expect(html).toContain("Policy Intelligence");
    expect(html).toContain("External context");
    // tier breakdown
    expect(html).toContain("By Target Upgrade Tier");
    expect(html).toContain("Pro");
    expect(html).toContain("Enterprise");
    // mix breakdown
    expect(html).toContain("Clicks by Source Mix");
    expect(html).toContain("single");
    expect(html).toContain("few");
    expect(html).toContain("many");
    // mix legend note
    expect(html).toContain("Source mix is now captured on both view and click events");
  });

  it("shows empty-data state in teaser panel when no teaser events", async () => {
    mockSummarise.mockReturnValue(
      makeSummary({
        teaser_performance: {
          views_by_dominant_source: {},
          clicks_by_dominant_source: {},
          views_by_tier: {},
          clicks_by_tier: {},
          clicks_by_mix: {},
          views_by_mix: {},
        },
      }),
    );
    const node = await PolicyAnalyticsPage();
    const html = renderToString(node);

    // Panel heading still present
    expect(html).toContain("Gated-Source Teaser Performance");
    // No-data fallback text for the compare tables
    expect(html).toContain("No data yet.");
  });

  it("shows trend-diff empty state when only one snapshot exists", async () => {
    mockSummarise.mockReturnValue(makeSummary());
    mockGetSnapshotPair.mockResolvedValue({
      latest: { captured_at: "2026-04-16T12:00:00.000Z", summary_version: "1", summary: makeSummary(), row_id: "r1" },
      previous: null,
    });
    const node = await PolicyAnalyticsPage();
    const html = renderToString(node);

    expect(html).toContain("Trend view unavailable");
    expect(html).toContain("at least two snapshots");
    expect(html).not.toContain("Trend Since Last Snapshot");
  });

  it("shows trend-diff empty state when no snapshots exist", async () => {
    mockSummarise.mockReturnValue(makeSummary());
    mockGetSnapshotPair.mockResolvedValue({ latest: null, previous: null });
    const node = await PolicyAnalyticsPage();
    const html = renderToString(node);

    expect(html).toContain("Trend view unavailable");
  });

  it("renders the trend diff panel when two snapshots are available", async () => {
    mockSummarise.mockReturnValue(makeSummary());
    const latestSnap = { captured_at: "2026-04-16T12:00:00.000Z", summary_version: "1", summary: makeSummary(), row_id: "r1" };
    const prevSnap = { captured_at: "2026-04-15T12:00:00.000Z", summary_version: "1", summary: makeSummary(), row_id: "r0" };
    mockGetSnapshotPair.mockResolvedValue({ latest: latestSnap, previous: prevSnap });
    mockComputeSnapshotDiff.mockReturnValue({
      latest_captured_at: latestSnap.captured_at,
      previous_captured_at: prevSnap.captured_at,
      headline: [
        { label: "Total Events", latest: 100, previous: 80, delta: 20, pct_delta: 0.25, direction: "up" },
        { label: "Expand Rate", latest: 0.4, previous: 0.35, delta: 0.05, pct_delta: null, direction: "up" },
        { label: "View-Setting Rate", latest: 0.15, previous: 0.15, delta: 0, pct_delta: 0, direction: "flat" },
        { label: "Teaser Click Rate", latest: 0.08, previous: 0.1, delta: -0.02, pct_delta: -0.2, direction: "down" },
        { label: "Featured Impressions", latest: 40, previous: 30, delta: 10, pct_delta: 0.333, direction: "up" },
        { label: "Featured Expands", latest: 15, previous: 10, delta: 5, pct_delta: 0.5, direction: "up" },
        { label: "More-Section Engagement", latest: 20, previous: 18, delta: 2, pct_delta: 0.111, direction: "up" },
      ],
      by_source_top_deltas: [
        { key: "Policy Intelligence", latest: 60, previous: 45, delta: 15 },
      ],
      teaser_by_source_deltas: [
        { key: "Policy Intelligence", latest: 40, previous: 30, delta: 10 },
      ],
      teaser_by_tier_deltas: [
        { key: "Pro", latest: 50, previous: 40, delta: 10 },
      ],
    });

    const node = await PolicyAnalyticsPage();
    const html = renderToString(node);

    // Panel heading and timestamps
    expect(html).toContain("Trend Since Last Snapshot");
    expect(html).toContain("Apr 16");
    expect(html).toContain("Apr 15");

    // Headline delta cards
    expect(html).toContain("Total Events");
    expect(html).toContain("Expand Rate");
    expect(html).toContain("Teaser Click Rate");

    // Dimension tables
    expect(html).toContain("By Source");
    expect(html).toContain("Policy Intelligence");

    // No trend-diff-empty element
    expect(html).not.toContain("Trend view unavailable");
  });

  it("degrades gracefully when getSnapshotPair throws", async () => {
    mockSummarise.mockReturnValue(makeSummary());
    mockGetLatestSnapshotMeta.mockRejectedValue(new Error("DB unavailable"));
    mockGetSnapshotPair.mockRejectedValue(new Error("DB unavailable"));
    const node = await PolicyAnalyticsPage();
    const html = renderToString(node);

    // Page still renders
    expect(html).toContain("Policy Analytics Summary");
    // Shows the empty diff state since DB failed
    expect(html).toContain("Trend view unavailable");
  });
});

/* ── minimal JSX-to-string helper (no extra deps) ─────────────────── */

function renderToString(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean")
    return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(renderToString).join("");
  if (typeof node === "object" && "type" in node && "props" in node) {
    const el = node as { type: unknown; props: Record<string, unknown> };
    // Call function components to get their rendered output
    if (typeof el.type === "function") {
      const rendered = (el.type as (props: Record<string, unknown>) => React.ReactNode)(el.props);
      return renderToString(rendered);
    }
    const children = el.props.children;
    const childStr = Array.isArray(children)
      ? children.map(renderToString).join("")
      : renderToString(children as React.ReactNode);
    // Extract text content from className and other string props
    const propsStr = Object.entries(el.props)
      .filter(([k]) => k !== "children")
      .map(([, v]) => (typeof v === "string" ? v : ""))
      .join(" ");
    return `${propsStr} ${childStr}`;
  }
  return String(node);
}

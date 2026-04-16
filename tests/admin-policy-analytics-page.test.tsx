import { beforeEach, describe, expect, it, vi } from "vitest";

/* ── mock the analytics store ──────────────────────────────────────── */

const mockSummarise = vi.fn();
vi.mock("@/lib/server/policy-analytics-store", () => ({
  summarise: (...args: unknown[]) => mockSummarise(...args),
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

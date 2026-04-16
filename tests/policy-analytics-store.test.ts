import { describe, it, expect, beforeEach } from "vitest";
import {
  recordPolicyEvent,
  summarise,
  _resetForTesting,
  POLICY_EVENT_NAMES,
} from "@/lib/server/policy-analytics-store";

beforeEach(() => {
  _resetForTesting();
});

// ── Helpers ─────────────────────────────────────────────────────────────────

function meta(overrides: Record<string, string | number | boolean> = {}) {
  return {
    recommendation_source: "Policy Intelligence",
    recommendation_priority: "high",
    recommendation_display_section: "featured",
    ...overrides,
  };
}

function recentTs(): number {
  return Date.now() - 1_000; // 1 second ago — within all windows
}

// ── Basic recording & aggregation ───────────────────────────────────────────

describe("policy-analytics-store", () => {
  it("starts with an empty summary", () => {
    const s = summarise();
    expect(s.total_events).toBe(0);
    expect(s.by_event_type).toEqual({});
    expect(s.by_source).toEqual({});
    expect(s.derived.expand_rate).toBeNull();
  });

  it("records only policy events (ignores non-policy names)", () => {
    recordPolicyEvent("page_view", {});
    recordPolicyEvent("cta_home_primary", {});
    expect(summarise().total_events).toBe(0);
  });

  it("records policy events correctly", () => {
    recordPolicyEvent("policy_recommendation_impression", meta());
    recordPolicyEvent("policy_recommendation_expand", meta());
    const s = summarise();
    expect(s.total_events).toBe(2);
  });

  it("counts by event type", () => {
    recordPolicyEvent("policy_recommendation_impression", meta());
    recordPolicyEvent("policy_recommendation_impression", meta());
    recordPolicyEvent("policy_recommendation_expand", meta());
    const s = summarise();
    expect(s.by_event_type["policy_recommendation_impression"].total).toBe(2);
    expect(s.by_event_type["policy_recommendation_expand"].total).toBe(1);
  });

  it("counts by source", () => {
    recordPolicyEvent(
      "policy_recommendation_impression",
      meta({ recommendation_source: "Market analysis" }),
    );
    recordPolicyEvent(
      "policy_recommendation_impression",
      meta({ recommendation_source: "Policy Intelligence" }),
    );
    const s = summarise();
    expect(s.by_source["Market analysis"].total).toBe(1);
    expect(s.by_source["Policy Intelligence"].total).toBe(1);
  });

  it("counts by priority", () => {
    recordPolicyEvent(
      "policy_recommendation_impression",
      meta({ recommendation_priority: "high" }),
    );
    recordPolicyEvent(
      "policy_recommendation_impression",
      meta({ recommendation_priority: "medium" }),
    );
    const s = summarise();
    expect(s.by_priority["high"].total).toBe(1);
    expect(s.by_priority["medium"].total).toBe(1);
  });

  it("counts by display section", () => {
    recordPolicyEvent(
      "policy_recommendation_impression",
      meta({ recommendation_display_section: "featured" }),
    );
    recordPolicyEvent(
      "policy_recommendation_impression",
      meta({ recommendation_display_section: "more" }),
    );
    recordPolicyEvent(
      "policy_recommendation_impression",
      meta({ recommendation_display_section: "top" }),
    );
    const s = summarise();
    expect(s.by_display_section["featured"].total).toBe(1);
    expect(s.by_display_section["more"].total).toBe(1);
    expect(s.by_display_section["top"].total).toBe(1);
  });

  // ── Derived rates ─────────────────────────────────────────────────────────

  it("computes expand_rate correctly", () => {
    for (let i = 0; i < 10; i++) {
      recordPolicyEvent("policy_recommendation_impression", meta());
    }
    for (let i = 0; i < 3; i++) {
      recordPolicyEvent("policy_recommendation_expand", meta());
    }
    expect(summarise().derived.expand_rate).toBeCloseTo(0.3);
  });

  it("computes view_setting_click_rate correctly", () => {
    for (let i = 0; i < 5; i++) {
      recordPolicyEvent("policy_recommendation_impression", meta());
    }
    recordPolicyEvent("policy_recommendation_view_setting", meta());
    expect(summarise().derived.view_setting_click_rate).toBeCloseTo(0.2);
  });

  it("computes upgrade_teaser_click_rate correctly", () => {
    for (let i = 0; i < 4; i++) {
      recordPolicyEvent("policy_upgrade_teaser_view", meta());
    }
    recordPolicyEvent("policy_upgrade_teaser_click", meta());
    expect(summarise().derived.upgrade_teaser_click_rate).toBeCloseTo(0.25);
  });

  it("returns null rates when denominators are zero", () => {
    const s = summarise();
    expect(s.derived.expand_rate).toBeNull();
    expect(s.derived.view_setting_click_rate).toBeNull();
    expect(s.derived.upgrade_teaser_click_rate).toBeNull();
  });

  // ── Featured card analytics ───────────────────────────────────────────────

  it("tracks featured impressions separately", () => {
    recordPolicyEvent(
      "policy_recommendation_impression",
      meta({ recommendation_display_section: "featured" }),
    );
    recordPolicyEvent(
      "policy_recommendation_impression",
      meta({ recommendation_display_section: "top" }),
    );
    const s = summarise();
    expect(s.derived.featured_impressions.total).toBe(1);
  });

  it("tracks featured expands separately", () => {
    recordPolicyEvent(
      "policy_recommendation_expand",
      meta({ recommendation_display_section: "featured" }),
    );
    recordPolicyEvent(
      "policy_recommendation_expand",
      meta({ recommendation_display_section: "top" }),
    );
    expect(summarise().derived.featured_expands.total).toBe(1);
  });

  it("tracks featured view-setting clicks separately", () => {
    recordPolicyEvent(
      "policy_recommendation_view_setting",
      meta({ recommendation_display_section: "featured" }),
    );
    expect(summarise().derived.featured_view_setting_clicks.total).toBe(1);
  });

  // ── "More" engagement ─────────────────────────────────────────────────────

  it("tracks more-suggestions engagement", () => {
    recordPolicyEvent(
      "policy_recommendation_impression",
      meta({ recommendation_display_section: "more" }),
    );
    recordPolicyEvent(
      "policy_recommendation_expand",
      meta({ recommendation_display_section: "more" }),
    );
    expect(summarise().derived.more_engagement.total).toBe(2);
  });

  // ── Time-bounded windows ──────────────────────────────────────────────────

  it("populates last_7d and last_30d for recent events", () => {
    recordPolicyEvent("policy_recommendation_impression", {
      ...meta(),
      ts: recentTs(),
    });
    const s = summarise();
    expect(s.by_event_type["policy_recommendation_impression"].last_7d).toBe(1);
    expect(
      s.by_event_type["policy_recommendation_impression"].last_30d,
    ).toBe(1);
  });

  it("excludes old events from last_7d window", () => {
    const old = Date.now() - 10 * 24 * 60 * 60 * 1000; // 10 days ago
    recordPolicyEvent("policy_recommendation_impression", {
      ...meta(),
      ts: old,
    });
    const s = summarise();
    expect(s.by_event_type["policy_recommendation_impression"].total).toBe(1);
    expect(s.by_event_type["policy_recommendation_impression"].last_7d).toBe(0);
    expect(
      s.by_event_type["policy_recommendation_impression"].last_30d,
    ).toBe(1);
  });

  // ── Privacy guardrail: allowlist ──────────────────────────────────────────

  it("POLICY_EVENT_NAMES contains exactly the known policy events", () => {
    expect(POLICY_EVENT_NAMES.size).toBe(8);
    expect(POLICY_EVENT_NAMES.has("policy_recommendation_impression")).toBe(
      true,
    );
    expect(POLICY_EVENT_NAMES.has("page_view")).toBe(false);
  });

  // ── Privacy guardrail: output shape ───────────────────────────────────────

  it("summary contains no raw policy values or customer identifiers", () => {
    recordPolicyEvent("policy_recommendation_impression", {
      ...meta(),
      recommendation_id: "rec-secret-123",
      plan_tier: "enterprise",
      field_key_present: true,
    });
    const s = summarise();
    const json = JSON.stringify(s);

    // Must NOT contain individual recommendation IDs
    expect(json).not.toContain("rec-secret-123");
    // Must NOT contain plan tier info
    expect(json).not.toContain("enterprise");
    // Must contain only aggregate structures
    expect(s.by_event_type).toBeDefined();
    expect(s.by_source).toBeDefined();
    expect(typeof s.total_events).toBe("number");
  });

  // ── Source × section cross-tabulation ─────────────────────────────────────

  it("populates by_source_and_section cross-tab", () => {
    recordPolicyEvent(
      "policy_recommendation_impression",
      meta({
        recommendation_source: "Policy Intelligence",
        recommendation_display_section: "featured",
      }),
    );
    recordPolicyEvent(
      "policy_recommendation_expand",
      meta({
        recommendation_source: "Policy Intelligence",
        recommendation_display_section: "featured",
      }),
    );
    recordPolicyEvent(
      "policy_recommendation_impression",
      meta({
        recommendation_source: "Market analysis",
        recommendation_display_section: "more",
      }),
    );
    const s = summarise();
    expect(s.by_source_and_section["Policy Intelligence::featured"].total).toBe(2);
    expect(s.by_source_and_section["Market analysis::more"].total).toBe(1);
    expect(s.by_source_and_section["Policy Intelligence::more"]).toBeUndefined();
  });

  // ── Ring-buffer eviction ──────────────────────────────────────────────────

  it("evicts old events when buffer exceeds cap", () => {
    // Record 50,001 events to trigger eviction (cap is 50,000)
    for (let i = 0; i < 50_001; i++) {
      recordPolicyEvent("policy_recommendation_impression", meta());
    }
    const s = summarise();
    // After eviction, should have roughly half of the cap
    expect(s.total_events).toBeLessThan(50_001);
    expect(s.total_events).toBeGreaterThan(0);
  });
});

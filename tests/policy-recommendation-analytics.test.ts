import { describe, it, expect, vi, beforeEach } from "vitest";

// Stub both tracking modules before importing the analytics helper
vi.mock("@/lib/track", () => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

import {
  trackRecommendationImpression,
  trackRecommendationExpand,
  trackRecommendationCollapse,
  trackRecommendationViewSetting,
  trackSignalRefreshClick,
  trackSignalRefreshComplete,
  trackUpgradeTeaserView,
  trackUpgradeTeaserClick,
  resetImpressionTracking,
} from "@/lib/client/policy-recommendation-analytics";

import { trackEvent as internalTrack } from "@/lib/track";
import { trackEvent as vercelTrack } from "@/lib/analytics";

const baseOpts = {
  recommendation_id: "rec-1",
  recommendation_source: "Policy Intelligence",
  recommendation_priority: "high",
  plan_tier: "pro",
  had_confidence: true,
  had_evidence: true,
  field_key_present: true,
  total_visible_count: 4,
  visible_sources_count: 3,
  has_gated_sources: false,
} as const;

beforeEach(() => {
  vi.clearAllMocks();
  resetImpressionTracking();
});

describe("policy-recommendation-analytics", () => {
  // ── Impression deduplication ────────────────────────────────────────────
  it("fires impression once per recommendation per render cycle", () => {
    trackRecommendationImpression(baseOpts);
    trackRecommendationImpression(baseOpts); // duplicate
    expect(internalTrack).toHaveBeenCalledTimes(1);
    expect(vercelTrack).toHaveBeenCalledTimes(1);
  });

  it("fires again after resetImpressionTracking()", () => {
    trackRecommendationImpression(baseOpts);
    resetImpressionTracking();
    trackRecommendationImpression(baseOpts);
    expect(internalTrack).toHaveBeenCalledTimes(2);
  });

  it("fires separately for different recommendation IDs", () => {
    trackRecommendationImpression(baseOpts);
    trackRecommendationImpression({ ...baseOpts, recommendation_id: "rec-2" });
    expect(internalTrack).toHaveBeenCalledTimes(2);
  });

  // ── Expand / Collapse ──────────────────────────────────────────────────
  it("fires expand with correct event name and fields", () => {
    trackRecommendationExpand({
      recommendation_id: "rec-1",
      recommendation_source: "Market analysis",
      recommendation_priority: "medium",
      plan_tier: "enterprise",
      had_confidence: false,
      had_evidence: true,
    });
    expect(internalTrack).toHaveBeenCalledWith(
      "policy_recommendation_expand",
      expect.objectContaining({
        page: "customer_policies",
        recommendation_id: "rec-1",
        recommendation_source: "Market analysis",
        plan_tier: "enterprise",
      }),
    );
  });

  it("fires collapse with correct event name", () => {
    trackRecommendationCollapse({
      recommendation_id: "rec-1",
      recommendation_source: "Default guidance",
      plan_tier: "free",
    });
    expect(internalTrack).toHaveBeenCalledWith(
      "policy_recommendation_collapse",
      expect.objectContaining({ recommendation_id: "rec-1" }),
    );
  });

  // ── View setting ──────────────────────────────────────────────────────
  it("fires view_setting event", () => {
    trackRecommendationViewSetting({
      recommendation_id: "rec-1",
      recommendation_source: "Customer history",
      recommendation_priority: "high",
      plan_tier: "pro",
      field_key_present: true,
    });
    expect(internalTrack).toHaveBeenCalledWith(
      "policy_recommendation_view_setting",
      expect.objectContaining({ field_key_present: true }),
    );
  });

  // ── Signal refresh ────────────────────────────────────────────────────
  it("fires signal refresh click and complete", () => {
    trackSignalRefreshClick({ plan_tier: "advanced" });
    expect(internalTrack).toHaveBeenCalledWith(
      "policy_signal_refresh_click",
      expect.objectContaining({ plan_tier: "advanced" }),
    );
    trackSignalRefreshComplete({
      plan_tier: "advanced",
      market_status: "fresh",
      external_status: "stale",
    });
    expect(internalTrack).toHaveBeenCalledWith(
      "policy_signal_refresh_complete",
      expect.objectContaining({ market_status: "fresh", external_status: "stale" }),
    );
  });

  it("omits undefined optional fields from refresh_complete", () => {
    trackSignalRefreshComplete({ plan_tier: "free" });
    const call = (internalTrack as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[1]).not.toHaveProperty("market_status");
    expect(call[1]).not.toHaveProperty("external_status");
  });

  // ── Upgrade teaser deduplication ──────────────────────────────────────
  it("fires teaser_view once per render cycle", () => {
    const opts = {
      plan_tier: "free",
      gated_source_count: 3,
      gated_sources_present: "Customer history,Cohort benchmark,External context",
      dominant_gated_source: "External context",
      highest_gated_tier: "Enterprise",
    } as const;
    trackUpgradeTeaserView(opts);
    trackUpgradeTeaserView(opts); // duplicate
    expect(internalTrack).toHaveBeenCalledTimes(1);
  });

  it("fires teaser_click without deduplication", () => {
    const opts = {
      plan_tier: "free",
      gated_source_count: 2,
      target_tier: "Enterprise",
      dominant_gated_source: "External context",
      highest_gated_tier: "Enterprise",
      gated_source_mix: "few",
    } as const;
    trackUpgradeTeaserClick(opts);
    trackUpgradeTeaserClick(opts);
    expect(internalTrack).toHaveBeenCalledTimes(2);
  });

  it("teaser_view includes dominant_gated_source and highest_gated_tier fields", () => {
    trackUpgradeTeaserView({
      plan_tier: "free",
      gated_source_count: 2,
      gated_sources_present: "Policy Intelligence,Cohort benchmark",
      dominant_gated_source: "Cohort benchmark",
      highest_gated_tier: "Advanced",
      gated_source_mix: "few",
    });
    const call = (internalTrack as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[1]).toMatchObject({
      dominant_gated_source: "Cohort benchmark",
      highest_gated_tier: "Advanced",
      gated_source_mix: "few",
    });
  });

  it("teaser_view includes dominant_source_rank_bucket when provided", () => {
    trackUpgradeTeaserView({
      plan_tier: "free",
      gated_source_count: 1,
      gated_sources_present: "Policy Intelligence",
      dominant_gated_source: "Policy Intelligence",
      highest_gated_tier: "Pro",
      gated_source_mix: "single",
      dominant_source_rank_bucket: "high",
    });
    const call = (internalTrack as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[1]).toMatchObject({
      dominant_source_rank_bucket: "high",
    });
  });

  it("teaser_click includes dominant_gated_source, highest_gated_tier, and gated_source_mix", () => {
    trackUpgradeTeaserClick({
      plan_tier: "free",
      gated_source_count: 4,
      target_tier: "Enterprise",
      dominant_gated_source: "External context",
      highest_gated_tier: "Enterprise",
      gated_source_mix: "many",
    });
    const call = (internalTrack as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[1]).toMatchObject({
      dominant_gated_source: "External context",
      highest_gated_tier: "Enterprise",
      gated_source_mix: "many",
    });
  });

  it("teaser_click includes dominant_source_rank_bucket when provided", () => {
    trackUpgradeTeaserClick({
      plan_tier: "free",
      gated_source_count: 1,
      target_tier: "Pro",
      dominant_gated_source: "Customer history",
      highest_gated_tier: "Pro",
      gated_source_mix: "single",
      dominant_source_rank_bucket: "standard",
    });
    const call = (internalTrack as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[1]).toMatchObject({
      dominant_source_rank_bucket: "standard",
    });
  });

  // ── Dual tracking ────────────────────────────────────────────────────
  it("sends events to both internal and Vercel trackers", () => {
    trackRecommendationExpand({
      recommendation_id: "rec-x",
      recommendation_source: "External context",
      recommendation_priority: "low",
      plan_tier: "enterprise",
      had_confidence: true,
      had_evidence: false,
    });
    expect(internalTrack).toHaveBeenCalledTimes(1);
    expect(vercelTrack).toHaveBeenCalledTimes(1);
    // Both should receive the same event name
    expect((internalTrack as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe(
      "policy_recommendation_expand",
    );
    expect((vercelTrack as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe(
      "policy_recommendation_expand",
    );
  });

  // ── Privacy: no raw values ────────────────────────────────────────────
  it("does not include raw policy values in any event payload", () => {
    trackRecommendationImpression(baseOpts);
    const payload = (internalTrack as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1];
    // Must not contain raw token lists, program lists, or secrets
    const keys = Object.keys(payload);
    const forbidden = ["token", "mint", "program", "secret", "password", "api_key"];
    for (const k of keys) {
      for (const f of forbidden) {
        expect(k.toLowerCase()).not.toContain(f);
      }
    }
  });
});

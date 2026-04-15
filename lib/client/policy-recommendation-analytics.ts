/**
 * Policy Recommendation Analytics — lightweight engagement instrumentation
 *
 * Privacy rules:
 *   - Never emit raw policy values, token lists, program lists, or customer secrets.
 *   - Fields are limited to primitives: strings, numbers, booleans.
 *   - Only structural metadata (source, priority, counts, booleans) is sent.
 *
 * Events:
 *   - policy_recommendation_impression   (once per card per render cycle)
 *   - policy_recommendation_expand
 *   - policy_recommendation_collapse
 *   - policy_recommendation_view_setting
 *   - policy_signal_refresh_click
 *   - policy_signal_refresh_complete
 *   - policy_upgrade_teaser_view          (once per render cycle)
 *   - policy_upgrade_teaser_click
 */

import { trackEvent } from "@/lib/track";
import { trackEvent as trackVercel } from "@/lib/analytics";

// ── Types ───────────────────────────────────────────────────────────────────

export type PolicyAnalyticsEvent =
  | "policy_recommendation_impression"
  | "policy_recommendation_expand"
  | "policy_recommendation_collapse"
  | "policy_recommendation_view_setting"
  | "policy_signal_refresh_click"
  | "policy_signal_refresh_complete"
  | "policy_upgrade_teaser_view"
  | "policy_upgrade_teaser_click";

type SafeProps = Record<string, string | number | boolean>;

// ── Shared state for impression deduplication ───────────────────────────────

const _firedImpressions = new Set<string>();
let _teaserFired = false;

/** Reset impression tracking — call when the recommendation list re-computes. */
export function resetImpressionTracking(): void {
  _firedImpressions.clear();
  _teaserFired = false;
}

// ── Core fire helper (dual-track: internal + Vercel) ────────────────────────

function fire(name: PolicyAnalyticsEvent, props: SafeProps): void {
  trackEvent(name, props);
  trackVercel(name, props);
}

// ── Public instrumentation API ──────────────────────────────────────────────

/**
 * Fire once per recommendation card per render cycle.
 * Duplicate calls for the same recommendation_id are silently dropped.
 */
export function trackRecommendationImpression(opts: {
  recommendation_id: string;
  recommendation_source: string;
  recommendation_priority: string;
  plan_tier: string;
  had_confidence: boolean;
  had_evidence: boolean;
  field_key_present: boolean;
  total_visible_count: number;
  visible_sources_count: number;
  has_gated_sources: boolean;
  /** Display section: "top" or "more" — for future ranking analysis */
  recommendation_display_section?: string;
}): void {
  if (_firedImpressions.has(opts.recommendation_id)) return;
  _firedImpressions.add(opts.recommendation_id);
  fire("policy_recommendation_impression", {
    page: "customer_policies",
    ...opts,
  });
}

export function trackRecommendationExpand(opts: {
  recommendation_id: string;
  recommendation_source: string;
  recommendation_priority: string;
  plan_tier: string;
  had_confidence: boolean;
  had_evidence: boolean;
}): void {
  fire("policy_recommendation_expand", {
    page: "customer_policies",
    ...opts,
  });
}

export function trackRecommendationCollapse(opts: {
  recommendation_id: string;
  recommendation_source: string;
  plan_tier: string;
}): void {
  fire("policy_recommendation_collapse", {
    page: "customer_policies",
    ...opts,
  });
}

export function trackRecommendationViewSetting(opts: {
  recommendation_id: string;
  recommendation_source: string;
  recommendation_priority: string;
  plan_tier: string;
  field_key_present: boolean;
}): void {
  fire("policy_recommendation_view_setting", {
    page: "customer_policies",
    ...opts,
  });
}

export function trackSignalRefreshClick(opts: {
  plan_tier: string;
}): void {
  fire("policy_signal_refresh_click", {
    page: "customer_policies",
    ...opts,
  });
}

export function trackSignalRefreshComplete(opts: {
  plan_tier: string;
  market_status?: string;
  external_status?: string;
}): void {
  const props: SafeProps = {
    page: "customer_policies",
    plan_tier: opts.plan_tier,
  };
  if (opts.market_status) props.market_status = opts.market_status;
  if (opts.external_status) props.external_status = opts.external_status;
  fire("policy_signal_refresh_complete", props);
}

/**
 * Fire once per render cycle when the upgrade teaser is visible.
 * Duplicate calls are silently dropped.
 */
export function trackUpgradeTeaserView(opts: {
  plan_tier: string;
  gated_source_count: number;
  gated_sources_present: string;
}): void {
  if (_teaserFired) return;
  _teaserFired = true;
  fire("policy_upgrade_teaser_view", {
    page: "customer_policies",
    ...opts,
  });
}

export function trackUpgradeTeaserClick(opts: {
  plan_tier: string;
  gated_source_count: number;
  target_tier: string;
}): void {
  fire("policy_upgrade_teaser_click", {
    page: "customer_policies",
    ...opts,
  });
}

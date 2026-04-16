/**
 * In-memory policy analytics event accumulator.
 *
 * Stores aggregated counts only — no raw event payloads, no PII,
 * no sensitive policy values.  Module-level state persists across
 * requests within the same serverless function instance.
 *
 * Limitations (documented by design):
 *   - Ephemeral: counts reset when the instance recycles.
 *   - Per-instance: in a multi-instance deployment each instance
 *     tracks only the events it processed.
 *   - Approximate: intended for trend/signal inspection, not billing.
 */

// ── Policy event names we track ─────────────────────────────────────────────

export const POLICY_EVENT_NAMES = new Set([
  "policy_recommendation_impression",
  "policy_recommendation_expand",
  "policy_recommendation_collapse",
  "policy_recommendation_view_setting",
  "policy_signal_refresh_click",
  "policy_signal_refresh_complete",
  "policy_upgrade_teaser_view",
  "policy_upgrade_teaser_click",
]);

// ── Bucket helpers ──────────────────────────────────────────────────────────

type BucketKey = string; // "event:source:priority:section"

interface BucketCounts {
  total: number;
  last_7d: number;
  last_30d: number;
}

interface StoredEvent {
  name: string;
  source: string;
  priority: string;
  display_section: string;
  /** Populated only for policy_upgrade_teaser_* events; "" otherwise. */
  dominant_gated_source: string;
  /** Populated only for policy_upgrade_teaser_* events; "" otherwise. */
  highest_gated_tier: string;
  /** Populated only for policy_upgrade_teaser_click events; "" otherwise. */
  gated_source_mix: string;
  ts: number;
}

// Ring-buffer of recent events (capped to avoid unbounded memory growth).
const MAX_EVENTS = 50_000;
let _events: StoredEvent[] = [];
let _instanceStartedAt: number = Date.now();

// ── Record an event ─────────────────────────────────────────────────────────

export function recordPolicyEvent(
  name: string,
  meta: Record<string, string | number | boolean>,
): void {
  if (!POLICY_EVENT_NAMES.has(name)) return;

  const isTeaserEvent =
    name === "policy_upgrade_teaser_view" ||
    name === "policy_upgrade_teaser_click";
  const isTeaserClick = name === "policy_upgrade_teaser_click";

  const entry: StoredEvent = {
    name,
    source: String(meta.recommendation_source ?? "unknown"),
    priority: String(meta.recommendation_priority ?? "unknown"),
    display_section: String(meta.recommendation_display_section ?? "unknown"),
    dominant_gated_source: isTeaserEvent
      ? String(meta.dominant_gated_source ?? "")
      : "",
    highest_gated_tier: isTeaserEvent
      ? String(meta.highest_gated_tier ?? "")
      : "",
    gated_source_mix: isTeaserClick
      ? String(meta.gated_source_mix ?? "")
      : "",
    ts: typeof meta.ts === "number" ? meta.ts : Date.now(),
  };

  _events.push(entry);

  // Evict oldest half when we hit the cap
  if (_events.length > MAX_EVENTS) {
    _events = _events.slice(Math.floor(MAX_EVENTS / 2));
  }
}

// ── Summarise ───────────────────────────────────────────────────────────────

export interface PolicyAnalyticsSummary {
  instance_started_at: string;
  generated_at: string;
  total_events: number;

  by_event_type: Record<string, BucketCounts>;
  by_source: Record<string, BucketCounts>;
  by_priority: Record<string, BucketCounts>;
  by_display_section: Record<string, BucketCounts>;

  /**
   * Cross-tabulation: source × display section.
   * Keys are "source::section" (e.g. "Policy Intelligence::featured").
   * Enables comparing engagement rates per source within each display
   * section — the primary input for tuning SOURCE_ENGAGEMENT_TIER in
   * the page display model.
   */
  by_source_and_section: Record<string, BucketCounts>;

  /**
   * Teaser-performance breakdowns — only populated from
   * policy_upgrade_teaser_view and policy_upgrade_teaser_click events.
   *
   * - views_by_dominant_source / clicks_by_dominant_source:
   *     which gated source most frequently triggers the teaser and drives
   *     clicks (keyed by dominant_gated_source, e.g. "External context").
   * - views_by_tier / clicks_by_tier:
   *     which upgrade tier is most often promoted (keyed by
   *     highest_gated_tier, e.g. "Pro", "Advanced", "Enterprise").
   * - clicks_by_mix:
   *     how single / few / many gated-source mixes convert (click-only;
   *     gated_source_mix is emitted only on click events).
   */
  teaser_performance: {
    views_by_dominant_source: Record<string, BucketCounts>;
    clicks_by_dominant_source: Record<string, BucketCounts>;
    views_by_tier: Record<string, BucketCounts>;
    clicks_by_tier: Record<string, BucketCounts>;
    clicks_by_mix: Record<string, BucketCounts>;
  };

  derived: {
    expand_rate: number | null;
    view_setting_click_rate: number | null;
    upgrade_teaser_click_rate: number | null;
    featured_impressions: BucketCounts;
    featured_expands: BucketCounts;
    featured_view_setting_clicks: BucketCounts;
    more_engagement: BucketCounts;
  };
}

function zeroBucket(): BucketCounts {
  return { total: 0, last_7d: 0, last_30d: 0 };
}

function increment(
  bucket: BucketCounts,
  ts: number,
  now: number,
  d7: number,
  d30: number,
): void {
  bucket.total += 1;
  if (ts >= d7) bucket.last_7d += 1;
  if (ts >= d30) bucket.last_30d += 1;
}

export function summarise(): PolicyAnalyticsSummary {
  const now = Date.now();
  const d7 = now - 7 * 24 * 60 * 60 * 1000;
  const d30 = now - 30 * 24 * 60 * 60 * 1000;

  const byType: Record<string, BucketCounts> = {};
  const bySource: Record<string, BucketCounts> = {};
  const byPriority: Record<string, BucketCounts> = {};
  const bySection: Record<string, BucketCounts> = {};
  const bySourceAndSection: Record<string, BucketCounts> = {};

  // Teaser performance breakdowns
  const tpViewsBySource: Record<string, BucketCounts> = {};
  const tpClicksBySource: Record<string, BucketCounts> = {};
  const tpViewsByTier: Record<string, BucketCounts> = {};
  const tpClicksByTier: Record<string, BucketCounts> = {};
  const tpClicksByMix: Record<string, BucketCounts> = {};

  // Derived counters
  const featuredImpressions = zeroBucket();
  const featuredExpands = zeroBucket();
  const featuredViewSettings = zeroBucket();
  const moreEngagement = zeroBucket();

  for (const ev of _events) {
    // by type
    if (!byType[ev.name]) byType[ev.name] = zeroBucket();
    increment(byType[ev.name], ev.ts, now, d7, d30);

    // by source
    if (!bySource[ev.source]) bySource[ev.source] = zeroBucket();
    increment(bySource[ev.source], ev.ts, now, d7, d30);

    // by priority
    if (!byPriority[ev.priority]) byPriority[ev.priority] = zeroBucket();
    increment(byPriority[ev.priority], ev.ts, now, d7, d30);

    // by display section
    if (!bySection[ev.display_section])
      bySection[ev.display_section] = zeroBucket();
    increment(bySection[ev.display_section], ev.ts, now, d7, d30);

    // source × section cross-tab
    const ssKey = `${ev.source}::${ev.display_section}`;
    if (!bySourceAndSection[ssKey]) bySourceAndSection[ssKey] = zeroBucket();
    increment(bySourceAndSection[ssKey], ev.ts, now, d7, d30);

    // featured card analytics
    if (ev.display_section === "featured") {
      if (ev.name === "policy_recommendation_impression")
        increment(featuredImpressions, ev.ts, now, d7, d30);
      if (ev.name === "policy_recommendation_expand")
        increment(featuredExpands, ev.ts, now, d7, d30);
      if (ev.name === "policy_recommendation_view_setting")
        increment(featuredViewSettings, ev.ts, now, d7, d30);
    }

    // "more" suggestions engagement
    if (ev.display_section === "more") {
      increment(moreEngagement, ev.ts, now, d7, d30);
    }

    // teaser performance breakdowns
    if (ev.name === "policy_upgrade_teaser_view") {
      if (ev.dominant_gated_source) {
        if (!tpViewsBySource[ev.dominant_gated_source])
          tpViewsBySource[ev.dominant_gated_source] = zeroBucket();
        increment(tpViewsBySource[ev.dominant_gated_source], ev.ts, now, d7, d30);
      }
      if (ev.highest_gated_tier) {
        if (!tpViewsByTier[ev.highest_gated_tier])
          tpViewsByTier[ev.highest_gated_tier] = zeroBucket();
        increment(tpViewsByTier[ev.highest_gated_tier], ev.ts, now, d7, d30);
      }
    }

    if (ev.name === "policy_upgrade_teaser_click") {
      if (ev.dominant_gated_source) {
        if (!tpClicksBySource[ev.dominant_gated_source])
          tpClicksBySource[ev.dominant_gated_source] = zeroBucket();
        increment(tpClicksBySource[ev.dominant_gated_source], ev.ts, now, d7, d30);
      }
      if (ev.highest_gated_tier) {
        if (!tpClicksByTier[ev.highest_gated_tier])
          tpClicksByTier[ev.highest_gated_tier] = zeroBucket();
        increment(tpClicksByTier[ev.highest_gated_tier], ev.ts, now, d7, d30);
      }
      if (ev.gated_source_mix) {
        if (!tpClicksByMix[ev.gated_source_mix])
          tpClicksByMix[ev.gated_source_mix] = zeroBucket();
        increment(tpClicksByMix[ev.gated_source_mix], ev.ts, now, d7, d30);
      }
    }
  }

  // Derived rates (null if denominator is 0)
  const impressions = byType["policy_recommendation_impression"]?.total ?? 0;
  const expands = byType["policy_recommendation_expand"]?.total ?? 0;
  const viewSettings =
    byType["policy_recommendation_view_setting"]?.total ?? 0;
  const teaserViews = byType["policy_upgrade_teaser_view"]?.total ?? 0;
  const teaserClicks = byType["policy_upgrade_teaser_click"]?.total ?? 0;

  return {
    instance_started_at: new Date(_instanceStartedAt).toISOString(),
    generated_at: new Date(now).toISOString(),
    total_events: _events.length,

    by_event_type: byType,
    by_source: bySource,
    by_priority: byPriority,
    by_display_section: bySection,
    by_source_and_section: bySourceAndSection,

    teaser_performance: {
      views_by_dominant_source: tpViewsBySource,
      clicks_by_dominant_source: tpClicksBySource,
      views_by_tier: tpViewsByTier,
      clicks_by_tier: tpClicksByTier,
      clicks_by_mix: tpClicksByMix,
    },

    derived: {
      expand_rate: impressions > 0 ? expands / impressions : null,
      view_setting_click_rate:
        impressions > 0 ? viewSettings / impressions : null,
      upgrade_teaser_click_rate:
        teaserViews > 0 ? teaserClicks / teaserViews : null,
      featured_impressions: featuredImpressions,
      featured_expands: featuredExpands,
      featured_view_setting_clicks: featuredViewSettings,
      more_engagement: moreEngagement,
    },
  };
}

// ── Test helper — reset all state ───────────────────────────────────────────

export function _resetForTesting(): void {
  _events = [];
  _instanceStartedAt = Date.now();
}

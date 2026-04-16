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

  const entry: StoredEvent = {
    name,
    source: String(meta.recommendation_source ?? "unknown"),
    priority: String(meta.recommendation_priority ?? "unknown"),
    display_section: String(meta.recommendation_display_section ?? "unknown"),
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

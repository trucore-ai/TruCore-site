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
  /** Populated only for policy_upgrade_teaser_* events; "" otherwise. */
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
    gated_source_mix: isTeaserEvent
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
   * - clicks_by_mix / views_by_mix:
   *     how single / few / many gated-source mixes convert (clicks) or appear
   *     (views).  gated_source_mix is now emitted on both view and click events
   *     so view-side CTR by mix can be computed.
   */
  teaser_performance: {
    views_by_dominant_source: Record<string, BucketCounts>;
    clicks_by_dominant_source: Record<string, BucketCounts>;
    views_by_tier: Record<string, BucketCounts>;
    clicks_by_tier: Record<string, BucketCounts>;
    clicks_by_mix: Record<string, BucketCounts>;
    views_by_mix: Record<string, BucketCounts>;
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
  const tpViewsByMix: Record<string, BucketCounts> = {};

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
      if (ev.gated_source_mix) {
        if (!tpViewsByMix[ev.gated_source_mix])
          tpViewsByMix[ev.gated_source_mix] = zeroBucket();
        increment(tpViewsByMix[ev.gated_source_mix], ev.ts, now, d7, d30);
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
      views_by_mix: tpViewsByMix,
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

// ── Durable snapshot export ──────────────────────────────────────────────────

/** Bumped when the snapshot shape changes in a non-backward-compatible way. */
export const SNAPSHOT_VERSION = "1";

/** Aggregated snapshot shape written to the DB and returned via export API. */
export interface SnapshotPayload {
  captured_at: string;
  summary_version: string;
  summary: PolicyAnalyticsSummary;
}

/** Lightweight metadata describing the most recently persisted snapshot. */
export interface SnapshotMeta {
  id: string;
  captured_at: string;
  summary_version: string;
}

/**
 * Capture the current in-memory summary and persist it as an aggregated
 * snapshot in the DB.  The payload is aggregated-only and contains no raw
 * event payloads or PII.
 *
 * Returns the full snapshot payload so callers can stream/return it as JSON.
 */
export async function persistSnapshot(): Promise<SnapshotPayload> {
  const { writeAnalyticsSnapshot } = await import("@/lib/db");
  const summary = summarise();
  const payload: SnapshotPayload = {
    captured_at: summary.generated_at,
    summary_version: SNAPSHOT_VERSION,
    summary,
  };
  await writeAnalyticsSnapshot(SNAPSHOT_VERSION, payload);
  return payload;
}

/**
 * Return the most recently persisted snapshot's metadata, or null if none
 * has been written yet.  Used by the admin surface to show snapshot status.
 */
export async function getLatestSnapshotMeta(): Promise<SnapshotMeta | null> {
  const { getLatestAnalyticsSnapshot } = await import("@/lib/db");
  const row = await getLatestAnalyticsSnapshot();
  if (!row) return null;
  return {
    id: row.id,
    captured_at: row.created_at,
    summary_version: row.summary_version,
  };
}

// ── Snapshot comparison / diff ───────────────────────────────────────────────

/** The shape stored as the `snapshot` JSONB in the DB row. */
export interface SnapshotPayloadStored {
  captured_at: string;
  summary_version: string;
  summary: PolicyAnalyticsSummary;
}

/** A latest + previous snapshot pair for the comparison view. */
export interface SnapshotPair {
  latest: SnapshotPayloadStored & { row_id: string } | null;
  previous: SnapshotPayloadStored & { row_id: string } | null;
}

/** Delta for a single scalar metric. */
export interface MetricDelta {
  label: string;
  latest: number | null;
  previous: number | null;
  /** Absolute difference: latest - previous. */
  delta: number | null;
  /** Fractional change ((latest - previous) / previous). Null if previous ≤ 0 or null. */
  pct_delta: number | null;
  direction: "up" | "down" | "flat" | "new";
}

/** Per-key delta for bucket-map dimensions (source, tier, etc.). */
export interface DimensionDelta {
  key: string;
  latest: number;
  previous: number;
  delta: number;
}

/** Complete diff model between two snapshots. */
export interface SnapshotDiff {
  latest_captured_at: string;
  previous_captured_at: string;
  headline: MetricDelta[];
  by_source_top_deltas: DimensionDelta[];
  teaser_by_source_deltas: DimensionDelta[];
  teaser_by_tier_deltas: DimensionDelta[];
}

function scalarDelta(
  label: string,
  latest: number | null,
  previous: number | null,
): MetricDelta {
  if (latest === null && previous === null) {
    return { label, latest, previous, delta: null, pct_delta: null, direction: "flat" };
  }
  if (previous === null) {
    return { label, latest, previous, delta: null, pct_delta: null, direction: "new" };
  }
  const latestVal = latest ?? 0;
  const delta = latestVal - previous;
  const pct_delta = previous > 0 ? delta / previous : null;
  const direction: MetricDelta["direction"] =
    delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  return { label, latest: latestVal, previous, delta, pct_delta, direction };
}

function bucketDelta(
  label: string,
  latest: { total: number } | undefined,
  previous: { total: number } | undefined,
): MetricDelta {
  return scalarDelta(label, latest?.total ?? 0, previous?.total ?? 0);
}

function dimensionDeltas(
  latestMap: Record<string, { total: number }>,
  previousMap: Record<string, { total: number }>,
  topN = 5,
): DimensionDelta[] {
  const keys = Array.from(
    new Set([...Object.keys(latestMap), ...Object.keys(previousMap)]),
  );
  return keys
    .map((key) => ({
      key,
      latest: latestMap[key]?.total ?? 0,
      previous: previousMap[key]?.total ?? 0,
      delta: (latestMap[key]?.total ?? 0) - (previousMap[key]?.total ?? 0),
    }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, topN);
}

/**
 * Compute a compact diff between two snapshot payloads.
 * Both arguments must be non-null (caller ensures this).
 */
export function computeSnapshotDiff(
  latest: SnapshotPayloadStored,
  previous: SnapshotPayloadStored,
): SnapshotDiff {
  const ls = latest.summary;
  const ps = previous.summary;

  const headline: MetricDelta[] = [
    scalarDelta("Total Events", ls.total_events, ps.total_events),
    scalarDelta("Expand Rate", ls.derived.expand_rate, ps.derived.expand_rate),
    scalarDelta(
      "View-Setting Rate",
      ls.derived.view_setting_click_rate,
      ps.derived.view_setting_click_rate,
    ),
    scalarDelta(
      "Teaser Click Rate",
      ls.derived.upgrade_teaser_click_rate,
      ps.derived.upgrade_teaser_click_rate,
    ),
    bucketDelta(
      "Featured Impressions",
      ls.derived.featured_impressions,
      ps.derived.featured_impressions,
    ),
    bucketDelta(
      "Featured Expands",
      ls.derived.featured_expands,
      ps.derived.featured_expands,
    ),
    bucketDelta(
      "More-Section Engagement",
      ls.derived.more_engagement,
      ps.derived.more_engagement,
    ),
  ];

  return {
    latest_captured_at: latest.captured_at,
    previous_captured_at: previous.captured_at,
    headline,
    by_source_top_deltas: dimensionDeltas(ls.by_source, ps.by_source),
    teaser_by_source_deltas: dimensionDeltas(
      ls.teaser_performance.views_by_dominant_source,
      ps.teaser_performance.views_by_dominant_source,
    ),
    teaser_by_tier_deltas: dimensionDeltas(
      ls.teaser_performance.views_by_tier,
      ps.teaser_performance.views_by_tier,
    ),
  };
}

/**
 * Fetch the latest and previous persisted snapshots from the DB.
 * Returns null for either field when fewer than 2 snapshots exist.
 */
export async function getSnapshotPair(): Promise<SnapshotPair> {
  const { getLatestTwoAnalyticsSnapshots } = await import("@/lib/db");
  const rows = await getLatestTwoAnalyticsSnapshots();

  function toPayload(
    row: import("@/lib/db").AnalyticsSnapshotRow,
  ): SnapshotPayloadStored & { row_id: string } {
    const raw = row.snapshot as SnapshotPayloadStored;
    return { ...raw, row_id: row.id };
  }

  return {
    latest: rows[0] ? toPayload(rows[0]) : null,
    previous: rows[1] ? toPayload(rows[1]) : null,
  };
}

// ── Test helper — reset all state ───────────────────────────────────────────

export function _resetForTesting(): void {
  _events = [];
  _instanceStartedAt = Date.now();
}

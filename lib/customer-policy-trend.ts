/**
 * Customer-facing policy trend surface utilities.
 *
 * Pure functions for deriving directional trend signals from two
 * ReceiptSummary windows (7-day vs 30-day) and from MarketConditions.
 *
 * All comparisons are grounded in real customer data — no fabricated history,
 * no longitudinal claims beyond what the ReceiptSummary supports.
 *
 * Also provides lightweight localStorage helpers for tracking which
 * recommendation IDs were visible on the previous page load, enabling
 * "New" status badges on newly-appearing recommendations.
 */

import { compareTrend } from "@/lib/trend";
import type { ReceiptSummary, MarketConditions } from "@/lib/customer-auth";

// ---------------------------------------------------------------------------
// Trend signal model
// ---------------------------------------------------------------------------

export type TrendSignalStatus =
  | "improving"    // Moving in a favourable direction
  | "worsening"    // Moving in an unfavourable direction
  | "elevated"     // Above baseline — informational, worth noting
  | "stable"       // No material change, or neutral informational
  | "unavailable"; // Insufficient data

export interface TrendSignal {
  key: string;
  label: string;
  status: TrendSignalStatus;
  detail: string;
}

// ---------------------------------------------------------------------------
// Visual style maps
// ---------------------------------------------------------------------------

export const TREND_STATUS_DOT: Record<TrendSignalStatus, string> = {
  improving:   "bg-emerald-400",
  worsening:   "bg-red-400",
  elevated:    "bg-amber-400",
  stable:      "bg-slate-500",
  unavailable: "bg-slate-700",
};

export const TREND_STATUS_TEXT: Record<TrendSignalStatus, string> = {
  improving:   "text-emerald-400",
  worsening:   "text-red-400",
  elevated:    "text-amber-400",
  stable:      "text-slate-400",
  unavailable: "text-slate-600",
};

// ---------------------------------------------------------------------------
// Receipt trend signals — 7-day vs 30-day comparison
// ---------------------------------------------------------------------------

/**
 * Derive customer-facing directional trend signals by comparing a short window
 * (7-day) against a longer baseline (30-day).
 *
 * Returns an empty array when there is insufficient data for a grounded
 * comparison.  Never fabricates trend directions.
 *
 * Exported for direct unit testing.
 */
export function deriveReceiptTrendSignals(
  short: ReceiptSummary | null,    // 7-day window
  baseline: ReceiptSummary | null, // 30-day window
): TrendSignal[] {
  if (!short || !baseline) return [];
  // Need a meaningful number of receipts in both windows.
  if (short.total_receipts < 3 || baseline.total_receipts < 5) return [];

  const signals: TrendSignal[] = [];

  // 1. Deny rate — most relevant signal for policy health
  const shortTotal    = short.total_receipts;
  const baseTotal     = baseline.total_receipts;
  const shortDenies   = short.decisions["deny"] ?? 0;
  const baseDenies    = baseline.decisions["deny"] ?? 0;

  if (shortTotal > 0 && baseTotal > 0) {
    const shortRate = shortDenies / shortTotal;
    const baseRate  = baseDenies  / baseTotal;
    const direction = compareTrend(shortRate, baseRate, 0.15);

    if (direction !== "unavailable") {
      const shortPct = Math.round(shortRate * 100);
      const basePct  = Math.round(baseRate  * 100);

      if (direction === "decreasing") {
        signals.push({
          key:    "deny-rate",
          label:  "Policy denials",
          status: "improving",
          detail: `Down to ${shortPct}% recently (vs ${basePct}% 30-day average) — your policy is blocking less`,
        });
      } else if (direction === "increasing") {
        signals.push({
          key:    "deny-rate",
          label:  "Policy denials",
          status: "elevated",
          detail: `Up to ${shortPct}% recently (vs ${basePct}% 30-day average) — more transactions blocked`,
        });
      } else {
        signals.push({
          key:    "deny-rate",
          label:  "Policy denials",
          status: "stable",
          detail: `Stable at ~${shortPct}% — consistent with your 30-day pattern`,
        });
      }
    }
  }

  // 2. Simulation failure rate
  if (short.simulation_total > 0 && baseline.simulation_total > 0) {
    const shortFailRate = short.simulation_failures / short.simulation_total;
    const baseFailRate  = baseline.simulation_failures / baseline.simulation_total;
    const direction = compareTrend(shortFailRate, baseFailRate, 0.15);

    if (direction === "increasing") {
      signals.push({
        key:    "sim-failures",
        label:  "Simulation failures",
        status: "elevated",
        detail: `Higher recently — ${Math.round(shortFailRate * 100)}% failure rate in last 7 days`,
      });
    } else if (direction === "decreasing" && baseFailRate > 0.05) {
      // Only surface the improvement when there was a meaningful baseline rate.
      signals.push({
        key:    "sim-failures",
        label:  "Simulation failures",
        status: "improving",
        detail: `Fewer recently — down to ${Math.round(shortFailRate * 100)}% from ${Math.round(baseFailRate * 100)}% baseline`,
      });
    }
  }

  // 3. Average trade size (informational — no normative direction)
  if (
    short.avg_notional_usd   !== null &&
    baseline.avg_notional_usd !== null &&
    baseline.avg_notional_usd > 0
  ) {
    const direction = compareTrend(
      short.avg_notional_usd,
      baseline.avg_notional_usd,
      0.20, // Only surface shifts of 20%+ to avoid noise
    );

    if (direction === "increasing" || direction === "decreasing") {
      const shortStr = `$${Math.round(short.avg_notional_usd).toLocaleString()}`;
      const baseStr  = `$${Math.round(baseline.avg_notional_usd).toLocaleString()}`;
      signals.push({
        key:    "trade-size",
        label:  "Average trade size",
        status: "stable", // Neutral — not inherently good or bad
        detail: direction === "increasing"
          ? `Trending up — avg ${shortStr} recently vs ${baseStr} over 30 days`
          : `Trending down — avg ${shortStr} recently vs ${baseStr} over 30 days`,
      });
    }
  }

  return signals;
}

// ---------------------------------------------------------------------------
// Market condition cue (point-in-time, surfaces non-stable states only)
// ---------------------------------------------------------------------------

/**
 * Return a single execution-environment cue when conditions are non-stable.
 * Returns null for stable environments — not showing a cue is the intended
 * behaviour when there is nothing to flag.
 */
export function getMarketConditionCue(
  market: MarketConditions | null,
): TrendSignal | null {
  if (!market) return null;
  if (market.environment === "stable") return null;

  if (market.environment === "degraded") {
    return {
      key:    "market-conditions",
      label:  "Execution environment",
      status: "elevated",
      detail: "Currently degraded — some elevated RPC or execution conditions",
    };
  }

  if (market.environment === "stressed") {
    return {
      key:    "market-conditions",
      label:  "Execution environment",
      status: "worsening",
      detail: "Currently stressed — elevated execution risk across the network",
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Recommendation snapshot — lightweight localStorage persistence for
// "New" badge detection across page loads
// ---------------------------------------------------------------------------

const REC_SNAPSHOT_KEY = "atf_policy_rec_snapshot";

/**
 * Load the set of recommendation IDs stored from the previous page load.
 * Returns an empty Set when there is no stored snapshot or when called
 * outside a browser context.
 */
export function loadRecSnapshot(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(REC_SNAPSHOT_KEY);
    if (!raw) return new Set();
    const ids = JSON.parse(raw);
    return Array.isArray(ids) ? new Set<string>(ids) : new Set();
  } catch {
    return new Set();
  }
}

/**
 * Persist the current recommendation IDs so they can be compared on the
 * next page load to detect newly-appearing recommendations.
 */
export function saveRecSnapshot(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REC_SNAPSHOT_KEY, JSON.stringify(ids));
  } catch {
    // Storage quota or availability issue — degrade gracefully.
  }
}

// ---------------------------------------------------------------------------
// Recommendation history — lightweight per-session persistence for
// "What changed since your last review" view
// ---------------------------------------------------------------------------

/**
 * A compact record of a single recommendation from a previous page load.
 * Stores only the minimum needed to render a customer-friendly history entry.
 */
export interface RecHistoryEntry {
  id: string;
  title: string;
  source: string;
}

const REC_HISTORY_KEY = "atf_policy_rec_history";

/**
 * Load the recommendation history entries stored from the previous page load.
 * Returns an empty array when there is no stored history or when called
 * outside a browser context.
 */
export function loadRecHistoryEntry(): RecHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(REC_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is RecHistoryEntry =>
        typeof e === "object" &&
        e !== null &&
        typeof e.id === "string" &&
        typeof e.title === "string" &&
        typeof e.source === "string",
    );
  } catch {
    return [];
  }
}

/**
 * Persist the current recommendation entries (id + title + source) so the
 * history panel can show "What changed since your last review" on the next
 * page load.
 */
export function saveRecHistoryEntry(entries: RecHistoryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REC_HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // Storage quota or availability issue — degrade gracefully.
  }
}

/**
 * Classify recommendations into customer-visible change categories by
 * comparing the current recommendation set against the previous history entry.
 *
 * Returns:
 *   newEntries    — IDs present now but absent from the previous entry
 *   resolvedEntries — IDs present in the previous entry but absent now
 *
 * When prevEntries is empty (first visit or no stored history), both arrays
 * are empty — the history panel is suppressed for first-time users.
 *
 * "Still active" entries are implicitly the intersection; they are not
 * enumerated here (the recommendation cards themselves convey their presence).
 */
export function classifyRecChanges(
  currentRecs: RecHistoryEntry[],
  prevEntries: RecHistoryEntry[],
): { newEntries: RecHistoryEntry[]; resolvedEntries: RecHistoryEntry[] } {
  if (prevEntries.length === 0) {
    return { newEntries: [], resolvedEntries: [] };
  }
  const currentIds = new Set(currentRecs.map((r) => r.id));
  const prevIds = new Set(prevEntries.map((e) => e.id));
  const newEntries = currentRecs.filter((r) => !prevIds.has(r.id));
  const resolvedEntries = prevEntries.filter((e) => !currentIds.has(e.id));
  return { newEntries, resolvedEntries };
}

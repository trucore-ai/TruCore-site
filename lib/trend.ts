/* ────────────────────────────────────────────────────────────────
 *  Trend Comparison Layer - derived directional semantics
 *
 *  A small utility providing grounded trend comparison helpers
 *  for the operator dashboard.  All comparisons are derived
 *  from existing data: current vs prior intervals, time-series
 *  points, timestamps, and usage buckets.
 *
 *  If the underlying data does not support a comparison the
 *  result is explicitly "unavailable".  No fabricated precision.
 *  No external APIs.
 * ──────────────────────────────────────────────────────────── */

/* ── Directional trend states ─────────────────────────────── */

export type TrendDirection =
  | "increasing"    // Current > prior by meaningful margin
  | "decreasing"    // Current < prior by meaningful margin
  | "unchanged"     // No material difference detected
  | "newly-active"  // Was zero/absent, now present
  | "persistent"    // Active across multiple intervals
  | "unavailable";  // Insufficient data for comparison

/* ── Core comparison ──────────────────────────────────────── */

/**
 * Compare two numeric values with a dead-band threshold.
 * Returns "unavailable" if either value is negative,
 * "newly-active" if prior was 0 and current is positive.
 */
export function compareTrend(
  current: number,
  prior: number,
  /** Fractional threshold below which change is "unchanged". Default 5 %. */
  threshold = 0.05,
): TrendDirection {
  if (current < 0 || prior < 0) return "unavailable";
  if (prior === 0 && current === 0) return "unchanged";
  if (prior === 0 && current > 0) return "newly-active";
  if (current === 0 && prior > 0) return "decreasing";

  const ratio = (current - prior) / prior;
  if (Math.abs(ratio) < threshold) return "unchanged";
  return ratio > 0 ? "increasing" : "decreasing";
}

/* ── Series analysis ──────────────────────────────────────── */

/**
 * Analyze a numeric series (oldest -> newest) for overall
 * direction using simple linear regression slope.
 */
export function seriesTrend(values: number[]): TrendDirection {
  if (values.length < 3) return "unavailable";

  const n = values.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return "unchanged";

  const slope = (n * sumXY - sumX * sumY) / denom;
  const mean = sumY / n;

  if (mean === 0) {
    return values.some((v) => v > 0) ? "newly-active" : "unchanged";
  }

  // Normalize slope relative to mean for significance check
  const normalized = slope / mean;
  if (Math.abs(normalized) < 0.02) return "unchanged";
  return normalized > 0 ? "increasing" : "decreasing";
}

/* ── Pace comparison ──────────────────────────────────────── */

/**
 * Compare the current-hour run rate to the daily average pace.
 * `hoursElapsed` must be > 0.
 */
export function paceComparison(
  lastHour: number,
  today: number,
  hoursElapsed: number,
): TrendDirection {
  if (hoursElapsed <= 0) return "unavailable";
  if (today === 0 && lastHour === 0) return "unchanged";
  if (today === 0 && lastHour > 0) return "newly-active";

  const avgHourlyPace = today / hoursElapsed;
  if (avgHourlyPace === 0) {
    return lastHour > 0 ? "increasing" : "unchanged";
  }

  return compareTrend(lastHour, avgHourlyPace, 0.15);
}

/* ── Time helpers ─────────────────────────────────────────── */

/**
 * Hours elapsed since midnight, using an optional reference
 * timestamp.  Floors at 0.5 h to avoid divide-by-near-zero.
 */
export function hoursElapsedToday(referenceIso?: string): number {
  try {
    const d = referenceIso ? new Date(referenceIso) : new Date();
    const h = d.getHours() + d.getMinutes() / 60;
    return Math.max(h, 0.5);
  } catch {
    return Math.max(new Date().getHours(), 1);
  }
}

/* ── Composite trend derivation ───────────────────────────── */

/**
 * Derive directional trend summary from a LiveTrend snapshot.
 * Compares hourly request/receipt pace against the daily average.
 */
export function deriveTrendSummary(trend: {
  requests_last_hour: number;
  requests_today: number;
  enforcement_last_hour: number;
  receipts_written_last_hour: number;
  receipts_written_today: number;
}): {
  requestPace: TrendDirection;
  enforcementPresence: TrendDirection;
  receiptPace: TrendDirection;
} {
  const hours = hoursElapsedToday();

  return {
    requestPace: paceComparison(
      trend.requests_last_hour,
      trend.requests_today,
      hours,
    ),
    enforcementPresence:
      trend.enforcement_last_hour > 0
        ? "persistent"
        : "unchanged",
    receiptPace: paceComparison(
      trend.receipts_written_last_hour,
      trend.receipts_written_today,
      hours,
    ),
  };
}

/**
 * Derive a directional comparison between a 24 h bucket and
 * a 7 d bucket by comparing the 24 h value against the 7 d
 * daily average.
 */
export function deriveUsageDelta(
  value24h: number,
  value7d: number,
): TrendDirection {
  if (value7d === 0 && value24h === 0) return "unchanged";
  if (value7d === 0 && value24h > 0) return "newly-active";
  const dailyAvg7d = value7d / 7;
  return compareTrend(value24h, dailyAvg7d, 0.10);
}

/* ── Display labels ───────────────────────────────────────── */

export const trendLabel: Record<TrendDirection, string> = {
  increasing: "Increasing vs prior interval",
  decreasing: "Decreasing vs prior interval",
  unchanged: "No material change detected",
  "newly-active": "New in current interval",
  persistent: "Persistent across recent intervals",
  unavailable: "Trend unavailable",
};

/** Compact inline labels for tight spaces. */
export const trendDeltaLabel: Record<TrendDirection, string> = {
  increasing: "Up vs prior",
  decreasing: "Down vs prior",
  unchanged: "Unchanged",
  "newly-active": "New",
  persistent: "Persistent",
  unavailable: "",
};

/* ── Style hooks (match existing attention model) ─────────── */

export const trendText: Record<TrendDirection, string> = {
  increasing: "text-amber-400/70",
  decreasing: "text-emerald-400/70",
  unchanged: "text-slate-500",
  "newly-active": "text-sky-400/70",
  persistent: "text-slate-400",
  unavailable: "text-slate-600",
};

/** Minimal directional indicators. */
export const trendIndicator: Record<TrendDirection, string> = {
  increasing: "\u2191",    // ↑
  decreasing: "\u2193",    // ↓
  unchanged: "\u2013",     // –
  "newly-active": "\u2022", // •
  persistent: "\u2500",    // ─
  unavailable: "",
};

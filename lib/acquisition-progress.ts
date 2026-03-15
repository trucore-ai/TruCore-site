/* ────────────────────────────────────────────────────────────────
 *  Acquisition Progress State — lightweight funnel progress visibility
 *
 *  Derives a progress state and a "progress signal" for each
 *  acquisition lead from existing data. Deterministic, read-only.
 *
 *  Progress states (mutually exclusive, derived from current flags):
 *    - pre_activation   → no API key, no portal token
 *    - api_key_issued   → has API key, no portal token
 *    - portal_enabled   → has API key + portal token
 *
 *  Progress signals (add temporal context using signup age):
 *    - newly_signed_up      → signed up within RECENT_DAYS, pre-activation
 *    - stalled_pre_key      → signed up > STALL_DAYS ago, still no API key
 *    - stalled_pre_portal   → has API key, signed up > STALL_DAYS ago, no portal
 *    - progressing          → has at least API key (regardless of age)
 *    - activated            → has both API key and portal
 *
 *  Limitation: We do not have timestamps for when API keys or portal
 *  tokens were issued. "Progressing" means the lead *currently* has
 *  the milestone — we cannot distinguish "got key last week" from
 *  "got key months ago." If API key/portal timestamps become
 *  available in the future, these signals can be refined.
 *
 *  Operator-only. Never shown to public users.
 * ──────────────────────────────────────────────────────────── */

import type { AcquisitionRecentRow } from "@/lib/db";

/* ── Constants ────────────────────────────────────────────── */

/** Days after signup before we consider a lead "stalled" */
const STALL_DAYS = 7;

/** Days after signup while we still consider the lead "new" */
const RECENT_DAYS = 3;

/* ── Types ────────────────────────────────────────────────── */

export type ProgressState =
  | "pre_activation"
  | "api_key_issued"
  | "portal_enabled";

export type ProgressSignal =
  | "newly_signed_up"
  | "stalled_pre_key"
  | "stalled_pre_portal"
  | "progressing"
  | "activated";

export type ProgressInfo = {
  state: ProgressState;
  signal: ProgressSignal;
};

export type AcquisitionRowWithProgress = AcquisitionRecentRow & {
  progress: ProgressInfo;
};

/* ── Display config ───────────────────────────────────────── */

export const PROGRESS_STATE_CONFIG: Record<
  ProgressState,
  { label: string; color: string; icon: string }
> = {
  pre_activation: {
    label: "Pre-activation",
    color: "bg-red-500/15 text-red-400",
    icon: "○",
  },
  api_key_issued: {
    label: "API key issued",
    color: "bg-amber-500/15 text-amber-300",
    icon: "◐",
  },
  portal_enabled: {
    label: "Portal enabled",
    color: "bg-emerald-500/15 text-emerald-300",
    icon: "●",
  },
};

export const PROGRESS_SIGNAL_CONFIG: Record<
  ProgressSignal,
  { label: string; color: string; shortLabel: string }
> = {
  newly_signed_up: {
    label: "Newly signed up",
    color: "bg-sky-500/15 text-sky-300",
    shortLabel: "New",
  },
  stalled_pre_key: {
    label: "Stalled before API key",
    color: "bg-red-500/15 text-red-400",
    shortLabel: "Stalled (no key)",
  },
  stalled_pre_portal: {
    label: "Stalled before portal",
    color: "bg-amber-500/15 text-amber-300",
    shortLabel: "Stalled (no portal)",
  },
  progressing: {
    label: "Progressing",
    color: "bg-blue-500/15 text-blue-300",
    shortLabel: "Progressing",
  },
  activated: {
    label: "Fully activated",
    color: "bg-emerald-500/15 text-emerald-300",
    shortLabel: "Activated",
  },
};

/* ── Derivation ───────────────────────────────────────────── */

function daysSinceSignup(createdAt: string, now: Date): number {
  const created = new Date(createdAt);
  return (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * Derive progress state from current activation flags.
 * Deterministic — same flags always produce same state.
 */
export function deriveProgressState(row: AcquisitionRecentRow): ProgressState {
  if (row.has_api_key && row.has_portal_token) return "portal_enabled";
  if (row.has_api_key) return "api_key_issued";
  return "pre_activation";
}

/**
 * Derive progress signal using signup age and current activation state.
 * Deterministic given a fixed reference time.
 */
export function deriveProgressSignal(
  row: AcquisitionRecentRow,
  now: Date = new Date(),
): ProgressSignal {
  const age = daysSinceSignup(row.created_at, now);

  // Fully activated — best state
  if (row.has_api_key && row.has_portal_token) return "activated";

  // Has API key but no portal — check if stalled
  if (row.has_api_key && !row.has_portal_token) {
    return age > STALL_DAYS ? "stalled_pre_portal" : "progressing";
  }

  // No API key — check age
  if (age <= RECENT_DAYS) return "newly_signed_up";
  if (age > STALL_DAYS) return "stalled_pre_key";

  // Between RECENT_DAYS and STALL_DAYS with no key
  return "newly_signed_up";
}

/**
 * Derive combined progress info for a single row.
 */
export function deriveProgress(
  row: AcquisitionRecentRow,
  now: Date = new Date(),
): ProgressInfo {
  return {
    state: deriveProgressState(row),
    signal: deriveProgressSignal(row, now),
  };
}

/* ── Batch enrichment ─────────────────────────────────────── */

/**
 * Enrich an array of acquisition rows with progress info.
 */
export function enrichWithProgress(
  rows: AcquisitionRecentRow[],
  now: Date = new Date(),
): AcquisitionRowWithProgress[] {
  return rows.map((row) => ({
    ...row,
    progress: deriveProgress(row, now),
  }));
}

/* ── Summary aggregation ──────────────────────────────────── */

export type ProgressStateSummary = {
  state: ProgressState;
  label: string;
  count: number;
  color: string;
  icon: string;
};

export type ProgressSignalSummary = {
  signal: ProgressSignal;
  label: string;
  shortLabel: string;
  count: number;
  color: string;
};

/**
 * Compute grouped counts by progress state.
 */
export function computeProgressStateSummary(
  rows: AcquisitionRowWithProgress[],
): ProgressStateSummary[] {
  const order: ProgressState[] = [
    "pre_activation",
    "api_key_issued",
    "portal_enabled",
  ];
  const counts = new Map<ProgressState, number>();
  for (const row of rows) {
    counts.set(row.progress.state, (counts.get(row.progress.state) ?? 0) + 1);
  }
  return order
    .filter((s) => counts.has(s))
    .map((state) => ({
      state,
      label: PROGRESS_STATE_CONFIG[state].label,
      count: counts.get(state)!,
      color: PROGRESS_STATE_CONFIG[state].color,
      icon: PROGRESS_STATE_CONFIG[state].icon,
    }));
}

/**
 * Compute grouped counts by progress signal.
 */
export function computeProgressSignalSummary(
  rows: AcquisitionRowWithProgress[],
): ProgressSignalSummary[] {
  const order: ProgressSignal[] = [
    "stalled_pre_key",
    "stalled_pre_portal",
    "newly_signed_up",
    "progressing",
    "activated",
  ];
  const counts = new Map<ProgressSignal, number>();
  for (const row of rows) {
    counts.set(
      row.progress.signal,
      (counts.get(row.progress.signal) ?? 0) + 1,
    );
  }
  return order
    .filter((s) => counts.has(s))
    .map((signal) => ({
      signal,
      label: PROGRESS_SIGNAL_CONFIG[signal].label,
      shortLabel: PROGRESS_SIGNAL_CONFIG[signal].shortLabel,
      count: counts.get(signal)!,
      color: PROGRESS_SIGNAL_CONFIG[signal].color,
    }));
}

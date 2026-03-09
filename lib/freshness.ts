/* ────────────────────────────────────────────────────────────────
 *  Freshness & Provenance - shared signal metadata utilities
 *
 *  A small, UI-only layer for classifying signal freshness and
 *  provenance across the operator dashboard. Used for trust
 *  metadata cues that help operators understand how current each
 *  signal is and what type of signal they are looking at.
 *
 *  Freshness states:
 *    fresh       - updated within the last polling cycle
 *    delayed     - updated recently but not within expected cadence
 *    stale       - no update in multiple cycles
 *    unavailable - no data received
 *
 *  Provenance states:
 *    direct          - reported directly by the active service
 *    derived         - computed from counters or service state
 *    capability-gated - requires configuration not present
 *    not-emitted     - endpoint exists but is not returning data
 *
 *  No external APIs. No fabricated precision.
 * ──────────────────────────────────────────────────────────── */

/* ── Freshness classification ─────────────────────────────── */

export type SignalFreshness = "fresh" | "delayed" | "stale" | "unavailable";

/** Classify freshness from age in seconds. */
export function classifyFreshness(ageSeconds: number): SignalFreshness {
  if (ageSeconds < 10) return "fresh";
  if (ageSeconds < 30) return "delayed";
  if (ageSeconds < 120) return "stale";
  return "unavailable";
}

/** Human-readable relative time from seconds elapsed. */
export function formatSecondsAgo(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

/* ── Freshness style hooks ────────────────────────────────── */

/** Subdued text color per freshness state. */
export const freshnessText: Record<SignalFreshness, string> = {
  fresh: "text-emerald-500/60",
  delayed: "text-amber-500/50",
  stale: "text-slate-600",
  unavailable: "text-slate-700",
};

/* ── Provenance classification ────────────────────────────── */

export type SignalProvenance =
  | "direct"
  | "derived"
  | "capability-gated"
  | "not-emitted";

/** Brief provenance labels for section metadata. */
export const provenanceLabel: Record<SignalProvenance, string> = {
  direct: "Direct system status",
  derived: "Derived assessment",
  "capability-gated": "Capability not configured in current environment",
  "not-emitted": "Signal not emitted by current deployment",
};

/** Longer provenance descriptions for contextual help. */
export const provenanceDescription: Record<SignalProvenance, string> = {
  direct: "Reported directly by the active service instance",
  derived: "Computed from current interval counters and service state",
  "capability-gated":
    "Requires deployment configuration not present in current environment",
  "not-emitted":
    "Endpoint exists but is not returning data in this deployment",
};

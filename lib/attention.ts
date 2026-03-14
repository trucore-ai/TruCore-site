/* ────────────────────────────────────────────────────────────────
 *  Attention Model - shared semantic priority system
 *
 *  A small, UI-only priority/recency model used across the
 *  operator dashboard. Provides consistent classification of
 *  severity, freshness, and actionability so every component
 *  speaks the same visual and semantic language.
 *
 *  All signals are derived from existing grounded data:
 *  timestamps, counts, status fields, and deterministic rules.
 *  No external APIs. No fabricated metrics.
 * ──────────────────────────────────────────────────────────── */

/* ── Priority levels ──────────────────────────────────────── */

export type AttentionLevel =
  | "normal"        // Healthy, no action needed
  | "informational" // Ambient context, safely ignorable
  | "attention"     // Warrants review, non-blocking
  | "critical";     // Needs operator action now

/* ── Recency classification ───────────────────────────────── */

export type RecencyState =
  | "current"  // Updated within the last few minutes
  | "recent"   // Changed within the current interval
  | "stale"    // No change in current interval
  | "idle";    // No activity detected

/* ── Panel-level status labels ────────────────────────────── */

export type PanelStatus =
  | "stable"
  | "review"
  | "idle"
  | "reduced"
  | "degraded"
  | "offline";

/* ── Attention signal (per-item) ──────────────────────────── */

export type AttentionSignal = {
  level: AttentionLevel;
  recency: RecencyState;
  reason: string;
  action?: string;
};

/* ── Style maps ───────────────────────────────────────────── */

export const attentionDot: Record<AttentionLevel, string> = {
  normal: "bg-emerald-400",
  informational: "bg-slate-500",
  attention: "bg-amber-400",
  critical: "bg-red-400",
};

export const attentionText: Record<AttentionLevel, string> = {
  normal: "text-slate-300",
  informational: "text-slate-400",
  attention: "text-amber-200/80",
  critical: "text-red-200/80",
};

export const attentionBorder: Record<AttentionLevel, string> = {
  normal: "border-emerald-500/10",
  informational: "border-slate-500/10",
  attention: "border-amber-500/15",
  critical: "border-red-500/15",
};

export const panelStatusBadge: Record<
  PanelStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  stable: {
    label: "Stable",
    bg: "bg-emerald-500/8",
    text: "text-emerald-400/80",
    border: "border-emerald-500/15",
  },
  review: {
    label: "Review",
    bg: "bg-amber-500/8",
    text: "text-amber-400/80",
    border: "border-amber-500/15",
  },
  idle: {
    label: "Idle",
    bg: "bg-slate-500/8",
    text: "text-slate-500",
    border: "border-slate-500/15",
  },
  reduced: {
    label: "Reduced",
    bg: "bg-amber-500/8",
    text: "text-amber-400/70",
    border: "border-amber-500/12",
  },
  degraded: {
    label: "Degraded",
    bg: "bg-red-500/8",
    text: "text-red-400/80",
    border: "border-red-500/15",
  },
  offline: {
    label: "Offline",
    bg: "bg-red-500/8",
    text: "text-red-400/70",
    border: "border-red-500/12",
  },
};

/* ── Utility: classify recency from ISO timestamp ─────────── */

export function classifyRecency(iso: string | null): RecencyState {
  if (!iso) return "idle";
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = diffMs / 60_000;
    if (mins < 5) return "current";
    if (mins < 60) return "recent";
    if (mins < 1440) return "stale"; // >1h but <24h
    return "idle";
  } catch {
    return "idle";
  }
}

/* ── Utility: human-readable recency label ────────────────── */

export function recencyLabel(iso: string | null): string {
  if (!iso) return "No recent activity";
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 1) return "Updated just now";
    if (mins < 60) return `Updated ${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Updated ${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `Last activity ${days}d ago`;
  } catch {
    return "Timestamp unavailable";
  }
}

/* ── Utility: classify enforcement intensity ──────────────── */

export type EnforcementIntensity =
  | "idle"       // Zero events
  | "background" // Low, ambient noise
  | "elevated"   // Notable, warrants review
  | "concentrated"; // Dominant single category or high volume

export function classifyEnforcementIntensity(
  total: number,
  activeCategories: number,
): EnforcementIntensity {
  if (total === 0) return "idle";
  if (total <= 10) return "background";
  if (total <= 100 || activeCategories <= 1) return "elevated";
  return "concentrated";
}

export const intensityLabel: Record<EnforcementIntensity, string> = {
  idle: "No enforcement activity",
  background: "Background-level activity",
  elevated: "Elevated enforcement activity",
  concentrated: "Concentrated enforcement activity",
};

/* ── Utility: tenant attention reason ─────────────────────── */

export function deriveTenantAttentionReason(tenant: {
  status: string;
  enforcements_24h: number;
  requests_24h: number;
  last_seen: string | null;
}): AttentionSignal | null {
  if (tenant.status === "suspended") {
    return {
      level: "critical",
      recency: classifyRecency(tenant.last_seen),
      reason: "Suspended",
      action: "Review suspension cause",
    };
  }

  if (tenant.enforcements_24h > 50) {
    return {
      level: "attention",
      recency: classifyRecency(tenant.last_seen),
      reason: "High enforcement volume",
      action: "Review policy pressure",
    };
  }

  if (tenant.enforcements_24h > 0) {
    return {
      level: "informational",
      recency: classifyRecency(tenant.last_seen),
      reason: "Recent enforcement events",
    };
  }

  if (tenant.status === "inactive") {
    return {
      level: "informational",
      recency: "idle",
      reason: "Inactive",
    };
  }

  if (tenant.requests_24h === 0 && tenant.last_seen === null) {
    return {
      level: "informational",
      recency: "idle",
      reason: "No activity recorded",
    };
  }

  return null;
}

/* ── Utility: derive panel status ─────────────────────────── */

export function deriveHealthPanelStatus(
  status: string,
  warnCount: number,
  failCount: number,
): PanelStatus {
  if (status === "down") return "offline";
  if (failCount > 0) return "degraded";
  if (status === "degraded") return "reduced";
  if (warnCount > 0) return "review";
  return "stable";
}

export function deriveEnforcementPanelStatus(
  total: number,
  authFailurePct: number,
): PanelStatus {
  if (total === 0) return "idle";
  if (authFailurePct >= 0.5 && total > 50) return "review";
  if (total > 100) return "review";
  return "stable";
}

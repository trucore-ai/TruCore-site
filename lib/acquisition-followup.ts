/* ────────────────────────────────────────────────────────────────
 *  Acquisition Follow-Up Guidance — deterministic operator triage
 *
 *  Derives a recommended next action for each waitlist/acquisition
 *  lead based on their current funnel state. Rule-based, no ML,
 *  no freeform AI summaries. Operator-only.
 *
 *  Signals used (all from AcquisitionRecentRow):
 *    - has_api_key          → whether the lead has an issued API key
 *    - has_portal_token     → whether the lead has an active portal token
 *    - build_stage          → self-reported: idea | prototype | in_production
 *    - intent               → design_partner | standard
 *    - integrations_interest → self-reported integrations list
 *    - tx_volume_bucket     → self-reported volume intent
 *    - status               → pipeline status: new | contacted | qualified | closed
 *    - created_at           → signup timestamp (for recentness)
 *
 *  Follow-up action rules (evaluated in priority order):
 *
 *  1. Already activated (has API key + portal): "Monitor"
 *  2. Has API key + no portal: "Send portal access / onboarding link help"
 *  3. In-production + no API key + design_partner intent: "Offer direct integration support"
 *  4. In-production + no API key: "Send API key onboarding help"
 *  5. Prototype + no API key + design_partner intent: "Send API key onboarding help"
 *  6. Prototype + no API key: "Send builder docs + API key help"
 *  7. Idea-stage + no API key: "Send builder docs only"
 *  8. Pipeline status = closed: "No action — closed"
 *  9. Default (unknown stage, no API key): "Send builder docs"
 *
 *  Priority levels:
 *    - urgent   → in-production builders stalled before API key
 *    - high     → design partners or prototype builders without key/portal
 *    - medium   → standard leads without key, recent signup
 *    - low      → idea-stage, already activated, or closed
 * ──────────────────────────────────────────────────────────── */

import type { AcquisitionRecentRow } from "@/lib/db";

/* ── Types ────────────────────────────────────────────────── */

export type FollowUpAction =
  | "monitor"
  | "send_portal_help"
  | "prompt_first_trade"
  | "offer_integration_support"
  | "send_api_key_help"
  | "send_docs_and_key_help"
  | "send_builder_docs"
  | "no_action_closed";

export type FollowUpPriority = "urgent" | "high" | "medium" | "low";

export type FollowUpGuidance = {
  action: FollowUpAction;
  priority: FollowUpPriority;
  label: string;
  reason: string;
};

export type AcquisitionRowWithGuidance = AcquisitionRecentRow & {
  guidance: FollowUpGuidance;
};

/* ── Action display config ────────────────────────────────── */

export const ACTION_CONFIG: Record<
  FollowUpAction,
  { label: string; color: string; icon: string }
> = {
  monitor: {
    label: "Monitor",
    color: "bg-emerald-500/20 text-emerald-300",
    icon: "👁",
  },
  send_portal_help: {
    label: "Send portal access help",
    color: "bg-cyan-500/20 text-cyan-300",
    icon: "🔗",
  },
  prompt_first_trade: {
    label: "Prompt first protected trade",
    color: "bg-violet-500/20 text-violet-300",
    icon: "🚀",
  },
  offer_integration_support: {
    label: "Offer integration support",
    color: "bg-amber-500/20 text-amber-300",
    icon: "🤝",
  },
  send_api_key_help: {
    label: "Send API key onboarding help",
    color: "bg-blue-500/20 text-blue-300",
    icon: "🔑",
  },
  send_docs_and_key_help: {
    label: "Send docs + API key help",
    color: "bg-sky-500/20 text-sky-300",
    icon: "📄",
  },
  send_builder_docs: {
    label: "Send builder docs only",
    color: "bg-slate-500/20 text-slate-400",
    icon: "📚",
  },
  no_action_closed: {
    label: "No action — closed",
    color: "bg-neutral-500/20 text-neutral-500",
    icon: "—",
  },
};

export const PRIORITY_CONFIG: Record<
  FollowUpPriority,
  { label: string; color: string; dot: string }
> = {
  urgent: {
    label: "Urgent",
    color: "text-red-400",
    dot: "bg-red-400",
  },
  high: {
    label: "High",
    color: "text-amber-400",
    dot: "bg-amber-400",
  },
  medium: {
    label: "Medium",
    color: "text-sky-400",
    dot: "bg-sky-400",
  },
  low: {
    label: "Low",
    color: "text-slate-500",
    dot: "bg-slate-500",
  },
};

/* ── Core follow-up derivation ────────────────────────────── */

/**
 * Derive follow-up guidance for a single acquisition lead.
 * Deterministic — same inputs always produce same output.
 */
export function deriveFollowUp(row: AcquisitionRecentRow): FollowUpGuidance {
  const stage = row.build_stage ?? "unknown";
  const isDP = row.intent === "design_partner";
  const hasKey = row.has_api_key;
  const hasPortal = row.has_portal_token;

  // 1. Pipeline closed — no action
  if (row.status === "closed") {
    return {
      action: "no_action_closed",
      priority: "low",
      label: ACTION_CONFIG.no_action_closed.label,
      reason: "Pipeline closed",
    };
  }

  // 2. Already fully activated (key + portal) → monitor
  if (hasKey && hasPortal) {
    return {
      action: "monitor",
      priority: "low",
      label: ACTION_CONFIG.monitor.label,
      reason: "Has API key and portal access — progressing",
    };
  }

  // 3. Has API key but no portal → send portal help
  if (hasKey && !hasPortal) {
    return {
      action: "send_portal_help",
      priority: "high",
      label: ACTION_CONFIG.send_portal_help.label,
      reason: "Has API key but not portal-active — help with portal onboarding",
    };
  }

  // Below: no API key yet

  // 4. In-production builder + design partner → offer direct support (urgent)
  if (stage === "in_production" && isDP) {
    return {
      action: "offer_integration_support",
      priority: "urgent",
      label: ACTION_CONFIG.offer_integration_support.label,
      reason: "In-production design partner without API key — high-value lead",
    };
  }

  // 5. In-production builder (standard) → send API key help (urgent)
  if (stage === "in_production") {
    return {
      action: "send_api_key_help",
      priority: "urgent",
      label: ACTION_CONFIG.send_api_key_help.label,
      reason: "In-production builder without API key — ready to activate",
    };
  }

  // 6. Prototype + design partner → API key help (high)
  if (stage === "prototype" && isDP) {
    return {
      action: "send_api_key_help",
      priority: "high",
      label: ACTION_CONFIG.send_api_key_help.label,
      reason: "Prototype-stage design partner — help get API key",
    };
  }

  // 7. Prototype (standard) → docs + key help (medium)
  if (stage === "prototype") {
    return {
      action: "send_docs_and_key_help",
      priority: "medium",
      label: ACTION_CONFIG.send_docs_and_key_help.label,
      reason: "Prototype-stage builder — send docs and API key onboarding",
    };
  }

  // 8. Idea-stage → builder docs only (low)
  if (stage === "idea") {
    return {
      action: "send_builder_docs",
      priority: isDP ? "medium" : "low",
      label: ACTION_CONFIG.send_builder_docs.label,
      reason: isDP
        ? "Idea-stage design partner — send builder docs, revisit later"
        : "Idea-stage builder — send docs, check back later",
    };
  }

  // 9. Default (unknown stage, no API key) → builder docs (medium)
  return {
    action: isDP ? "send_api_key_help" : "send_builder_docs",
    priority: isDP ? "high" : "medium",
    label: isDP
      ? ACTION_CONFIG.send_api_key_help.label
      : ACTION_CONFIG.send_builder_docs.label,
    reason: isDP
      ? "Design partner with unknown build stage — prioritize key onboarding"
      : "Unknown build stage, no API key — send builder docs",
  };
}

/* ── Batch derivation ─────────────────────────────────────── */

/**
 * Enrich an array of acquisition rows with follow-up guidance.
 * Returns rows sorted by priority (urgent → high → medium → low).
 */
export function enrichWithGuidance(
  rows: AcquisitionRecentRow[],
): AcquisitionRowWithGuidance[] {
  const priorityOrder: Record<FollowUpPriority, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return rows
    .map((row) => ({
      ...row,
      guidance: deriveFollowUp(row),
    }))
    .sort(
      (a, b) =>
        priorityOrder[a.guidance.priority] -
        priorityOrder[b.guidance.priority],
    );
}

/* ── Summary aggregation ──────────────────────────────────── */

export type FollowUpSummary = {
  action: FollowUpAction;
  label: string;
  count: number;
  color: string;
};

export type PrioritySummary = {
  priority: FollowUpPriority;
  label: string;
  count: number;
  color: string;
};

/**
 * Compute grouped counts by recommended action.
 * Useful for summary chips on the dashboard strip.
 */
export function computeActionSummary(
  rows: AcquisitionRowWithGuidance[],
): FollowUpSummary[] {
  const counts = new Map<FollowUpAction, number>();
  for (const row of rows) {
    counts.set(row.guidance.action, (counts.get(row.guidance.action) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([action, count]) => ({
      action,
      label: ACTION_CONFIG[action].label,
      count,
      color: ACTION_CONFIG[action].color,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Compute grouped counts by priority level.
 */
export function computePrioritySummary(
  rows: AcquisitionRowWithGuidance[],
): PrioritySummary[] {
  const priorityOrder: FollowUpPriority[] = ["urgent", "high", "medium", "low"];
  const counts = new Map<FollowUpPriority, number>();
  for (const row of rows) {
    counts.set(
      row.guidance.priority,
      (counts.get(row.guidance.priority) ?? 0) + 1,
    );
  }

  return priorityOrder
    .filter((p) => counts.has(p))
    .map((priority) => ({
      priority,
      label: PRIORITY_CONFIG[priority].label,
      count: counts.get(priority)!,
      color: PRIORITY_CONFIG[priority].dot,
    }));
}

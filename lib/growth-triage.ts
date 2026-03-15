/* ────────────────────────────────────────────────────────────────
 *  Growth Triage — operator-only deterministic prioritization
 *
 *  Derives triage segments and follow-up priority from existing
 *  adoption data (TenantActivationSnapshot). Rule-based, no ML,
 *  no external dependencies.
 *
 *  All derivation uses grounded fields already present in the
 *  /dashboard/adoption response: activation_stage, stalled_stage,
 *  dormant_days, repeat_active_7d, dominant_source, protect_count,
 *  receipt_count, verify_count, last_seen_at.
 *
 *  Operator-only. Never shown to tenant users.
 * ──────────────────────────────────────────────────────────── */

import type { TenantActivationSnapshot, AdoptionFunnel } from "@/lib/dashboard-client";

/* ── Triage segments ──────────────────────────────────────── */

export type TriageSegment =
  | "newly_onboarded"
  | "activated_unverified"
  | "verified_low_repeat"
  | "repeat_active"
  | "stalled_after_protect"
  | "stalled_after_receipt"
  | "dormant_after_activation"
  | "source_unknown_active";

export type FollowUpPriority = "high" | "medium" | "low";

export type TriageResult = {
  segment: TriageSegment;
  priority: FollowUpPriority;
  reason: string;
};

export type TriagedTenant = TenantActivationSnapshot & {
  triage: TriageResult;
};

/* ── Segment labels + colors ──────────────────────────────── */

export const SEGMENT_CONFIG: Record<
  TriageSegment,
  { label: string; color: string; description: string }
> = {
  newly_onboarded: {
    label: "Newly Onboarded",
    color: "bg-slate-500/20 text-slate-400",
    description: "Recently provisioned, no protect yet",
  },
  activated_unverified: {
    label: "Activated, Unverified",
    color: "bg-blue-500/20 text-blue-400",
    description: "Has protect/receipt but no verify",
  },
  verified_low_repeat: {
    label: "Verified, Low Repeat",
    color: "bg-emerald-500/20 text-emerald-400",
    description: "Verified at least once but not repeat-active",
  },
  repeat_active: {
    label: "Repeat Active",
    color: "bg-amber-500/20 text-amber-300",
    description: "Active, verified, ongoing usage",
  },
  stalled_after_protect: {
    label: "Stalled after Protect",
    color: "bg-red-500/20 text-red-400",
    description: "Got protect but no receipt, inactive ≥7d",
  },
  stalled_after_receipt: {
    label: "Stalled after Receipt",
    color: "bg-orange-500/20 text-orange-400",
    description: "Got receipt but no verify, inactive ≥7d",
  },
  dormant_after_activation: {
    label: "Dormant",
    color: "bg-rose-500/20 text-rose-400",
    description: "Past onboarded but inactive ≥14d",
  },
  source_unknown_active: {
    label: "Unknown Source, Active",
    color: "bg-purple-500/20 text-purple-400",
    description: "Active but integration source unidentified",
  },
};

export const PRIORITY_CONFIG: Record<
  FollowUpPriority,
  { label: string; color: string; dot: string }
> = {
  high: {
    label: "High",
    color: "text-red-400",
    dot: "bg-red-400",
  },
  medium: {
    label: "Medium",
    color: "text-amber-400",
    dot: "bg-amber-400",
  },
  low: {
    label: "Low",
    color: "text-emerald-400",
    dot: "bg-emerald-400",
  },
};

/* ── Core triage logic ────────────────────────────────────── */

/**
 * Derive triage segment and follow-up priority for a single tenant.
 *
 * Rules (evaluated in priority order):
 *
 * HIGH PRIORITY:
 *  1. stalled_stage present → stalled_after_protect or stalled_after_receipt
 *  2. protect_count > 0 and receipt_count = 0 (recent activity) → activated_unverified
 *  3. receipt_count > 0 and verify_count = 0 → activated_unverified
 *  4. dominant_source = "unknown" and protect_count > 0 → source_unknown_active
 *  5. dormant_days ≥ 14 and activation past onboarded → dormant_after_activation
 *
 * MEDIUM PRIORITY:
 *  6. onboarded but no protect → newly_onboarded
 *  7. verify_count > 0 but not repeat_active_7d → verified_low_repeat
 *
 * LOW PRIORITY:
 *  8. repeat_active_7d and verify_count > 0 → repeat_active
 *  9. Everything else → newly_onboarded (low)
 */
export function triageTenant(snap: TenantActivationSnapshot): TriageResult {
  const stage = snap.activation_stage ?? "onboarded";
  const stalled = snap.stalled_stage ?? "";
  const dormant = snap.dormant_days ?? 0;
  const repeatActive = snap.repeat_active_7d ?? false;
  const source = snap.dominant_source ?? "unknown";
  const protects = snap.protect_count ?? snap.requests_total;
  const receipts = snap.receipt_count ?? snap.receipts_written_total;
  const verifies = snap.verify_count ?? snap.receipts_verified_total;

  // 1. Stalled tenants — high priority
  if (stalled === "first_protect") {
    return {
      segment: "stalled_after_protect",
      priority: "high",
      reason: `Stalled at protect for ${dormant}d — no receipt generated`,
    };
  }
  if (stalled === "first_receipt") {
    return {
      segment: "stalled_after_receipt",
      priority: "high",
      reason: `Stalled at receipt for ${dormant}d — no verify completed`,
    };
  }
  if (stalled && stalled.length > 0) {
    return {
      segment: "stalled_after_protect",
      priority: "high",
      reason: `Stalled at ${stalled} for ${dormant}d`,
    };
  }

  // 2. Dormant after meaningful activation — high priority
  if (dormant >= 14 && stage !== "onboarded") {
    return {
      segment: "dormant_after_activation",
      priority: "high",
      reason: `Dormant ${dormant}d after reaching ${stage}`,
    };
  }

  // 3. Has protect but no receipt — high priority
  if (protects > 0 && receipts === 0) {
    return {
      segment: "activated_unverified",
      priority: "high",
      reason: "Protected but no receipt — integration may be incomplete",
    };
  }

  // 4. Has receipt but no verify — high priority
  if (receipts > 0 && verifies === 0) {
    return {
      segment: "activated_unverified",
      priority: "high",
      reason: "Receipt issued but no verify — verification not integrated",
    };
  }

  // 5. Unknown source but active — high priority
  if (source === "unknown" && protects > 0) {
    return {
      segment: "source_unknown_active",
      priority: "high",
      reason: "Active tenant with unknown integration source",
    };
  }

  // 6. Onboarded but no protect — medium priority
  if (stage === "onboarded" && protects === 0) {
    return {
      segment: "newly_onboarded",
      priority: "medium",
      reason: "Onboarded but has not sent first protect request",
    };
  }

  // 7. Verified but not repeat-active — medium priority
  if (verifies > 0 && !repeatActive) {
    return {
      segment: "verified_low_repeat",
      priority: "medium",
      reason: "Verified at least once but not showing repeat usage",
    };
  }

  // 8. Repeat active — low priority (healthy)
  if (repeatActive && verifies > 0) {
    return {
      segment: "repeat_active",
      priority: "low",
      reason: "Active, verified, ongoing usage — healthy adoption",
    };
  }

  // 9. Fallback
  return {
    segment: "newly_onboarded",
    priority: "low",
    reason: "Recently provisioned",
  };
}

/* ── Batch triage ─────────────────────────────────────────── */

const PRIORITY_ORDER: Record<FollowUpPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/**
 * Triage all tenant snapshots and return sorted by priority
 * (high first), then by last_seen descending within each tier.
 */
export function triageAllTenants(
  snapshots: TenantActivationSnapshot[],
): TriagedTenant[] {
  return snapshots
    .map((snap) => ({ ...snap, triage: triageTenant(snap) }))
    .sort((a, b) => {
      const pDiff =
        PRIORITY_ORDER[a.triage.priority] -
        PRIORITY_ORDER[b.triage.priority];
      if (pDiff !== 0) return pDiff;
      const aTime = a.last_seen_at ?? a.last_activity_ts ?? "";
      const bTime = b.last_seen_at ?? b.last_activity_ts ?? "";
      return bTime.localeCompare(aTime);
    });
}

/* ── Source conversion rollups ─────────────────────────────── */

export type SourceRollup = {
  source: string;
  tenantCount: number;
  protectCount: number;
  receiptCount: number;
  verifyCount: number;
  stalledCount: number;
  repeatActiveCount: number;
};

/**
 * Compute source-based conversion rollups from tenant snapshots.
 * Groups by dominant_source and aggregates activation counts.
 */
export function computeSourceRollups(
  snapshots: TenantActivationSnapshot[],
): SourceRollup[] {
  const map = new Map<string, SourceRollup>();

  for (const snap of snapshots) {
    const src = snap.dominant_source ?? "unknown";
    let entry = map.get(src);
    if (!entry) {
      entry = {
        source: src,
        tenantCount: 0,
        protectCount: 0,
        receiptCount: 0,
        verifyCount: 0,
        stalledCount: 0,
        repeatActiveCount: 0,
      };
      map.set(src, entry);
    }
    entry.tenantCount++;
    entry.protectCount += snap.protect_count ?? snap.requests_total;
    entry.receiptCount += snap.receipt_count ?? snap.receipts_written_total;
    entry.verifyCount += snap.verify_count ?? snap.receipts_verified_total;
    if (snap.stalled_stage && snap.stalled_stage.length > 0) {
      entry.stalledCount++;
    }
    if (snap.repeat_active_7d) {
      entry.repeatActiveCount++;
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => b.tenantCount - a.tenantCount,
  );
}

/* ── Segment summary ──────────────────────────────────────── */

export type SegmentSummary = {
  segment: TriageSegment;
  count: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
};

/**
 * Compute segment distribution from triaged tenants.
 */
export function computeSegmentSummary(
  triaged: TriagedTenant[],
): SegmentSummary[] {
  const map = new Map<TriageSegment, SegmentSummary>();

  for (const t of triaged) {
    let entry = map.get(t.triage.segment);
    if (!entry) {
      entry = {
        segment: t.triage.segment,
        count: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
      };
      map.set(t.triage.segment, entry);
    }
    entry.count++;
    if (t.triage.priority === "high") entry.highCount++;
    else if (t.triage.priority === "medium") entry.mediumCount++;
    else entry.lowCount++;
  }

  return Array.from(map.values()).sort((a, b) => {
    // Sort by high count desc, then total count desc
    if (a.highCount !== b.highCount) return b.highCount - a.highCount;
    return b.count - a.count;
  });
}

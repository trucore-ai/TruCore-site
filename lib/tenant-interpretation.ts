/* ────────────────────────────────────────────────────────────────
 *  Tenant Interpretation — deterministic operator growth guidance
 *
 *  Derives likely next milestone, likely friction point, and
 *  prioritization rationale from existing adoption snapshot fields.
 *
 *  All rules are deterministic: no ML, no LLM, no external calls.
 *  Inputs are grounded fields from TenantActivationSnapshot.
 *
 *  Operator-only. Never surfaced to tenant users.
 *
 *  Rule documentation:
 *    likely_next_milestone — what this tenant should achieve next
 *    likely_friction_point — where they are probably stuck
 *    why_prioritized       — why this tenant has its priority level
 * ──────────────────────────────────────────────────────────── */

import type { TenantActivationSnapshot } from "@/lib/dashboard-client";
import type { TriageResult } from "@/lib/growth-triage";
import { triageTenant } from "@/lib/growth-triage";

/* ── Types ────────────────────────────────────────────────── */

export type TenantInterpretation = {
  likely_next_milestone: string;
  likely_friction_point: string;
  why_prioritized: string;
  likely_current_state: string;
  activation_progress: ActivationProgress;
};

export type ActivationProgress = {
  onboarded: boolean;
  first_protect: boolean;
  first_receipt: boolean;
  first_verify: boolean;
  repeat_active: boolean;
  current_stage: string;
};

/* ── Activation progress ──────────────────────────────────── */

export function deriveActivationProgress(
  snap: TenantActivationSnapshot,
): ActivationProgress {
  const stage = snap.activation_stage ?? "onboarded";
  const protects = snap.protect_count ?? snap.requests_total;
  const receipts = snap.receipt_count ?? snap.receipts_written_total;
  const verifies = snap.verify_count ?? snap.receipts_verified_total;
  const repeat = snap.repeat_active_7d ?? false;

  return {
    onboarded: true,
    first_protect: protects > 0,
    first_receipt: receipts > 0,
    first_verify: verifies > 0,
    repeat_active: repeat,
    current_stage: stage,
  };
}

/* ── Likely next milestone ────────────────────────────────── */

/**
 * Rules (evaluated in order):
 *  - no protect         → "First protect request"
 *  - protect, no receipt → "First receipt generation"
 *  - receipt, no verify  → "First receipt verification"
 *  - verified, not repeat-active → "Repeat protected usage (7d)"
 *  - repeat-active       → "Sustained adoption" (already healthy)
 */
function deriveNextMilestone(snap: TenantActivationSnapshot): string {
  const protects = snap.protect_count ?? snap.requests_total;
  const receipts = snap.receipt_count ?? snap.receipts_written_total;
  const verifies = snap.verify_count ?? snap.receipts_verified_total;
  const repeat = snap.repeat_active_7d ?? false;

  if (protects === 0) return "First protect request";
  if (receipts === 0) return "First receipt generation";
  if (verifies === 0) return "First receipt verification";
  if (!repeat) return "Repeat protected usage (7d window)";
  return "Sustained adoption — healthy state";
}

/* ── Likely friction point ────────────────────────────────── */

/**
 * Rules (evaluated in order):
 *  - protect > 0, receipt = 0    → integration may not handle receipts
 *  - receipt > 0, verify = 0     → verification flow not integrated
 *  - unknown source, active      → attribution missing, integration unclear
 *  - dormant ≥ 14d               → tenant may have abandoned trial
 *  - stalled at any stage        → stuck at specific lifecycle stage
 *  - verified but not repeating  → one-time test, not production use
 *  - otherwise                   → no obvious friction detected
 */
function deriveFrictionPoint(snap: TenantActivationSnapshot): string {
  const protects = snap.protect_count ?? snap.requests_total;
  const receipts = snap.receipt_count ?? snap.receipts_written_total;
  const verifies = snap.verify_count ?? snap.receipts_verified_total;
  const repeat = snap.repeat_active_7d ?? false;
  const source = snap.dominant_source ?? "unknown";
  const dormant = snap.dormant_days ?? 0;
  const stalled = snap.stalled_stage ?? "";

  if (protects > 0 && receipts === 0) {
    return "Requests reach ATF but no receipts are generated — integration may not consume receipt responses";
  }
  if (receipts > 0 && verifies === 0) {
    return "Receipts are issued but never verified — tenant may not understand verification flow";
  }
  if (source === "unknown" && protects > 0) {
    return "Integration path attribution is missing — unknown how tenant connects";
  }
  if (stalled.length > 0) {
    return `Stalled at ${stalled.replace(/_/g, " ")} for ${dormant}d — may need onboarding help`;
  }
  if (dormant >= 14) {
    return "Inactive for 14+ days — tenant may have abandoned trial or paused integration";
  }
  if (verifies > 0 && !repeat) {
    return "Verified once but not repeating — may be a one-time test rather than production use";
  }
  if (protects === 0) {
    return "No protect requests yet — tenant may need guidance on first integration step";
  }
  return "No obvious friction detected — adoption progressing normally";
}

/* ── Why prioritized ──────────────────────────────────────── */

function deriveWhyPrioritized(
  snap: TenantActivationSnapshot,
  triage: TriageResult,
): string {
  return triage.reason;
}

/* ── Likely current state ─────────────────────────────────── */

/**
 * Derive a human-readable sentence describing the likely current
 * operational state of this tenant.
 */
function deriveCurrentState(snap: TenantActivationSnapshot): string {
  const protects = snap.protect_count ?? snap.requests_total;
  const receipts = snap.receipt_count ?? snap.receipts_written_total;
  const verifies = snap.verify_count ?? snap.receipts_verified_total;
  const repeat = snap.repeat_active_7d ?? false;
  const dormant = snap.dormant_days ?? 0;
  const source = snap.dominant_source ?? "unknown";

  if (repeat && verifies > 0) {
    return `Healthy adoption — repeat-active via ${source}, ${verifies} verifications completed`;
  }
  if (verifies > 0 && !repeat) {
    return `Verified but not repeat-active — may be testing or early integration via ${source}`;
  }
  if (receipts > 0 && verifies === 0) {
    return `Receiving receipts but not verifying — integration partially complete via ${source}`;
  }
  if (protects > 0 && receipts === 0) {
    return `Sending protect requests but not processing receipts — early integration via ${source}`;
  }
  if (dormant >= 14) {
    return `Dormant for ${dormant} days — no recent activity detected`;
  }
  if (dormant >= 7) {
    return `Inactive for ${dormant} days — may be stalled or paused`;
  }
  return "Newly onboarded — no protect activity recorded yet";
}

/* ── Public API ───────────────────────────────────────────── */

/**
 * Derive full operator interpretation for a tenant snapshot.
 * All outputs are deterministic and rule-based.
 */
export function interpretTenant(
  snap: TenantActivationSnapshot,
): TenantInterpretation {
  const triage = triageTenant(snap);
  return {
    likely_next_milestone: deriveNextMilestone(snap),
    likely_friction_point: deriveFrictionPoint(snap),
    why_prioritized: deriveWhyPrioritized(snap, triage),
    likely_current_state: deriveCurrentState(snap),
    activation_progress: deriveActivationProgress(snap),
  };
}

/**
 * PIL recommendation action-state derivation helper.
 *
 * Deterministically maps a PIL recommendation (id + parameter) and the
 * current policy state (effective values, stored overrides, plan capabilities)
 * into an explicit action state used to drive the PIL card UX.
 *
 * This helper is intentionally pure and side-effect-free so it can be
 * tested in isolation without a React or Next.js environment.
 *
 * Action states:
 *   already_applied      — recommendation goal is already met by effective policy
 *   actionable           — can be one-click applied (pro-tier, overrides enabled)
 *   unavailable_on_plan  — would be actionable but plan does not allow overrides
 *   manual_only          — cannot be safely auto-applied; requires edit form
 *   unsupported          — no known mapping; render honestly without fake action
 */

export type PilActionState =
  | "already_applied"
  | "actionable"
  | "unavailable_on_plan"
  | "manual_only"
  | "unsupported";

export type RecommendedDirection =
  | "enable"
  | "decrease"
  | "increase"
  | "none";

export interface PilActionResult {
  /** Derived action state — drives badge and CTA selection. */
  actionState: PilActionState;
  /**
   * Directional hint for numeric fields shown in the card even when manual-only.
   * "none" = informational / no change needed.
   */
  recommendedDirection?: RecommendedDirection;
  /**
   * Human-readable label for the current effective value of the target field.
   * Shown alongside the recommendation to give context.
   */
  currentValueLabel?: string;
  /**
   * Human-readable label for the recommended target state.
   * Shown when the card is actionable or manual-only.
   */
  recommendedValueLabel?: string;
  /**
   * True when already_applied AND the field has a stored override — meaning
   * the user may want to "clear override" to return to plan default.
   */
  satisfiedViaOverride?: boolean;
  /** Mutation to apply — only present when actionState is "actionable". */
  applyMutation?: { key: string; value: unknown };
  /** Confirmation text — only present when actionState is "actionable". */
  applyConfirmText?: string;
}

// ---------------------------------------------------------------------------
// PIL ID classification sets
// ---------------------------------------------------------------------------

/**
 * PIL IDs that represent a healthy / satisfied state.
 * No policy change is needed; map to "already_applied".
 */
const PIL_SATISFIED_IDS: ReadonlySet<string> = new Set([
  "GENERAL_HEALTH",
  "HEALTHY_CONFIRMATION",
  "MAINTAIN_PARAMETERS",
]);

/**
 * PIL IDs that are purely informational — no single policy field to target.
 * Map to "manual_only" (show "View setting" if a fieldKey exists, otherwise
 * render the rec without an action control).
 */
const PIL_MANUAL_IDS: ReadonlySet<string> = new Set([
  "HIGH_FRICTION",
  "REVIEW_LATENCY",
  "CONFIRMATION_BOTTLENECK",
  "IMPROVE_EXECUTION",
  "SPARSE_DATA",
  "COLLECT_MORE_DATA",
]);

/**
 * PIL IDs that suggest enabling require_simulation_success.
 * Safe to auto-apply because the mutation is boolean and reversible.
 */
const PIL_SIMULATION_ENABLE_IDS: ReadonlySet<string> = new Set([
  "TIGHTEN_RISK",
]);

/**
 * PIL IDs that suggest tightening (reducing) slippage tolerance.
 * Cannot auto-apply because the backend does not send a concrete target value.
 * Expose as manual_only with directional hint.
 */
const PIL_SLIPPAGE_TIGHTEN_IDS: ReadonlySet<string> = new Set([
  "REDUCE_SLIPPAGE",
  "SLIPPAGE_HEADROOM",
]);

/**
 * PIL IDs that suggest relaxing (increasing) transaction limits.
 * Cannot auto-apply — auto-increasing limits is not safe without explicit
 * user review.  Expose as manual_only.
 */
const PIL_LIMIT_RELAX_IDS: ReadonlySet<string> = new Set([
  "RELAX_LIMIT",
]);

// ---------------------------------------------------------------------------
// Main derivation function
// ---------------------------------------------------------------------------

/**
 * Derive the action state for a single PIL recommendation.
 *
 * @param pilId       PIL recommendation id (e.g. "TIGHTEN_RISK")
 * @param parameter   Backend parameter field (e.g. "require_simulation_success")
 * @param effective   Current effective policy values
 * @param overrides   Current stored override values
 * @param overridesEnabled Whether the plan allows policy overrides
 */
export function derivePilActionState(
  pilId: string,
  parameter: string,
  effective: Record<string, unknown>,
  overrides: Record<string, unknown>,
  overridesEnabled: boolean,
): PilActionResult {
  // ── Satisfied / no-action IDs ────────────────────────────────────────────
  if (PIL_SATISFIED_IDS.has(pilId)) {
    return { actionState: "already_applied", recommendedDirection: "none" };
  }

  // ── Manual-only IDs ──────────────────────────────────────────────────────
  if (PIL_MANUAL_IDS.has(pilId)) {
    return { actionState: "manual_only" };
  }

  // ── require_simulation_success ───────────────────────────────────────────
  if (
    parameter === "require_simulation_success" &&
    PIL_SIMULATION_ENABLE_IDS.has(pilId)
  ) {
    const isEnabled = effective.require_simulation_success === true;
    if (isEnabled) {
      const satisfiedViaOverride = Object.prototype.hasOwnProperty.call(
        overrides,
        "require_simulation_success",
      );
      return {
        actionState: "already_applied",
        recommendedDirection: "enable",
        currentValueLabel: "Required",
        recommendedValueLabel: "Required",
        satisfiedViaOverride,
      };
    }
    if (!overridesEnabled) {
      return {
        actionState: "unavailable_on_plan",
        recommendedDirection: "enable",
        currentValueLabel: "Optional",
        recommendedValueLabel: "Required",
      };
    }
    return {
      actionState: "actionable",
      recommendedDirection: "enable",
      currentValueLabel: "Optional",
      recommendedValueLabel: "Required",
      applyMutation: { key: "require_simulation_success", value: true },
      applyConfirmText:
        "This will require simulation for all transactions. Any transaction that fails pre-execution simulation will be blocked before real funds are at risk.",
    };
  }

  // ── max_slippage_bps — tightening ────────────────────────────────────────
  if (
    parameter === "max_slippage_bps" &&
    PIL_SLIPPAGE_TIGHTEN_IDS.has(pilId)
  ) {
    const effectiveBps =
      typeof effective.max_slippage_bps === "number"
        ? effective.max_slippage_bps
        : null;
    // Consider "already applied" if slippage is already at or below a tight
    // threshold (≤ 100 bps = 1%).  Above that, the recommendation is valid.
    if (effectiveBps !== null && effectiveBps <= 100) {
      const satisfiedViaOverride = Object.prototype.hasOwnProperty.call(
        overrides,
        "max_slippage_bps",
      );
      return {
        actionState: "already_applied",
        recommendedDirection: "decrease",
        currentValueLabel: `${effectiveBps} bps`,
        recommendedValueLabel: "≤ 100 bps",
        satisfiedViaOverride,
      };
    }
    return {
      actionState: "manual_only",
      recommendedDirection: "decrease",
      currentValueLabel:
        effectiveBps !== null ? `${effectiveBps} bps` : "Plan default",
      recommendedValueLabel: "Lower tolerance",
    };
  }

  // ── max_notional_usd / max_value_sol — relax (increase) ──────────────────
  if (
    (parameter === "max_notional_usd" || parameter === "max_value_sol") &&
    PIL_LIMIT_RELAX_IDS.has(pilId)
  ) {
    const current = effective[parameter];
    const label =
      parameter === "max_notional_usd"
        ? typeof current === "number"
          ? `$${current.toLocaleString()}`
          : "Plan default"
        : typeof current === "number"
          ? `${current} SOL`
          : "Plan default";
    return {
      actionState: "manual_only",
      recommendedDirection: "increase",
      currentValueLabel: label,
      recommendedValueLabel: "Increase limit",
    };
  }

  // ── Unrecognized PIL ID / parameter combination ───────────────────────────
  return { actionState: "unsupported" };
}

// ---------------------------------------------------------------------------
// Utility: human-readable badge label for each state
// ---------------------------------------------------------------------------

export const PIL_ACTION_STATE_LABELS: Record<PilActionState, string> = {
  already_applied: "Already applied",
  actionable: "Actionable",
  unavailable_on_plan: "Pro required",
  manual_only: "Manual review",
  unsupported: "Informational",
};

/**
 * Returns the Tailwind class string for the action-state badge.
 * Kept separate from the label so UI can mix/match styles.
 */
export function pilActionStateBadgeClass(state: PilActionState): string {
  switch (state) {
    case "already_applied":
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    case "actionable":
      return "bg-primary-500/15 text-primary-300 border border-primary-400/30";
    case "unavailable_on_plan":
      return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    case "manual_only":
      return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    case "unsupported":
      return "bg-white/5 text-slate-500 border border-white/10";
  }
}

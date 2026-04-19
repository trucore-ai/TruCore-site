/**
 * @vitest-environment node
 *
 * Tests for PIL card action-state logic as used by the policies page.
 *
 * Since the policies page is a massive "use client" component that requires
 * a full Next.js context, these tests verify the data contract between
 * derivePilActionState() and the rendering layer:
 *   - The right applyMutation/applyConfirmText is produced for actionable recs
 *   - The right labels are produced for all states
 *   - satisfiedViaOverride correctly reflects the override store
 *   - Free-tier gating produces unavailable_on_plan (not actionable)
 *   - PIL clear-override semantics (applyMutation with null value via caller)
 *
 * These tests exercise the full surface area of the helper that the PIL card
 * UI depends on, without needing to render the component.
 */

import { describe, it, expect } from "vitest";
import { derivePilActionState } from "@/lib/policy-pil-action-state";

// ── Actionable PIL card — Apply recommendation CTA ──────────────────────────

describe("PIL card — actionable state (TIGHTEN_RISK)", () => {
  const pilId = "TIGHTEN_RISK";
  const parameter = "require_simulation_success";
  const effective = { require_simulation_success: false };

  it("produces applyMutation for apply-recommendation button", () => {
    const r = derivePilActionState(pilId, parameter, effective, {}, true);
    expect(r.actionState).toBe("actionable");
    expect(r.applyMutation).toEqual({ key: "require_simulation_success", value: true });
  });

  it("produces applyConfirmText for confirm panel", () => {
    const r = derivePilActionState(pilId, parameter, effective, {}, true);
    expect(typeof r.applyConfirmText).toBe("string");
    expect(r.applyConfirmText!.length).toBeGreaterThan(20);
  });

  it("produces currentValueLabel and recommendedValueLabel for value comparison", () => {
    const r = derivePilActionState(pilId, parameter, effective, {}, true);
    expect(r.currentValueLabel).toBe("Optional");
    expect(r.recommendedValueLabel).toBe("Required");
  });

  it("recommendedDirection is enable", () => {
    const r = derivePilActionState(pilId, parameter, effective, {}, true);
    expect(r.recommendedDirection).toBe("enable");
  });
});

// ── Already-applied PIL card ─────────────────────────────────────────────────

describe("PIL card — already_applied state", () => {
  it("TIGHTEN_RISK + simulation already required → no applyMutation", () => {
    const r = derivePilActionState(
      "TIGHTEN_RISK",
      "require_simulation_success",
      { require_simulation_success: true },
      {},
      true,
    );
    expect(r.actionState).toBe("already_applied");
    expect(r.applyMutation).toBeUndefined();
    expect(r.applyConfirmText).toBeUndefined();
  });

  it("satisfiedViaOverride=false when override store is empty", () => {
    const r = derivePilActionState(
      "TIGHTEN_RISK",
      "require_simulation_success",
      { require_simulation_success: true },
      {},
      true,
    );
    expect(r.satisfiedViaOverride).toBe(false);
  });

  it("satisfiedViaOverride=true when override store has the key", () => {
    const r = derivePilActionState(
      "TIGHTEN_RISK",
      "require_simulation_success",
      { require_simulation_success: true },
      { require_simulation_success: true },
      true,
    );
    // The clear-override button should render (satisfiedViaOverride=true)
    expect(r.satisfiedViaOverride).toBe(true);
  });

  it("GENERAL_HEALTH → already_applied + direction none (no value labels)", () => {
    const r = derivePilActionState("GENERAL_HEALTH", "n/a", {}, {}, true);
    expect(r.actionState).toBe("already_applied");
    expect(r.recommendedDirection).toBe("none");
    expect(r.currentValueLabel).toBeUndefined();
  });

  it("REDUCE_SLIPPAGE + 50 bps → already_applied with value label", () => {
    const r = derivePilActionState(
      "REDUCE_SLIPPAGE",
      "max_slippage_bps",
      { max_slippage_bps: 50 },
      {},
      true,
    );
    expect(r.actionState).toBe("already_applied");
    expect(r.currentValueLabel).toBe("50 bps");
  });
});

// ── Free-tier gating — unavailable_on_plan ───────────────────────────────────

describe("PIL card — unavailable_on_plan (overridesEnabled=false)", () => {
  it("TIGHTEN_RISK + overridesEnabled=false → unavailable_on_plan teaser", () => {
    const r = derivePilActionState(
      "TIGHTEN_RISK",
      "require_simulation_success",
      { require_simulation_success: false },
      {},
      false,
    );
    expect(r.actionState).toBe("unavailable_on_plan");
    // No mutation should be produced — teaser pill only
    expect(r.applyMutation).toBeUndefined();
  });

  it("still shows value comparison labels for teaser", () => {
    const r = derivePilActionState(
      "TIGHTEN_RISK",
      "require_simulation_success",
      { require_simulation_success: false },
      {},
      false,
    );
    expect(r.currentValueLabel).toBe("Optional");
    expect(r.recommendedValueLabel).toBe("Required");
  });
});

// ── Manual-only PIL card ─────────────────────────────────────────────────────

describe("PIL card — manual_only state", () => {
  it("HIGH_FRICTION → manual_only with no value labels", () => {
    const r = derivePilActionState("HIGH_FRICTION", "any", {}, {}, true);
    expect(r.actionState).toBe("manual_only");
    expect(r.applyMutation).toBeUndefined();
  });

  it("REDUCE_SLIPPAGE + 200 bps → manual_only with directional hint", () => {
    const r = derivePilActionState(
      "REDUCE_SLIPPAGE",
      "max_slippage_bps",
      { max_slippage_bps: 200 },
      {},
      true,
    );
    expect(r.actionState).toBe("manual_only");
    expect(r.recommendedDirection).toBe("decrease");
    expect(r.currentValueLabel).toBe("200 bps");
    expect(r.recommendedValueLabel).toBe("Lower tolerance");
  });

  it("RELAX_LIMIT + max_notional_usd → manual_only + increase direction", () => {
    const r = derivePilActionState(
      "RELAX_LIMIT",
      "max_notional_usd",
      { max_notional_usd: 500 },
      {},
      true,
    );
    expect(r.actionState).toBe("manual_only");
    expect(r.recommendedDirection).toBe("increase");
    expect(r.currentValueLabel).toBe("$500");
  });
});

// ── PIL clear-override semantics ─────────────────────────────────────────────

describe("PIL card — clear-override flow data contract", () => {
  /**
   * The UI calls handleClearPilOverride(rec) which sends { [rec.fieldKey]: null }
   * to updatePolicyOverrides(). The helper's job is simply to surface
   * satisfiedViaOverride=true so the UI knows to show the clear-override button.
   */
  it("satisfiedViaOverride correctly gated on override store key presence", () => {
    // With override key present → show clear-override button
    const withOverride = derivePilActionState(
      "TIGHTEN_RISK",
      "require_simulation_success",
      { require_simulation_success: true },
      { require_simulation_success: true },
      true,
    );
    expect(withOverride.satisfiedViaOverride).toBe(true);

    // Without override key → no clear-override button
    const withoutOverride = derivePilActionState(
      "TIGHTEN_RISK",
      "require_simulation_success",
      { require_simulation_success: true },
      {},
      true,
    );
    expect(withoutOverride.satisfiedViaOverride).toBe(false);
  });

  it("satisfiedViaOverride only relevant for already_applied state", () => {
    // When actionable, satisfiedViaOverride is undefined — clear-override N/A
    const actionable = derivePilActionState(
      "TIGHTEN_RISK",
      "require_simulation_success",
      { require_simulation_success: false },
      { require_simulation_success: false },
      true,
    );
    expect(actionable.actionState).toBe("actionable");
    expect(actionable.satisfiedViaOverride).toBeUndefined();
  });
});

// ── Unsupported PIL IDs ──────────────────────────────────────────────────────

describe("PIL card — unsupported", () => {
  it("unknown pilId renders without action controls (unsupported)", () => {
    const r = derivePilActionState("MYSTERY_REC", "unknown_field", {}, {}, true);
    expect(r.actionState).toBe("unsupported");
    expect(r.applyMutation).toBeUndefined();
    expect(r.applyConfirmText).toBeUndefined();
  });
});

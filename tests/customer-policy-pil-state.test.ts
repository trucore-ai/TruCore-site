/**
 * @vitest-environment node
 *
 * Unit tests for derivePilActionState() — pure logic, no React or Next.js.
 */

import { describe, it, expect } from "vitest";
import {
  derivePilActionState,
  PIL_ACTION_STATE_LABELS,
  pilActionStateBadgeClass,
} from "@/lib/policy-pil-action-state";

// Convenient empty-state fixtures
const EMPTY_EFFECTIVE: Record<string, unknown> = {};
const EMPTY_OVERRIDES: Record<string, unknown> = {};

// ── Satisfied / no-action IDs ────────────────────────────────────────────────

describe("PIL_SATISFIED_IDS", () => {
  const SATISFIED = [
    "GENERAL_HEALTH",
    "HEALTHY_CONFIRMATION",
    "MAINTAIN_PARAMETERS",
  ];

  SATISFIED.forEach((id) => {
    it(`${id} → already_applied`, () => {
      const result = derivePilActionState(id, "any_param", EMPTY_EFFECTIVE, EMPTY_OVERRIDES, true);
      expect(result.actionState).toBe("already_applied");
      expect(result.recommendedDirection).toBe("none");
    });

    it(`${id} → already_applied even when overridesEnabled=false`, () => {
      const result = derivePilActionState(id, "any_param", EMPTY_EFFECTIVE, EMPTY_OVERRIDES, false);
      expect(result.actionState).toBe("already_applied");
    });
  });
});

// ── Manual-only IDs ──────────────────────────────────────────────────────────

describe("PIL_MANUAL_IDS", () => {
  const MANUAL = [
    "HIGH_FRICTION",
    "REVIEW_LATENCY",
    "CONFIRMATION_BOTTLENECK",
    "IMPROVE_EXECUTION",
    "SPARSE_DATA",
    "COLLECT_MORE_DATA",
  ];

  MANUAL.forEach((id) => {
    it(`${id} → manual_only`, () => {
      const result = derivePilActionState(id, "any_param", EMPTY_EFFECTIVE, EMPTY_OVERRIDES, true);
      expect(result.actionState).toBe("manual_only");
    });
  });
});

// ── require_simulation_success ───────────────────────────────────────────────

describe("TIGHTEN_RISK + require_simulation_success", () => {
  const pilId = "TIGHTEN_RISK";
  const parameter = "require_simulation_success";

  it("actionable when disabled and overridesEnabled", () => {
    const result = derivePilActionState(
      pilId,
      parameter,
      { require_simulation_success: false },
      EMPTY_OVERRIDES,
      true,
    );
    expect(result.actionState).toBe("actionable");
    expect(result.applyMutation).toEqual({ key: "require_simulation_success", value: true });
    expect(result.applyConfirmText).toBeTruthy();
    expect(result.currentValueLabel).toBe("Optional");
    expect(result.recommendedValueLabel).toBe("Required");
  });

  it("actionable when key absent and overridesEnabled", () => {
    const result = derivePilActionState(pilId, parameter, EMPTY_EFFECTIVE, EMPTY_OVERRIDES, true);
    expect(result.actionState).toBe("actionable");
  });

  it("unavailable_on_plan when disabled and !overridesEnabled", () => {
    const result = derivePilActionState(
      pilId,
      parameter,
      { require_simulation_success: false },
      EMPTY_OVERRIDES,
      false,
    );
    expect(result.actionState).toBe("unavailable_on_plan");
    expect(result.applyMutation).toBeUndefined();
    expect(result.currentValueLabel).toBe("Optional");
    expect(result.recommendedValueLabel).toBe("Required");
  });

  it("already_applied when effective=true (plan default)", () => {
    const result = derivePilActionState(
      pilId,
      parameter,
      { require_simulation_success: true },
      EMPTY_OVERRIDES,
      true,
    );
    expect(result.actionState).toBe("already_applied");
    expect(result.satisfiedViaOverride).toBe(false);
    expect(result.currentValueLabel).toBe("Required");
  });

  it("already_applied with satisfiedViaOverride=true when override key present", () => {
    const result = derivePilActionState(
      pilId,
      parameter,
      { require_simulation_success: true },
      { require_simulation_success: true },
      true,
    );
    expect(result.actionState).toBe("already_applied");
    expect(result.satisfiedViaOverride).toBe(true);
  });
});

// ── max_slippage_bps ─────────────────────────────────────────────────────────

describe("REDUCE_SLIPPAGE + max_slippage_bps", () => {
  const pilId = "REDUCE_SLIPPAGE";
  const parameter = "max_slippage_bps";

  it("already_applied when bps ≤ 100", () => {
    const result = derivePilActionState(
      pilId,
      parameter,
      { max_slippage_bps: 80 },
      EMPTY_OVERRIDES,
      true,
    );
    expect(result.actionState).toBe("already_applied");
    expect(result.currentValueLabel).toBe("80 bps");
    expect(result.satisfiedViaOverride).toBe(false);
  });

  it("already_applied at exactly 100 bps", () => {
    const result = derivePilActionState(
      pilId,
      parameter,
      { max_slippage_bps: 100 },
      EMPTY_OVERRIDES,
      true,
    );
    expect(result.actionState).toBe("already_applied");
  });

  it("already_applied with satisfiedViaOverride=true when override present", () => {
    const result = derivePilActionState(
      pilId,
      parameter,
      { max_slippage_bps: 50 },
      { max_slippage_bps: 50 },
      true,
    );
    expect(result.actionState).toBe("already_applied");
    expect(result.satisfiedViaOverride).toBe(true);
  });

  it("manual_only when bps > 100", () => {
    const result = derivePilActionState(
      pilId,
      parameter,
      { max_slippage_bps: 150 },
      EMPTY_OVERRIDES,
      true,
    );
    expect(result.actionState).toBe("manual_only");
    expect(result.recommendedDirection).toBe("decrease");
    expect(result.currentValueLabel).toBe("150 bps");
  });

  it("manual_only with 'Plan default' when bps absent", () => {
    const result = derivePilActionState(pilId, parameter, EMPTY_EFFECTIVE, EMPTY_OVERRIDES, true);
    expect(result.actionState).toBe("manual_only");
    expect(result.currentValueLabel).toBe("Plan default");
  });
});

describe("SLIPPAGE_HEADROOM + max_slippage_bps", () => {
  it("already_applied when bps ≤ 100", () => {
    const result = derivePilActionState(
      "SLIPPAGE_HEADROOM",
      "max_slippage_bps",
      { max_slippage_bps: 80 },
      EMPTY_OVERRIDES,
      true,
    );
    expect(result.actionState).toBe("already_applied");
  });

  it("manual_only when bps > 100", () => {
    const result = derivePilActionState(
      "SLIPPAGE_HEADROOM",
      "max_slippage_bps",
      { max_slippage_bps: 300 },
      EMPTY_OVERRIDES,
      true,
    );
    expect(result.actionState).toBe("manual_only");
    expect(result.recommendedDirection).toBe("decrease");
  });
});

// ── max_notional_usd / max_value_sol ─────────────────────────────────────────

describe("RELAX_LIMIT + max_notional_usd", () => {
  it("manual_only with increase direction", () => {
    const result = derivePilActionState(
      "RELAX_LIMIT",
      "max_notional_usd",
      { max_notional_usd: 1000 },
      EMPTY_OVERRIDES,
      true,
    );
    expect(result.actionState).toBe("manual_only");
    expect(result.recommendedDirection).toBe("increase");
    expect(result.currentValueLabel).toBe("$1,000");
  });

  it("manual_only with Plan default when value absent", () => {
    const result = derivePilActionState(
      "RELAX_LIMIT",
      "max_notional_usd",
      EMPTY_EFFECTIVE,
      EMPTY_OVERRIDES,
      true,
    );
    expect(result.actionState).toBe("manual_only");
    expect(result.currentValueLabel).toBe("Plan default");
  });
});

describe("RELAX_LIMIT + max_value_sol", () => {
  it("manual_only with SOL label", () => {
    const result = derivePilActionState(
      "RELAX_LIMIT",
      "max_value_sol",
      { max_value_sol: 5 },
      EMPTY_OVERRIDES,
      true,
    );
    expect(result.actionState).toBe("manual_only");
    expect(result.currentValueLabel).toBe("5 SOL");
    expect(result.recommendedDirection).toBe("increase");
  });
});

// ── Unknown / unsupported ────────────────────────────────────────────────────

describe("unsupported", () => {
  it("unknown pilId → unsupported", () => {
    const result = derivePilActionState("TOTALLY_UNKNOWN", "some_param", EMPTY_EFFECTIVE, EMPTY_OVERRIDES, true);
    expect(result.actionState).toBe("unsupported");
  });

  it("known parameter but wrong pilId → unsupported", () => {
    const result = derivePilActionState("HIGH_FRICTION_WRONG", "require_simulation_success", EMPTY_EFFECTIVE, EMPTY_OVERRIDES, true);
    expect(result.actionState).toBe("unsupported");
  });
});

// ── Label / badge utility coverage ───────────────────────────────────────────

describe("PIL_ACTION_STATE_LABELS", () => {
  it("covers all 5 states", () => {
    expect(PIL_ACTION_STATE_LABELS.already_applied).toBeTruthy();
    expect(PIL_ACTION_STATE_LABELS.actionable).toBeTruthy();
    expect(PIL_ACTION_STATE_LABELS.unavailable_on_plan).toBeTruthy();
    expect(PIL_ACTION_STATE_LABELS.manual_only).toBeTruthy();
    expect(PIL_ACTION_STATE_LABELS.unsupported).toBeTruthy();
  });
});

describe("pilActionStateBadgeClass", () => {
  it("returns a non-empty Tailwind string for every state", () => {
    const states = [
      "already_applied",
      "actionable",
      "unavailable_on_plan",
      "manual_only",
      "unsupported",
    ] as const;
    for (const s of states) {
      const cls = pilActionStateBadgeClass(s);
      expect(cls.length).toBeGreaterThan(0);
    }
  });
});

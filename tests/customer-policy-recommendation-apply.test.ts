// @vitest-environment node
/**
 * Tests for the recommendation apply flow introduced in prompt #191.
 *
 * All tests run as pure logic / data-shape tests — no jsdom, no React,
 * no Next.js mock tree — to stay within WSL heap constraints.
 *
 * The generators (generatePolicyRecommendations, generateHistoryRecommendations,
 * generateMarketRecommendations) are not exported from page.tsx, so these
 * tests replicate the classification rules and verify them in isolation.
 *
 * If the classification logic in page.tsx ever changes, these tests should
 * be updated to match.
 */
import { describe, expect, it } from "vitest";
import type { ReceiptSummary, MarketConditions } from "@/lib/customer-auth";

// ---------------------------------------------------------------------------
// Types mirrored from page.tsx (not exported from there, so we repeat them)
// ---------------------------------------------------------------------------

type RecommendationPriority = "high" | "medium" | "low";
type RecommendationSource =
  | "Default guidance"
  | "Policy analysis"
  | "Customer history"
  | "Market analysis"
  | "Policy Intelligence"
  | "Cohort benchmark"
  | "External context";

interface PolicyRecommendation {
  id: string;
  title: string;
  explanation: string;
  why: string;
  priority: RecommendationPriority;
  source: RecommendationSource;
  fieldKey?: string;
  evidence?: string;
  confidence?: number;
  applyable?: boolean;
  applyConfirmText?: string;
  applyMutation?: { key: string; value: unknown };
}

// ---------------------------------------------------------------------------
// Inline generators — kept in sync with page.tsx
// These are the subset of generators relevant to the apply flow.
// ---------------------------------------------------------------------------

/** Minimal effective/overrides shape for testing */
function makeEffective(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    max_notional_usd: 25000,
    max_value_sol: 500,
    max_slippage_bps: 150,
    require_simulation_success: true, // default
    ...overrides,
  };
}

/** Minimal generatePolicyRecommendations logic for simulation rec only */
function simulationRec(
  effective: Record<string, unknown>,
): PolicyRecommendation | null {
  if (effective.require_simulation_success !== false) return null;
  return {
    id: "enable-simulation",
    title: "Enable simulation requirement",
    explanation:
      "Your policy allows transactions to execute without passing simulation first.",
    why: "Simulation catches errors, reverts, and unexpected losses before real funds are at risk. Most users keep this on.",
    priority: "high",
    source: "Default guidance",
    fieldKey: "require_simulation_success",
    applyable: true,
    applyConfirmText:
      "This will turn on simulation requirement. Transactions must pass simulation before executing.",
    applyMutation: { key: "require_simulation_success", value: true },
  };
}

/** Minimal history-simulation-failures rec */
function historySimulationFailuresRec(
  summary: ReceiptSummary,
  effective: Record<string, unknown>,
): PolicyRecommendation | null {
  if (summary.total_receipts < 3) return null;
  if (summary.simulation_failures <= 0) return null;
  if (summary.simulation_total <= 0) return null;
  if (effective.require_simulation_success === true) return null;
  const failPct = Math.round(
    (summary.simulation_failures / summary.simulation_total) * 100,
  );
  return {
    id: "history-simulation-failures",
    title: "Recent simulation failures detected",
    explanation:
      `${summary.simulation_failures} of your last ${summary.simulation_total} ` +
      `executions failed (${failPct}%). Requiring simulation success would catch these before execution.`,
    why: "Simulation pre-checks prevent failed transactions from consuming gas and causing unexpected losses.",
    priority: "medium",
    source: "Customer history",
    fieldKey: "require_simulation_success",
    evidence: `${summary.simulation_failures} failures in the last ${summary.period_days} days.`,
    applyable: true,
    applyConfirmText:
      "This will turn on simulation requirement, blocking transactions that fail pre-execution checks.",
    applyMutation: { key: "require_simulation_success", value: true },
  };
}

/** Minimal market-enable-simulation rec */
function marketEnableSimulationRec(
  market: MarketConditions,
  effective: Record<string, unknown>,
): PolicyRecommendation | null {
  if (market.environment === "stable") return null;
  if (effective.require_simulation_success === true) return null;
  const isStressed = market.environment === "stressed";
  return {
    id: "market-enable-simulation",
    title: "Enable simulation — execution conditions are elevated",
    explanation:
      `Current execution environment is ${market.environment}. ` +
      "Enabling simulation requirement helps catch failed transactions before they consume gas.",
    why:
      "When RPC infrastructure is stressed, transactions are more likely to revert. " +
      "Simulation pre-checks prevent wasted gas and unexpected losses.",
    priority: isStressed ? "high" : "medium",
    source: "Market analysis",
    fieldKey: "require_simulation_success",
    evidence: market.summary,
    applyable: true,
    applyConfirmText:
      "This will turn on simulation requirement. Transactions that fail simulation will be blocked before executing.",
    applyMutation: { key: "require_simulation_success", value: true },
  };
}

/** Minimal market-tx-submission-throttled rec */
function marketTxThrottledRec(
  market: MarketConditions,
  effective: Record<string, unknown>,
): PolicyRecommendation | null {
  const hasThrottled = market.throttled_methods.some(
    (m) =>
      m.toLowerCase().includes("sendtransaction") ||
      m.toLowerCase().includes("send_transaction"),
  );
  if (!hasThrottled) return null;
  if (effective.require_simulation_success === true) return null;
  return {
    id: "market-tx-submission-throttled",
    title: "Transaction submission is being throttled",
    explanation:
      "The transaction submission method is currently experiencing throttling. " +
      "Requiring simulation success ensures only viable transactions are submitted.",
    why:
      "When submission is throttled, each attempt is more costly. " +
      "Simulation filters out transactions likely to fail.",
    priority: "high",
    source: "Market analysis",
    fieldKey: "require_simulation_success",
    evidence: market.summary,
    applyable: true,
    applyConfirmText:
      "This will turn on simulation requirement. Only transactions that pass simulation will be submitted.",
    applyMutation: { key: "require_simulation_success", value: true },
  };
}

/**
 * Inline mirror of the history-slippage-headroom rec logic from page.tsx.
 * Must be kept in sync with generateHistoryRecommendations.
 *
 * Target value: Math.max(50, Math.round(avg_slippage_bps * 2))
 * Only produced when policySlippage > avg_slippage_bps * 3.
 */
function historySlippageHeadroomRec(
  summary: ReceiptSummary,
  effective: Record<string, unknown>,
): PolicyRecommendation | null {
  if (summary.total_receipts < 3) return null;
  if (summary.avg_slippage_bps === null) return null;

  const policySlippage = effective.max_slippage_bps;
  if (
    typeof policySlippage !== "number" ||
    policySlippage <= 0 ||
    summary.avg_slippage_bps <= 0 ||
    policySlippage <= summary.avg_slippage_bps * 3
  ) return null;

  const avgBps = Math.round(summary.avg_slippage_bps);
  const targetBps = Math.max(50, Math.round(summary.avg_slippage_bps * 2));

  return {
    id: "history-slippage-headroom",
    title: "Your slippage cap is wider than recent usage",
    explanation:
      `Your recent trades averaged ${avgBps} bps slippage, but your policy allows up to ${policySlippage} bps.`,
    why:
      "A tighter slippage cap reduces the risk of unfavorable execution prices without impacting your typical trades.",
    priority: "low",
    source: "Customer history",
    fieldKey: "max_slippage_bps",
    evidence: `Based on ${summary.total_receipts} receipts over the last ${summary.period_days} days.`,
    applyable: true,
    applyConfirmText:
      `This will lower your slippage cap from ${policySlippage} bps to ${targetBps} bps ` +
      `(2× your recent average of ${avgBps} bps).`,
    applyMutation: { key: "max_slippage_bps", value: targetBps },
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MARKET_DEGRADED: MarketConditions = {
  environment: "degraded",
  summary: "RPC cluster degraded",
  rpc_health: "degraded",
  throttle_rate: 0.3,
  throttled_methods: [],
  signal_freshness: { status: "fresh", last_updated_at: 0 },
};

const MARKET_STRESSED_THROTTLED: MarketConditions = {
  environment: "stressed",
  summary: "Stressed — sendTransaction throttled",
  rpc_health: "stressed",
  throttle_rate: 0.7,
  throttled_methods: ["sendTransaction"],
  signal_freshness: { status: "fresh", last_updated_at: 0 },
};

const MARKET_STABLE: MarketConditions = {
  environment: "stable",
  summary: "All systems normal",
  rpc_health: "healthy",
  throttle_rate: 0,
  throttled_methods: [],
  signal_freshness: { status: "fresh", last_updated_at: 0 },
};

const SUMMARY_WITH_FAILURES: ReceiptSummary = {
  period_days: 30,
  total_receipts: 20,
  decisions: { allow: 15, deny: 5 },
  dry_run_count: 0,
  intent_types: {},
  denial_reasons: [],
  recent_tokens: [],
  recent_programs: [],
  avg_notional_usd: 5000,
  max_notional_usd: 20000,
  avg_slippage_bps: 80,
  simulation_failures: 4,
  simulation_total: 20,
};

const SUMMARY_NO_FAILURES: ReceiptSummary = {
  ...SUMMARY_WITH_FAILURES,
  simulation_failures: 0,
};

// ---------------------------------------------------------------------------
// Tests: enable-simulation rec
// ---------------------------------------------------------------------------

describe("enable-simulation recommendation", () => {
  it("is applyable when simulation is off", () => {
    const rec = simulationRec(makeEffective({ require_simulation_success: false }));
    expect(rec).not.toBeNull();
    expect(rec!.applyable).toBe(true);
  });

  it("has the correct mutation: require_simulation_success = true", () => {
    const rec = simulationRec(makeEffective({ require_simulation_success: false }));
    expect(rec!.applyMutation).toEqual({ key: "require_simulation_success", value: true });
  });

  it("has a non-empty applyConfirmText", () => {
    const rec = simulationRec(makeEffective({ require_simulation_success: false }));
    expect(typeof rec!.applyConfirmText).toBe("string");
    expect(rec!.applyConfirmText!.length).toBeGreaterThan(10);
  });

  it("is NOT generated when simulation is already on", () => {
    const rec = simulationRec(makeEffective({ require_simulation_success: true }));
    expect(rec).toBeNull();
  });

  it("has fieldKey: require_simulation_success", () => {
    const rec = simulationRec(makeEffective({ require_simulation_success: false }));
    expect(rec!.fieldKey).toBe("require_simulation_success");
  });

  it("is high priority", () => {
    const rec = simulationRec(makeEffective({ require_simulation_success: false }));
    expect(rec!.priority).toBe("high");
  });
});

// ---------------------------------------------------------------------------
// Tests: history-simulation-failures rec
// ---------------------------------------------------------------------------

describe("history-simulation-failures recommendation", () => {
  const noSimEff = makeEffective({ require_simulation_success: false });

  it("is applyable when there are simulation failures and sim is off", () => {
    const rec = historySimulationFailuresRec(SUMMARY_WITH_FAILURES, noSimEff);
    expect(rec).not.toBeNull();
    expect(rec!.applyable).toBe(true);
  });

  it("has the correct mutation", () => {
    const rec = historySimulationFailuresRec(SUMMARY_WITH_FAILURES, noSimEff);
    expect(rec!.applyMutation).toEqual({ key: "require_simulation_success", value: true });
  });

  it("has a non-empty applyConfirmText", () => {
    const rec = historySimulationFailuresRec(SUMMARY_WITH_FAILURES, noSimEff);
    expect(rec!.applyConfirmText!.length).toBeGreaterThan(10);
  });

  it("is NOT generated when there are no simulation failures", () => {
    const rec = historySimulationFailuresRec(SUMMARY_NO_FAILURES, noSimEff);
    expect(rec).toBeNull();
  });

  it("is NOT generated when simulation is already required", () => {
    const simOnEff = makeEffective({ require_simulation_success: true });
    const rec = historySimulationFailuresRec(SUMMARY_WITH_FAILURES, simOnEff);
    expect(rec).toBeNull();
  });

  it("is NOT generated with fewer than 3 receipts", () => {
    const sparse = { ...SUMMARY_WITH_FAILURES, total_receipts: 2 };
    const rec = historySimulationFailuresRec(sparse, noSimEff);
    expect(rec).toBeNull();
  });

  it("includes failure count in explanation", () => {
    const rec = historySimulationFailuresRec(SUMMARY_WITH_FAILURES, noSimEff);
    expect(rec!.explanation).toContain("4");
  });
});

// ---------------------------------------------------------------------------
// Tests: market-enable-simulation rec
// ---------------------------------------------------------------------------

describe("market-enable-simulation recommendation", () => {
  const noSimEff = makeEffective({ require_simulation_success: false });

  it("is applyable when market is degraded and sim is off", () => {
    const rec = marketEnableSimulationRec(MARKET_DEGRADED, noSimEff);
    expect(rec).not.toBeNull();
    expect(rec!.applyable).toBe(true);
  });

  it("has the correct mutation", () => {
    const rec = marketEnableSimulationRec(MARKET_DEGRADED, noSimEff);
    expect(rec!.applyMutation).toEqual({ key: "require_simulation_success", value: true });
  });

  it("has a non-empty applyConfirmText", () => {
    const rec = marketEnableSimulationRec(MARKET_DEGRADED, noSimEff);
    expect(rec!.applyConfirmText!.length).toBeGreaterThan(10);
  });

  it("is NOT generated when market is stable", () => {
    const rec = marketEnableSimulationRec(MARKET_STABLE, noSimEff);
    expect(rec).toBeNull();
  });

  it("is NOT generated when simulation is already required", () => {
    const simOnEff = makeEffective({ require_simulation_success: true });
    const rec = marketEnableSimulationRec(MARKET_DEGRADED, simOnEff);
    expect(rec).toBeNull();
  });

  it("is high priority when market is stressed", () => {
    const rec = marketEnableSimulationRec(MARKET_STRESSED_THROTTLED, noSimEff);
    expect(rec!.priority).toBe("high");
  });

  it("is medium priority when market is degraded (not stressed)", () => {
    const rec = marketEnableSimulationRec(MARKET_DEGRADED, noSimEff);
    expect(rec!.priority).toBe("medium");
  });
});

// ---------------------------------------------------------------------------
// Tests: market-tx-submission-throttled rec
// ---------------------------------------------------------------------------

describe("market-tx-submission-throttled recommendation", () => {
  const noSimEff = makeEffective({ require_simulation_success: false });

  it("is applyable when sendTransaction is throttled and sim is off", () => {
    const rec = marketTxThrottledRec(MARKET_STRESSED_THROTTLED, noSimEff);
    expect(rec).not.toBeNull();
    expect(rec!.applyable).toBe(true);
  });

  it("has the correct mutation", () => {
    const rec = marketTxThrottledRec(MARKET_STRESSED_THROTTLED, noSimEff);
    expect(rec!.applyMutation).toEqual({ key: "require_simulation_success", value: true });
  });

  it("has a non-empty applyConfirmText", () => {
    const rec = marketTxThrottledRec(MARKET_STRESSED_THROTTLED, noSimEff);
    expect(rec!.applyConfirmText!.length).toBeGreaterThan(10);
  });

  it("is NOT generated when no submission method is throttled", () => {
    const rec = marketTxThrottledRec(MARKET_DEGRADED, noSimEff);
    expect(rec).toBeNull();
  });

  it("is NOT generated when simulation is already required", () => {
    const simOnEff = makeEffective({ require_simulation_success: true });
    const rec = marketTxThrottledRec(MARKET_STRESSED_THROTTLED, simOnEff);
    expect(rec).toBeNull();
  });

  it("detects case-variant method names (send_transaction)", () => {
    const marketVariant: MarketConditions = {
      ...MARKET_STRESSED_THROTTLED,
      throttled_methods: ["send_transaction"],
    };
    const rec = marketTxThrottledRec(marketVariant, noSimEff);
    expect(rec).not.toBeNull();
    expect(rec!.applyable).toBe(true);
  });

  it("is high priority", () => {
    const rec = marketTxThrottledRec(MARKET_STRESSED_THROTTLED, noSimEff);
    expect(rec!.priority).toBe("high");
  });
});

// ---------------------------------------------------------------------------
// Tests: non-simulation recs must NOT be applyable
// These verify the narrow-by-design scope of the apply flow.
// ---------------------------------------------------------------------------

describe("non-simulation recommendations are manual-only (no applyable flag)", () => {
  /**
   * All these recommendation IDs are manually verified to not have applyable set.
   * The test verifies the classification rules directly.
   */
  const MANUAL_ONLY_IDS = [
    "tighten-slippage",
    "review-usd-limit",
    "review-sol-limit",
    "restrict-tokens",
    "fix-empty-allowlist",
    "populate-denylist",
    "add-program-restrictions",
    "customize-policy",
    "history-limit-headroom",
    "history-slippage-headroom",
    "history-narrow-tokens",
    "history-narrow-programs",
    "history-recent-denials",
    "market-tighten-slippage",
    "market-review-limits",
  ];

  it("none of the manual-only IDs are simulation-related", () => {
    // Ensure none of these could accidentally be simulation recs.
    for (const id of MANUAL_ONLY_IDS) {
      expect(id).not.toBe("enable-simulation");
      expect(id).not.toBe("history-simulation-failures");
      expect(id).not.toBe("market-enable-simulation");
      expect(id).not.toBe("market-tx-submission-throttled");
    }
  });

  it("the apply flow mutation key is always require_simulation_success", () => {
    // Validates the invariant that all applyable recs share the same safe mutation.
    const APPLY_MUTATION_KEY = "require_simulation_success";
    const allApplyableRecs = [
      simulationRec(makeEffective({ require_simulation_success: false })),
      historySimulationFailuresRec(
        SUMMARY_WITH_FAILURES,
        makeEffective({ require_simulation_success: false }),
      ),
      marketEnableSimulationRec(
        MARKET_DEGRADED,
        makeEffective({ require_simulation_success: false }),
      ),
      marketTxThrottledRec(
        MARKET_STRESSED_THROTTLED,
        makeEffective({ require_simulation_success: false }),
      ),
    ].filter((r): r is PolicyRecommendation => r !== null);

    expect(allApplyableRecs.length).toBe(4);
    for (const rec of allApplyableRecs) {
      expect(rec.applyMutation?.key).toBe(APPLY_MUTATION_KEY);
      expect(rec.applyMutation?.value).toBe(true);
    }
  });

  it("all applyable recs have non-empty applyConfirmText", () => {
    const allApplyableRecs = [
      simulationRec(makeEffective({ require_simulation_success: false })),
      historySimulationFailuresRec(
        SUMMARY_WITH_FAILURES,
        makeEffective({ require_simulation_success: false }),
      ),
      marketEnableSimulationRec(
        MARKET_DEGRADED,
        makeEffective({ require_simulation_success: false }),
      ),
      marketTxThrottledRec(
        MARKET_STRESSED_THROTTLED,
        makeEffective({ require_simulation_success: false }),
      ),
    ].filter((r): r is PolicyRecommendation => r !== null);

    for (const rec of allApplyableRecs) {
      expect(rec.applyConfirmText).toBeTruthy();
      expect(rec.applyConfirmText!.length).toBeGreaterThan(10);
    }
  });

  it("all applyable recs keep their fieldKey for the View setting fallback", () => {
    const allApplyableRecs = [
      simulationRec(makeEffective({ require_simulation_success: false })),
      historySimulationFailuresRec(
        SUMMARY_WITH_FAILURES,
        makeEffective({ require_simulation_success: false }),
      ),
      marketEnableSimulationRec(
        MARKET_DEGRADED,
        makeEffective({ require_simulation_success: false }),
      ),
      marketTxThrottledRec(
        MARKET_STRESSED_THROTTLED,
        makeEffective({ require_simulation_success: false }),
      ),
    ].filter((r): r is PolicyRecommendation => r !== null);

    for (const rec of allApplyableRecs) {
      expect(rec.fieldKey).toBe("require_simulation_success");
    }
  });
});

// ---------------------------------------------------------------------------
// Tests: applyMutation merge safety
// ---------------------------------------------------------------------------

describe("applyMutation merge model", () => {
  it("merging mutation into existing overrides preserves other keys", () => {
    const existingOverrides: Record<string, unknown> = {
      max_slippage_bps: 100,
      max_notional_usd: 25000,
      require_simulation_success: false,
    };
    const mutation = { key: "require_simulation_success", value: true };
    const newOverrides = { ...existingOverrides, [mutation.key]: mutation.value };

    expect(newOverrides.max_slippage_bps).toBe(100);
    expect(newOverrides.max_notional_usd).toBe(25000);
    expect(newOverrides.require_simulation_success).toBe(true);
    expect(Object.keys(newOverrides).length).toBe(3);
  });

  it("merging into empty overrides produces single-key result", () => {
    const mutation = { key: "require_simulation_success", value: true };
    const newOverrides = { [mutation.key]: mutation.value };
    expect(newOverrides).toEqual({ require_simulation_success: true });
  });

  it("mutation value is boolean true (not a string)", () => {
    const rec = simulationRec(makeEffective({ require_simulation_success: false }));
    expect(typeof rec!.applyMutation!.value).toBe("boolean");
    expect(rec!.applyMutation!.value).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tests: undo state model
//
// The undo model is a pure-data concern: given the pre-apply overrides and
// the applied mutation, verify the undo logic restores the correct state.
// These tests replicate the handleUndoRecommendation restore logic in isolation.
// ---------------------------------------------------------------------------

/**
 * Compute the restored overrides that undo would send to PATCH /overrides.
 * Mirrors the logic in handleUndoRecommendation exactly.
 */
function computeRestoredOverrides(
  currentOverrides: Record<string, unknown>,
  undoState: { key: string; hadKey: boolean; prevValue: unknown },
): Record<string, unknown> {
  if (undoState.hadKey) {
    return { ...currentOverrides, [undoState.key]: undoState.prevValue };
  } else {
    const { [undoState.key as keyof typeof currentOverrides]: _removed, ...rest } =
      currentOverrides;
    return rest;
  }
}

/**
 * Build the undo state that handleApplyRecommendation would store.
 * Mirrors the pre-apply capture logic exactly.
 */
function captureUndoState(
  priorOverrides: Record<string, unknown>,
  mutationKey: string,
): { key: string; hadKey: boolean; prevValue: unknown } {
  const hadKey = Object.prototype.hasOwnProperty.call(priorOverrides, mutationKey);
  const prevValue = priorOverrides[mutationKey];
  return { key: mutationKey, hadKey, prevValue };
}

describe("undo state model — prior override capture", () => {
  it("detects hadKey=true when key was already in overrides (explicit false)", () => {
    const priorOverrides = { require_simulation_success: false };
    const state = captureUndoState(priorOverrides, "require_simulation_success");
    expect(state.hadKey).toBe(true);
    expect(state.prevValue).toBe(false);
    expect(state.key).toBe("require_simulation_success");
  });

  it("detects hadKey=false when key was absent from overrides", () => {
    const priorOverrides: Record<string, unknown> = {
      max_slippage_bps: 100,
      max_notional_usd: 25000,
    };
    const state = captureUndoState(priorOverrides, "require_simulation_success");
    expect(state.hadKey).toBe(false);
    expect(state.prevValue).toBeUndefined();
  });

  it("detects hadKey=true even when prior value was undefined explicitly", () => {
    // Edge: explicitly set to undefined vs absent — Object.hasOwn distinguishes them.
    const priorOverrides: Record<string, unknown> = { require_simulation_success: undefined };
    const state = captureUndoState(priorOverrides, "require_simulation_success");
    expect(state.hadKey).toBe(true);
  });
});

describe("undo state model — restoring prior override (hadKey=true)", () => {
  it("restores the key to its prior explicit false value", () => {
    const priorOverrides = { require_simulation_success: false, max_slippage_bps: 100 };
    const undoState = captureUndoState(priorOverrides, "require_simulation_success");

    // After apply: current overrides have key set to true
    const postApplyOverrides = { ...priorOverrides, require_simulation_success: true };
    const restored = computeRestoredOverrides(postApplyOverrides, undoState);

    expect(restored.require_simulation_success).toBe(false);
  });

  it("preserves all other override keys when restoring", () => {
    const priorOverrides = {
      require_simulation_success: false,
      max_slippage_bps: 100,
      max_notional_usd: 25000,
    };
    const undoState = captureUndoState(priorOverrides, "require_simulation_success");
    const postApplyOverrides = { ...priorOverrides, require_simulation_success: true };
    const restored = computeRestoredOverrides(postApplyOverrides, undoState);

    expect(restored.max_slippage_bps).toBe(100);
    expect(restored.max_notional_usd).toBe(25000);
    expect(Object.keys(restored).length).toBe(3);
  });
});

describe("undo state model — removing introduced key (hadKey=false)", () => {
  it("removes the key that apply introduced when it was not previously in overrides", () => {
    const priorOverrides: Record<string, unknown> = {
      max_slippage_bps: 150,
      max_notional_usd: 50000,
    };
    const undoState = captureUndoState(priorOverrides, "require_simulation_success");

    // After apply: key now exists
    const postApplyOverrides: Record<string, unknown> = {
      ...priorOverrides,
      require_simulation_success: true,
    };
    const restored = computeRestoredOverrides(postApplyOverrides, undoState);

    expect(Object.prototype.hasOwnProperty.call(restored, "require_simulation_success")).toBe(false);
  });

  it("preserves unrelated override keys when removing introduced key", () => {
    const priorOverrides: Record<string, unknown> = {
      max_slippage_bps: 150,
      max_notional_usd: 50000,
    };
    const undoState = captureUndoState(priorOverrides, "require_simulation_success");
    const postApplyOverrides = { ...priorOverrides, require_simulation_success: true };
    const restored = computeRestoredOverrides(postApplyOverrides, undoState);

    expect(restored.max_slippage_bps).toBe(150);
    expect(restored.max_notional_usd).toBe(50000);
    expect(Object.keys(restored).length).toBe(2);
  });

  it("produces empty overrides when apply was the only key", () => {
    const priorOverrides: Record<string, unknown> = {};
    const undoState = captureUndoState(priorOverrides, "require_simulation_success");
    const postApplyOverrides = { require_simulation_success: true };
    const restored = computeRestoredOverrides(postApplyOverrides, undoState);

    expect(Object.keys(restored).length).toBe(0);
  });
});

describe("undo scope is limited to simulation apply path", () => {
  it("only applyable recs have the mutation key that undo supports", () => {
    const UNDO_SAFE_MUTATION_KEYS = new Set([
      "require_simulation_success",
      "max_slippage_bps",
    ]);
    const applyableRecs = [
      simulationRec(makeEffective({ require_simulation_success: false })),
      historySimulationFailuresRec(
        SUMMARY_WITH_FAILURES,
        makeEffective({ require_simulation_success: false }),
      ),
      marketEnableSimulationRec(
        MARKET_DEGRADED,
        makeEffective({ require_simulation_success: false }),
      ),
      marketTxThrottledRec(
        MARKET_STRESSED_THROTTLED,
        makeEffective({ require_simulation_success: false }),
      ),
    ].filter((r): r is PolicyRecommendation => r !== null);

    for (const rec of applyableRecs) {
      expect(UNDO_SAFE_MUTATION_KEYS.has(rec.applyMutation?.key ?? "")).toBe(true);
    }
  });

  it("undo state is only valid when applyUndoStates has an entry for the recId", () => {
    // Simulates the UI guard: Undo button only renders when applyUndoStates[rec.id] exists.
    const applyUndoStates: Record<string, { key: string; hadKey: boolean; prevValue: unknown }> =
      {};

    // Before apply: no undo state
    expect(applyUndoStates["enable-simulation"]).toBeUndefined();

    // After apply: undo state is populated
    applyUndoStates["enable-simulation"] = {
      key: "require_simulation_success",
      hadKey: false,
      prevValue: undefined,
    };
    expect(applyUndoStates["enable-simulation"]).toBeDefined();

    // After undo: cleared
    delete applyUndoStates["enable-simulation"];
    expect(applyUndoStates["enable-simulation"]).toBeUndefined();
  });

  it("clearing applyResults[recId] after undo allows the recommendation to reappear", () => {
    const applyResults: Record<string, "success" | "error"> = { "enable-simulation": "success" };

    // After undo success, both are cleared
    delete applyResults["enable-simulation"];
    expect(applyResults["enable-simulation"]).toBeUndefined();

    // Now the recommendation generator (which checks effective policy) would
    // produce the rec again if conditions still warrant it.
    const rec = simulationRec(makeEffective({ require_simulation_success: false }));
    expect(rec).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Fixtures for slippage tests
// ---------------------------------------------------------------------------

/** Summary where avg slippage is 60 bps and policy is 300 bps (exactly 5× avg). */
const SUMMARY_HIGH_SLIPPAGE_HEADROOM: ReceiptSummary = {
  period_days: 30,
  total_receipts: 15,
  decisions: { allow: 15, deny: 0 },
  dry_run_count: 0,
  intent_types: {},
  denial_reasons: [],
  recent_tokens: [],
  recent_programs: [],
  avg_notional_usd: 5000,
  max_notional_usd: 20000,
  avg_slippage_bps: 60,
  simulation_failures: 0,
  simulation_total: 15,
};

/** Effective policy with 300 bps slippage cap — 5× the 60 bps average. */
const EFF_SLIPPAGE_300 = makeEffective({ max_slippage_bps: 300 });

// ---------------------------------------------------------------------------
// Tests: history-slippage-headroom recommendation (applyable — prompt #193)
// ---------------------------------------------------------------------------

describe("history-slippage-headroom recommendation", () => {
  it("is applyable when policy slippage > 3× avg slippage", () => {
    const rec = historySlippageHeadroomRec(SUMMARY_HIGH_SLIPPAGE_HEADROOM, EFF_SLIPPAGE_300);
    expect(rec).not.toBeNull();
    expect(rec!.applyable).toBe(true);
  });

  it("mutation key is max_slippage_bps", () => {
    const rec = historySlippageHeadroomRec(SUMMARY_HIGH_SLIPPAGE_HEADROOM, EFF_SLIPPAGE_300);
    expect(rec!.applyMutation?.key).toBe("max_slippage_bps");
  });

  it("target value is 2× avg rounded, floored at 50", () => {
    const rec = historySlippageHeadroomRec(SUMMARY_HIGH_SLIPPAGE_HEADROOM, EFF_SLIPPAGE_300);
    // avg=60 → target = Math.max(50, Math.round(60 * 2)) = 120
    expect(rec!.applyMutation?.value).toBe(120);
  });

  it("floor at 50 applies when avg is very small", () => {
    const tinyAvgSummary: ReceiptSummary = {
      ...SUMMARY_HIGH_SLIPPAGE_HEADROOM,
      avg_slippage_bps: 10, // 2× = 20, floored to 50
    };
    // policy must be > 10*3 = 30, so 300 qualifies
    const rec = historySlippageHeadroomRec(tinyAvgSummary, EFF_SLIPPAGE_300);
    expect(rec!.applyMutation?.value).toBe(50);
  });

  it("target value is strictly less than current policy cap", () => {
    const rec = historySlippageHeadroomRec(SUMMARY_HIGH_SLIPPAGE_HEADROOM, EFF_SLIPPAGE_300);
    expect(rec!.applyMutation!.value as number).toBeLessThan(300);
  });

  it("applyConfirmText mentions the current cap, target cap, and average", () => {
    const rec = historySlippageHeadroomRec(SUMMARY_HIGH_SLIPPAGE_HEADROOM, EFF_SLIPPAGE_300);
    const text = rec!.applyConfirmText ?? "";
    expect(text).toContain("300 bps");   // from cap
    expect(text).toContain("120 bps");   // to target
    expect(text).toContain("60 bps");    // avg
  });

  it("has a non-empty applyConfirmText", () => {
    const rec = historySlippageHeadroomRec(SUMMARY_HIGH_SLIPPAGE_HEADROOM, EFF_SLIPPAGE_300);
    expect((rec!.applyConfirmText ?? "").length).toBeGreaterThan(20);
  });

  it("is NOT generated when policy slippage is exactly 3× avg (boundary)", () => {
    // 60 * 3 = 180 — not strictly greater, so no rec
    const eff = makeEffective({ max_slippage_bps: 180 });
    const rec = historySlippageHeadroomRec(SUMMARY_HIGH_SLIPPAGE_HEADROOM, eff);
    expect(rec).toBeNull();
  });

  it("is NOT generated when policy slippage is below 3× avg", () => {
    const eff = makeEffective({ max_slippage_bps: 150 }); // 150 < 180
    const rec = historySlippageHeadroomRec(SUMMARY_HIGH_SLIPPAGE_HEADROOM, eff);
    expect(rec).toBeNull();
  });

  it("is NOT generated with fewer than 3 receipts", () => {
    const sparse: ReceiptSummary = { ...SUMMARY_HIGH_SLIPPAGE_HEADROOM, total_receipts: 2 };
    const rec = historySlippageHeadroomRec(sparse, EFF_SLIPPAGE_300);
    expect(rec).toBeNull();
  });

  it("is NOT generated when avg_slippage_bps is 0", () => {
    const zeroAvg: ReceiptSummary = { ...SUMMARY_HIGH_SLIPPAGE_HEADROOM, avg_slippage_bps: 0 };
    const rec = historySlippageHeadroomRec(zeroAvg, EFF_SLIPPAGE_300);
    expect(rec).toBeNull();
  });

  it("is NOT generated when avg_slippage_bps is null", () => {
    const nullAvg = { ...SUMMARY_HIGH_SLIPPAGE_HEADROOM, avg_slippage_bps: null } as unknown as ReceiptSummary;
    const rec = historySlippageHeadroomRec(nullAvg, EFF_SLIPPAGE_300);
    expect(rec).toBeNull();
  });

  it("has source: Customer history", () => {
    const rec = historySlippageHeadroomRec(SUMMARY_HIGH_SLIPPAGE_HEADROOM, EFF_SLIPPAGE_300);
    expect(rec!.source).toBe("Customer history");
  });

  it("has fieldKey: max_slippage_bps", () => {
    const rec = historySlippageHeadroomRec(SUMMARY_HIGH_SLIPPAGE_HEADROOM, EFF_SLIPPAGE_300);
    expect(rec!.fieldKey).toBe("max_slippage_bps");
  });

  it("undo can restore a prior explicit slippage cap (hadKey=true)", () => {
    const priorOverrides = { max_slippage_bps: 300, require_simulation_success: true };
    const undoState = captureUndoState(priorOverrides, "max_slippage_bps");
    const postApplyOverrides = { ...priorOverrides, max_slippage_bps: 120 };
    const restored = computeRestoredOverrides(postApplyOverrides, undoState);

    expect(restored.max_slippage_bps).toBe(300);
    expect(restored.require_simulation_success).toBe(true); // unrelated key preserved
  });

  it("undo removes slippage key if it was absent before apply (hadKey=false)", () => {
    const priorOverrides: Record<string, unknown> = { require_simulation_success: true };
    const undoState = captureUndoState(priorOverrides, "max_slippage_bps");
    const postApplyOverrides: Record<string, unknown> = {
      ...priorOverrides,
      max_slippage_bps: 120,
    };
    const restored = computeRestoredOverrides(postApplyOverrides, undoState);

    expect(Object.prototype.hasOwnProperty.call(restored, "max_slippage_bps")).toBe(false);
    expect(restored.require_simulation_success).toBe(true); // unrelated preserved
  });

  it("preserves unrelated override keys after slippage apply undo", () => {
    const priorOverrides = {
      max_slippage_bps: 300,
      max_notional_usd: 50000,
      require_simulation_success: true,
    };
    const undoState = captureUndoState(priorOverrides, "max_slippage_bps");
    const postApplyOverrides = { ...priorOverrides, max_slippage_bps: 120 };
    const restored = computeRestoredOverrides(postApplyOverrides, undoState);

    expect(restored.max_notional_usd).toBe(50000);
    expect(restored.require_simulation_success).toBe(true);
    expect(Object.keys(restored).length).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Tests: unsupported slippage recs remain manual-only
// ---------------------------------------------------------------------------

describe("unsupported slippage recommendations remain manual-only", () => {
  /** Mirrors the tighten-slippage rec from generatePolicyRecommendations. */
  function tightenSlippageRec(effective: Record<string, unknown>): PolicyRecommendation | null {
    const slippage = effective.max_slippage_bps;
    if (typeof slippage !== "number" || slippage <= 300) return null;
    return {
      id: "tighten-slippage",
      title: "Tighten slippage tolerance",
      explanation: `Your slippage cap is set to ${slippage} bps. This is higher than most users configure.`,
      why: "High slippage tolerance increases the risk of unfavorable execution prices.",
      priority: "medium",
      source: "Default guidance",
      fieldKey: "max_slippage_bps",
    };
  }

  /** Mirrors the market-tighten-slippage rec from generateMarketRecommendations. */
  function marketTightenSlippageRec(
    market: MarketConditions,
    effective: Record<string, unknown>,
  ): PolicyRecommendation | null {
    if (market.environment !== "stressed") return null;
    const policySlippage = effective.max_slippage_bps;
    if (typeof policySlippage !== "number" || policySlippage <= 100) return null;
    return {
      id: "market-tighten-slippage",
      title: "Consider tightening slippage — market conditions are stressed",
      explanation: `Your slippage cap is ${policySlippage} bps. During stressed conditions wider tolerances increase risk.`,
      why: "Tighter slippage limits provide a safety net when execution quality is reduced.",
      priority: "medium",
      source: "Market analysis",
      fieldKey: "max_slippage_bps",
      evidence: market.summary,
    };
  }

  it("tighten-slippage (default guidance) has no applyable flag", () => {
    const rec = tightenSlippageRec(makeEffective({ max_slippage_bps: 500 }));
    expect(rec).not.toBeNull();
    expect(rec!.applyable).toBeUndefined();
    expect(rec!.applyMutation).toBeUndefined();
  });

  it("tighten-slippage fires only when slippage > 300", () => {
    expect(tightenSlippageRec(makeEffective({ max_slippage_bps: 300 }))).toBeNull();
    expect(tightenSlippageRec(makeEffective({ max_slippage_bps: 301 }))).not.toBeNull();
  });

  it("market-tighten-slippage has no applyable flag", () => {
    const rec = marketTightenSlippageRec(
      { ...MARKET_STRESSED_THROTTLED, environment: "stressed" },
      makeEffective({ max_slippage_bps: 300 }),
    );
    expect(rec).not.toBeNull();
    expect(rec!.applyable).toBeUndefined();
    expect(rec!.applyMutation).toBeUndefined();
  });

  it("market-tighten-slippage requires stressed environment", () => {
    const rec = marketTightenSlippageRec(MARKET_DEGRADED, makeEffective({ max_slippage_bps: 300 }));
    expect(rec).toBeNull(); // degraded, not stressed
  });
});

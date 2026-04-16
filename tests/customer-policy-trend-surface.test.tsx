// @vitest-environment node
/**
 * Pure-function unit tests for lib/customer-policy-trend.ts.
 *
 * Uses the node environment (no jsdom) to avoid the 2 GB+ heap
 * consumption that jsdom incurs during setup in memory-constrained
 * WSL environments.  The functions under test have no real DOM
 * dependencies beyond localStorage, which is provided via vi.stubGlobal.
 *
 * Page integration tests (rendering CustomerPoliciesPage) are intentionally
 * excluded from this file — they require jsdom and a full Next.js mock tree
 * that exhausts available heap on this host.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  deriveReceiptTrendSignals,
  getMarketConditionCue,
  loadRecSnapshot,
  saveRecSnapshot,
  TREND_STATUS_DOT,
  TREND_STATUS_TEXT,
} from "@/lib/customer-policy-trend";
import type { ReceiptSummary, MarketConditions } from "@/lib/customer-auth";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** 30-day baseline: 20 receipts, 10% deny rate, avg $5 k */
const BASELINE: ReceiptSummary = {
  period_days: 30,
  total_receipts: 20,
  decisions: { allow: 18, deny: 2 },
  dry_run_count: 0,
  intent_types: {},
  denial_reasons: [],
  recent_tokens: [],
  recent_programs: [],
  avg_notional_usd: 5000,
  max_notional_usd: 20000,
  avg_slippage_bps: 80,
  simulation_failures: 2,
  simulation_total: 20,
};

/**
 * 7-day window: deny rate = 1/5 = 20%.
 * compareTrend(0.20, 0.10, 0.15): ratio = (0.20-0.10)/0.10 = 1.0 > 0.15 → "increasing" → elevated.
 */
const SHORT_ELEVATED: ReceiptSummary = {
  period_days: 7,
  total_receipts: 5,
  decisions: { allow: 4, deny: 1 },
  dry_run_count: 0,
  intent_types: {},
  denial_reasons: [],
  recent_tokens: [],
  recent_programs: [],
  avg_notional_usd: 5000,
  max_notional_usd: 20000,
  avg_slippage_bps: 80,
  simulation_failures: 0,
  simulation_total: 5,
};

/**
 * 7-day window: deny rate = 0/5 = 0%.
 * compareTrend(0, 0.10, 0.15): current=0, prior>0 → "decreasing" → improving.
 */
const SHORT_IMPROVING: ReceiptSummary = {
  period_days: 7,
  total_receipts: 5,
  decisions: { allow: 5, deny: 0 },
  dry_run_count: 0,
  intent_types: {},
  denial_reasons: [],
  recent_tokens: [],
  recent_programs: [],
  avg_notional_usd: 5000,
  max_notional_usd: 20000,
  avg_slippage_bps: 80,
  simulation_failures: 0,
  simulation_total: 5,
};

/** Under-data short summary — should suppress all trend signals (< 3 receipts). */
const SHORT_SPARSE: ReceiptSummary = {
  period_days: 7,
  total_receipts: 2,
  decisions: { allow: 2, deny: 0 },
  dry_run_count: 0,
  intent_types: {},
  denial_reasons: [],
  recent_tokens: [],
  recent_programs: [],
  avg_notional_usd: null,
  max_notional_usd: null,
  avg_slippage_bps: null,
  simulation_failures: 0,
  simulation_total: 2,
};

const MARKET_STRESSED: MarketConditions = {
  environment: "stressed",
  notes: ["High volatility detected"],
};

const MARKET_DEGRADED: MarketConditions = {
  environment: "degraded",
  notes: [],
};

const MARKET_NORMAL: MarketConditions = {
  environment: "normal",
  notes: [],
};

// ---------------------------------------------------------------------------
// localStorage stub helpers
// ---------------------------------------------------------------------------

function makeLocalStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
}

// ---------------------------------------------------------------------------
// deriveReceiptTrendSignals
// ---------------------------------------------------------------------------

describe("deriveReceiptTrendSignals", () => {
  it("returns empty array when both summaries are null", () => {
    expect(deriveReceiptTrendSignals(null, null)).toEqual([]);
  });

  it("returns empty array when short summary is null", () => {
    expect(deriveReceiptTrendSignals(null, BASELINE)).toEqual([]);
  });

  it("returns empty array when baseline summary is null", () => {
    expect(deriveReceiptTrendSignals(SHORT_ELEVATED, null)).toEqual([]);
  });

  it("returns empty array when short has fewer than 3 receipts", () => {
    expect(deriveReceiptTrendSignals(SHORT_SPARSE, BASELINE)).toEqual([]);
  });

  it("returns deny-rate signal with elevated status when recent rate is higher", () => {
    const signals = deriveReceiptTrendSignals(SHORT_ELEVATED, BASELINE);
    const denySignal = signals.find((s) => s.key === "deny-rate");
    expect(denySignal).toBeDefined();
    expect(denySignal?.status).toBe("elevated");
  });

  it("returns deny-rate signal with improving status when recent rate is lower", () => {
    const signals = deriveReceiptTrendSignals(SHORT_IMPROVING, BASELINE);
    const denySignal = signals.find((s) => s.key === "deny-rate");
    expect(denySignal).toBeDefined();
    expect(denySignal?.status).toBe("improving");
  });

  it("each signal has non-empty key, label, and detail", () => {
    const signals = deriveReceiptTrendSignals(SHORT_ELEVATED, BASELINE);
    for (const s of signals) {
      expect(s.key).toBeTruthy();
      expect(s.label).toBeTruthy();
      expect(s.detail).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// getMarketConditionCue
// ---------------------------------------------------------------------------

describe("getMarketConditionCue", () => {
  it("returns null for null input", () => {
    expect(getMarketConditionCue(null)).toBeNull();
  });

  it("returns null for normal market", () => {
    expect(getMarketConditionCue(MARKET_NORMAL)).toBeNull();
  });

  it("returns an elevated signal for degraded market", () => {
    const cue = getMarketConditionCue(MARKET_DEGRADED);
    expect(cue).not.toBeNull();
    expect(cue?.status).toBe("elevated");
    expect(cue?.key).toBe("market-conditions");
  });

  it("returns a worsening signal for stressed market", () => {
    const cue = getMarketConditionCue(MARKET_STRESSED);
    expect(cue).not.toBeNull();
    expect(cue?.status).toBe("worsening");
    expect(cue?.key).toBe("market-conditions");
  });
});

// ---------------------------------------------------------------------------
// loadRecSnapshot / saveRecSnapshot
// ---------------------------------------------------------------------------

describe("loadRecSnapshot / saveRecSnapshot", () => {
  let lsMock: ReturnType<typeof makeLocalStorageMock>;

  beforeEach(() => {
    lsMock = makeLocalStorageMock();
    // Stub window so typeof window !== "undefined" inside the functions.
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", lsMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns an empty Set when localStorage is empty", () => {
    const result = loadRecSnapshot();
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it("round-trips IDs through save and load", () => {
    saveRecSnapshot(["id-1", "id-2", "id-3"]);
    const result = loadRecSnapshot();
    expect(result.has("id-1")).toBe(true);
    expect(result.has("id-2")).toBe(true);
    expect(result.has("id-3")).toBe(true);
    expect(result.size).toBe(3);
  });

  it("returns empty Set for malformed JSON", () => {
    lsMock.setItem("atf_policy_rec_snapshot", "not-valid-json{{");
    const result = loadRecSnapshot();
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it("overwrites existing snapshot on save", () => {
    saveRecSnapshot(["old-id"]);
    saveRecSnapshot(["new-id-a", "new-id-b"]);
    const result = loadRecSnapshot();
    expect(result.has("old-id")).toBe(false);
    expect(result.has("new-id-a")).toBe(true);
    expect(result.size).toBe(2);
  });

  it("returns empty Set for non-array JSON value", () => {
    lsMock.setItem("atf_policy_rec_snapshot", JSON.stringify({ id: "wrong" }));
    const result = loadRecSnapshot();
    expect(result.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// TREND_STATUS_DOT / TREND_STATUS_TEXT completeness
// ---------------------------------------------------------------------------

const ALL_STATUSES = ["improving", "worsening", "elevated", "stable", "unavailable"] as const;

describe("TREND_STATUS_DOT", () => {
  it("has a non-empty Tailwind class for every status", () => {
    for (const status of ALL_STATUSES) {
      expect(TREND_STATUS_DOT[status]).toBeTruthy();
      expect(typeof TREND_STATUS_DOT[status]).toBe("string");
    }
  });
});

describe("TREND_STATUS_TEXT", () => {
  it("has a non-empty Tailwind class for every status", () => {
    for (const status of ALL_STATUSES) {
      expect(TREND_STATUS_TEXT[status]).toBeTruthy();
      expect(typeof TREND_STATUS_TEXT[status]).toBe("string");
    }
  });
});

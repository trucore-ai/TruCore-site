/**
 * Shared fixtures for customer-policy-overrides test suite.
 *
 * Contains policy shapes, history summaries, and market-condition fixtures
 * used across the split test files.  Mock function declarations live in each
 * individual test file so Vitest's module-isolation and vi.mock() hoisting
 * work correctly.
 */

// ---------------------------------------------------------------------------
// Plan / policy fixtures
// ---------------------------------------------------------------------------

export const FREE_POLICY = {
  plan_code: "free",
  plan_limits: { tx_limit_per_month: 100, policy_overrides_enabled: false },
  overrides: {},
  effective: {
    max_slippage_bps: 50,
    max_notional_usd: 1000,
    require_simulation_success: true,
  },
};

export const PRO_POLICY = {
  plan_code: "pro",
  plan_limits: { tx_limit_per_month: 5000, policy_overrides_enabled: true },
  overrides: {},
  effective: {
    max_slippage_bps: 100,
    max_notional_usd: 25000,
    require_simulation_success: true,
  },
};

export const PRO_POLICY_WITH_OVERRIDES = {
  plan_code: "pro",
  plan_limits: { tx_limit_per_month: 5000, policy_overrides_enabled: true },
  overrides: { max_slippage_bps: 200, max_notional_usd: 50000 },
  effective: {
    max_slippage_bps: 200,
    max_notional_usd: 50000,
    require_simulation_success: true,
  },
};

export const PRO_POLICY_WITH_PROGRAMS = {
  plan_code: "pro",
  plan_limits: { tx_limit_per_month: 5000, policy_overrides_enabled: true },
  overrides: {
    max_slippage_bps: 100,
    allowed_programs: ["prog1", "prog2"],
    denied_programs: ["bad1"],
  },
  effective: {
    max_slippage_bps: 100,
    max_notional_usd: 25000,
    require_simulation_success: true,
    allowed_programs: ["prog1", "prog2"],
    denied_programs: ["bad1"],
  },
};

export const PRO_POLICY_WITH_TOKEN_POLICY = {
  plan_code: "pro",
  plan_limits: { tx_limit_per_month: 5000, policy_overrides_enabled: true },
  overrides: {
    max_slippage_bps: 100,
    token_policy: {
      mode: "allowlist",
      allowed_mints: ["SOL", "USDC"],
      denied_mints: [],
    },
  },
  effective: {
    max_slippage_bps: 100,
    max_notional_usd: 25000,
    require_simulation_success: true,
    token_policy: {
      mode: "allowlist",
      allowed_mints: ["SOL", "USDC"],
      denied_mints: [],
    },
  },
};

/** Pro plan with require_simulation_success overridden to false. */
export const PRO_WITH_SIM_OVERRIDE = {
  plan_code: "pro",
  plan_limits: { tx_limit_per_month: 5000, policy_overrides_enabled: true },
  overrides: { require_simulation_success: false },
  effective: {
    max_slippage_bps: 150,
    max_notional_usd: 50000,
    require_simulation_success: false,
  },
};

/** Pro plan with require_simulation_success overridden to true (explicitly). */
export const PRO_WITH_SIM_OVERRIDE_TRUE = {
  plan_code: "pro",
  plan_limits: { tx_limit_per_month: 5000, policy_overrides_enabled: true },
  overrides: { require_simulation_success: true },
  effective: {
    max_slippage_bps: 150,
    max_notional_usd: 50000,
    require_simulation_success: true,
  },
};

// ---------------------------------------------------------------------------
// History / market fixtures
// ---------------------------------------------------------------------------

/** Receipt summary with meaningful history data for testing. */
export const HISTORY_SUMMARY = {
  period_days: 30,
  total_receipts: 42,
  decisions: { allow: 38, deny: 4 },
  dry_run_count: 5,
  intent_types: { swap: 30, multi_hop_swap: 8, lend: 4 },
  denial_reasons: ["slippage_exceeded", "notional_limit"],
  recent_tokens: ["SOL", "USDC", "BONK"],
  recent_programs: ["JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"],
  avg_notional_usd: 5200,
  max_notional_usd: 45000,
  avg_slippage_bps: 85,
  simulation_failures: 3,
  simulation_total: 40,
};

/** Empty history summary (new customer). */
export const EMPTY_HISTORY_SUMMARY = {
  period_days: 30,
  total_receipts: 0,
  decisions: {},
  dry_run_count: 0,
  intent_types: {},
  denial_reasons: [],
  recent_tokens: [],
  recent_programs: [],
  avg_notional_usd: null,
  max_notional_usd: null,
  avg_slippage_bps: null,
  simulation_failures: 0,
  simulation_total: 0,
};

/** Market conditions — stable (healthy). */
export const MARKET_STABLE = {
  environment: "stable" as const,
  rpc_status: "ok",
  throttled_methods: [],
  throttle_rate_pct: 0.0,
  recommendation: null,
  summary:
    "Execution environment is stable — no infrastructure issues detected.",
  captured_at: Date.now() / 1000,
  signal_freshness: {
    status: "fresh" as const,
    last_updated_at: Date.now() / 1000,
  },
};

/** Market conditions — degraded. */
export const MARKET_DEGRADED = {
  environment: "degraded" as const,
  rpc_status: "degraded",
  throttled_methods: ["getLatestBlockhash"],
  throttle_rate_pct: 2.5,
  recommendation: "increase_backoff",
  summary:
    "Execution environment shows minor degradation — 2.5% of requests are being throttled.",
  captured_at: Date.now() / 1000,
  signal_freshness: {
    status: "fresh" as const,
    last_updated_at: Date.now() / 1000,
  },
};

/** Market conditions — stressed. */
export const MARKET_STRESSED = {
  environment: "stressed" as const,
  rpc_status: "throttled",
  throttled_methods: [
    "getLatestBlockhash",
    "sendTransaction",
    "getBalance",
  ],
  throttle_rate_pct: 14.8,
  recommendation: "upgrade_plan",
  summary:
    "Execution environment is under stress — getLatestBlockhash, sendTransaction, getBalance experiencing elevated throttling (14.8% error rate).",
  captured_at: Date.now() / 1000,
  signal_freshness: {
    status: "fresh" as const,
    last_updated_at: Date.now() / 1000,
  },
};

/** Default empty PIL recommendations response. */
export const EMPTY_PIL = {
  recommendations: [],
  record_count: 0,
  confidence_summary: "low",
  captured_at: Date.now() / 1000,
  plan: "free",
};

/** Default empty cohort benchmarks response. */
export const EMPTY_BENCHMARKS = {
  benchmarks: [],
  cohort_size: 0,
  captured_at: Date.now() / 1000,
  plan: "free",
};

/** Default empty external context response. */
export const EMPTY_EXTERNAL = {
  recommendations: [],
  captured_at: Date.now() / 1000,
  plan: "free",
};

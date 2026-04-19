import { vi } from "vitest";

export const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: mockReplace }),
}));

export const mockFetchPolicy = vi.fn();
export const mockUpdatePolicyOverrides = vi.fn();
export const mockFetchReceiptSummary = vi.fn();
export const mockFetchMarketConditions = vi.fn();
export const mockFetchPilRecommendations = vi.fn();
export const mockFetchCohortBenchmarks = vi.fn();
export const mockFetchExternalContext = vi.fn();

vi.mock("@/lib/customer-auth", () => {
  class ApiError extends Error {
    code: string;
    retryAfterSeconds?: number;
    constructor(code: string, message: string, retryAfterSeconds?: number) {
      super(message);
      this.name = "ApiError";
      this.code = code;
      this.retryAfterSeconds = retryAfterSeconds;
    }
  }
  return {
    isLoggedIn: () => true,
    fetchPolicy: (...args: unknown[]) => mockFetchPolicy(...args),
    updatePolicyOverrides: (...args: unknown[]) => mockUpdatePolicyOverrides(...args),
    fetchReceiptSummary: (...args: unknown[]) => mockFetchReceiptSummary(...args),
    fetchMarketConditions: (...args: unknown[]) => mockFetchMarketConditions(...args),
    fetchPilRecommendations: (...args: unknown[]) => mockFetchPilRecommendations(...args),
    fetchCohortBenchmarks: (...args: unknown[]) => mockFetchCohortBenchmarks(...args),
    fetchExternalContext: (...args: unknown[]) => mockFetchExternalContext(...args),
    ApiError,
  };
});

import CustomerPoliciesPage from "@/app/customer/policies/page";
export { CustomerPoliciesPage };

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
  ...PRO_POLICY,
  overrides: { max_slippage_bps: 200, max_notional_usd: 50000 },
  effective: {
    ...PRO_POLICY.effective,
    max_slippage_bps: 200,
    max_notional_usd: 50000,
  },
};

export const PRO_POLICY_WITH_PROGRAMS = {
  ...PRO_POLICY,
  overrides: {
    max_slippage_bps: 100,
    allowed_programs: ["prog1", "prog2"],
    denied_programs: ["bad1"],
  },
  effective: {
    ...PRO_POLICY.effective,
    allowed_programs: ["prog1", "prog2"],
    denied_programs: ["bad1"],
  },
};

export const PRO_POLICY_WITH_TOKEN_POLICY = {
  ...PRO_POLICY,
  overrides: {
    max_slippage_bps: 100,
    token_policy: {
      mode: "allowlist",
      allowed_mints: ["SOL", "USDC"],
      denied_mints: [],
    },
  },
  effective: {
    ...PRO_POLICY.effective,
    token_policy: {
      mode: "allowlist",
      allowed_mints: ["SOL", "USDC"],
      denied_mints: [],
    },
  },
};

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

export const MARKET_STABLE = {
  environment: "stable" as const,
  rpc_status: "ok",
  throttled_methods: [],
  throttle_rate_pct: 0,
  recommendation: null,
  summary: "Execution environment is stable — no infrastructure issues detected.",
  captured_at: Date.now() / 1000,
  signal_freshness: { status: "fresh" as const, last_updated_at: Date.now() / 1000 },
};

export const MARKET_DEGRADED = {
  environment: "degraded" as const,
  rpc_status: "degraded",
  throttled_methods: ["getLatestBlockhash"],
  throttle_rate_pct: 2.5,
  recommendation: "increase_backoff",
  summary: "Execution environment shows minor degradation — 2.5% of requests are being throttled.",
  captured_at: Date.now() / 1000,
  signal_freshness: { status: "fresh" as const, last_updated_at: Date.now() / 1000 },
};

export const MARKET_STRESSED = {
  environment: "stressed" as const,
  rpc_status: "throttled",
  throttled_methods: ["getLatestBlockhash", "sendTransaction", "getBalance"],
  throttle_rate_pct: 14.8,
  recommendation: "upgrade_plan",
  summary: "Execution environment is under stress — elevated throttling detected.",
  captured_at: Date.now() / 1000,
  signal_freshness: { status: "fresh" as const, last_updated_at: Date.now() / 1000 },
};

export function resetPolicyMocks() {
  vi.clearAllMocks();
  mockFetchReceiptSummary.mockResolvedValue(EMPTY_HISTORY_SUMMARY);
  mockFetchMarketConditions.mockResolvedValue(MARKET_STABLE);
  mockFetchPilRecommendations.mockResolvedValue({
    recommendations: [],
    record_count: 0,
    confidence_summary: "low",
    captured_at: Date.now() / 1000,
    plan: "free",
  });
  mockFetchCohortBenchmarks.mockResolvedValue({
    benchmarks: [],
    cohort_size: 0,
    captured_at: Date.now() / 1000,
    plan: "free",
  });
  mockFetchExternalContext.mockResolvedValue({
    recommendations: [],
    captured_at: Date.now() / 1000,
    plan: "free",
  });
}

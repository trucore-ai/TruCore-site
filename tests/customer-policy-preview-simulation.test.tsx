/**
 * CustomerPoliciesPage — preview and simulation surfaces.
 *
 * Split from customer-policy-overrides.test.tsx to keep file-level memory
 * usage lower during wildcard policy runs.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: mockReplace }),
}));

const mockFetchPolicy = vi.fn();
const mockUpdatePolicyOverrides = vi.fn();
const mockFetchReceiptSummary = vi.fn();
const mockFetchMarketConditions = vi.fn();
const mockFetchPilRecommendations = vi.fn();
const mockFetchCohortBenchmarks = vi.fn();
const mockFetchExternalContext = vi.fn();

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
    updatePolicyOverrides: (...args: unknown[]) =>
      mockUpdatePolicyOverrides(...args),
    fetchReceiptSummary: (...args: unknown[]) =>
      mockFetchReceiptSummary(...args),
    fetchMarketConditions: (...args: unknown[]) =>
      mockFetchMarketConditions(...args),
    fetchPilRecommendations: (...args: unknown[]) =>
      mockFetchPilRecommendations(...args),
    fetchCohortBenchmarks: (...args: unknown[]) =>
      mockFetchCohortBenchmarks(...args),
    fetchExternalContext: (...args: unknown[]) =>
      mockFetchExternalContext(...args),
    ApiError,
  };
});

import CustomerPoliciesPage from "@/app/customer/policies/page";

const PRO_POLICY = {
  plan_code: "pro",
  plan_limits: { tx_limit_per_month: 5000, policy_overrides_enabled: true },
  overrides: {},
  effective: {
    max_slippage_bps: 100,
    max_notional_usd: 25000,
    require_simulation_success: true,
  },
};

const PRO_POLICY_WITH_OVERRIDES = {
  plan_code: "pro",
  plan_limits: { tx_limit_per_month: 5000, policy_overrides_enabled: true },
  overrides: { max_slippage_bps: 200, max_notional_usd: 50000 },
  effective: {
    max_slippage_bps: 200,
    max_notional_usd: 50000,
    require_simulation_success: true,
  },
};

const PRO_POLICY_WITH_PROGRAMS = {
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

const PRO_POLICY_WITH_TOKEN_POLICY = {
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

const EMPTY_HISTORY_SUMMARY = {
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

const MARKET_STABLE = {
  environment: "stable" as const,
  rpc_status: "ok",
  throttled_methods: [],
  throttle_rate_pct: 0.0,
  recommendation: null,
  summary: "Execution environment is stable — no infrastructure issues detected.",
  captured_at: Date.now() / 1000,
  signal_freshness: { status: "fresh" as const, last_updated_at: Date.now() / 1000 },
};

describe("CustomerPoliciesPage preview and simulation", () => {
  beforeEach(() => {
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
  });

  describe("effective policy preview", () => {
    it("renders policy-at-a-glance section in view mode", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Policy at a Glance")).toBeTruthy();
      });

      expect(screen.getByTestId("policy-preview")).toBeTruthy();
      expect(screen.getByTestId("policy-rules")).toBeTruthy();
    });

    it("renders helper copy that points users to Policy Controls", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("effective-policy-controls-hint")).toBeTruthy();
      });

      expect(screen.getByText(/use Policy Controls above and save your policy controls/i)).toBeTruthy();
    });

    it("shows plain-English rule for transaction limits", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/Transactions above \$25,000 USD will be denied/),
        ).toBeTruthy();
      });
    });

    it("shows plain-English rule for slippage", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText(/Slippage is capped at 100 bps/)).toBeTruthy();
      });
    });

    it("shows plain-English rule for simulation", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(
          screen.getByText("Simulation must succeed before execution."),
        ).toBeTruthy();
      });
    });

    it("shows token policy explanation for allowlist", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_TOKEN_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/2 approved tokens are permitted/),
        ).toBeTruthy();
      });
    });

    it("marks overridden rules with Override badge", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_OVERRIDES);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("policy-rules")).toBeTruthy();
      });

      const rules = screen.getByTestId("policy-rules");
      const overrideBadges = rules.querySelectorAll("span");
      const overrideTexts = Array.from(overrideBadges).map((el) => el.textContent);
      expect(overrideTexts.some((t) => t === "Override")).toBe(true);
      expect(overrideTexts.some((t) => t === "Default")).toBe(true);
    });

    it("shows what-this-means outcomes section", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("policy-outcomes")).toBeTruthy();
      });

      expect(screen.getByText("What this means")).toBeTruthy();
      expect(
        screen.getByText("If simulation fails, execution will not proceed."),
      ).toBeTruthy();
    });

    it("hides preview in edit mode", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      expect(screen.queryByTestId("policy-preview")).toBeNull();
    });
  });

  describe("policy simulation preview", () => {
    it("renders simulation section in view mode", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("policy-simulation")).toBeTruthy();
      });

      expect(screen.getByText("How Your Policy Behaves")).toBeTruthy();
      expect(screen.getByTestId("simulation-scenarios")).toBeTruthy();
    });

    it("generates denied scenario for exceeding USD limit", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Large USD transaction")).toBeTruthy();
      });

      expect(screen.getByText(/Exceeds your \$25,000 USD transaction limit/)).toBeTruthy();
    });

    it("generates allowed scenario for normal USD transaction", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Normal USD transaction")).toBeTruthy();
      });

      expect(screen.getByText(/Within your \$25,000 USD transaction limit/)).toBeTruthy();
    });

    it("generates denied scenario for high slippage", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("High-slippage swap")).toBeTruthy();
      });

      expect(screen.getByText(/Slippage exceeds your 100 bps cap/)).toBeTruthy();
    });

    it("generates denied scenario for failed simulation", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Failed simulation")).toBeTruthy();
      });

      expect(screen.getByText(/requires simulation to succeed/)).toBeTruthy();
    });

    it("generates token policy scenarios for allowlist mode", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_TOKEN_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Approved token swap")).toBeTruthy();
      });

      expect(screen.getByText("Unlisted token swap")).toBeTruthy();
      expect(screen.getByText(/on your approved token list/)).toBeTruthy();
      expect(screen.getByText(/Only tokens on your allowlist are permitted/)).toBeTruthy();
    });

    it("generates program control scenarios for denied programs", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_PROGRAMS);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Blocked program call")).toBeTruthy();
      });

      expect(screen.getByText(/on your block list/)).toBeTruthy();
    });

    it("shows Allowed and Denied outcome badges", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("simulation-scenarios")).toBeTruthy();
      });

      const badges = screen.getAllByTestId("scenario-outcome");
      const texts = badges.map((b) => b.textContent);
      expect(texts.some((t) => t === "Allowed")).toBe(true);
      expect(texts.some((t) => t === "Denied")).toBe(true);
    });

    it("hides simulation section in edit mode", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      expect(screen.queryByTestId("policy-simulation")).toBeNull();
    });

    it("shows disclaimer that scenarios are not live transactions", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText(/not live transactions/)).toBeTruthy();
      });
    });
  });
});

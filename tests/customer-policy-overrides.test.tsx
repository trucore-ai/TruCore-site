import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FREE_POLICY = {
  plan_code: "free",
  plan_limits: { tx_limit_per_month: 100, policy_overrides_enabled: false },
  overrides: {},
  effective: {
    max_slippage_bps: 50,
    max_notional_usd: 1000,
    require_simulation_success: true,
  },
};

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

/** Receipt summary with meaningful history data for testing. */
const HISTORY_SUMMARY = {
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

/** Market conditions — stable (healthy). */
const MARKET_STABLE = {
  environment: "stable" as const,
  rpc_status: "ok",
  throttled_methods: [],
  throttle_rate_pct: 0.0,
  recommendation: null,
  summary: "Execution environment is stable — no infrastructure issues detected.",
  captured_at: Date.now() / 1000,
};

/** Market conditions — degraded. */
const MARKET_DEGRADED = {
  environment: "degraded" as const,
  rpc_status: "degraded",
  throttled_methods: ["getLatestBlockhash"],
  throttle_rate_pct: 2.5,
  recommendation: "increase_backoff",
  summary: "Execution environment shows minor degradation — 2.5% of requests are being throttled.",
  captured_at: Date.now() / 1000,
};

/** Market conditions — stressed. */
const MARKET_STRESSED = {
  environment: "stressed" as const,
  rpc_status: "throttled",
  throttled_methods: ["getLatestBlockhash", "sendTransaction", "getBalance"],
  throttle_rate_pct: 14.8,
  recommendation: "upgrade_plan",
  summary: "Execution environment is under stress — getLatestBlockhash, sendTransaction, getBalance experiencing elevated throttling (14.8% error rate).",
  captured_at: Date.now() / 1000,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CustomerPoliciesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: history summary returns empty (no history).  Tests that need
    // history data will override this.
    mockFetchReceiptSummary.mockResolvedValue(EMPTY_HISTORY_SUMMARY);
    // Default: market conditions returns stable (no market recs).
    mockFetchMarketConditions.mockResolvedValue(MARKET_STABLE);
    // Default: PIL returns empty (no intelligence recs).
    mockFetchPilRecommendations.mockResolvedValue({
      recommendations: [],
      record_count: 0,
      confidence_summary: "low",
      captured_at: Date.now() / 1000,
      plan: "free",
    });
    // Default: benchmarks returns empty (no cohort recs).
    mockFetchCohortBenchmarks.mockResolvedValue({
      benchmarks: [],
      cohort_size: 0,
      captured_at: Date.now() / 1000,
      plan: "free",
    });
    // Default: external context returns empty (no external recs).
    mockFetchExternalContext.mockResolvedValue({
      recommendations: [],
      captured_at: Date.now() / 1000,
      plan: "free",
    });
  });

  // -----------------------------------------------------------------------
  // Free plan — read-only
  // -----------------------------------------------------------------------

  describe("Free plan (read-only)", () => {
    it("renders policy data without edit controls", async () => {
      mockFetchPolicy.mockResolvedValue(FREE_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Policy & Protections")).toBeTruthy();
      });

      // Plan badge (appears in header text and badge)
      expect(screen.getAllByText("Free").length).toBeGreaterThanOrEqual(1);

      // No edit button
      expect(screen.queryByText("Edit Overrides")).toBeNull();

      // Shows upsell footer
      expect(
        screen.getByText(/Policy customization is available on Pro plans/),
      ).toBeTruthy();
    });

    it("shows 'Not available on this plan' for overrides status", async () => {
      mockFetchPolicy.mockResolvedValue(FREE_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Not available on this plan")).toBeTruthy();
      });
    });
  });

  // -----------------------------------------------------------------------
  // Entitled plan — editable
  // -----------------------------------------------------------------------

  describe("Pro plan (editable)", () => {
    it("renders Edit Overrides button when overrides are enabled", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      // No upsell footer
      expect(
        screen.queryByText(/Policy customization is available on Pro plans/),
      ).toBeNull();
    });

    it("shows editable form fields when Edit Overrides is clicked", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      // Form fields visible
      expect(screen.getByLabelText("Max Slippage (bps)")).toBeTruthy();
      expect(
        screen.getByLabelText("Max Transaction Value (USD)"),
      ).toBeTruthy();
      expect(screen.getByLabelText("Max Value (SOL)")).toBeTruthy();
      expect(
        screen.getByLabelText("Require Simulation Success"),
      ).toBeTruthy();
      // List fields have labels displayed
      expect(screen.getByText("Allowed Programs")).toBeTruthy();
      expect(screen.getByText("Denied Programs")).toBeTruthy();

      // Action buttons
      expect(screen.getByText("Save Overrides")).toBeTruthy();
      expect(screen.getByText("Cancel")).toBeTruthy();
    });

    it("pre-populates form with current override values", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_OVERRIDES);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      const slippageInput = screen.getByLabelText(
        "Max Slippage (bps)",
      ) as HTMLInputElement;
      expect(slippageInput.value).toBe("200");

      const notionalInput = screen.getByLabelText(
        "Max Transaction Value (USD)",
      ) as HTMLInputElement;
      expect(notionalInput.value).toBe("50000");
    });

    it("cancels edit mode without saving", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));
      expect(screen.getByText("Save Overrides")).toBeTruthy();

      fireEvent.click(screen.getByText("Cancel"));
      expect(screen.queryByText("Save Overrides")).toBeNull();
      expect(mockUpdatePolicyOverrides).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Successful save
  // -----------------------------------------------------------------------

  describe("save overrides", () => {
    it("saves overrides and refreshes policy data", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      mockUpdatePolicyOverrides.mockResolvedValue({
        overrides: { max_slippage_bps: 200 },
        message: "Policy overrides updated successfully",
      });

      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      const callsBefore = mockFetchPolicy.mock.calls.length;

      fireEvent.click(screen.getByText("Edit Overrides"));

      const slippageInput = screen.getByLabelText("Max Slippage (bps)");
      fireEvent.change(slippageInput, { target: { value: "200" } });

      await act(async () => {
        fireEvent.click(screen.getByText("Save Overrides"));
      });

      await waitFor(() => {
        expect(mockUpdatePolicyOverrides).toHaveBeenCalledTimes(1);
      });

      // The payload must contain max_slippage_bps: 200
      const payload = mockUpdatePolicyOverrides.mock.calls[0][0] as Record<string, unknown>;
      expect(payload.max_slippage_bps).toBe(200);

      // Should exit edit mode and show success
      await waitFor(() => {
        expect(screen.queryByText("Save Overrides")).toBeNull();
        expect(
          screen.getByText("Policy overrides saved successfully."),
        ).toBeTruthy();
      });

      // Policy should have been re-fetched after save
      expect(mockFetchPolicy.mock.calls.length).toBeGreaterThan(callsBefore);
    });

    it("validates number fields before saving", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      const slippageInput = screen.getByLabelText("Max Slippage (bps)");
      fireEvent.change(slippageInput, { target: { value: "99999" } });

      await act(async () => {
        fireEvent.click(screen.getByText("Save Overrides"));
      });

      // Should show validation error, not call API
      expect(
        screen.getByText(/must be a number between/),
      ).toBeTruthy();
      expect(mockUpdatePolicyOverrides).not.toHaveBeenCalled();
    });

    it("preserves non-editable overrides when saving", async () => {
      const policyWithExtraOverrides = {
        ...PRO_POLICY,
        overrides: {
          max_slippage_bps: 100,
          blocked_programs: ["program123"],
        },
      };
      mockFetchPolicy
        .mockResolvedValueOnce(policyWithExtraOverrides)
        .mockResolvedValueOnce(policyWithExtraOverrides);
      mockUpdatePolicyOverrides.mockResolvedValue({
        overrides: { max_slippage_bps: 150, blocked_programs: ["program123"] },
        message: "ok",
      });

      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      const slippageInput = screen.getByLabelText("Max Slippage (bps)");
      fireEvent.change(slippageInput, { target: { value: "150" } });

      await act(async () => {
        fireEvent.click(screen.getByText("Save Overrides"));
      });

      await waitFor(() => {
        expect(mockUpdatePolicyOverrides).toHaveBeenCalledWith({
          max_slippage_bps: 150,
          blocked_programs: ["program123"],
        });
      });
    });
  });

  // -----------------------------------------------------------------------
  // Save failure
  // -----------------------------------------------------------------------

  describe("save failure", () => {
    it("shows error message and preserves form state", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      mockUpdatePolicyOverrides.mockRejectedValue(
        new Error("Your plan does not support policy overrides."),
      );

      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      const slippageInput = screen.getByLabelText(
        "Max Slippage (bps)",
      ) as HTMLInputElement;
      fireEvent.change(slippageInput, { target: { value: "150" } });

      await act(async () => {
        fireEvent.click(screen.getByText("Save Overrides"));
      });

      await waitFor(() => {
        expect(
          screen.getByText("Your plan does not support policy overrides."),
        ).toBeTruthy();
      });

      // Form should still be visible with user's values
      expect(screen.getByText("Save Overrides")).toBeTruthy();
      expect(
        (screen.getByLabelText("Max Slippage (bps)") as HTMLInputElement).value,
      ).toBe("150");
    });
  });

  // -----------------------------------------------------------------------
  // max_value_sol field
  // -----------------------------------------------------------------------

  describe("max_value_sol field", () => {
    it("saves max_value_sol as a number", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      mockUpdatePolicyOverrides.mockResolvedValue({
        overrides: { max_value_sol: 500 },
        message: "Policy overrides updated successfully",
      });

      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      const solInput = screen.getByLabelText("Max Value (SOL)");
      fireEvent.change(solInput, { target: { value: "500" } });

      await act(async () => {
        fireEvent.click(screen.getByText("Save Overrides"));
      });

      await waitFor(() => {
        expect(mockUpdatePolicyOverrides).toHaveBeenCalledTimes(1);
      });

      const payload = mockUpdatePolicyOverrides.mock.calls[0][0] as Record<string, unknown>;
      expect(payload.max_value_sol).toBe(500);
    });

    it("validates max_value_sol range (1–100,000)", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      const solInput = screen.getByLabelText("Max Value (SOL)");
      fireEvent.change(solInput, { target: { value: "999999" } });

      await act(async () => {
        fireEvent.click(screen.getByText("Save Overrides"));
      });

      expect(screen.getByText(/must be a number between/)).toBeTruthy();
      expect(mockUpdatePolicyOverrides).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Program list editors
  // -----------------------------------------------------------------------

  describe("program list editors", () => {
    it("pre-populates program lists from overrides", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_PROGRAMS);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      // Should show existing program items as tags
      expect(screen.getByText("prog1")).toBeTruthy();
      expect(screen.getByText("prog2")).toBeTruthy();
      expect(screen.getByText("bad1")).toBeTruthy();
    });

    it("adds programs to the allowed list and saves", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      mockUpdatePolicyOverrides.mockResolvedValue({
        overrides: { allowed_programs: ["newProg"] },
        message: "ok",
      });

      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      // Type into the allowed programs input and press Enter
      const input = screen.getByLabelText("Allowed Programs");
      fireEvent.change(input, { target: { value: "newProg" } });
      fireEvent.keyDown(input, { key: "Enter" });

      // Tag should appear
      expect(screen.getByText("newProg")).toBeTruthy();

      await act(async () => {
        fireEvent.click(screen.getByText("Save Overrides"));
      });

      await waitFor(() => {
        expect(mockUpdatePolicyOverrides).toHaveBeenCalledTimes(1);
      });

      const payload = mockUpdatePolicyOverrides.mock.calls[0][0] as Record<string, unknown>;
      expect(payload.allowed_programs).toEqual(["newProg"]);
    });

    it("removes a program from a list when × is clicked", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_PROGRAMS);
      mockUpdatePolicyOverrides.mockResolvedValue({
        overrides: { max_slippage_bps: 100, allowed_programs: ["prog2"], denied_programs: ["bad1"] },
        message: "ok",
      });

      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      // Remove prog1
      const removeBtn = screen.getByLabelText("Remove prog1");
      fireEvent.click(removeBtn);

      // prog1 should be gone
      expect(screen.queryByText("prog1")).toBeNull();
      // prog2 should still be there
      expect(screen.getByText("prog2")).toBeTruthy();

      await act(async () => {
        fireEvent.click(screen.getByText("Save Overrides"));
      });

      await waitFor(() => {
        expect(mockUpdatePolicyOverrides).toHaveBeenCalledTimes(1);
      });

      const payload = mockUpdatePolicyOverrides.mock.calls[0][0] as Record<string, unknown>;
      expect(payload.allowed_programs).toEqual(["prog2"]);
    });

    it("omits empty program lists from save payload", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      mockUpdatePolicyOverrides.mockResolvedValue({
        overrides: {},
        message: "ok",
      });

      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      // Don't add any programs — just save
      await act(async () => {
        fireEvent.click(screen.getByText("Save Overrides"));
      });

      await waitFor(() => {
        expect(mockUpdatePolicyOverrides).toHaveBeenCalledTimes(1);
      });

      const payload = mockUpdatePolicyOverrides.mock.calls[0][0] as Record<string, unknown>;
      // Empty lists should be omitted
      expect(payload.allowed_programs).toBeUndefined();
      expect(payload.denied_programs).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // -----------------------------------------------------------------------
  // Token policy editor
  // -----------------------------------------------------------------------

  describe("token policy editor", () => {
    it("shows token policy section in edit mode for pro plan", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      expect(screen.getByText("Token Access Policy")).toBeTruthy();
      expect(screen.getByTestId("token-mode-unrestricted")).toBeTruthy();
      expect(screen.getByTestId("token-mode-denylist")).toBeTruthy();
      expect(screen.getByTestId("token-mode-allowlist")).toBeTruthy();
    });

    it("defaults to unrestricted mode when no token_policy override exists", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      // Unrestricted button should have the selected styling (amber border)
      const unrestrictedBtn = screen.getByTestId("token-mode-unrestricted");
      expect(unrestrictedBtn.className).toContain("border-amber");
    });

    it("initializes from existing token_policy override", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_TOKEN_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      // Allowlist button should be selected
      const allowlistBtn = screen.getByTestId("token-mode-allowlist");
      expect(allowlistBtn.className).toContain("border-amber");

      // Mints should appear as chips
      expect(screen.getByText("SOL")).toBeTruthy();
      expect(screen.getByText("USDC")).toBeTruthy();
    });

    it("switching to allowlist mode shows mint editor", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));
      fireEvent.click(screen.getByTestId("token-mode-allowlist"));

      // Should show the quick-add section and custom input
      expect(screen.getByText("Quick add popular tokens:")).toBeTruthy();
      expect(screen.getByPlaceholderText("Token symbol or mint address")).toBeTruthy();
    });

    it("switching to denylist mode shows mint editor", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));
      fireEvent.click(screen.getByTestId("token-mode-denylist"));

      expect(screen.getByText("Quick add popular tokens:")).toBeTruthy();
    });

    it("unrestricted mode hides mint editor", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      // Default is unrestricted — no mint input should be shown
      expect(screen.queryByPlaceholderText("Token symbol or mint address")).toBeNull();
    });

    it("adds a token via quick-add button", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));
      fireEvent.click(screen.getByTestId("token-mode-allowlist"));

      // Click quick-add for SOL
      fireEvent.click(screen.getByText("+ SOL"));

      // SOL should now appear as a chip (without the + prefix)
      expect(screen.getByTitle("SOL")).toBeTruthy();
      expect(screen.getByLabelText("Remove SOL")).toBeTruthy();
    });

    it("removes a token by clicking the × button", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_TOKEN_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      // SOL and USDC should be present
      expect(screen.getByLabelText("Remove SOL")).toBeTruthy();
      expect(screen.getByLabelText("Remove USDC")).toBeTruthy();

      // Remove SOL
      fireEvent.click(screen.getByLabelText("Remove SOL"));

      // SOL should be gone, USDC should remain
      expect(screen.queryByLabelText("Remove SOL")).toBeNull();
      expect(screen.getByLabelText("Remove USDC")).toBeTruthy();
    });

    it("adds a custom mint via text input", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));
      fireEvent.click(screen.getByTestId("token-mode-allowlist"));

      const input = screen.getByPlaceholderText("Token symbol or mint address");
      fireEvent.change(input, { target: { value: "customMint123" } });
      fireEvent.keyDown(input, { key: "Enter" });

      // Chip should appear
      expect(screen.getByTitle("customMint123")).toBeTruthy();
    });

    it("includes token_policy in save payload for non-default mode", async () => {
      mockFetchPolicy
        .mockResolvedValueOnce(PRO_POLICY)
        .mockResolvedValueOnce(PRO_POLICY);
      mockUpdatePolicyOverrides.mockResolvedValue({
        overrides: { token_policy: { mode: "allowlist", allowed_mints: ["SOL"], denied_mints: [] } },
        message: "ok",
      });

      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));
      fireEvent.click(screen.getByTestId("token-mode-allowlist"));
      fireEvent.click(screen.getByText("+ SOL"));

      await act(async () => {
        fireEvent.click(screen.getByText("Save Overrides"));
      });

      await waitFor(() => {
        expect(mockUpdatePolicyOverrides).toHaveBeenCalledWith(
          expect.objectContaining({
            token_policy: {
              mode: "allowlist",
              allowed_mints: ["SOL"],
              denied_mints: [],
            },
          }),
        );
      });
    });

    it("omits token_policy from save payload when default unrestricted", async () => {
      mockFetchPolicy
        .mockResolvedValueOnce(PRO_POLICY)
        .mockResolvedValueOnce(PRO_POLICY);
      mockUpdatePolicyOverrides.mockResolvedValue({
        overrides: {},
        message: "ok",
      });

      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      // Leave as unrestricted (default) and save
      await act(async () => {
        fireEvent.click(screen.getByText("Save Overrides"));
      });

      await waitFor(() => {
        expect(mockUpdatePolicyOverrides).toHaveBeenCalled();
      });

      const payload = mockUpdatePolicyOverrides.mock.calls[0][0];
      expect(payload.token_policy).toBeUndefined();
    });

    it("cancel resets token policy to default", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));
      fireEvent.click(screen.getByTestId("token-mode-allowlist"));
      fireEvent.click(screen.getByText("+ SOL"));

      // Cancel
      fireEvent.click(screen.getByText("Cancel"));

      // Re-enter edit mode
      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });
      fireEvent.click(screen.getByText("Edit Overrides"));

      // Should be back to unrestricted
      const unrestrictedBtn = screen.getByTestId("token-mode-unrestricted");
      expect(unrestrictedBtn.className).toContain("border-amber");
    });

    it("denylist mode sets denied_mints in payload", async () => {
      mockFetchPolicy
        .mockResolvedValueOnce(PRO_POLICY)
        .mockResolvedValueOnce(PRO_POLICY);
      mockUpdatePolicyOverrides.mockResolvedValue({
        overrides: { token_policy: { mode: "denylist", allowed_mints: [], denied_mints: ["BONK"] } },
        message: "ok",
      });

      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));
      fireEvent.click(screen.getByTestId("token-mode-denylist"));
      fireEvent.click(screen.getByText("+ BONK"));

      await act(async () => {
        fireEvent.click(screen.getByText("Save Overrides"));
      });

      await waitFor(() => {
        expect(mockUpdatePolicyOverrides).toHaveBeenCalledWith(
          expect.objectContaining({
            token_policy: {
              mode: "denylist",
              allowed_mints: [],
              denied_mints: ["BONK"],
            },
          }),
        );
      });
    });
  });

  // -----------------------------------------------------------------------
  // Backend validation errors (422)
  // -----------------------------------------------------------------------

  describe("backend validation errors", () => {
    it("displays 422 validation error from backend", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      mockUpdatePolicyOverrides.mockRejectedValue(
        new Error("Unsupported override key: bad_key"),
      );

      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      const slippageInput = screen.getByLabelText("Max Slippage (bps)");
      fireEvent.change(slippageInput, { target: { value: "100" } });

      await act(async () => {
        fireEvent.click(screen.getByText("Save Overrides"));
      });

      await waitFor(() => {
        expect(
          screen.getByText("Unsupported override key: bad_key"),
        ).toBeTruthy();
      });
    });
  });

  // -----------------------------------------------------------------------
  // Effective Policy Preview
  // -----------------------------------------------------------------------

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

      // max_slippage_bps is overridden — check that its rule has "Override" badge
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

  // -----------------------------------------------------------------------
  // Policy Simulation — example outcomes
  // -----------------------------------------------------------------------

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

  // -----------------------------------------------------------------------
  // Policy Recommendations
  // -----------------------------------------------------------------------

  describe("policy recommendations", () => {
    it("renders recommendations section in view mode", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
      });

      expect(screen.getByText("Policy Recommendations")).toBeTruthy();
    });

    it("shows recommendation for unrestricted token access", async () => {
      mockFetchPolicy.mockResolvedValue({
        ...PRO_POLICY,
        effective: {
          ...PRO_POLICY.effective,
          token_policy: { mode: "unrestricted", allowed_mints: [], denied_mints: [] },
        },
      });
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Restrict token access")).toBeTruthy();
      });

      expect(screen.getByText(/token policy is set to unrestricted/)).toBeTruthy();
    });

    it("shows recommendation for empty token allowlist", async () => {
      mockFetchPolicy.mockResolvedValue({
        ...PRO_POLICY,
        overrides: { token_policy: { mode: "allowlist", allowed_mints: [], denied_mints: [] } },
        effective: {
          ...PRO_POLICY.effective,
          token_policy: { mode: "allowlist", allowed_mints: [], denied_mints: [] },
        },
      });
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Add tokens to your allowlist")).toBeTruthy();
      });

      expect(screen.getByText(/empty allowlist prevents all token activity/)).toBeTruthy();
    });

    it("shows recommendation when simulation is not required", async () => {
      mockFetchPolicy.mockResolvedValue({
        ...PRO_POLICY,
        effective: {
          ...PRO_POLICY.effective,
          require_simulation_success: false,
        },
      });
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Enable simulation requirement")).toBeTruthy();
      });

      expect(screen.getByText(/without passing simulation/)).toBeTruthy();
    });

    it("shows recommendation for very high slippage", async () => {
      mockFetchPolicy.mockResolvedValue({
        ...PRO_POLICY,
        effective: {
          ...PRO_POLICY.effective,
          max_slippage_bps: 500,
        },
      });
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Tighten slippage tolerance")).toBeTruthy();
      });

      expect(screen.getByText(/higher than most users/)).toBeTruthy();
    });

    it("shows recommendation when no program restrictions are set", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Add program restrictions")).toBeTruthy();
      });

      expect(screen.getByTestId("recommendation-add-program-restrictions")).toBeTruthy();
    });

    it("does not show program restriction recommendation when programs are configured", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_PROGRAMS);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Policy & Protections")).toBeTruthy();
      });

      expect(screen.queryByTestId("recommendation-add-program-restrictions")).toBeNull();
    });

    it("shows recommendation to customize when no overrides are set", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Customize your policy")).toBeTruthy();
      });

      expect(screen.getByText(/no overrides are set/)).toBeTruthy();
    });

    it("displays source labels on each recommendation", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
      });

      const sources = screen.getAllByTestId("recommendation-source");
      expect(sources.length).toBeGreaterThan(0);
      const texts = sources.map((s) => s.textContent);
      expect(texts.every((t) => t === "Default guidance" || t === "Policy analysis" || t === "Policy Intelligence")).toBe(true);
    });

    it("displays priority labels on each recommendation", async () => {
      mockFetchPolicy.mockResolvedValue({
        ...PRO_POLICY,
        effective: {
          ...PRO_POLICY.effective,
          require_simulation_success: false,
        },
      });
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
      });

      const priorities = screen.getAllByTestId("recommendation-priority");
      const texts = priorities.map((p) => p.textContent);
      expect(texts.some((t) => t === "High priority")).toBe(true);
    });

    it("shows View setting action for editable recommendations", async () => {
      mockFetchPolicy.mockResolvedValue({
        ...PRO_POLICY,
        effective: {
          ...PRO_POLICY.effective,
          require_simulation_success: false,
        },
      });
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("recommendation-action-enable-simulation")).toBeTruthy();
      });

      expect(screen.getByTestId("recommendation-action-enable-simulation").textContent).toContain("View setting");
    });

    it("hides recommendations section in edit mode", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      expect(screen.queryByTestId("policy-recommendations")).toBeNull();
    });

    it("shows advisory disclaimer", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText(/recommendations are advisory/)).toBeTruthy();
      });
    });

    // -------------------------------------------------------------------
    // Customer-history-aware recommendations
    // -------------------------------------------------------------------

    describe("customer-history recommendations", () => {
      it("shows limit-headroom recommendation when policy limit >> avg usage", async () => {
        mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
        mockFetchPolicy.mockResolvedValue({
          ...PRO_POLICY,
          effective: {
            ...PRO_POLICY.effective,
            // 50_000 > 5200 * 5 → triggers headroom rec
            max_notional_usd: 50000,
          },
        });
        render(<CustomerPoliciesPage />);

        await waitFor(() => {
          expect(screen.getByTestId("recommendation-history-limit-headroom")).toBeTruthy();
        });

        expect(
          screen.getByTestId("recommendation-history-limit-headroom").textContent,
        ).toContain("significant headroom");
      });

      it("shows slippage-headroom recommendation when policy slippage >> avg usage", async () => {
        mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
        mockFetchPolicy.mockResolvedValue({
          ...PRO_POLICY,
          effective: {
            ...PRO_POLICY.effective,
            // 500 > 85 * 3 → triggers slippage rec
            max_slippage_bps: 500,
          },
        });
        render(<CustomerPoliciesPage />);

        await waitFor(() => {
          expect(screen.getByTestId("recommendation-history-slippage-headroom")).toBeTruthy();
        });

        expect(
          screen.getByTestId("recommendation-history-slippage-headroom").textContent,
        ).toContain("wider than recent usage");
      });

      it("shows simulation-failures recommendation when failures exist and sim not required", async () => {
        mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
        mockFetchPolicy.mockResolvedValue({
          ...PRO_POLICY,
          effective: {
            ...PRO_POLICY.effective,
            require_simulation_success: false,
          },
        });
        render(<CustomerPoliciesPage />);

        await waitFor(() => {
          expect(screen.getByTestId("recommendation-history-simulation-failures")).toBeTruthy();
        });

        expect(
          screen.getByTestId("recommendation-history-simulation-failures").textContent,
        ).toContain("simulation failures");
      });

      it("shows narrow-tokens recommendation when few tokens used and unrestricted", async () => {
        mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
        // PRO_POLICY has no token_policy → unrestricted
        mockFetchPolicy.mockResolvedValue(PRO_POLICY);
        render(<CustomerPoliciesPage />);

        await waitFor(() => {
          expect(screen.getByTestId("recommendation-history-narrow-tokens")).toBeTruthy();
        });

        expect(
          screen.getByTestId("recommendation-history-narrow-tokens").textContent,
        ).toContain("small set of tokens");
      });

      it("does NOT show narrow-tokens when token_policy is allowlist", async () => {
        mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
        mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_TOKEN_POLICY);
        render(<CustomerPoliciesPage />);

        await waitFor(() => {
          expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
        });

        expect(screen.queryByTestId("recommendation-history-narrow-tokens")).toBeNull();
      });

      it("shows narrow-programs recommendation when few programs used and no restrictions", async () => {
        mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
        // PRO_POLICY has no allowed/denied programs → no restrictions
        mockFetchPolicy.mockResolvedValue(PRO_POLICY);
        render(<CustomerPoliciesPage />);

        await waitFor(() => {
          expect(screen.getByTestId("recommendation-history-narrow-programs")).toBeTruthy();
        });

        expect(
          screen.getByTestId("recommendation-history-narrow-programs").textContent,
        ).toContain("small set of programs");
      });

      it("does NOT show narrow-programs when programs are configured", async () => {
        mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
        mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_PROGRAMS);
        render(<CustomerPoliciesPage />);

        await waitFor(() => {
          expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
        });

        expect(screen.queryByTestId("recommendation-history-narrow-programs")).toBeNull();
      });

      it("shows recent-denials recommendation when denials exist", async () => {
        mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
        mockFetchPolicy.mockResolvedValue(PRO_POLICY);
        render(<CustomerPoliciesPage />);

        await waitFor(() => {
          expect(screen.getByTestId("recommendation-history-recent-denials")).toBeTruthy();
        });

        const card = screen.getByTestId("recommendation-history-recent-denials");
        expect(card.textContent).toContain("denied");
        expect(card.textContent).toContain("slippage_exceeded");
      });

      it("renders evidence text on history recommendations", async () => {
        mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
        mockFetchPolicy.mockResolvedValue(PRO_POLICY);
        render(<CustomerPoliciesPage />);

        await waitFor(() => {
          expect(screen.getByTestId("recommendation-history-recent-denials")).toBeTruthy();
        });

        const denialsCard = screen.getByTestId("recommendation-history-recent-denials");
        expect(denialsCard.textContent).toContain("30 days");
      });

      it("shows 'Customer history' source label on history recommendations", async () => {
        mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
        mockFetchPolicy.mockResolvedValue(PRO_POLICY);
        render(<CustomerPoliciesPage />);

        await waitFor(() => {
          expect(screen.getByTestId("recommendation-history-recent-denials")).toBeTruthy();
        });

        const sources = screen.getAllByTestId("recommendation-source");
        const historySourceLabels = sources.filter(
          (el) => el.textContent === "Customer history",
        );
        expect(historySourceLabels.length).toBeGreaterThan(0);
      });

      it("does NOT show history recommendations when summary is null (fetch fails)", async () => {
        mockFetchReceiptSummary.mockRejectedValue(new Error("network error"));
        mockFetchPolicy.mockResolvedValue(PRO_POLICY);
        render(<CustomerPoliciesPage />);

        await waitFor(() => {
          expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
        });

        expect(screen.queryByTestId("recommendation-history-recent-denials")).toBeNull();
        expect(screen.queryByTestId("recommendation-history-narrow-tokens")).toBeNull();
      });

      it("does NOT show history recommendations when receipt count is below threshold", async () => {
        mockFetchReceiptSummary.mockResolvedValue({
          ...HISTORY_SUMMARY,
          total_receipts: 2, // below threshold of 3
        });
        mockFetchPolicy.mockResolvedValue(PRO_POLICY);
        render(<CustomerPoliciesPage />);

        await waitFor(() => {
          expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
        });

        expect(screen.queryByTestId("recommendation-history-recent-denials")).toBeNull();
        expect(screen.queryByTestId("recommendation-history-narrow-tokens")).toBeNull();
      });

      it("includes transaction history mention in disclaimer when history recs present", async () => {
        mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
        mockFetchPolicy.mockResolvedValue(PRO_POLICY);
        render(<CustomerPoliciesPage />);

        await waitFor(() => {
          expect(screen.getByTestId("recommendation-history-recent-denials")).toBeTruthy();
        });

        // Both the subtitle and disclaimer mention history; confirm at least one exists
        const matches = screen.getAllByText(/recent transaction history/);
        expect(matches.length).toBeGreaterThan(0);
      });

      it("deterministic and history recommendations coexist without duplication", async () => {
        mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
        mockFetchPolicy.mockResolvedValue({
          ...PRO_POLICY,
          effective: {
            ...PRO_POLICY.effective,
            require_simulation_success: false, // triggers both deterministic + history recs
          },
        });
        render(<CustomerPoliciesPage />);

        await waitFor(() => {
          expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
        });

        // Deterministic simulation recommendation
        expect(screen.getByTestId("recommendation-enable-simulation")).toBeTruthy();
        // History-derived simulation recommendation
        expect(screen.getByTestId("recommendation-history-simulation-failures")).toBeTruthy();
        // Both should be in the recommendation cards container
        const cards = screen.getByTestId("recommendation-cards");
        expect(cards.children.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  // -----------------------------------------------------------------------
  // Source badges in effective policy grid
  // -----------------------------------------------------------------------

  describe("source badges on effective policy values", () => {
    it("shows Override badge for overridden fields", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_OVERRIDES);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("source-badge-max_slippage_bps")).toBeTruthy();
      });

      expect(
        screen.getByTestId("source-badge-max_slippage_bps").textContent,
      ).toBe("Override");
    });

    it("shows Default badge for non-overridden fields", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_OVERRIDES);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(
          screen.getByTestId("source-badge-require_simulation_success"),
        ).toBeTruthy();
      });

      expect(
        screen.getByTestId("source-badge-require_simulation_success").textContent,
      ).toBe("Default");
    });
  });

  // -----------------------------------------------------------------------
  // Market-aware recommendations
  // -----------------------------------------------------------------------

  describe("market-aware recommendations", () => {
    describe("market-aware recommendation rendering", () => {
      it("shows market simulation recommendation when degraded and simulation not required", async () => {
        mockFetchPolicy.mockResolvedValue({
          ...PRO_POLICY,
          effective: { ...PRO_POLICY.effective, require_simulation_success: false },
        });
        mockFetchMarketConditions.mockResolvedValue(MARKET_DEGRADED);
        render(<CustomerPoliciesPage />);

        await waitFor(() => {
          expect(screen.getByTestId("recommendation-market-enable-simulation")).toBeTruthy();
        });
      });

      it("shows market slippage recommendation when stressed and slippage > 100", async () => {
        mockFetchPolicy.mockResolvedValue({
          ...PRO_POLICY,
          effective: { ...PRO_POLICY.effective, max_slippage_bps: 300 },
        });
        mockFetchMarketConditions.mockResolvedValue(MARKET_STRESSED);
        render(<CustomerPoliciesPage />);

        await waitFor(() => {
          expect(screen.getByTestId("recommendation-market-tighten-slippage")).toBeTruthy();
        });
      });

      it("shows market limits recommendation when stressed and high USD limit", async () => {
        mockFetchPolicy.mockResolvedValue({
          ...PRO_POLICY,
          effective: { ...PRO_POLICY.effective, max_notional_usd: 100000 },
        });
        mockFetchMarketConditions.mockResolvedValue(MARKET_STRESSED);
        render(<CustomerPoliciesPage />);

        await waitFor(() => {
          expect(screen.getByTestId("recommendation-market-review-limits")).toBeTruthy();
        });
      });

      it("shows transaction throttle recommendation when sendTransaction is throttled", async () => {
        mockFetchPolicy.mockResolvedValue({
          ...PRO_POLICY,
          effective: { ...PRO_POLICY.effective, require_simulation_success: false },
        });
        mockFetchMarketConditions.mockResolvedValue(MARKET_STRESSED);
        render(<CustomerPoliciesPage />);

        await waitFor(() => {
          expect(screen.getByTestId("recommendation-market-tx-submission-throttled")).toBeTruthy();
        });
      });
    });

    describe("market source labeling", () => {
      it("displays 'Market analysis' source label on market recommendations", async () => {
        mockFetchPolicy.mockResolvedValue({
          ...PRO_POLICY,
          effective: { ...PRO_POLICY.effective, require_simulation_success: false },
        });
        mockFetchMarketConditions.mockResolvedValue(MARKET_DEGRADED);
        render(<CustomerPoliciesPage />);

        await waitFor(() => {
          expect(screen.getByTestId("recommendation-market-enable-simulation")).toBeTruthy();
        });

        const rec = screen.getByTestId("recommendation-market-enable-simulation");
        const sources = rec.querySelectorAll("[data-testid='recommendation-source']");
        const sourceTexts = Array.from(sources).map((s) => s.textContent);
        expect(sourceTexts).toContain("Market analysis");
      });

      it("shows evidence text from market conditions summary", async () => {
        mockFetchPolicy.mockResolvedValue({
          ...PRO_POLICY,
          effective: { ...PRO_POLICY.effective, require_simulation_success: false },
        });
        mockFetchMarketConditions.mockResolvedValue(MARKET_DEGRADED);
        render(<CustomerPoliciesPage />);

        await waitFor(() => {
          expect(screen.getByTestId("recommendation-market-enable-simulation")).toBeTruthy();
        });

        expect(screen.getByText(/minor degradation/)).toBeTruthy();
      });
    });

    describe("coexistence with deterministic and history recs", () => {
      it("market recs appear alongside deterministic recs", async () => {
        mockFetchPolicy.mockResolvedValue({
          ...PRO_POLICY,
          effective: { ...PRO_POLICY.effective, require_simulation_success: false },
        });
        mockFetchMarketConditions.mockResolvedValue(MARKET_DEGRADED);
        render(<CustomerPoliciesPage />);

        await waitFor(() => {
          // Deterministic rec for simulation
          expect(screen.getByTestId("recommendation-enable-simulation")).toBeTruthy();
          // Market rec for simulation
          expect(screen.getByTestId("recommendation-market-enable-simulation")).toBeTruthy();
        });
      });

      it("market recs appear alongside history recs", async () => {
        mockFetchPolicy.mockResolvedValue({
          ...PRO_POLICY,
          effective: { ...PRO_POLICY.effective, require_simulation_success: false },
        });
        mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
        mockFetchMarketConditions.mockResolvedValue(MARKET_DEGRADED);
        render(<CustomerPoliciesPage />);

        await waitFor(() => {
          expect(screen.getByTestId("recommendation-market-enable-simulation")).toBeTruthy();
          expect(screen.getByTestId("recommendation-history-simulation-failures")).toBeTruthy();
        });
      });
    });

    describe("graceful degradation when market signals absent", () => {
      it("shows no market recs when conditions are stable", async () => {
        mockFetchPolicy.mockResolvedValue({
          ...PRO_POLICY,
          effective: { ...PRO_POLICY.effective, require_simulation_success: false },
        });
        mockFetchMarketConditions.mockResolvedValue(MARKET_STABLE);
        render(<CustomerPoliciesPage />);

        await waitFor(() => {
          // Deterministic recs should appear (simulation not required)
          expect(screen.getByTestId("recommendation-enable-simulation")).toBeTruthy();
        });
        // No market-* recs
        expect(screen.queryByTestId("recommendation-market-enable-simulation")).toBeNull();
        expect(screen.queryByTestId("recommendation-market-tighten-slippage")).toBeNull();
      });

      it("shows no market recs when fetch fails", async () => {
        mockFetchPolicy.mockResolvedValue({
          ...PRO_POLICY,
          effective: { ...PRO_POLICY.effective, require_simulation_success: false },
        });
        mockFetchMarketConditions.mockRejectedValue(new Error("network error"));
        render(<CustomerPoliciesPage />);

        await waitFor(() => {
          expect(screen.getByTestId("recommendation-enable-simulation")).toBeTruthy();
        });
        expect(screen.queryByTestId("recommendation-market-enable-simulation")).toBeNull();
      });

      it("does not show market simulation rec when simulation already required", async () => {
        mockFetchPolicy.mockResolvedValue(PRO_POLICY); // simulation=true
        mockFetchMarketConditions.mockResolvedValue(MARKET_STRESSED);
        render(<CustomerPoliciesPage />);

        await waitFor(() => {
          expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
        });
        expect(screen.queryByTestId("recommendation-market-enable-simulation")).toBeNull();
        expect(screen.queryByTestId("recommendation-market-tx-submission-throttled")).toBeNull();
      });

      it("does not show market slippage rec when slippage is tight", async () => {
        mockFetchPolicy.mockResolvedValue(PRO_POLICY); // slippage=100
        mockFetchMarketConditions.mockResolvedValue(MARKET_STRESSED);
        render(<CustomerPoliciesPage />);

        await waitFor(() => {
          expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
        });
        expect(screen.queryByTestId("recommendation-market-tighten-slippage")).toBeNull();
      });

      it("description mentions execution conditions when market recs present", async () => {
        mockFetchPolicy.mockResolvedValue({
          ...PRO_POLICY,
          effective: { ...PRO_POLICY.effective, require_simulation_success: false },
        });
        mockFetchMarketConditions.mockResolvedValue(MARKET_DEGRADED);
        render(<CustomerPoliciesPage />);

        await waitFor(() => {
          expect(screen.getByTestId("recommendation-market-enable-simulation")).toBeTruthy();
        });
        expect(screen.getByText(/current execution conditions/)).toBeTruthy();
      });
    });
  });

  // -----------------------------------------------------------------------
  // Policy Intelligence (PIL) recommendations
  // -----------------------------------------------------------------------

  describe("PIL recommendations", () => {
    const PIL_RESPONSE = {
      recommendations: [
        {
          id: "REDUCE_SLIPPAGE",
          title: "Reduce slippage tolerance",
          explanation: "Slippage pressure is high — many transactions are near the threshold.",
          parameter: "max_slippage_bps",
          confidence: "high",
          evidence: "avg_slippage=95bps, near_threshold=8/42",
        },
        {
          id: "HIGH_FRICTION",
          title: "Policy friction is elevated",
          explanation: "Denial rate is 12/42.  Review policy rules.",
          parameter: "max_notional_usd",
          confidence: "medium",
          evidence: "denial_rate=28.6%",
        },
      ],
      record_count: 42,
      confidence_summary: "medium",
      captured_at: Date.now() / 1000,
      plan: "free",
    };

    it("renders PIL recommendations with Policy Intelligence source label", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      mockFetchPilRecommendations.mockResolvedValue(PIL_RESPONSE);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("recommendation-pil-reduce-slippage")).toBeTruthy();
      });

      // Source label should say "Policy Intelligence"
      const card = screen.getByTestId("recommendation-pil-reduce-slippage");
      expect(card.textContent).toContain("Policy Intelligence");
    });

    it("shows evidence text for PIL recommendations", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      mockFetchPilRecommendations.mockResolvedValue(PIL_RESPONSE);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("recommendation-pil-reduce-slippage")).toBeTruthy();
      });

      expect(screen.getByText(/avg_slippage=95bps/)).toBeTruthy();
    });

    it("shows confidence indicator for PIL recommendations", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      mockFetchPilRecommendations.mockResolvedValue(PIL_RESPONSE);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("recommendation-pil-reduce-slippage")).toBeTruthy();
      });

      const confidenceEl = screen.getAllByTestId("recommendation-confidence");
      expect(confidenceEl.length).toBeGreaterThan(0);
      expect(confidenceEl[0].textContent).toContain("Confidence:");
    });

    it("coexists with deterministic and history recommendations", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
      mockFetchPilRecommendations.mockResolvedValue(PIL_RESPONSE);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
      });

      // Should have recs from both deterministic and PIL sources
      const sources = screen.getAllByTestId("recommendation-source");
      const sourceLabels = sources.map((el) => el.textContent);
      expect(sourceLabels).toContain("Policy Intelligence");
      // Deterministic recs should still be present
      expect(
        sourceLabels.some((s) => s === "Default guidance" || s === "Policy analysis"),
      ).toBe(true);
    });

    it("gracefully degrades when PIL is unavailable", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      mockFetchPilRecommendations.mockRejectedValue(new Error("network"));
      render(<CustomerPoliciesPage />);

      // Should still show deterministic recs
      await waitFor(() => {
        expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
      });

      // No PIL recs should appear
      const sources = screen.getAllByTestId("recommendation-source");
      const sourceLabels = sources.map((el) => el.textContent);
      expect(sourceLabels).not.toContain("Policy Intelligence");
    });

    it("renders zero PIL recs when backend returns empty list", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      mockFetchPilRecommendations.mockResolvedValue({
        recommendations: [],
        record_count: 0,
        confidence_summary: "low",
        captured_at: Date.now() / 1000,
        plan: "free",
      });
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
      });

      // No PIL-sourced recs
      const sources = screen.getAllByTestId("recommendation-source");
      const sourceLabels = sources.map((el) => el.textContent);
      expect(sourceLabels).not.toContain("Policy Intelligence");
    });

    it("PIL recs use correct priority mapping from confidence", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      mockFetchPilRecommendations.mockResolvedValue(PIL_RESPONSE);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("recommendation-pil-reduce-slippage")).toBeTruthy();
      });

      // REDUCE_SLIPPAGE has confidence "high" → should map to "high" priority
      const card = screen.getByTestId("recommendation-pil-reduce-slippage");
      expect(card.textContent).toContain("High priority");
    });

    it("disclaimer mentions policy intelligence when PIL recs present", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      mockFetchPilRecommendations.mockResolvedValue(PIL_RESPONSE);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("recommendation-pil-reduce-slippage")).toBeTruthy();
      });

      expect(screen.getAllByText(/policy intelligence analysis/).length).toBeGreaterThan(0);
    });

    it("PIL rec with fieldKey shows View setting button", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      mockFetchPilRecommendations.mockResolvedValue(PIL_RESPONSE);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("recommendation-pil-reduce-slippage")).toBeTruthy();
      });

      // REDUCE_SLIPPAGE maps to max_slippage_bps → should have action button
      expect(screen.getByTestId("recommendation-action-pil-reduce-slippage")).toBeTruthy();
    });
  });

  // -----------------------------------------------------------------------
  // Source badges in effective policy grid
  // -----------------------------------------------------------------------

  describe("source badges on effective policy values", () => {
    it("shows Override badge for overridden fields", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_OVERRIDES);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("source-badge-max_slippage_bps")).toBeTruthy();
      });

      expect(
        screen.getByTestId("source-badge-max_slippage_bps").textContent,
      ).toBe("Override");
    });

    it("shows Default badge for non-overridden fields", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_OVERRIDES);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(
          screen.getByTestId("source-badge-require_simulation_success"),
        ).toBeTruthy();
      });

      expect(
        screen.getByTestId("source-badge-require_simulation_success").textContent,
      ).toBe("Default");
    });
  });

  // -----------------------------------------------------------------------
  // External context recommendations (Enterprise)
  // -----------------------------------------------------------------------

  describe("External context recommendations", () => {
    const EXTERNAL_CONTEXT_RESPONSE = {
      recommendations: [
        {
          id: "EXT_SUSTAINED_THROTTLE",
          title: "Sustained external network pressure detected",
          explanation:
            "The execution environment has been experiencing sustained throttling.",
          parameter: "require_simulation_success",
          confidence: "high",
          evidence: "External infrastructure has been under sustained pressure for 6 consecutive minutes.",
        },
        {
          id: "EXT_HIGH_THROTTLE_RATE",
          title: "Elevated external infrastructure error rate",
          explanation: "The shared execution infrastructure is experiencing an elevated error rate.",
          parameter: "max_notional_usd",
          confidence: "medium",
          evidence: "External infrastructure error rate is 11.0%, above the normal operating threshold.",
        },
      ],
      captured_at: Date.now() / 1000,
      plan: "enterprise",
      gated: false,
      gated_count: 0,
    };

    const ENTERPRISE_POLICY = {
      plan_code: "enterprise",
      plan_limits: { tx_limit_per_month: 1000000, policy_overrides_enabled: true },
      overrides: {},
      effective: {
        max_slippage_bps: 100,
        max_notional_usd: 100000,
        require_simulation_success: true,
      },
    };

    it("renders external context recommendations with External context source label", async () => {
      mockFetchPolicy.mockResolvedValue(ENTERPRISE_POLICY);
      mockFetchExternalContext.mockResolvedValue(EXTERNAL_CONTEXT_RESPONSE);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("recommendation-ext-ext-sustained-throttle")).toBeTruthy();
      });

      const card = screen.getByTestId("recommendation-ext-ext-sustained-throttle");
      expect(card.textContent).toContain("External context");
    });

    it("shows evidence text for external context recommendations", async () => {
      mockFetchPolicy.mockResolvedValue(ENTERPRISE_POLICY);
      mockFetchExternalContext.mockResolvedValue(EXTERNAL_CONTEXT_RESPONSE);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("recommendation-ext-ext-sustained-throttle")).toBeTruthy();
      });

      expect(screen.getByText(/sustained pressure for 6 consecutive/)).toBeTruthy();
    });

    it("shows confidence indicator for external context recommendations", async () => {
      mockFetchPolicy.mockResolvedValue(ENTERPRISE_POLICY);
      mockFetchExternalContext.mockResolvedValue(EXTERNAL_CONTEXT_RESPONSE);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("recommendation-ext-ext-sustained-throttle")).toBeTruthy();
      });

      const confidenceEl = screen.getAllByTestId("recommendation-confidence");
      expect(confidenceEl.length).toBeGreaterThan(0);
      expect(confidenceEl.some((el) => el.textContent?.includes("Confidence:"))).toBe(true);
    });

    it("coexists with deterministic and other recommendation sources", async () => {
      mockFetchPolicy.mockResolvedValue(ENTERPRISE_POLICY);
      mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
      mockFetchExternalContext.mockResolvedValue(EXTERNAL_CONTEXT_RESPONSE);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
      });

      const sources = screen.getAllByTestId("recommendation-source");
      const sourceLabels = sources.map((el) => el.textContent);
      expect(sourceLabels).toContain("External context");
      expect(
        sourceLabels.some((s) => s === "Default guidance" || s === "Policy analysis"),
      ).toBe(true);
    });

    it("gracefully degrades when external context is unavailable", async () => {
      mockFetchPolicy.mockResolvedValue(ENTERPRISE_POLICY);
      mockFetchExternalContext.mockRejectedValue(new Error("network"));
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
      });

      const sources = screen.getAllByTestId("recommendation-source");
      const sourceLabels = sources.map((el) => el.textContent);
      expect(sourceLabels).not.toContain("External context");
    });

    it("renders zero external recs when backend returns empty list", async () => {
      mockFetchPolicy.mockResolvedValue(ENTERPRISE_POLICY);
      mockFetchExternalContext.mockResolvedValue({
        recommendations: [],
        captured_at: Date.now() / 1000,
        plan: "enterprise",
      });
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
      });

      const sources = screen.getAllByTestId("recommendation-source");
      const sourceLabels = sources.map((el) => el.textContent);
      expect(sourceLabels).not.toContain("External context");
    });

    it("disclaimer mentions external infrastructure when external recs present", async () => {
      mockFetchPolicy.mockResolvedValue(ENTERPRISE_POLICY);
      mockFetchExternalContext.mockResolvedValue(EXTERNAL_CONTEXT_RESPONSE);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("recommendation-ext-ext-sustained-throttle")).toBeTruthy();
      });

      expect(screen.getAllByText(/external infrastructure signals/).length).toBeGreaterThan(0);
    });

    it("non-Enterprise plans do not see external context recommendations", async () => {
      const ADVANCED_POLICY = {
        plan_code: "advanced",
        plan_limits: { tx_limit_per_month: 50000, policy_overrides_enabled: true },
        overrides: {},
        effective: {
          max_slippage_bps: 100,
          max_notional_usd: 25000,
          require_simulation_success: true,
        },
      };
      mockFetchPolicy.mockResolvedValue(ADVANCED_POLICY);
      // Even if external context returns data, Advanced should not show it
      mockFetchExternalContext.mockResolvedValue(EXTERNAL_CONTEXT_RESPONSE);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
      });

      const sources = screen.getAllByTestId("recommendation-source");
      const sourceLabels = sources.map((el) => el.textContent);
      expect(sourceLabels).not.toContain("External context");
    });
  });

  // -----------------------------------------------------------------------
  // Plan-aware recommendation tiering
  // -----------------------------------------------------------------------

  describe("plan-aware recommendation tiering", () => {
    const PIL_GATED_RESPONSE = {
      recommendations: [],
      record_count: 42,
      confidence_summary: "medium",
      captured_at: Date.now() / 1000,
      plan: "free",
      gated: true,
      gated_count: 3,
    };

    it("Free plan shows only Default guidance and Policy analysis sources", async () => {
      mockFetchPolicy.mockResolvedValue(FREE_POLICY);
      mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
      mockFetchMarketConditions.mockResolvedValue(MARKET_DEGRADED);
      mockFetchPilRecommendations.mockResolvedValue(PIL_GATED_RESPONSE);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
      });

      const sources = screen.getAllByTestId("recommendation-source");
      const sourceLabels = sources.map((el) => el.textContent);
      // Only deterministic sources visible on Free
      for (const label of sourceLabels) {
        expect(label === "Default guidance" || label === "Policy analysis").toBe(true);
      }
      // No advanced sources should appear
      expect(sourceLabels).not.toContain("Customer history");
      expect(sourceLabels).not.toContain("Market analysis");
      expect(sourceLabels).not.toContain("Policy Intelligence");
    });

    it("Free plan shows upgrade teaser when gated sources have data", async () => {
      mockFetchPolicy.mockResolvedValue(FREE_POLICY);
      mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
      mockFetchMarketConditions.mockResolvedValue(MARKET_DEGRADED);
      mockFetchPilRecommendations.mockResolvedValue(PIL_GATED_RESPONSE);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("recommendation-upgrade-teaser")).toBeTruthy();
      });

      expect(screen.getByTestId("recommendation-upgrade-teaser").textContent).toContain(
        "Unlock deeper policy intelligence",
      );
      expect(screen.getByTestId("recommendation-upgrade-link")).toBeTruthy();
    });

    it("upgrade teaser mentions gated PIL count when available", async () => {
      mockFetchPolicy.mockResolvedValue(FREE_POLICY);
      mockFetchReceiptSummary.mockResolvedValue(EMPTY_HISTORY_SUMMARY);
      mockFetchMarketConditions.mockResolvedValue(MARKET_STABLE);
      mockFetchPilRecommendations.mockResolvedValue(PIL_GATED_RESPONSE);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("recommendation-upgrade-teaser")).toBeTruthy();
      });

      expect(screen.getByTestId("recommendation-upgrade-teaser").textContent).toContain(
        "3 intelligence-backed suggestions",
      );
    });

    it("Pro plan shows Customer history, Market analysis, and PIL recs", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
      mockFetchMarketConditions.mockResolvedValue(MARKET_DEGRADED);
      mockFetchPilRecommendations.mockResolvedValue({
        recommendations: [
          {
            id: "REDUCE_SLIPPAGE",
            title: "Reduce slippage tolerance",
            explanation: "Slippage pressure is high.",
            parameter: "max_slippage_bps",
            confidence: "high",
            evidence: "avg_slippage=95bps",
          },
        ],
        record_count: 42,
        confidence_summary: "medium",
        captured_at: Date.now() / 1000,
        plan: "pro",
        gated: false,
        gated_count: 0,
      });
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
      });

      const sources = screen.getAllByTestId("recommendation-source");
      const sourceLabels = sources.map((el) => el.textContent);
      expect(sourceLabels).toContain("Policy Intelligence");
      // Should have at least one Customer history rec (HISTORY_SUMMARY has enough data)
      expect(sourceLabels).toContain("Customer history");
    });

    it("Pro plan does not show upgrade teaser", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
      mockFetchPilRecommendations.mockResolvedValue({
        recommendations: [
          {
            id: "REDUCE_SLIPPAGE",
            title: "Reduce slippage tolerance",
            explanation: "Slippage pressure is high.",
            parameter: "max_slippage_bps",
            confidence: "high",
            evidence: "avg_slippage=95bps",
          },
        ],
        record_count: 42,
        confidence_summary: "medium",
        captured_at: Date.now() / 1000,
        plan: "pro",
      });
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
      });

      expect(screen.queryByTestId("recommendation-upgrade-teaser")).toBeNull();
    });

    it("Free plan with no gated data does not show upgrade teaser", async () => {
      mockFetchPolicy.mockResolvedValue(FREE_POLICY);
      mockFetchReceiptSummary.mockResolvedValue(EMPTY_HISTORY_SUMMARY);
      mockFetchMarketConditions.mockResolvedValue(null);
      mockFetchPilRecommendations.mockResolvedValue({
        recommendations: [],
        record_count: 0,
        confidence_summary: "low",
        captured_at: Date.now() / 1000,
        plan: "free",
        gated: false,
        gated_count: 0,
      });
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
      });

      expect(screen.queryByTestId("recommendation-upgrade-teaser")).toBeNull();
    });

    it("Advanced plan shows all recommendation sources like Pro", async () => {
      const ADVANCED_POLICY = {
        plan_code: "advanced",
        plan_limits: { tx_limit_per_month: 50000, policy_overrides_enabled: true },
        overrides: {},
        effective: {
          max_slippage_bps: 100,
          max_notional_usd: 25000,
          require_simulation_success: true,
        },
      };
      mockFetchPolicy.mockResolvedValue(ADVANCED_POLICY);
      mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
      mockFetchMarketConditions.mockResolvedValue(MARKET_DEGRADED);
      mockFetchPilRecommendations.mockResolvedValue({
        recommendations: [
          {
            id: "REDUCE_SLIPPAGE",
            title: "Reduce slippage tolerance",
            explanation: "Slippage pressure is high.",
            parameter: "max_slippage_bps",
            confidence: "high",
            evidence: "avg_slippage=95bps",
          },
        ],
        record_count: 42,
        confidence_summary: "medium",
        captured_at: Date.now() / 1000,
        plan: "advanced",
        gated: false,
        gated_count: 0,
      });
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
      });

      const sources = screen.getAllByTestId("recommendation-source");
      const sourceLabels = sources.map((el) => el.textContent);
      expect(sourceLabels).toContain("Policy Intelligence");
      expect(sourceLabels).toContain("Customer history");
      expect(screen.queryByTestId("recommendation-upgrade-teaser")).toBeNull();
    });

    it("Enterprise plan shows all recommendation sources", async () => {
      const ENTERPRISE_POLICY = {
        plan_code: "enterprise",
        plan_limits: { tx_limit_per_month: 1000000, policy_overrides_enabled: true },
        overrides: {},
        effective: {
          max_slippage_bps: 100,
          max_notional_usd: 100000,
          require_simulation_success: true,
        },
      };
      mockFetchPolicy.mockResolvedValue(ENTERPRISE_POLICY);
      mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
      mockFetchPilRecommendations.mockResolvedValue({
        recommendations: [
          {
            id: "REDUCE_SLIPPAGE",
            title: "Reduce slippage tolerance",
            explanation: "Slippage pressure is high.",
            parameter: "max_slippage_bps",
            confidence: "high",
            evidence: "avg_slippage=95bps",
          },
        ],
        record_count: 42,
        confidence_summary: "medium",
        captured_at: Date.now() / 1000,
        plan: "enterprise",
        gated: false,
        gated_count: 0,
      });
      mockFetchExternalContext.mockResolvedValue({
        recommendations: [
          {
            id: "EXT_SUSTAINED_THROTTLE",
            title: "Sustained external network pressure detected",
            explanation: "The execution environment has been experiencing sustained throttling.",
            parameter: "require_simulation_success",
            confidence: "high",
            evidence: "External infrastructure has been under sustained pressure for 6 consecutive minutes.",
          },
        ],
        captured_at: Date.now() / 1000,
        plan: "enterprise",
        gated: false,
        gated_count: 0,
      });
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
      });

      const sources = screen.getAllByTestId("recommendation-source");
      const sourceLabels = sources.map((el) => el.textContent);
      expect(sourceLabels).toContain("Policy Intelligence");
      expect(sourceLabels).toContain("External context");
      expect(screen.queryByTestId("recommendation-upgrade-teaser")).toBeNull();
    });

    it("upgrade teaser lists source descriptions when multiple sources are gated", async () => {
      mockFetchPolicy.mockResolvedValue(FREE_POLICY);
      mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
      mockFetchMarketConditions.mockResolvedValue(MARKET_DEGRADED);
      mockFetchPilRecommendations.mockResolvedValue(PIL_GATED_RESPONSE);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("recommendation-upgrade-teaser")).toBeTruthy();
      });

      const details = screen.getByTestId("gated-source-details");
      expect(details).toBeTruthy();
      // Should list each gated source with description
      expect(details.textContent).toContain("Customer history");
      expect(details.textContent).toContain("Market analysis");
      expect(details.textContent).toContain("Policy Intelligence");
    });

    it("upgrade teaser omits source detail list when only one source is gated", async () => {
      mockFetchPolicy.mockResolvedValue(FREE_POLICY);
      mockFetchReceiptSummary.mockResolvedValue(EMPTY_HISTORY_SUMMARY);
      mockFetchMarketConditions.mockResolvedValue(null);
      mockFetchPilRecommendations.mockResolvedValue(PIL_GATED_RESPONSE);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("recommendation-upgrade-teaser")).toBeTruthy();
      });

      expect(screen.queryByTestId("gated-source-details")).toBeNull();
    });
  });
});

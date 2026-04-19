/**
 * customer-policy-adaptive-mode-ui.test.tsx
 *
 * Focused tests for adaptive PIL mode controls on /customer/policies.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

const { mockPush, mockReplace } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockReplace: vi.fn(),
}));

vi.mock("next/navigation", () => {
  const stableRouter = { push: mockPush, replace: mockReplace };
  return { useRouter: () => stableRouter };
});

const mockFetchPolicy = vi.fn();
const mockUpdateAutoDynamicPilMode = vi.fn();
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
    updateAutoDynamicPilMode: (...args: unknown[]) => mockUpdateAutoDynamicPilMode(...args),
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

const BASE_EFFECTIVE = {
  max_slippage_bps: 100,
  max_notional_usd: 25_000,
  require_simulation_success: true,
};

const PRO_POLICY = {
  plan_code: "pro",
  plan_limits: { tx_limit_per_month: 5000, policy_overrides_enabled: true },
  overrides: {},
  effective: BASE_EFFECTIVE,
  adaptive_pil: {
    mode: "off",
    eligible: true,
    eligible_fields: ["max_slippage_bps"],
    scope: "same_market_next_transaction",
    bounded: true,
    pending_overlays: 0,
    latest_event: null,
  },
};

const FREE_POLICY = {
  plan_code: "free",
  plan_limits: { tx_limit_per_month: 100, policy_overrides_enabled: false },
  overrides: {},
  effective: BASE_EFFECTIVE,
  adaptive_pil: {
    mode: "off",
    eligible: false,
    eligible_fields: ["max_slippage_bps"],
    scope: "same_market_next_transaction",
    bounded: true,
    pending_overlays: 0,
    latest_event: null,
  },
};

describe("CustomerPoliciesPage — adaptive mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateAutoDynamicPilMode.mockResolvedValue({ mode: "recommend", message: "ok" });
    mockFetchReceiptSummary.mockResolvedValue({
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
    });
    mockFetchMarketConditions.mockResolvedValue(null);
    mockFetchPilRecommendations.mockResolvedValue({ recommendations: [], record_count: 0, confidence_summary: "low", captured_at: Date.now() / 1000, plan: "free" });
    mockFetchCohortBenchmarks.mockResolvedValue({ benchmarks: [], cohort_size: 0, captured_at: Date.now() / 1000, plan: "free" });
    mockFetchExternalContext.mockResolvedValue({ recommendations: [], captured_at: Date.now() / 1000, plan: "free" });
  });

  it("shows premium gating copy for non-eligible plans", async () => {
    mockFetchPolicy.mockResolvedValue(FREE_POLICY);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByText(/Auto-Dynamic PIL Mode/)).toBeTruthy();
    });

    expect(screen.getByText(/available on Pro and Enterprise plans/i)).toBeTruthy();
  });

  it("calls updateAutoDynamicPilMode when selecting recommend", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("adaptive-mode-recommend")).toBeTruthy();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("adaptive-mode-recommend"));
    });

    await waitFor(() => {
      expect(mockUpdateAutoDynamicPilMode).toHaveBeenCalledWith("recommend");
    });
  });

  it("renders the How it works docs link in the adaptive section", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByText(/Auto-Dynamic PIL Mode/)).toBeTruthy();
    });

    const link = screen.getByTestId("adaptive-pil-docs-link");
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("/docs/policies/auto-dynamic-pil");
    expect(link.textContent).toMatch(/How it works/i);
  });

  it("renders the docs link for free-tier users too", async () => {
    mockFetchPolicy.mockResolvedValue(FREE_POLICY);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByText(/Auto-Dynamic PIL Mode/)).toBeTruthy();
    });

    const link = screen.getByTestId("adaptive-pil-docs-link");
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("/docs/policies/auto-dynamic-pil");
  });

  it("adaptive mode buttons are still rendered correctly after docs link addition", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("adaptive-mode-off")).toBeTruthy();
      expect(screen.getByTestId("adaptive-mode-recommend")).toBeTruthy();
      expect(screen.getByTestId("adaptive-mode-auto_bounded")).toBeTruthy();
    });
  });
});

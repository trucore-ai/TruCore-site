/**
 * CustomerPoliciesPage — recommendations tests.
 * Covers: policy recommendations section, customer-history recs,
 * recommendation display prioritization, source badges, market-aware recs,
 * PIL recommendations, external context recommendations.
 *
 * MEMORY NOTE: This file uses jsdom + React Testing Library and mounts
 * CustomerPoliciesPage (a large component) multiple times.  Each worker
 * fork requires ~3–4 GB of heap.  The heap cap is raised to 6 GB via
 * NODE_OPTIONS in .env.test, which Vitest loads automatically.
 * Do not remove .env.test or the worker will OOM at the jsdom setup phase.
 */
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
  signal_freshness: { status: "fresh" as const, last_updated_at: Date.now() / 1000 },
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
  signal_freshness: { status: "fresh" as const, last_updated_at: Date.now() / 1000 },
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
  signal_freshness: { status: "fresh" as const, last_updated_at: Date.now() / 1000 },
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

      // "why" text is now behind the expandable toggle
      fireEvent.click(screen.getByTestId("recommendation-details-toggle-fix-empty-allowlist"));
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

      it("renders evidence text on history recommendations after expanding", async () => {
        mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
        mockFetchPolicy.mockResolvedValue(PRO_POLICY);
        render(<CustomerPoliciesPage />);

        await waitFor(() => {
          expect(screen.getByTestId("recommendation-history-recent-denials")).toBeTruthy();
        });

        // Evidence is hidden by default; expand the card
        fireEvent.click(screen.getByTestId("recommendation-details-toggle-history-recent-denials"));

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
        // Both should be present within the recommendation cards container
        const cards = screen.getByTestId("recommendation-cards");
        // enable-simulation is high-priority → top section
        expect(cards.querySelector('[data-testid="recommendation-enable-simulation"]')).toBeTruthy();
        // history-simulation-failures is medium-priority → top section
        expect(cards.querySelector('[data-testid="recommendation-history-simulation-failures"]')).toBeTruthy();
      });
    });
  });

  // -----------------------------------------------------------------------
  // Recommendation display prioritization
  // -----------------------------------------------------------------------

  describe("recommendation display prioritization", () => {
    it("places high-priority recommendations in the top section", async () => {
      mockFetchPolicy.mockResolvedValue({
        ...PRO_POLICY,
        effective: {
          ...PRO_POLICY.effective,
          require_simulation_success: false, // high-priority rec
        },
      });
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("top-recommendations")).toBeTruthy();
      });

      const topSection = screen.getByTestId("top-recommendations");
      expect(topSection.querySelector('[data-testid="recommendation-enable-simulation"]')).toBeTruthy();
    });

    it("places low-priority non-actionable recs in the more-suggestions section", async () => {
      // PRO_POLICY generates "customize-policy" (low, no fieldKey) and
      // "add-program-restrictions" (low, has fieldKey) etc.
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("more-suggestions")).toBeTruthy();
      });

      // "customize-policy" is low priority without fieldKey → "more"
      expect(screen.getByTestId("more-suggestions-toggle")).toBeTruthy();
    });

    it("hides more-suggestions cards by default", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("more-suggestions")).toBeTruthy();
      });

      // The list should be in the DOM but hidden
      const list = screen.getByTestId("more-suggestions-list");
      expect(list.className).toContain("hidden");
    });

    it("expands more-suggestions section when toggle is clicked", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("more-suggestions-toggle")).toBeTruthy();
      });

      fireEvent.click(screen.getByTestId("more-suggestions-toggle"));

      const list = screen.getByTestId("more-suggestions-list");
      expect(list.className).not.toContain("hidden");
    });

    it("more-suggestions toggle has correct aria-expanded attribute", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("more-suggestions-toggle")).toBeTruthy();
      });

      const toggle = screen.getByTestId("more-suggestions-toggle");
      expect(toggle.getAttribute("aria-expanded")).toBe("false");

      fireEvent.click(toggle);
      expect(toggle.getAttribute("aria-expanded")).toBe("true");
    });

    it("medium-priority actionable recs appear in top section, not more-suggestions", async () => {
      // max_slippage_bps=500 generates a medium-priority rec with fieldKey
      mockFetchPolicy.mockResolvedValue({
        ...PRO_POLICY,
        effective: {
          ...PRO_POLICY.effective,
          max_slippage_bps: 500,
        },
      });
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("recommendation-tighten-slippage")).toBeTruthy();
      });

      const topSection = screen.getByTestId("top-recommendations");
      expect(topSection.querySelector('[data-testid="recommendation-tighten-slippage"]')).toBeTruthy();
    });

    it("shows correct count in more-suggestions toggle label", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("more-suggestions-toggle")).toBeTruthy();
      });

      const label = screen.getByTestId("more-suggestions-toggle").textContent!;
      expect(label).toMatch(/more suggestion/);
    });

    it("sorts actionable recs before non-actionable within same priority", async () => {
      mockFetchPolicy.mockResolvedValue({
        ...PRO_POLICY,
        effective: {
          ...PRO_POLICY.effective,
          require_simulation_success: false,
          max_slippage_bps: 500,
          token_policy: { mode: "unrestricted", allowed_mints: [], denied_mints: [] },
        },
      });
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("top-recommendations")).toBeTruthy();
      });

      // All medium-priority actionable recs (tighten-slippage, restrict-tokens)
      // should be in top section
      const topSection = screen.getByTestId("top-recommendations");
      expect(topSection.querySelector('[data-testid="recommendation-tighten-slippage"]')).toBeTruthy();
      expect(topSection.querySelector('[data-testid="recommendation-restrict-tokens"]')).toBeTruthy();
    });

    it("featured card gets data-emphasis=featured and recommended-action badge", async () => {
      // require_simulation_success=false triggers a high-priority actionable rec
      mockFetchPolicy.mockResolvedValue({
        ...PRO_POLICY,
        effective: {
          ...PRO_POLICY.effective,
          require_simulation_success: false,
        },
      });
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("recommendation-enable-simulation")).toBeTruthy();
      });

      const card = screen.getByTestId("recommendation-enable-simulation");
      expect(card.getAttribute("data-emphasis")).toBe("featured");
      expect(card.querySelector('[data-testid="recommended-action-badge"]')).toBeTruthy();
    });

    it("featured card shows inline reason snippet by default", async () => {
      mockFetchPolicy.mockResolvedValue({
        ...PRO_POLICY,
        effective: {
          ...PRO_POLICY.effective,
          require_simulation_success: false,
        },
      });
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("recommendation-enable-simulation")).toBeTruthy();
      });

      expect(screen.getByTestId("recommendation-inline-reason-enable-simulation")).toBeTruthy();
      expect(screen.getByTestId("recommendation-inline-reason-enable-simulation").textContent).toContain("Why:");
    });

    it("non-featured top cards get data-emphasis=emphasized", async () => {
      // Two recs: enable-simulation (high, featured) + tighten-slippage (medium)
      mockFetchPolicy.mockResolvedValue({
        ...PRO_POLICY,
        effective: {
          ...PRO_POLICY.effective,
          require_simulation_success: false,
          max_slippage_bps: 500,
        },
      });
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("recommendation-tighten-slippage")).toBeTruthy();
      });

      const slippageCard = screen.getByTestId("recommendation-tighten-slippage");
      expect(slippageCard.getAttribute("data-emphasis")).toBe("emphasized");
    });

    it("more-suggestions cards get data-emphasis=standard", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("more-suggestions")).toBeTruthy();
      });

      fireEvent.click(screen.getByTestId("more-suggestions-toggle"));
      const moreList = screen.getByTestId("more-suggestions-list");
      const firstMoreCard = moreList.querySelector("[data-emphasis]");
      expect(firstMoreCard).toBeTruthy();
      expect(firstMoreCard!.getAttribute("data-emphasis")).toBe("standard");
    });

    it("featured card has prominent CTA button styling", async () => {
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

      const btn = screen.getByTestId("recommendation-action-enable-simulation");
      expect(btn.className).toContain("red");
    });

    it("featured card expand toggle says 'More detail' instead of 'Why this recommendation?'", async () => {
      mockFetchPolicy.mockResolvedValue({
        ...PRO_POLICY,
        effective: {
          ...PRO_POLICY.effective,
          require_simulation_success: false,
        },
      });
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("recommendation-details-toggle-enable-simulation")).toBeTruthy();
      });

      expect(screen.getByTestId("recommendation-details-toggle-enable-simulation").textContent).toContain("More detail");
    });

    it("inline confidence badge shown for high-confidence PIL rec in top section", async () => {
      mockFetchPolicy.mockResolvedValue({
        ...PRO_POLICY,
        effective: {
          ...PRO_POLICY.effective,
          require_simulation_success: false,
        },
      });
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
        expect(screen.getByTestId("recommendation-pil-reduce-slippage")).toBeTruthy();
      });

      // PIL high-confidence rec should have inline confidence in the top section
      const pilCard = screen.getByTestId("recommendation-pil-reduce-slippage");
      expect(pilCard.querySelector('[data-testid="recommendation-inline-confidence"]')).toBeTruthy();
    });

    it("top/more split preserved — low-priority recs still in more-suggestions", async () => {
      mockFetchPolicy.mockResolvedValue({
        ...PRO_POLICY,
        effective: {
          ...PRO_POLICY.effective,
          require_simulation_success: false,
        },
      });
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("more-suggestions")).toBeTruthy();
      });

      // "add-program-restrictions" is low priority → still in more
      fireEvent.click(screen.getByTestId("more-suggestions-toggle"));
      const moreList = screen.getByTestId("more-suggestions-list");
      expect(moreList.querySelector('[data-testid="recommendation-add-program-restrictions"]')).toBeTruthy();
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

      it("shows evidence text from market conditions summary after expanding", async () => {
        mockFetchPolicy.mockResolvedValue({
          ...PRO_POLICY,
          effective: { ...PRO_POLICY.effective, require_simulation_success: false },
        });
        mockFetchMarketConditions.mockResolvedValue(MARKET_DEGRADED);
        render(<CustomerPoliciesPage />);

        await waitFor(() => {
          expect(screen.getByTestId("recommendation-market-enable-simulation")).toBeTruthy();
        });

        // Evidence is hidden by default; expand the card
        fireEvent.click(screen.getByTestId("recommendation-details-toggle-market-enable-simulation"));

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

    it("shows evidence text for PIL recommendations after expanding", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      mockFetchPilRecommendations.mockResolvedValue(PIL_RESPONSE);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("recommendation-pil-reduce-slippage")).toBeTruthy();
      });

      // Evidence is hidden by default; expand the card
      fireEvent.click(screen.getByTestId("recommendation-details-toggle-pil-reduce-slippage"));

      expect(screen.getByText(/avg_slippage=95bps/)).toBeTruthy();
    });

    it("shows confidence indicator for PIL recommendations", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      mockFetchPilRecommendations.mockResolvedValue(PIL_RESPONSE);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("recommendation-pil-reduce-slippage")).toBeTruthy();
      });

      // High-confidence PIL recs show inline confidence badge (no expand needed)
      const card = screen.getByTestId("recommendation-pil-reduce-slippage");
      const inlineConf = card.querySelector('[data-testid="recommendation-inline-confidence"]');
      expect(inlineConf).toBeTruthy();
      expect(inlineConf!.textContent).toContain("confidence");
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

    it("shows evidence text for external context recommendations after expanding", async () => {
      mockFetchPolicy.mockResolvedValue(ENTERPRISE_POLICY);
      mockFetchExternalContext.mockResolvedValue(EXTERNAL_CONTEXT_RESPONSE);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("recommendation-ext-ext-sustained-throttle")).toBeTruthy();
      });

      // Evidence is hidden by default; expand the card
      fireEvent.click(screen.getByTestId("recommendation-details-toggle-ext-ext-sustained-throttle"));

      expect(screen.getByText(/sustained pressure for 6 consecutive/)).toBeTruthy();
    });

    it("shows confidence indicator for external context recommendations", async () => {
      mockFetchPolicy.mockResolvedValue(ENTERPRISE_POLICY);
      mockFetchExternalContext.mockResolvedValue(EXTERNAL_CONTEXT_RESPONSE);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("recommendation-ext-ext-sustained-throttle")).toBeTruthy();
      });

      // High-confidence external recs show inline confidence badge (no expand needed)
      const card = screen.getByTestId("recommendation-ext-ext-sustained-throttle");
      const inlineConf = card.querySelector('[data-testid="recommendation-inline-confidence"]');
      expect(inlineConf).toBeTruthy();
      expect(inlineConf!.textContent).toContain("confidence");
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

});

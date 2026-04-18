/**
 * customer-policy-overrides-status.test.tsx
 *
 * Covers view-mode status rendering for CustomerPoliciesPage:
 *   - Effective policy preview (Policy at a Glance)
 *   - Override / Default badges in the policy-rules panel
 *   - Policy simulation preview (example outcomes)
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  PRO_POLICY,
  PRO_POLICY_WITH_OVERRIDES,
  PRO_POLICY_WITH_TOKEN_POLICY,
  PRO_POLICY_WITH_PROGRAMS,
  EMPTY_HISTORY_SUMMARY,
  MARKET_STABLE,
  EMPTY_PIL,
  EMPTY_BENCHMARKS,
  EMPTY_EXTERNAL,
} from "./helpers/render-customer-policies";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockPush, mockReplace } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockReplace: vi.fn(),
}));
vi.mock("next/navigation", () => {
  const stableRouter = { push: mockPush, replace: mockReplace };
  return { useRouter: () => stableRouter };
});

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
// Tests
// ---------------------------------------------------------------------------

describe("CustomerPoliciesPage — status & preview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchReceiptSummary.mockResolvedValue(EMPTY_HISTORY_SUMMARY);
    mockFetchMarketConditions.mockResolvedValue(MARKET_STABLE);
    mockFetchPilRecommendations.mockResolvedValue(EMPTY_PIL);
    mockFetchCohortBenchmarks.mockResolvedValue(EMPTY_BENCHMARKS);
    mockFetchExternalContext.mockResolvedValue(EMPTY_EXTERNAL);
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

      const rules = screen.getByTestId("policy-rules");
      const overrideBadges = rules.querySelectorAll("span");
      const overrideTexts = Array.from(overrideBadges).map(
        (el) => el.textContent,
      );
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

      expect(
        screen.getByText(/Exceeds your \$25,000 USD transaction limit/),
      ).toBeTruthy();
    });

    it("generates allowed scenario for normal USD transaction", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Normal USD transaction")).toBeTruthy();
      });

      expect(
        screen.getByText(/Within your \$25,000 USD transaction limit/),
      ).toBeTruthy();
    });

    it("generates denied scenario for high slippage", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("High-slippage swap")).toBeTruthy();
      });

      expect(
        screen.getByText(/Slippage exceeds your 100 bps cap/),
      ).toBeTruthy();
    });

    it("generates denied scenario for failed simulation", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Failed simulation")).toBeTruthy();
      });

      expect(
        screen.getByText(/requires simulation to succeed/),
      ).toBeTruthy();
    });

    it("generates token policy scenarios for allowlist mode", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_TOKEN_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Approved token swap")).toBeTruthy();
      });

      expect(screen.getByText("Unlisted token swap")).toBeTruthy();
      expect(screen.getByText(/on your approved token list/)).toBeTruthy();
      expect(
        screen.getByText(/Only tokens on your allowlist are permitted/),
      ).toBeTruthy();
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

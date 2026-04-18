/**
 * customer-policy-overrides-token.test.tsx
 *
 * Covers the token policy editor for CustomerPoliciesPage:
 *   - Mode selector (unrestricted / allowlist / denylist)
 *   - Mint chip add / remove (quick-add and custom input)
 *   - Token policy included / excluded from save payload
 *   - Cancel resets token policy to default
 *
 * Kept separate from core because token-policy tests are DOM-heavy and
 * splitting them reduces per-worker heap pressure.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  PRO_POLICY,
  PRO_POLICY_WITH_TOKEN_POLICY,
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

describe("CustomerPoliciesPage — token policy editor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchReceiptSummary.mockResolvedValue(EMPTY_HISTORY_SUMMARY);
    mockFetchMarketConditions.mockResolvedValue(MARKET_STABLE);
    mockFetchPilRecommendations.mockResolvedValue(EMPTY_PIL);
    mockFetchCohortBenchmarks.mockResolvedValue(EMPTY_BENCHMARKS);
    mockFetchExternalContext.mockResolvedValue(EMPTY_EXTERNAL);
  });

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

    const allowlistBtn = screen.getByTestId("token-mode-allowlist");
    expect(allowlistBtn.className).toContain("border-amber");
  });

  it("switching to allowlist mode shows mint editor", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByText("Edit Overrides")).toBeTruthy();
    });

    fireEvent.click(screen.getByText("Edit Overrides"));
    fireEvent.click(screen.getByTestId("token-mode-allowlist"));

    expect(screen.getByText("Quick add popular tokens:")).toBeTruthy();
    expect(
      screen.getByPlaceholderText("Token symbol or mint address"),
    ).toBeTruthy();
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

    expect(
      screen.queryByPlaceholderText("Token symbol or mint address"),
    ).toBeNull();
  });

  it("adds a token via quick-add button", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByText("Edit Overrides")).toBeTruthy();
    });

    fireEvent.click(screen.getByText("Edit Overrides"));
    fireEvent.click(screen.getByTestId("token-mode-allowlist"));
    fireEvent.click(screen.getByText("+ SOL"));

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

    expect(screen.getByLabelText("Remove SOL")).toBeTruthy();
    expect(screen.getByLabelText("Remove USDC")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Remove SOL"));

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

    expect(screen.getByTitle("customMint123")).toBeTruthy();
  });

  it("includes token_policy in save payload for non-default mode", async () => {
    mockFetchPolicy
      .mockResolvedValueOnce(PRO_POLICY)
      .mockResolvedValueOnce(PRO_POLICY);
    mockUpdatePolicyOverrides.mockResolvedValue({
      overrides: {
        token_policy: {
          mode: "allowlist",
          allowed_mints: ["SOL"],
          denied_mints: [],
        },
      },
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

    fireEvent.click(screen.getByText("Cancel"));

    await waitFor(() => {
      expect(screen.getByText("Edit Overrides")).toBeTruthy();
    });
    fireEvent.click(screen.getByText("Edit Overrides"));

    const unrestrictedBtn = screen.getByTestId("token-mode-unrestricted");
    expect(unrestrictedBtn.className).toContain("border-amber");
  });

  it("denylist mode sets denied_mints in payload", async () => {
    mockFetchPolicy
      .mockResolvedValueOnce(PRO_POLICY)
      .mockResolvedValueOnce(PRO_POLICY);
    mockUpdatePolicyOverrides.mockResolvedValue({
      overrides: {
        token_policy: {
          mode: "denylist",
          allowed_mints: [],
          denied_mints: ["BONK"],
        },
      },
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

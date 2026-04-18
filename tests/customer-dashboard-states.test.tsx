import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mocks — must be declared before importing the component
// ---------------------------------------------------------------------------

const { mockPush, mockReplace } = vi.hoisted(() => ({ mockPush: vi.fn(), mockReplace: vi.fn() }));
vi.mock("next/navigation", () => {
  const stableRouter = { push: mockPush, replace: mockReplace };
  return { useRouter: () => stableRouter };
});

const mockFetchDashboard = vi.fn();
const mockFetchActivation = vi.fn();
const mockFetchReceipts = vi.fn();
const mockFetchUpgradeRequests = vi.fn();
const mockFetchPolicy = vi.fn();

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
    getApiKey: () => "test_key_123",
    fetchDashboard: (...args: unknown[]) => mockFetchDashboard(...args),
    clearAuth: vi.fn(),
    fetchSampleIntent: vi.fn(),
    simulateProtection: vi.fn(),
    executeSample: vi.fn(),
    fetchActivation: (...args: unknown[]) => mockFetchActivation(...args),
    markActivationStep: vi.fn(),
    fetchReceipts: (...args: unknown[]) => mockFetchReceipts(...args),
    requestVerificationEmail: vi.fn(),
    fetchUpgradeRequests: (...args: unknown[]) =>
      mockFetchUpgradeRequests(...args),
    fetchPolicy: (...args: unknown[]) => mockFetchPolicy(...args),
    updatePolicyOverrides: vi.fn().mockResolvedValue({}),
    ApiError,
  };
});

vi.mock("@/components/run-test-request", () => ({
  default: () => <div data-testid="run-test-request" />,
}));

import CustomerDashboardPage from "@/app/customer/dashboard/page";
// Re-import ApiError from the mocked module for instanceof checks
const { ApiError } = await import("@/lib/customer-auth");

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const EMPTY_DASHBOARD = {
  user_id: "u_1",
  email: "test@example.com",
  email_verified: true,
  tenant_id: "t_1",
  tenant: { plan_tier: "free", status: "active" },
  api_keys: [],
  receipt_count: 0,
};

const ACTIVE_DASHBOARD = {
  ...EMPTY_DASHBOARD,
  api_keys: [
    {
      key_id: "k_1",
      label: "Test Key",
      status: "active",
      created_at: 1711000000,
    },
  ],
  receipt_count: 5,
  activation: {
    onboarding_completed: true,
    steps_completed: [
      "sample_generated",
      "dry_run_completed",
      "execution_completed",
    ],
    first_receipt_id: "r_1",
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchActivation.mockResolvedValue({
    onboarding_completed: false,
    steps_completed: [],
    first_receipt_id: null,
  });
  mockFetchReceipts.mockResolvedValue({ receipts: [], count: 0 });
  mockFetchUpgradeRequests.mockResolvedValue({ requests: [] });
  mockFetchPolicy.mockResolvedValue({});
});

describe("CustomerDashboardPage — empty state", () => {
  it("renders empty-state message for a new verified user with no activity", async () => {
    mockFetchDashboard.mockResolvedValue(EMPTY_DASHBOARD);

    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByText(
          /your account is ready/i,
        ),
      ).toBeInTheDocument();
    });

    // Should NOT show error state
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("CustomerDashboardPage — error state", () => {
  it("renders global error state when both dashboard AND activation fail", async () => {
    // Both fetches fail - this triggers global error
    mockFetchDashboard.mockRejectedValue(
      new ApiError(
        "upstream_5xx",
        "We couldn't load your dashboard right now. Please try again in a moment.",
      ),
    );
    mockFetchActivation.mockRejectedValue(
      new ApiError("upstream_5xx", "Activation unavailable"),
    );

    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      // Error is classified to a user-friendly message
      expect(
        screen.getByText(/service temporarily unavailable/i),
      ).toBeInTheDocument();
    });

    // Retry button should exist
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("renders global error state on network failure when both fetches fail", async () => {
    // Both fetches fail with network error
    mockFetchDashboard.mockRejectedValue(
      new ApiError(
        "network_error",
        "We couldn't reach the dashboard service.",
      ),
    );
    mockFetchActivation.mockRejectedValue(
      new ApiError("network_error", "Activation unreachable"),
    );

    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      // Error is classified to a user-friendly message
      expect(
        screen.getByText(/network issue detected/i),
      ).toBeInTheDocument();
    });
  });
});

describe("CustomerDashboardPage — active state", () => {
  it("renders data for a user with activity without empty-state message", async () => {
    mockFetchDashboard.mockResolvedValue(ACTIVE_DASHBOARD);

    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/test@example\.com/)).toBeInTheDocument();
    });

    // Should NOT show the empty-state banner
    expect(
      screen.queryByText(/your account is ready/i),
    ).not.toBeInTheDocument();
  });
});

describe("CustomerDashboardPage — scoped error handling", () => {
  it("renders first-trade section without global error when dashboard fails but activation succeeds", async () => {
    // Dashboard fetch fails
    mockFetchDashboard.mockRejectedValue(
      new ApiError(
        "upstream_5xx",
        "We couldn't load your dashboard right now. Please try again in a moment.",
      ),
    );
    // But activation succeeds
    mockFetchActivation.mockResolvedValue({
      onboarding_completed: false,
      steps_completed: [],
      first_receipt_id: null,
    });

    render(<CustomerDashboardPage />);

    await waitFor(() => {
      // First-trade section should render
      expect(
        screen.getByTestId("first-trade-section"),
      ).toBeInTheDocument();
    });

    // Should NOT show global "service temporarily unavailable" error
    expect(
      screen.queryByText(/service temporarily unavailable/i),
    ).not.toBeInTheDocument();

    // Should show scoped error for data sections
    expect(
      screen.getByText(/plan and usage data unavailable/i),
    ).toBeInTheDocument();

    expect(
      screen.queryByText(/your account is ready/i),
    ).not.toBeInTheDocument();
  });

  it("first-trade card still renders when secondary data fetch fails", async () => {
    // Dashboard fails
    mockFetchDashboard.mockRejectedValue(
      new ApiError("upstream_5xx", "Dashboard unavailable"),
    );
    // Activation succeeds with some progress
    mockFetchActivation.mockResolvedValue({
      onboarding_completed: false,
      steps_completed: ["sample_generated"],
      first_receipt_id: null,
    });
    // Receipts fail (non-fatal)
    mockFetchReceipts.mockRejectedValue(new Error("Receipts unavailable"));

    render(<CustomerDashboardPage />);

    await waitFor(() => {
      // First-trade section should render
      expect(
        screen.getByTestId("first-trade-section"),
      ).toBeInTheDocument();
    });

    // Verify step indicators are present (both are rendered)
    const stepLabels = screen.getAllByText(/^(Generate|Simulate|Execute|Receipt)$/);
    expect(stepLabels.length).toBeGreaterThanOrEqual(4);
  });

  it("clears the scoped dashboard error after a successful retry", async () => {
    mockFetchDashboard.mockRejectedValueOnce(
      new ApiError("upstream_5xx", "We couldn't load your dashboard right now. Please try again in a moment."),
    );
    mockFetchActivation.mockResolvedValue({
      onboarding_completed: false,
      steps_completed: [],
      first_receipt_id: null,
    });

    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/plan and usage data unavailable/i),
      ).toBeInTheDocument();
    });

    mockFetchDashboard.mockResolvedValueOnce(ACTIVE_DASHBOARD);

    const retryButton = screen.getByRole("button", { name: "Retry" });
    await act(async () => {
      fireEvent.click(retryButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/test@example\.com/i)).toBeInTheDocument();
    });

    expect(
      screen.queryByText(/plan and usage data unavailable/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("redirects to login when the dashboard auth session is no longer valid", async () => {
    mockFetchDashboard.mockRejectedValue(
      new ApiError("unauthorized", "Your session has expired. Please sign in again."),
    );
    mockFetchActivation.mockRejectedValue(
      new ApiError("unauthorized", "Your session has expired. Please sign in again."),
    );

    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

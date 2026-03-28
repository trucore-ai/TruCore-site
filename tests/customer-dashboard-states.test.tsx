import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mocks — must be declared before importing the component
// ---------------------------------------------------------------------------

const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

const mockFetchDashboard = vi.fn();
const mockFetchActivation = vi.fn();
const mockFetchReceipts = vi.fn();
const mockFetchUpgradeRequests = vi.fn();

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
});

describe("CustomerDashboardPage — empty state", () => {
  it("renders empty-state message for a new verified user with no activity", async () => {
    mockFetchDashboard.mockResolvedValue(EMPTY_DASHBOARD);

    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByText(
          /your dashboard is ready, but there's no activity yet/i,
        ),
      ).toBeInTheDocument();
    });

    // Should NOT show error state
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("CustomerDashboardPage — error state", () => {
  it("renders error state on upstream failure", async () => {
    mockFetchDashboard.mockRejectedValue(
      new ApiError(
        "upstream_5xx",
        "We couldn't load your dashboard right now. Please try again in a moment.",
      ),
    );

    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(
        screen.getByText(/couldn't load your dashboard/i),
      ).toBeInTheDocument();
    });

    // Retry button should exist
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("renders error state on network failure", async () => {
    mockFetchDashboard.mockRejectedValue(
      new ApiError(
        "network_error",
        "We couldn't reach the dashboard service.",
      ),
    );

    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(
        screen.getByText(/couldn't reach the dashboard service/i),
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
      screen.queryByText(/no activity yet/i),
    ).not.toBeInTheDocument();
  });
});

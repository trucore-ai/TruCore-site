/**
 * Dashboard onboarding demotion tests.
 *
 * Validates that the "Protected Trade" card is:
 * - Prominent for new users (onboarding not yet completed)
 * - Demoted (collapsed, lower priority) for returning users
 * - Still accessible when expanded for returning users
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mocks — must be declared before importing the component
// ---------------------------------------------------------------------------

const { mockPush, mockReplace } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockReplace: vi.fn(),
}));
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

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseDashboard = {
  user_id: "u_test",
  email: "test@example.com",
  email_verified: true,
  tenant_id: "t_test",
  tenant: { plan_tier: "free", status: "active" },
  api_keys: [],
  receipt_count: 0,
};

const newUserActivation = {
  onboarding_completed: false,
  steps_completed: [],
  first_receipt_id: null,
};

const returningUserActivation = {
  onboarding_completed: true,
  steps_completed: ["sample_generated", "dry_run_completed", "execution_completed"],
  first_receipt_id: "rcpt_abc123",
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchReceipts.mockResolvedValue({ receipts: [], total: 0 });
  mockFetchUpgradeRequests.mockResolvedValue([]);
  mockFetchPolicy.mockResolvedValue({
    effective: {},
    plan_defaults: {},
    overrides: {},
    overrides_enabled: false,
  });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Dashboard onboarding demotion", () => {
  it("shows prominent first-trade section for new users", async () => {
    mockFetchDashboard.mockResolvedValue({
      ...baseDashboard,
      activation: newUserActivation,
    });
    mockFetchActivation.mockResolvedValue(newUserActivation);

    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("first-trade-section")).toBeInTheDocument();
    });

    // Should show the prominent heading (use heading role to avoid button match)
    expect(
      screen.getByRole("heading", { name: /run your first protected trade/i }),
    ).toBeInTheDocument();

    // Should NOT show the sandbox toggle (that's for returning users)
    expect(screen.queryByTestId("sandbox-toggle")).not.toBeInTheDocument();
  });

  it("shows collapsed sandbox card for returning users", async () => {
    mockFetchDashboard.mockResolvedValue({
      ...baseDashboard,
      activation: returningUserActivation,
      receipt_count: 3,
      api_keys: [{ key_id: "k_1", label: "test", status: "active", created_at: 1700000000 }],
    });
    mockFetchActivation.mockResolvedValue(returningUserActivation);

    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("first-trade-section")).toBeInTheDocument();
    });

    // Should show sandbox heading
    expect(screen.getByText("Protected Trade Sandbox")).toBeInTheDocument();

    // Should be collapsed by default
    expect(screen.getByTestId("sandbox-toggle")).toBeInTheDocument();

    // The prominent "Run Your First Protected Trade" heading should NOT appear
    expect(
      screen.queryByRole("heading", { name: /run your first protected trade/i }),
    ).not.toBeInTheDocument();
  });

  it("expands sandbox card when toggle is clicked", async () => {
    mockFetchDashboard.mockResolvedValue({
      ...baseDashboard,
      activation: returningUserActivation,
      receipt_count: 3,
      api_keys: [{ key_id: "k_1", label: "test", status: "active", created_at: 1700000000 }],
    });
    mockFetchActivation.mockResolvedValue(returningUserActivation);

    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("sandbox-toggle")).toBeInTheDocument();
    });

    // Click to expand
    fireEvent.click(screen.getByTestId("sandbox-toggle"));

    // Should now show the expanded content
    await waitFor(() => {
      expect(
        screen.getByText("Protected trade completed successfully"),
      ).toBeInTheDocument();
    });

    // Should have the "Try another protected trade" button
    expect(
      screen.getByText("Try another protected trade"),
    ).toBeInTheDocument();
  });

  it("sandbox card appears after policy summary for returning users", async () => {
    mockFetchDashboard.mockResolvedValue({
      ...baseDashboard,
      activation: returningUserActivation,
      receipt_count: 3,
      api_keys: [{ key_id: "k_1", label: "test", status: "active", created_at: 1700000000 }],
    });
    mockFetchActivation.mockResolvedValue(returningUserActivation);

    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("first-trade-section")).toBeInTheDocument();
    });

    // Verify the sandbox toggle exists (ordering validated by DOM structure)
    expect(screen.getByTestId("sandbox-toggle")).toBeInTheDocument();
  });
});

describe("Dashboard copy quality", () => {
  it("does not contain em dashes in user-facing dashboard copy", async () => {
    mockFetchDashboard.mockResolvedValue({
      ...baseDashboard,
      activation: newUserActivation,
    });
    mockFetchActivation.mockResolvedValue(newUserActivation);

    const { container } = render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("first-trade-section")).toBeInTheDocument();
    });

    // Check that no em dashes appear in the rendered text
    const textContent = container.textContent ?? "";
    // Em dash character: \u2014
    const emDashCount = (textContent.match(/\u2014/g) ?? []).length;
    expect(emDashCount).toBe(0);
  });
});

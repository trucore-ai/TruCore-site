import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mocks
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
const mockFetchSampleIntent = vi.fn();
const mockSimulateProtection = vi.fn();
const mockExecuteSample = vi.fn();
const mockMarkActivationStep = vi.fn();

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
    getApiKey: () => null,
    fetchDashboard: (...args: unknown[]) => mockFetchDashboard(...args),
    clearAuth: vi.fn(),
    fetchSampleIntent: (...args: unknown[]) => mockFetchSampleIntent(...args),
    simulateProtection: (...args: unknown[]) =>
      mockSimulateProtection(...args),
    executeSample: (...args: unknown[]) => mockExecuteSample(...args),
    fetchActivation: (...args: unknown[]) => mockFetchActivation(...args),
    markActivationStep: (...args: unknown[]) =>
      mockMarkActivationStep(...args),
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
const { ApiError } = await import("@/lib/customer-auth");

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const EMPTY_DASHBOARD = {
  user_id: "u_1",
  email: "new@example.com",
  email_verified: true,
  tenant_id: "t_1",
  tenant: { plan_tier: "free", status: "active" },
  api_keys: [],
  receipt_count: 0,
};

// ---------------------------------------------------------------------------
// Shared setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchDashboard.mockResolvedValue(EMPTY_DASHBOARD);
  mockFetchActivation.mockResolvedValue({
    onboarding_completed: false,
    steps_completed: [],
    first_receipt_id: null,
  });
  mockFetchReceipts.mockResolvedValue({ receipts: [], count: 0 });
  mockFetchUpgradeRequests.mockResolvedValue({ requests: [] });
  mockMarkActivationStep.mockResolvedValue({
    onboarding_completed: false,
    steps_completed: [],
    first_receipt_id: null,
  });
});

// ---------------------------------------------------------------------------
// S1: Empty state renders correctly
// ---------------------------------------------------------------------------

describe("First-use UX — empty state", () => {
  it('shows "Your account is ready" header for new users', async () => {
    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/your account is ready/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(/run your first protected trade to activate/i),
    ).toBeInTheDocument();
  });

  it("does not show error UI on initial empty load", async () => {
    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/your account is ready/i)).toBeInTheDocument();
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the trust signal text", async () => {
    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/your account is ready/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(/all transactions are policy-protected/i),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// S2: First trade button visible and positioned
// ---------------------------------------------------------------------------

describe("First-use UX — first trade button", () => {
  it('shows "Generate Sample Trade" button for new users', async () => {
    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByTestId("generate-btn"),
      ).toBeInTheDocument();
    });

    expect(screen.getByTestId("generate-btn")).toHaveTextContent(
      "Generate Sample Trade",
    );
  });

  it("first trade section appears before QuickTest", async () => {
    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("first-trade-section")).toBeInTheDocument();
    });

    const tradeSection = screen.getByTestId("first-trade-section");
    const quickTest = screen.getByTestId("run-test-request");

    // First trade section should appear before quick test in DOM
    expect(
      tradeSection.compareDocumentPosition(quickTest) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("first trade section appears above plan details", async () => {
    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("first-trade-section")).toBeInTheDocument();
      expect(screen.getByText(/your plan/i)).toBeInTheDocument();
    });

    const tradeSection = screen.getByTestId("first-trade-section");
    const planHeading = screen.getByText(/your plan/i);

    expect(
      tradeSection.compareDocumentPosition(planHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("shows step indicators (Generate, Simulate, Execute, Receipt)", async () => {
    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Generate")).toBeInTheDocument();
    });

    expect(screen.getByText("Simulate")).toBeInTheDocument();
    expect(screen.getByText("Execute")).toBeInTheDocument();
    expect(screen.getByText("Receipt")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// S3: Loading state disables interaction
// ---------------------------------------------------------------------------

describe("First-use UX — loading state", () => {
  it("disables generate button and shows spinner text while loading", async () => {
    // Make fetchSampleIntent hang
    mockFetchSampleIntent.mockReturnValue(new Promise(() => {}));

    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("generate-btn")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("generate-btn"));
    });

    await waitFor(() => {
      const btn = screen.getByTestId("generate-btn");
      expect(btn).toBeDisabled();
      expect(btn).toHaveTextContent(/generating sample trade/i);
    });
  });
});

// ---------------------------------------------------------------------------
// S4: Success state renders
// ---------------------------------------------------------------------------

describe("First-use UX — success state", () => {
  it("shows success banner after completing all steps", async () => {
    mockFetchSampleIntent.mockResolvedValue({
      intent: { action: "swap", amount: 1000000 },
    });
    mockSimulateProtection.mockResolvedValue({
      decision: "ALLOW",
      policy_breakdown: [{ policy: "amount-limit", result: "PASS", reason: "ok" }],
    });
    mockExecuteSample.mockResolvedValue({
      receipt: { receipt_id: "r_test_1" },
      execution_mode: "simulated",
    });

    render(<CustomerDashboardPage />);

    // Step 1: Generate — click and wait for intent to appear
    await waitFor(() => {
      expect(screen.getByTestId("generate-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("generate-btn"));
    });
    // Wait for intent JSON to render (proves handler completed)
    await waitFor(() => {
      expect(screen.getByText("Sample Intent")).toBeInTheDocument();
    });

    // Step 2: Simulate
    await waitFor(() => {
      expect(screen.getByTestId("simulate-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("simulate-btn"));
    });
    // Wait for policy evaluation to render
    await waitFor(() => {
      expect(screen.getByText("Policy Evaluation")).toBeInTheDocument();
    });

    // Step 3: Execute
    await waitFor(() => {
      expect(screen.getByTestId("execute-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("execute-btn"));
    });

    // Verify success banner
    await waitFor(() => {
      expect(
        screen.getByText(/protected trade completed successfully/i),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("link", { name: /view protected trade receipts/i }),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// S5: Error mapping works
// ---------------------------------------------------------------------------

describe("First-use UX — error mapping", () => {
  it("shows classified network error on generate failure", async () => {
    mockFetchSampleIntent.mockRejectedValue(
      new ApiError(
        "network_error",
        "We couldn't reach the sample trade service.",
      ),
    );

    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("generate-btn")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("generate-btn"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("ob-error")).toBeInTheDocument();
      expect(
        screen.getByText(/network issue detected/i),
      ).toBeInTheDocument();
    });
  });

  it("shows classified rate-limit error", async () => {
    mockFetchSampleIntent.mockRejectedValue(
      new ApiError("rate_limited", "Rate limit reached. Please try again later."),
    );

    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("generate-btn")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("generate-btn"));
    });

    await waitFor(() => {
      expect(
        screen.getByText(/too many requests/i),
      ).toBeInTheDocument();
    });
  });

  it("shows classified unavailable error", async () => {
    mockFetchSampleIntent.mockRejectedValue(
      new ApiError("upstream_5xx", "Sample trade generation is temporarily unavailable."),
    );

    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("generate-btn")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("generate-btn"));
    });

    await waitFor(() => {
      expect(
        screen.getByText(/service temporarily unavailable/i),
      ).toBeInTheDocument();
    });
  });

  it("shows classified unavailable error for unknown failures", async () => {
    mockFetchSampleIntent.mockRejectedValue(new Error("some weird error"));

    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("generate-btn")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("generate-btn"));
    });

    await waitFor(() => {
      // Generic errors get the "temporarily unavailable" fallback message from
      // handleGenerateSample, which classifyError maps to "unavailable"
      expect(
        screen.getByText(/service temporarily unavailable/i),
      ).toBeInTheDocument();
    });
  });

  it("shows Retry button inside onboarding error", async () => {
    mockFetchSampleIntent.mockRejectedValue(
      new ApiError("network_error", "We couldn't reach the sample trade service."),
    );

    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("generate-btn")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("generate-btn"));
    });

    await waitFor(() => {
      const errorBox = screen.getByTestId("ob-error");
      expect(errorBox).toBeInTheDocument();
      expect(errorBox.querySelector("button")).toHaveTextContent("Retry");
    });
  });
});

// ---------------------------------------------------------------------------
// S6: Dashboard-level error + retry
// ---------------------------------------------------------------------------

describe("First-use UX — dashboard error + retry", () => {
  it("shows a scoped retry card instead of a global alert when dashboard data fails but activation succeeds", async () => {
    mockFetchDashboard.mockRejectedValue(
      new ApiError(
        "upstream_5xx",
        "We couldn't load your dashboard right now. Please try again in a moment.",
      ),
    );

    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/plan and usage data unavailable/i),
      ).toBeInTheDocument();
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText(/your account is ready/i)).not.toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("Retry reloads dashboard data without a page reload and clears the scoped error", async () => {
    // Initial bootstrap fails until the user explicitly retries.
    mockFetchDashboard.mockRejectedValue(
      new ApiError("upstream_5xx", "Service temporarily unavailable."),
    );

    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/plan and usage data unavailable/i),
      ).toBeInTheDocument();
    });

    // Retry call succeeds
    mockFetchDashboard.mockResolvedValueOnce(EMPTY_DASHBOARD);

    await act(async () => {
      fireEvent.click(screen.getByText("Retry"));
    });

    await waitFor(() => {
      expect(screen.getByText(/your plan/i)).toBeInTheDocument();
      expect(screen.getByText(/new@example\.com/i)).toBeInTheDocument();
    });

    // Scoped dashboard error should be gone
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/plan and usage data unavailable/i),
    ).not.toBeInTheDocument();
  });
});

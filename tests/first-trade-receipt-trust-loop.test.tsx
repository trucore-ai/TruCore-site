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

const COMPLETED_ACTIVATION = {
  onboarding_completed: true,
  steps_completed: ["sample_generated", "dry_run_completed", "execution_completed"],
  first_receipt_id: "r_test_first_receipt",
};

const MOCK_RECEIPT = {
  receipt: { receipt_id: "r_live_123abc" },
  execution_mode: "simulated",
};

const MOCK_DRY_RUN = {
  decision: "ALLOW",
  policy_breakdown: [
    { policy: "amount-limit", result: "PASS", reason: "ok" },
    { policy: "rate-limit", result: "PASS", reason: "ok" },
  ],
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
// S1: Trust card renders with correct trust-focused copy
// ---------------------------------------------------------------------------

describe("First trade receipt trust loop — trust headline", () => {
  it("shows trust-focused headline after completing trade", async () => {
    mockFetchSampleIntent.mockResolvedValue({
      intent: { action: "swap", amount: 1000000 },
    });
    mockSimulateProtection.mockResolvedValue(MOCK_DRY_RUN);
    mockExecuteSample.mockResolvedValue(MOCK_RECEIPT);

    render(<CustomerDashboardPage />);

    // Complete all steps
    await waitFor(() => {
      expect(screen.getByTestId("generate-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("generate-btn"));
    });
    await waitFor(() => {
      expect(screen.getByText("Sample Intent")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByTestId("simulate-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("simulate-btn"));
    });
    await waitFor(() => {
      expect(screen.getByText("Policy Evaluation")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByTestId("execute-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("execute-btn"));
    });

    // Verify trust headline
    await waitFor(() => {
      expect(screen.getByTestId("trust-headline")).toBeInTheDocument();
    });
    expect(screen.getByTestId("trust-headline")).toHaveTextContent(
      /protected trade completed successfully/i,
    );
  });

  it("shows ATF enforcement subline", async () => {
    mockFetchSampleIntent.mockResolvedValue({
      intent: { action: "swap", amount: 1000000 },
    });
    mockSimulateProtection.mockResolvedValue(MOCK_DRY_RUN);
    mockExecuteSample.mockResolvedValue(MOCK_RECEIPT);

    render(<CustomerDashboardPage />);

    // Complete all steps
    await waitFor(() => {
      expect(screen.getByTestId("generate-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("generate-btn"));
    });
    await waitFor(() => {
      expect(screen.getByTestId("simulate-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("simulate-btn"));
    });
    await waitFor(() => {
      expect(screen.getByTestId("execute-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("execute-btn"));
    });

    // Verify subline
    await waitFor(() => {
      expect(screen.getByTestId("trust-subline")).toBeInTheDocument();
    });
    expect(screen.getByTestId("trust-subline")).toHaveTextContent(
      /atf evaluated, enforced, and recorded/i,
    );
  });
});

// ---------------------------------------------------------------------------
// S2: Receipt metadata renders when receipt data exists
// ---------------------------------------------------------------------------

describe("First trade receipt trust loop — receipt metadata", () => {
  it("shows receipt metadata card with receipt id when receipt exists", async () => {
    mockFetchSampleIntent.mockResolvedValue({
      intent: { action: "swap", amount: 1000000 },
    });
    mockSimulateProtection.mockResolvedValue(MOCK_DRY_RUN);
    mockExecuteSample.mockResolvedValue(MOCK_RECEIPT);

    render(<CustomerDashboardPage />);

    // Complete all steps
    await waitFor(() => {
      expect(screen.getByTestId("generate-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("generate-btn"));
    });
    await waitFor(() => {
      expect(screen.getByTestId("simulate-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("simulate-btn"));
    });
    await waitFor(() => {
      expect(screen.getByTestId("execute-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("execute-btn"));
    });

    // Verify metadata card renders
    await waitFor(() => {
      expect(screen.getByTestId("trust-metadata")).toBeInTheDocument();
    });

    // Should show receipt label
    expect(screen.getByText("Receipt:")).toBeInTheDocument();
    // Should show decision label
    expect(screen.getByText("Decision:")).toBeInTheDocument();
    // Should show verification label and value
    expect(screen.getByText("Verification:")).toBeInTheDocument();
    const metadataSection = screen.getByTestId("trust-metadata");
    expect(metadataSection).toHaveTextContent(/Available/);
  });

  it("shows decision badge in metadata", async () => {
    mockFetchSampleIntent.mockResolvedValue({
      intent: { action: "swap", amount: 1000000 },
    });
    mockSimulateProtection.mockResolvedValue(MOCK_DRY_RUN);
    mockExecuteSample.mockResolvedValue(MOCK_RECEIPT);

    render(<CustomerDashboardPage />);

    // Complete all steps
    await waitFor(() => {
      expect(screen.getByTestId("generate-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("generate-btn"));
    });
    await waitFor(() => {
      expect(screen.getByTestId("simulate-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("simulate-btn"));
    });
    await waitFor(() => {
      expect(screen.getByTestId("execute-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("execute-btn"));
    });

    // Verify ALLOW badge within metadata section
    await waitFor(() => {
      expect(screen.getByTestId("trust-metadata")).toBeInTheDocument();
    });
    const metadataSection = screen.getByTestId("trust-metadata");
    expect(metadataSection).toHaveTextContent("ALLOW");
  });
});

// ---------------------------------------------------------------------------
// S3: Verification explainer renders
// ---------------------------------------------------------------------------

describe("First trade receipt trust loop — verification explainer", () => {
  it("shows verification explainer text", async () => {
    mockFetchSampleIntent.mockResolvedValue({
      intent: { action: "swap", amount: 1000000 },
    });
    mockSimulateProtection.mockResolvedValue(MOCK_DRY_RUN);
    mockExecuteSample.mockResolvedValue(MOCK_RECEIPT);

    render(<CustomerDashboardPage />);

    // Complete all steps
    await waitFor(() => {
      expect(screen.getByTestId("generate-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("generate-btn"));
    });
    await waitFor(() => {
      expect(screen.getByTestId("simulate-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("simulate-btn"));
    });
    await waitFor(() => {
      expect(screen.getByTestId("execute-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("execute-btn"));
    });

    // Verify explainer
    await waitFor(() => {
      expect(screen.getByTestId("verification-explainer")).toBeInTheDocument();
    });
    expect(screen.getByTestId("verification-explainer")).toHaveTextContent(
      /receipts are tamper-evident records/i,
    );
  });
});

// ---------------------------------------------------------------------------
// S4: Receipt actions render correctly
// ---------------------------------------------------------------------------

describe("First trade receipt trust loop — receipt actions", () => {
  it("shows View protected trade receipts link", async () => {
    mockFetchSampleIntent.mockResolvedValue({
      intent: { action: "swap", amount: 1000000 },
    });
    mockSimulateProtection.mockResolvedValue(MOCK_DRY_RUN);
    mockExecuteSample.mockResolvedValue(MOCK_RECEIPT);

    render(<CustomerDashboardPage />);

    // Complete all steps
    await waitFor(() => {
      expect(screen.getByTestId("generate-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("generate-btn"));
    });
    await waitFor(() => {
      expect(screen.getByTestId("simulate-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("simulate-btn"));
    });
    await waitFor(() => {
      expect(screen.getByTestId("execute-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("execute-btn"));
    });

    // Verify actions
    await waitFor(() => {
      expect(screen.getByTestId("trust-actions")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("link", { name: /view protected trade receipts/i }),
    ).toBeInTheDocument();
  });

  it("shows verify receipt action when receipt id exists", async () => {
    mockFetchSampleIntent.mockResolvedValue({
      intent: { action: "swap", amount: 1000000 },
    });
    mockSimulateProtection.mockResolvedValue(MOCK_DRY_RUN);
    mockExecuteSample.mockResolvedValue(MOCK_RECEIPT);

    render(<CustomerDashboardPage />);

    // Complete all steps
    await waitFor(() => {
      expect(screen.getByTestId("generate-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("generate-btn"));
    });
    await waitFor(() => {
      expect(screen.getByTestId("simulate-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("simulate-btn"));
    });
    await waitFor(() => {
      expect(screen.getByTestId("execute-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("execute-btn"));
    });

    // Verify verify action renders
    await waitFor(() => {
      expect(screen.getByTestId("verify-action")).toBeInTheDocument();
    });
    expect(screen.getByTestId("verify-action")).toHaveTextContent(
      /verify receipt/i,
    );
  });

  it("shows run another trade button", async () => {
    mockFetchSampleIntent.mockResolvedValue({
      intent: { action: "swap", amount: 1000000 },
    });
    mockSimulateProtection.mockResolvedValue(MOCK_DRY_RUN);
    mockExecuteSample.mockResolvedValue(MOCK_RECEIPT);

    render(<CustomerDashboardPage />);

    // Complete all steps
    await waitFor(() => {
      expect(screen.getByTestId("generate-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("generate-btn"));
    });
    await waitFor(() => {
      expect(screen.getByTestId("simulate-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("simulate-btn"));
    });
    await waitFor(() => {
      expect(screen.getByTestId("execute-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("execute-btn"));
    });

    // Verify run another trade
    await waitFor(() => {
      expect(screen.getByTestId("trust-actions")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /run another trade/i }),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// S5: Partial success fallback renders when receipt data is absent
// ---------------------------------------------------------------------------

describe("First trade receipt trust loop — partial receipt fallback", () => {
  it("shows pending fallback when receipt has no receipt_id", async () => {
    mockFetchSampleIntent.mockResolvedValue({
      intent: { action: "swap", amount: 1000000 },
    });
    mockSimulateProtection.mockResolvedValue(MOCK_DRY_RUN);
    // Receipt without receipt_id
    mockExecuteSample.mockResolvedValue({
      execution_mode: "simulated",
      receipt: {}, // No receipt_id
    });
    // No receipts on backend either
    mockFetchReceipts.mockResolvedValue({ receipts: [], count: 0 });

    render(<CustomerDashboardPage />);

    // Complete all steps
    await waitFor(() => {
      expect(screen.getByTestId("generate-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("generate-btn"));
    });
    await waitFor(() => {
      expect(screen.getByTestId("simulate-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("simulate-btn"));
    });
    await waitFor(() => {
      expect(screen.getByTestId("execute-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("execute-btn"));
    });

    // Verify fallback renders
    await waitFor(() => {
      expect(screen.getByTestId("trust-metadata-pending")).toBeInTheDocument();
    });
    expect(screen.getByTestId("trust-metadata-pending")).toHaveTextContent(
      /receipt is being prepared/i,
    );
  });

  it("does not show verify action when receipt data is absent", async () => {
    mockFetchSampleIntent.mockResolvedValue({
      intent: { action: "swap", amount: 1000000 },
    });
    mockSimulateProtection.mockResolvedValue(MOCK_DRY_RUN);
    // Receipt without receipt_id
    mockExecuteSample.mockResolvedValue({
      execution_mode: "simulated",
      receipt: {},
    });
    mockFetchReceipts.mockResolvedValue({ receipts: [], count: 0 });

    render(<CustomerDashboardPage />);

    // Complete all steps
    await waitFor(() => {
      expect(screen.getByTestId("generate-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("generate-btn"));
    });
    await waitFor(() => {
      expect(screen.getByTestId("simulate-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("simulate-btn"));
    });
    await waitFor(() => {
      expect(screen.getByTestId("execute-btn")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("execute-btn"));
    });

    // Verify no verify action
    await waitFor(() => {
      expect(screen.getByTestId("trust-actions")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("verify-action")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// S6: Completed state from backend activation still shows trust card
// ---------------------------------------------------------------------------

describe("First trade receipt trust loop — backend activation restore", () => {
  it("shows trust card when restored from completed backend activation", async () => {
    mockFetchDashboard.mockResolvedValue({
      ...EMPTY_DASHBOARD,
      receipt_count: 1,
    });
    mockFetchActivation.mockResolvedValue(COMPLETED_ACTIVATION);
    mockFetchReceipts.mockResolvedValue({
      receipts: [
        {
          receipt_id: "r_test_first_receipt",
          created_at: Date.now(),
          decision: "ALLOW",
          dry_run: false,
          content_hash: "abc123",
          protected_by: "ATF",
          summary: "Test trade",
          intent_type: "swap",
        },
      ],
      count: 1,
    });

    render(<CustomerDashboardPage />);

    // Should immediately show trust headline (no need to click through steps)
    await waitFor(() => {
      expect(screen.getByTestId("trust-headline")).toBeInTheDocument();
    });
    expect(screen.getByTestId("trust-headline")).toHaveTextContent(
      /protected trade completed successfully/i,
    );
  });
});

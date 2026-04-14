import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/verify-receipt-form", () => ({
  VerifyReceiptForm: () => <div data-testid="verify-receipt-form" />,
}));

vi.mock("@/components/ui/container", () => ({
  Container: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/section", () => ({
  Section: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
}));

vi.mock("@/components/tracked-link", () => ({
  TrackedLink: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/verify-page-cta", () => ({
  VerifyPageCta: () => <div data-testid="verify-page-cta" />,
}));

vi.mock("@/lib/track", () => ({
  trackEvent: vi.fn(),
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
    getApiKey: () => null,
    fetchDashboard: (...args: unknown[]) => mockFetchDashboard(...args),
    clearAuth: vi.fn(),
    fetchSampleIntent: vi.fn(),
    simulateProtection: vi.fn(),
    executeSample: vi.fn(),
    fetchActivation: (...args: unknown[]) => mockFetchActivation(...args),
    markActivationStep: vi.fn(),
    fetchReceipts: (...args: unknown[]) => mockFetchReceipts(...args),
    requestVerificationEmail: vi.fn(),
    fetchUpgradeRequests: (...args: unknown[]) => mockFetchUpgradeRequests(...args),
    fetchPolicy: vi.fn().mockResolvedValue({}),
    updatePolicyOverrides: vi.fn().mockResolvedValue({}),
    ApiError,
  };
});

vi.mock("@/components/run-test-request", () => ({
  default: () => <div data-testid="run-test-request" />,
}));

import VerifyReceiptPage from "@/app/verify/page";
import CustomerDashboardPage from "@/app/customer/dashboard/page";
import { buildTelegramUrl, buildTwitterUrl, buildVerifyUrl } from "@/lib/share-utils";
import { fetchSampleIntent, simulateProtection, executeSample, markActivationStep } from "@/lib/customer-auth";

beforeEach(() => {
  vi.clearAllMocks();

  vi.stubGlobal("navigator", {
    clipboard: {
      writeText: vi.fn(() => Promise.resolve()),
    },
  });

  mockFetchDashboard.mockResolvedValue({
    user_id: "u_1",
    email: "user@example.com",
    email_verified: true,
    tenant_id: "t_1",
    tenant: { plan_tier: "free", status: "active" },
    api_keys: [],
    receipt_count: 1,
    activation: {
      onboarding_completed: true,
      steps_completed: ["sample_generated", "dry_run_completed", "execution_completed"],
      first_receipt_id: "hash_abc123",
    },
  });

  mockFetchActivation.mockResolvedValue({
    onboarding_completed: true,
    steps_completed: ["sample_generated", "dry_run_completed", "execution_completed"],
    first_receipt_id: "hash_abc123",
  });

  mockFetchReceipts.mockResolvedValue({ receipts: [], count: 1 });
  mockFetchUpgradeRequests.mockResolvedValue({ requests: [] });
});

/**
 * Set up mocks so the dashboard starts at onboarding step 0 and the
 * generate → simulate → execute flow completes when "Run Your First
 * Protected Trade" is clicked.  After calling this, render the page
 * and click the quick-trade button to populate obReceipt.
 */
function setupExecutionFlowMocks() {
  const SAMPLE_INTENT = { action: "swap", from_token: "SOL", to_token: "USDC", amount: 1 };

  mockFetchDashboard.mockResolvedValue({
    user_id: "u_1",
    email: "user@example.com",
    email_verified: true,
    tenant_id: "t_1",
    tenant: { plan_tier: "free", status: "active" },
    api_keys: [],
    receipt_count: 0,
    activation: {
      onboarding_completed: false,
      steps_completed: [],
      first_receipt_id: null,
    },
  });

  mockFetchActivation.mockResolvedValue({
    onboarding_completed: false,
    steps_completed: [],
    first_receipt_id: null,
  });

  (fetchSampleIntent as ReturnType<typeof vi.fn>).mockResolvedValue({
    intent: SAMPLE_INTENT,
  });

  (simulateProtection as ReturnType<typeof vi.fn>).mockResolvedValue({
    decision: "ALLOW",
    receipt: { receipt_id: "hash_abc123" },
  });

  (executeSample as ReturnType<typeof vi.fn>).mockResolvedValue({
    receipt: { receipt_id: "hash_abc123", content_hash: "hash_abc123" },
  });

  (markActivationStep as ReturnType<typeof vi.fn>).mockResolvedValue({
    onboarding_completed: true,
    steps_completed: ["sample_generated", "dry_run_completed", "execution_completed"],
    first_receipt_id: "hash_abc123",
  });
}

/**
 * Render the dashboard, trigger the quick-trade flow, and wait for the
 * post-execution proof surface to appear (trust-actions with proof links).
 */
async function renderDashboardWithExecutionFlow() {
  setupExecutionFlowMocks();
  render(<CustomerDashboardPage />);

  // Wait for the quick-trade button to appear (dashboard loaded, step 0)
  const quickTradeBtn = await screen.findByTestId("quick-trade-btn");
  fireEvent.click(quickTradeBtn);

  // Wait for the execution flow to complete and proof elements to render
  await waitFor(() => {
    expect(screen.getByTestId("trust-actions")).toBeInTheDocument();
  });
}

describe("share-utils", () => {
  it("buildVerifyUrl generates canonical share verify URL", () => {
    expect(buildVerifyUrl("abc123")).toBe("https://www.trucore.xyz/verify?hash=abc123&from=share");
  });

  it("buildTwitterUrl contains encoded verify URL", () => {
    const url = buildVerifyUrl("abc123");
    const twitterUrl = buildTwitterUrl(url);

    expect(twitterUrl).toContain("twitter.com/intent/tweet?text=");
    expect(twitterUrl).toContain(encodeURIComponent(url));
  });

  it("buildTelegramUrl contains encoded url and text", () => {
    const url = buildVerifyUrl("abc123");
    const telegramUrl = buildTelegramUrl(url);

    expect(telegramUrl).toContain("https://t.me/share/url?url=");
    expect(telegramUrl).toContain(`url=${encodeURIComponent(url)}`);
    expect(telegramUrl).toContain("text=");
  });
});

describe("verify page sharing section", () => {
  it("shows share section when hash exists", async () => {
    const page = await VerifyReceiptPage({ searchParams: Promise.resolve({ hash: "abc123" }) });
    render(page);

    expect(screen.getByText("Share this receipt")).toBeInTheDocument();
    expect(
      screen.getByText("Anyone can independently verify this transaction"),
    ).toBeInTheDocument();
  });

  it("copy button writes the correct verify URL", async () => {
    const page = await VerifyReceiptPage({ searchParams: Promise.resolve({ hash: "abc123" }) });
    render(page);

    fireEvent.click(screen.getByTestId("copy-share-link-button"));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "https://www.trucore.xyz/verify?hash=abc123&from=share",
      );
    });
  });

  it("twitter and telegram links contain encoded URL", async () => {
    const hash = "abc123";
    const verifyUrl = buildVerifyUrl(hash);
    const page = await VerifyReceiptPage({ searchParams: Promise.resolve({ hash }) });
    render(page);

    const twitter = screen.getByTestId("twitter-share-link");
    const telegram = screen.getByTestId("telegram-share-link");

    expect(twitter.getAttribute("href")).toContain(encodeURIComponent(verifyUrl));
    expect(telegram.getAttribute("href")).toContain(`url=${encodeURIComponent(verifyUrl)}`);
  });

  it("OG preview link points at receipt OG endpoint", async () => {
    const hash = "abc123";
    const page = await VerifyReceiptPage({ searchParams: Promise.resolve({ hash }) });
    render(page);

    const ogPreview = screen.getByTestId("open-og-preview-link");
    expect(ogPreview.getAttribute("href")).toBe(`/api/og/receipt?hash=${encodeURIComponent(hash)}`);
  });

  it("does not render share section when hash is missing", async () => {
    const page = await VerifyReceiptPage({ searchParams: Promise.resolve({}) });
    render(page);

    expect(screen.queryByText("Share this receipt")).not.toBeInTheDocument();
  });
});

describe("dashboard success state share actions", () => {
  it("shows view/share/preview actions after successful trade", async () => {
    await renderDashboardWithExecutionFlow();

    expect(screen.getByRole("link", { name: "View Receipt" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share Receipt" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Preview Share Card" })).toBeInTheDocument();
  });

  it("dashboard actions use correct verify + OG preview links", async () => {
    await renderDashboardWithExecutionFlow();

    const viewReceipt = screen.getByRole("link", { name: "View Receipt" });
    const previewOg = screen.getByRole("link", { name: "Preview Share Card" });

    expect(viewReceipt.getAttribute("href")).toBe("/verify?hash=hash_abc123&from=share");
    expect(previewOg.getAttribute("href")).toBe("/api/og/receipt?hash=hash_abc123");
  });

  it("share receipt button copies canonical verify link", async () => {
    await renderDashboardWithExecutionFlow();

    fireEvent.click(screen.getByRole("button", { name: "Share Receipt" }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "https://www.trucore.xyz/verify?hash=hash_abc123&from=share",
      );
    });
  });
});

describe("verify success surface includes proof links", () => {
  it("renders ProofLinksCard when hash is present", async () => {
    const page = await VerifyReceiptPage({ searchParams: Promise.resolve({ hash: "abc123" }) });
    render(page);

    expect(screen.getByTestId("proof-links-card")).toBeInTheDocument();
  });

  it("verify URL in ProofLinksCard is canonical", async () => {
    const page = await VerifyReceiptPage({ searchParams: Promise.resolve({ hash: "abc123" }) });
    render(page);

    const verifyUrlEl = screen.getByTestId("proof-verify-url");
    expect(verifyUrlEl.textContent).toBe("https://www.trucore.xyz/verify?hash=abc123&from=share");
  });

  it("OG preview URL in ProofLinksCard is canonical", async () => {
    const page = await VerifyReceiptPage({ searchParams: Promise.resolve({ hash: "abc123" }) });
    render(page);

    const ogUrlEl = screen.getByTestId("proof-og-url");
    expect(ogUrlEl.textContent).toBe("https://www.trucore.xyz/api/og/receipt?hash=abc123");
  });

  it("does not render ProofLinksCard when hash is absent", async () => {
    const page = await VerifyReceiptPage({ searchParams: Promise.resolve({}) });
    render(page);

    expect(screen.queryByTestId("proof-links-card")).not.toBeInTheDocument();
  });
});

describe("dashboard success surface includes proof links", () => {
  it("renders ProofLinksCard in success state when receipt id is available", async () => {
    await renderDashboardWithExecutionFlow();

    expect(screen.getByTestId("proof-links-card")).toBeInTheDocument();
  });

  it("proof links card verify URL uses receipt id from activation", async () => {
    await renderDashboardWithExecutionFlow();

    const verifyUrlEl = screen.getByTestId("proof-verify-url");
    expect(verifyUrlEl.textContent).toBe(
      "https://www.trucore.xyz/verify?hash=hash_abc123&from=share",
    );
  });
});

// ────────────────────────────────────────────────────────────────
// Distribution Actions Integration Tests
// ────────────────────────────────────────────────────────────────

describe("verify page distribution actions", () => {
  it("renders DistributionActions when hash is present", async () => {
    const page = await VerifyReceiptPage({ searchParams: Promise.resolve({ hash: "abc123" }) });
    render(page);

    expect(screen.getByTestId("distribution-actions")).toBeInTheDocument();
  });

  it("renders Copy Share Text button", async () => {
    const page = await VerifyReceiptPage({ searchParams: Promise.resolve({ hash: "abc123" }) });
    render(page);

    expect(screen.getByTestId("copy-share-text-btn")).toBeInTheDocument();
  });

  it("renders Copy Bot Line button", async () => {
    const page = await VerifyReceiptPage({ searchParams: Promise.resolve({ hash: "abc123" }) });
    render(page);

    expect(screen.getByTestId("copy-bot-line-btn")).toBeInTheDocument();
  });

  it("does not render DistributionActions when hash is absent", async () => {
    const page = await VerifyReceiptPage({ searchParams: Promise.resolve({}) });
    render(page);

    expect(screen.queryByTestId("distribution-actions")).not.toBeInTheDocument();
  });
});

describe("dashboard distribution actions", () => {
  it("renders DistributionActions in success state when receipt id is available", async () => {
    await renderDashboardWithExecutionFlow();

    expect(screen.getByTestId("distribution-actions")).toBeInTheDocument();
  });

  it("renders Copy Share Text button in dashboard", async () => {
    await renderDashboardWithExecutionFlow();

    expect(screen.getByTestId("copy-share-text-btn")).toBeInTheDocument();
  });

  it("renders Copy Bot Line button in dashboard", async () => {
    await renderDashboardWithExecutionFlow();

    expect(screen.getByTestId("copy-bot-line-btn")).toBeInTheDocument();
  });
});

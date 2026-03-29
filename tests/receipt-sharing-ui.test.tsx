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
    ApiError,
  };
});

vi.mock("@/components/run-test-request", () => ({
  default: () => <div data-testid="run-test-request" />,
}));

import VerifyReceiptPage from "@/app/verify/page";
import CustomerDashboardPage from "@/app/customer/dashboard/page";
import { buildTelegramUrl, buildTwitterUrl, buildVerifyUrl } from "@/lib/share-utils";

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

describe("share-utils", () => {
  it("buildVerifyUrl generates canonical share verify URL", () => {
    expect(buildVerifyUrl("abc123")).toBe("https://trucore.xyz/verify?hash=abc123&from=share");
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
        "https://trucore.xyz/verify?hash=abc123&from=share",
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
    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("trust-actions")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: "View Receipt" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share Receipt" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Preview Share Card" })).toBeInTheDocument();
  });

  it("dashboard actions use correct verify + OG preview links", async () => {
    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "View Receipt" })).toBeInTheDocument();
    });

    const viewReceipt = screen.getByRole("link", { name: "View Receipt" });
    const previewOg = screen.getByRole("link", { name: "Preview Share Card" });

    expect(viewReceipt.getAttribute("href")).toBe("/verify?hash=hash_abc123&from=share");
    expect(previewOg.getAttribute("href")).toBe("/api/og/receipt?hash=hash_abc123");
  });

  it("share receipt button copies canonical verify link", async () => {
    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Share Receipt" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Share Receipt" }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "https://trucore.xyz/verify?hash=hash_abc123&from=share",
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
    expect(verifyUrlEl.textContent).toBe("https://trucore.xyz/verify?hash=abc123&from=share");
  });

  it("OG preview URL in ProofLinksCard is canonical", async () => {
    const page = await VerifyReceiptPage({ searchParams: Promise.resolve({ hash: "abc123" }) });
    render(page);

    const ogUrlEl = screen.getByTestId("proof-og-url");
    expect(ogUrlEl.textContent).toBe("https://trucore.xyz/api/og/receipt?hash=abc123");
  });

  it("does not render ProofLinksCard when hash is absent", async () => {
    const page = await VerifyReceiptPage({ searchParams: Promise.resolve({}) });
    render(page);

    expect(screen.queryByTestId("proof-links-card")).not.toBeInTheDocument();
  });
});

describe("dashboard success surface includes proof links", () => {
  it("renders ProofLinksCard in success state when receipt id is available", async () => {
    render(<CustomerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("proof-links-card")).toBeInTheDocument();
    });
  });

  it("proof links card verify URL uses receipt id from activation", async () => {
    render(<CustomerDashboardPage />);

    await waitFor(() => {
      const verifyUrlEl = screen.getByTestId("proof-verify-url");
      expect(verifyUrlEl.textContent).toBe(
        "https://trucore.xyz/verify?hash=hash_abc123&from=share",
      );
    });
  });
});

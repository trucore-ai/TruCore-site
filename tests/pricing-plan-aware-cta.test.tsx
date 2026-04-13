import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mocks — declared before importing the component
// ---------------------------------------------------------------------------

const mockIsLoggedIn = vi.fn();
const mockFetchDashboard = vi.fn();

vi.mock("@/lib/customer-auth", () => ({
  isLoggedIn: () => mockIsLoggedIn(),
  fetchDashboard: () => mockFetchDashboard(),
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import { PricingCards } from "@/components/pricing-cards";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PLANS = [
  {
    tier: "Free",
    tagline: "For builders exploring ATF",
    price: "$0",
    priceNote: "No credit card required",
    highlight: false,
    limits: { protect: "100 / day", execution: "10 / day", receipts: "100 stored" },
    features: ["Feature A"],
    cta: { label: "Get Started Free", href: "/signup" },
  },
  {
    tier: "Pro",
    tagline: "For teams shipping real agents",
    price: "Contact us",
    priceNote: "Custom pricing",
    highlight: true,
    limits: { protect: "5,000 / day", execution: "500 / day", receipts: "10,000 stored" },
    features: ["Everything in Free"],
    cta: { label: "Request Pro Access", href: "/upgrade?plan=pro" },
  },
  {
    tier: "Enterprise",
    tagline: "For institutions",
    price: "Custom",
    priceNote: "Volume-based",
    highlight: false,
    limits: { protect: "1M / day", execution: "100K / day", receipts: "10M stored" },
    features: ["Everything in Pro"],
    cta: { label: "Request Enterprise", href: "/upgrade?plan=enterprise" },
  },
] as const;

const EMPTY_CATALOG: Record<string, never[]> = {};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PricingCards — CTA behaviour", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows default CTAs for logged-out users", async () => {
    mockIsLoggedIn.mockReturnValue(false);
    render(<PricingCards plans={PLANS} featuresByPlan={EMPTY_CATALOG} />);

    await waitFor(() => {
      expect(screen.getByText("Get Started Free")).toBeDefined();
      expect(screen.getByText("Request Pro Access")).toBeDefined();
      expect(screen.getByText("Request Enterprise")).toBeDefined();
    });
  });

  it("shows 'Current Plan' for a logged-in Free user on the Free card", async () => {
    mockIsLoggedIn.mockReturnValue(true);
    mockFetchDashboard.mockResolvedValue({ tenant: { plan_tier: "free" } });
    render(<PricingCards plans={PLANS} featuresByPlan={EMPTY_CATALOG} />);

    await waitFor(() => {
      // Badge + CTA both say "Current Plan"
      expect(screen.getAllByText("Current Plan")).toHaveLength(2);
    });

    // Free card CTA should link to dashboard, not /signup
    const currentLinks = screen.getAllByText("Current Plan").filter((el) => el.tagName === "A");
    expect(currentLinks).toHaveLength(1);
    expect(currentLinks[0].getAttribute("href")).toBe("/customer/dashboard");

    // Pro and Enterprise should keep their default CTAs
    expect(screen.getByText("Request Pro Access")).toBeDefined();
    expect(screen.getByText("Request Enterprise")).toBeDefined();
  });

  it("shows 'Current Plan' on Pro and 'Go to Dashboard' on Free for a Pro user", async () => {
    mockIsLoggedIn.mockReturnValue(true);
    mockFetchDashboard.mockResolvedValue({ tenant: { plan_tier: "pro" } });
    render(<PricingCards plans={PLANS} featuresByPlan={EMPTY_CATALOG} />);

    await waitFor(() => {
      expect(screen.getAllByText("Current Plan")).toHaveLength(2);
      expect(screen.getByText("Go to Dashboard")).toBeDefined();
    });

    // Pro card CTA links to dashboard
    const currentLinks = screen.getAllByText("Current Plan").filter((el) => el.tagName === "A");
    expect(currentLinks).toHaveLength(1);
    expect(currentLinks[0].getAttribute("href")).toBe("/customer/dashboard");

    // Free card shows dashboard link, not signup
    const dashLink = screen.getByText("Go to Dashboard").closest("a");
    expect(dashLink?.getAttribute("href")).toBe("/customer/dashboard");

    // Enterprise keeps its default CTA
    expect(screen.getByText("Request Enterprise")).toBeDefined();
  });

  it("shows 'Current Plan' on Enterprise and 'Go to Dashboard' on Free/Pro for Enterprise user", async () => {
    mockIsLoggedIn.mockReturnValue(true);
    mockFetchDashboard.mockResolvedValue({ tenant: { plan_tier: "enterprise" } });
    render(<PricingCards plans={PLANS} featuresByPlan={EMPTY_CATALOG} />);

    await waitFor(() => {
      expect(screen.getAllByText("Current Plan")).toHaveLength(2);
    });

    const dashLinks = screen.getAllByText("Go to Dashboard");
    expect(dashLinks).toHaveLength(2); // Free + Pro
  });

  it("falls back to default CTAs when dashboard fetch fails", async () => {
    mockIsLoggedIn.mockReturnValue(true);
    mockFetchDashboard.mockRejectedValue(new Error("network error"));
    render(<PricingCards plans={PLANS} featuresByPlan={EMPTY_CATALOG} />);

    await waitFor(() => {
      expect(screen.getByText("Get Started Free")).toBeDefined();
      expect(screen.getByText("Request Pro Access")).toBeDefined();
      expect(screen.getByText("Request Enterprise")).toBeDefined();
    });
  });
});

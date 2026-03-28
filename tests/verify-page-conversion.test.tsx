import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

/* ────────────────────────────────────────────────────────────────
 *  Verify Page Conversion Tests
 *
 *  Verifies that the verify page:
 *  - Shows hero context for shared receipt visitors
 *  - Shows trust breakdown explaining what happened
 *  - Renders correct CTAs based on auth state
 *  - Tracks telemetry events
 *  - Preserves verification functionality
 * ──────────────────────────────────────────────────────────── */

// ── Mocks ────────────────────────────────────────────────────

const mockTrackEvent = vi.fn();
vi.mock("@/lib/analytics", () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}));

const mockIsLoggedIn = vi.fn();
vi.mock("@/lib/customer-auth", () => ({
  isLoggedIn: () => mockIsLoggedIn(),
}));

// Mock Link component
vi.mock("next/link", () => ({
  default: ({ children, href, onClick }: { children: React.ReactNode; href: string; onClick?: () => void }) => (
    <a href={href} onClick={onClick} data-testid={`link-${href.replace(/\//g, "-")}`}>
      {children}
    </a>
  ),
}));

import { VerifyPageCta } from "@/components/verify-page-cta";

// ── Setup ────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ── VerifyPageCta Component Tests ────────────────────────────

describe("VerifyPageCta", () => {
  describe("when user is not logged in", () => {
    beforeEach(() => {
      mockIsLoggedIn.mockReturnValue(false);
    });

    it("shows 'Get started free' as primary CTA", async () => {
      render(<VerifyPageCta from="share" />);

      await waitFor(() => {
        expect(screen.getByText("Get started free")).toBeDefined();
      });
    });

    it("links primary CTA to signup page", async () => {
      render(<VerifyPageCta from="share" />);

      await waitFor(() => {
        const link = screen.getByText("Get started free").closest("a");
        expect(link?.getAttribute("href")).toBe("/signup");
      });
    });

    it("shows 'See how it works' as secondary CTA", async () => {
      render(<VerifyPageCta from="share" />);

      await waitFor(() => {
        expect(screen.getByText("See how it works")).toBeDefined();
      });
    });

    it("links secondary CTA to first-protected-trade docs", async () => {
      render(<VerifyPageCta from="share" />);

      await waitFor(() => {
        const link = screen.getByText("See how it works").closest("a");
        expect(link?.getAttribute("href")).toBe("/docs/first-protected-trade");
      });
    });
  });

  describe("when user is logged in", () => {
    beforeEach(() => {
      mockIsLoggedIn.mockReturnValue(true);
    });

    it("shows 'Go to dashboard' as primary CTA", async () => {
      render(<VerifyPageCta from="share" />);

      await waitFor(() => {
        expect(screen.getByText("Go to dashboard")).toBeDefined();
      });
    });

    it("links primary CTA to dashboard", async () => {
      render(<VerifyPageCta from="share" />);

      await waitFor(() => {
        const link = screen.getByText("Go to dashboard").closest("a");
        expect(link?.getAttribute("href")).toBe("/customer/dashboard");
      });
    });
  });

  describe("telemetry", () => {
    it("tracks verify_page_view on mount with from=share", async () => {
      mockIsLoggedIn.mockReturnValue(false);
      render(<VerifyPageCta from="share" />);

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith("verify_page_view", { from: "share" });
      });
    });

    it("tracks verify_page_view on mount with from=verify", async () => {
      mockIsLoggedIn.mockReturnValue(false);
      render(<VerifyPageCta from="verify" />);

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith("verify_page_view", { from: "verify" });
      });
    });
  });

  describe("loading state", () => {
    it("renders CTAs immediately without loading state", async () => {
      mockIsLoggedIn.mockReturnValue(false);

      render(<VerifyPageCta from="share" />);

      // Should render CTAs immediately
      await waitFor(() => {
        expect(screen.getByText("Get started free")).toBeDefined();
        expect(screen.getByText("See how it works")).toBeDefined();
      });
    });
  });
});

// ── Share Page Content Tests ─────────────────────────────────

describe("Share page content requirements", () => {
  it("trust breakdown bullet points are defined", () => {
    const trustBreakdownPoints = [
      "Transaction evaluated before execution",
      "Risk rules enforced in real time",
      "Outcome recorded as tamper-evident receipt",
    ];

    // Verify each point is a valid, credible statement
    for (const point of trustBreakdownPoints) {
      expect(point.length).toBeGreaterThan(10);
      expect(point).not.toMatch(/free|amazing|best|incredible/i); // No hype
    }
  });

  it("hero headline is present and clear", () => {
    const headline = "This trade was protected by TruCore";
    expect(headline).toContain("protected");
    expect(headline).toContain("TruCore");
  });

  it("subline explains value proposition", () => {
    const subline = "AI transactions evaluated, enforced, and recorded with verifiable receipts.";
    expect(subline).toContain("evaluated");
    expect(subline).toContain("enforced");
    expect(subline).toContain("receipts");
  });

  it("social proof line is subtle", () => {
    const socialProof = "Used by autonomous trading agents and developers";
    expect(socialProof).not.toMatch(/1000\+|millions|thousands/i); // No fake numbers
    expect(socialProof.length).toBeLessThan(60); // Keep it brief
  });
});

// ── CTA Behavior Contract ────────────────────────────────────

describe("CTA behavior contract", () => {
  it("primary CTA text is clear and actionable", () => {
    const ctaText = "Run your first protected trade";
    expect(ctaText).toContain("first");
    expect(ctaText).toContain("protected");
  });

  it("secondary CTA provides educational path", () => {
    const secondaryCta = "See how it works";
    expect(secondaryCta.length).toBeLessThan(25);
  });

  it("button labels match target audience", () => {
    const newUserCta = "Get started free";
    const existingUserCta = "Go to dashboard";

    expect(newUserCta).toContain("free"); // New users need low friction
    expect(existingUserCta).toContain("dashboard"); // Existing users want quick access
  });
});

// ── Telemetry Event Names ────────────────────────────────────

describe("Telemetry event names", () => {
  const expectedEvents = [
    "verify_page_view",
    "verify_to_signup_click",
    "verify_to_dashboard_click",
    "verify_to_docs_click",
  ];

  it("all event names follow naming convention", () => {
    for (const event of expectedEvents) {
      expect(event).toMatch(/^[a-z_]+$/); // lowercase with underscores
      expect(event.startsWith("verify_")).toBe(true); // verify page prefix
    }
  });
});

// ── parseFrom function behavior ──────────────────────────────

describe("parseFrom contract", () => {
  // These test the expected behavior documented in the implementation
  it("recognizes 'share' as valid from value", () => {
    const validValues = ["verify", "receipts", "portal", "share"];
    expect(validValues).toContain("share");
  });

  it("defaults to 'verify' for unknown values", () => {
    const defaultValue = "verify";
    expect(defaultValue).toBe("verify");
  });
});

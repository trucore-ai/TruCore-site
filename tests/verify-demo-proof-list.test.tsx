import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/track", () => ({
  trackEvent: vi.fn(),
}));

vi.mock("@/lib/verify-demo-data", () => ({
  FALLBACK_RESULT: {
    decision: "ALLOW",
    receipt_hash: "test_hash_abc",
    policy_breakdown: [
      { policy: "slippage_guard", result: "PASS", reason: "within tolerance" },
    ],
  },
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ComponentProps<"button">) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: React.ComponentProps<"div">) => (
    <div {...props}>{children}</div>
  ),
}));

vi.mock("@/components/ui/container", () => ({
  Container: ({ children, ...props }: React.ComponentProps<"div">) => (
    <div {...props}>{children}</div>
  ),
}));

vi.mock("@/components/ui/section", () => ({
  Section: ({ children, ...props }: React.ComponentProps<"section">) => (
    <section {...props}>{children}</section>
  ),
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }: React.ComponentProps<"span">) => (
    <span {...props}>{children}</span>
  ),
}));

import VerifyDemoPage from "@/app/verify-demo/page";

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("navigator", {
    clipboard: { writeText: vi.fn(() => Promise.resolve()) },
  });
  // Fetch rejects so the component falls back to FALLBACK_RESULT
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new Error("offline"))),
  );
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("verify-demo proof list rendering", () => {
  it("renders proof section with semantic list", async () => {
    render(<VerifyDemoPage />);

    await waitFor(() => {
      expect(
        screen.getByText("What This Receipt Proves"),
      ).toBeInTheDocument();
    });

    const list = screen
      .getByText("What This Receipt Proves")
      .closest("div")!
      .querySelector("ul");

    expect(list).not.toBeNull();
    expect(list!.tagName).toBe("UL");

    const items = list!.querySelectorAll("li");
    expect(items).toHaveLength(3);
  });

  it("does not contain stray ? prefixes in proof items", async () => {
    render(<VerifyDemoPage />);

    await waitFor(() => {
      expect(
        screen.getByText("What This Receipt Proves"),
      ).toBeInTheDocument();
    });

    const list = screen
      .getByText("What This Receipt Proves")
      .closest("div")!
      .querySelector("ul");

    const items = Array.from(list!.querySelectorAll("li"));
    for (const li of items) {
      expect(li.textContent).not.toMatch(/^\?/);
    }
  });

  it("contains expected proof statements", async () => {
    render(<VerifyDemoPage />);

    await waitFor(() => {
      expect(
        screen.getByText("What This Receipt Proves"),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("The exact policy rules that were applied"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("The deterministic decision made (ALLOWED or DENIED)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("The precise transaction inputs used"),
    ).toBeInTheDocument();
  });
});

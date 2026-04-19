/**
 * docs-auto-dynamic-pil.test.tsx
 *
 * Verifies the Auto-Dynamic PIL docs page renders its key sections and content.
 */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import DocsAutoDynamicPilPage from "@/app/docs/policies/auto-dynamic-pil/page";

describe("DocsAutoDynamicPilPage", () => {
  it("renders the page title", () => {
    render(<DocsAutoDynamicPilPage />);
    expect(screen.getByText("Auto-Dynamic PIL")).toBeTruthy();
  });

  it("renders the category label", () => {
    render(<DocsAutoDynamicPilPage />);
    // Use exact match on the standalone label paragraph
    expect(screen.getAllByText(/Policy Intelligence/i).length).toBeGreaterThan(0);
  });

  it("renders the three-modes section", () => {
    render(<DocsAutoDynamicPilPage />);
    expect(screen.getByText(/The three modes/i)).toBeTruthy();
    // table cell labels are the exact strings
    expect(screen.getByRole("cell", { name: "Off" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "Recommend" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: /Auto \(bounded\)/i })).toBeTruthy();
  });

  it("renders the eligible fields section mentioning max_slippage_bps", () => {
    render(<DocsAutoDynamicPilPage />);
    expect(screen.getByText(/What it can change/i)).toBeTruthy();
    expect(screen.getByText("max_slippage_bps")).toBeTruthy();
  });

  it("renders the durable policy vs adaptive overlay section", () => {
    render(<DocsAutoDynamicPilPage />);
    expect(screen.getByText(/Durable policy vs adaptive overlay/i)).toBeTruthy();
    // Card labels appear exactly as short headings
    expect(screen.getAllByText(/Durable Policy/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Adaptive Overlay/i).length).toBeGreaterThan(0);
  });

  it("renders the safety rails section", () => {
    render(<DocsAutoDynamicPilPage />);
    expect(screen.getByText(/Safety rails/i)).toBeTruthy();
    expect(screen.getByText(/Bounded delta size/i)).toBeTruthy();
    // Hard caps appears as an exact span label
    expect(screen.getAllByText(/Hard caps/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Same-market scope/i).length).toBeGreaterThan(0);
  });

  it("renders the practical usage guidance section", () => {
    render(<DocsAutoDynamicPilPage />);
    expect(screen.getByText(/How to use it safely/i)).toBeTruthy();
    expect(screen.getByText(/When to leave it Off/i)).toBeTruthy();
    expect(screen.getByText(/When Recommend mode is best/i)).toBeTruthy();
    expect(screen.getByText(/When Auto \(bounded\) makes sense/i)).toBeTruthy();
  });

  it("renders the verifying section with receipt evidence copy", () => {
    render(<DocsAutoDynamicPilPage />);
    expect(screen.getByText(/How to verify what happened/i)).toBeTruthy();
    expect(screen.getAllByText(/Receipt evidence/i).length).toBeGreaterThan(0);
  });

  it("renders availability note for Pro/Enterprise", () => {
    render(<DocsAutoDynamicPilPage />);
    expect(screen.getByText(/Availability/i)).toBeTruthy();
    expect(screen.getByText(/Pro and Enterprise plans/i)).toBeTruthy();
  });

  it("renders what-it-does-not-do section", () => {
    render(<DocsAutoDynamicPilPage />);
    expect(screen.getByText(/What it does not do/i)).toBeTruthy();
    expect(screen.getByText(/Rewrite trust boundaries/i)).toBeTruthy();
    expect(screen.getByText(/Mutate allow or deny lists/i)).toBeTruthy();
  });
});

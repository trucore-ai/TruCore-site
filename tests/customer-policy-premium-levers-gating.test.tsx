/**
 * Premium levers — free-tier gating tests.
 *
 * Verifies that PremiumSlider renders in read-only gated mode for free-tier
 * users: input is replaced by a static display, the slider area is dimmed,
 * and no override controls are shown.  Also verifies that the pro-tier
 * slider IS interactive (not gated).
 *
 * Uses the default jsdom environment declared in vitest.config.ts.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PremiumSlider } from "@/components/premium-slider";

// ---------------------------------------------------------------------------
// Tests — gated mode (free-tier)
// ---------------------------------------------------------------------------

describe("PremiumSlider — gated mode", () => {
  it("renders a static gated-input display instead of a number input when gated=true", () => {
    render(
      <PremiumSlider
        id="gated-test"
        min={0}
        max={1000}
        value="200"
        onChange={vi.fn()}
        gated={true}
      />,
    );
    expect(screen.getByTestId("gated-test-gated-input")).toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });

  it("does not render plan-default marker in gated mode", () => {
    render(
      <PremiumSlider
        id="gated-test"
        min={0}
        max={1000}
        value="200"
        onChange={vi.fn()}
        gated={true}
        planDefaultValue={50}
      />,
    );
    expect(screen.queryByText("default")).not.toBeInTheDocument();
  });

  it("does not render PIL marker in gated mode", () => {
    render(
      <PremiumSlider
        id="gated-test"
        min={0}
        max={1000}
        value="200"
        onChange={vi.fn()}
        gated={true}
        pilContext={{ value: 50, direction: "lower", satisfied: false }}
      />,
    );
    expect(screen.queryByTestId("gated-test-pil-marker")).not.toBeInTheDocument();
  });

  it("does not render PIL direction hint in gated mode", () => {
    render(
      <PremiumSlider
        id="gated-test"
        min={0}
        max={1000}
        value="200"
        onChange={vi.fn()}
        gated={true}
        pilContext={{ direction: "lower", satisfied: false }}
      />,
    );
    expect(screen.queryByTestId("gated-test-pil-hint")).not.toBeInTheDocument();
  });

  it("does not render override status row in gated mode", () => {
    render(
      <PremiumSlider
        id="gated-test"
        min={0}
        max={1000}
        value="200"
        onChange={vi.fn()}
        gated={true}
        isOverride={true}
        onClearOverride={vi.fn()}
      />,
    );
    expect(
      screen.queryByTestId("gated-test-override-status"),
    ).not.toBeInTheDocument();
  });

  it("displays the formatted effective value in the gated input", () => {
    render(
      <PremiumSlider
        id="gated-test"
        min={0}
        max={1000}
        value="250"
        onChange={vi.fn()}
        gated={true}
        formatDisplay={(v) => `$${v.toLocaleString()}`}
      />,
    );
    const gatedInput = screen.getByTestId("gated-test-gated-input");
    expect(gatedInput).toHaveTextContent("$250");
  });
});

// ---------------------------------------------------------------------------
// Tests — non-gated (pro) mode is interactive
// ---------------------------------------------------------------------------

describe("PremiumSlider — non-gated mode", () => {
  it("renders a number input (not gated display) when gated=false", () => {
    render(
      <PremiumSlider
        id="pro-test"
        min={0}
        max={1000}
        value="200"
        onChange={vi.fn()}
        gated={false}
      />,
    );
    expect(screen.getByRole("spinbutton")).toBeInTheDocument();
    expect(screen.queryByTestId("pro-test-gated-input")).not.toBeInTheDocument();
  });

  it("renders a number input by default (no gated prop)", () => {
    render(
      <PremiumSlider
        id="default-test"
        min={0}
        max={1000}
        value="200"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("spinbutton")).toBeInTheDocument();
  });
});

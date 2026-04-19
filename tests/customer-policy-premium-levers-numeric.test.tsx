/**
 * Premium levers — PremiumSlider numeric tests.
 *
 * Tests the PremiumSlider component directly (no full page mount) to verify
 * plan-default marker, PIL context marker, PIL direction hint, and override
 * status row render correctly based on props.
 *
 * Uses the default jsdom environment declared in vitest.config.ts.
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PremiumSlider } from "@/components/premium-slider";

// ---------------------------------------------------------------------------
// Tests — plan-default marker
// ---------------------------------------------------------------------------

describe("PremiumSlider — plan-default marker", () => {
  it("renders a 'default' label when planDefaultValue differs from current", () => {
    render(
      <PremiumSlider
        id="test-slider"
        min={0}
        max={1000}
        value="200"
        onChange={vi.fn()}
        planDefaultValue={50}
      />,
    );
    // The text "default" appears in the sub-track marker label
    expect(screen.getByText("default")).toBeInTheDocument();
  });

  it("does not render 'default' label when planDefaultValue equals current value", () => {
    render(
      <PremiumSlider
        id="test-slider"
        min={0}
        max={1000}
        value="50"
        onChange={vi.fn()}
        planDefaultValue={50}
      />,
    );
    expect(screen.queryByText("default")).not.toBeInTheDocument();
  });

  it("does not render 'default' label when planDefaultValue is undefined", () => {
    render(
      <PremiumSlider
        id="test-slider"
        min={0}
        max={1000}
        value="200"
        onChange={vi.fn()}
      />,
    );
    expect(screen.queryByText("default")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tests — PIL marker
// ---------------------------------------------------------------------------

describe("PremiumSlider — PIL marker", () => {
  it("renders PIL marker when pilContext.value differs from current", () => {
    render(
      <PremiumSlider
        id="pil-slider"
        min={0}
        max={1000}
        value="200"
        onChange={vi.fn()}
        pilContext={{ value: 50, direction: "lower", satisfied: false }}
      />,
    );
    expect(screen.getByTestId("pil-slider-pil-marker")).toBeInTheDocument();
    expect(screen.getByText("PIL")).toBeInTheDocument();
  });

  it("shows '✓ met' when PIL is satisfied", () => {
    render(
      <PremiumSlider
        id="pil-slider"
        min={0}
        max={1000}
        value="50"
        onChange={vi.fn()}
        pilContext={{ value: 100, direction: "lower", satisfied: true }}
      />,
    );
    expect(screen.getByText("✓ met")).toBeInTheDocument();
  });

  it("does not render PIL marker when pilContext.value equals current", () => {
    render(
      <PremiumSlider
        id="pil-slider"
        min={0}
        max={1000}
        value="50"
        onChange={vi.fn()}
        pilContext={{ value: 50, direction: "lower", satisfied: false }}
      />,
    );
    expect(screen.queryByTestId("pil-slider-pil-marker")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tests — PIL direction hint (no concrete value)
// ---------------------------------------------------------------------------

describe("PremiumSlider — PIL direction hint", () => {
  it("renders direction hint when pilContext.direction is 'lower'", () => {
    render(
      <PremiumSlider
        id="hint-slider"
        min={0}
        max={1000}
        value="200"
        onChange={vi.fn()}
        pilContext={{ direction: "lower", satisfied: false }}
      />,
    );
    const hint = screen.getByTestId("hint-slider-pil-hint");
    expect(hint).toHaveTextContent(/recommends a lower value/i);
  });

  it("renders direction hint when pilContext.direction is 'higher'", () => {
    render(
      <PremiumSlider
        id="hint-slider"
        min={0}
        max={1000}
        value="200"
        onChange={vi.fn()}
        pilContext={{ direction: "higher", satisfied: false }}
      />,
    );
    const hint = screen.getByTestId("hint-slider-pil-hint");
    expect(hint).toHaveTextContent(/recommends a higher value/i);
  });

  it("does not render hint when direction is 'none'", () => {
    render(
      <PremiumSlider
        id="hint-slider"
        min={0}
        max={1000}
        value="200"
        onChange={vi.fn()}
        pilContext={{ direction: "none", satisfied: false }}
      />,
    );
    expect(screen.queryByTestId("hint-slider-pil-hint")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tests — override status row
// ---------------------------------------------------------------------------

describe("PremiumSlider — override status row", () => {
  it("shows 'Override active' when isOverride is true", () => {
    render(
      <PremiumSlider
        id="ov-slider"
        min={0}
        max={1000}
        value="200"
        onChange={vi.fn()}
        isOverride={true}
      />,
    );
    const row = screen.getByTestId("ov-slider-override-status");
    expect(row).toHaveTextContent("Override active");
  });

  it("shows 'Using plan default' when isOverride is false", () => {
    render(
      <PremiumSlider
        id="ov-slider"
        min={0}
        max={1000}
        value="200"
        onChange={vi.fn()}
        isOverride={false}
      />,
    );
    const row = screen.getByTestId("ov-slider-override-status");
    expect(row).toHaveTextContent("Using plan default");
  });

  it("calls onClearOverride when 'Clear override' is clicked", () => {
    const onClear = vi.fn();
    render(
      <PremiumSlider
        id="ov-slider"
        min={0}
        max={1000}
        value="200"
        onChange={vi.fn()}
        isOverride={true}
        onClearOverride={onClear}
      />,
    );
    const clearBtn = screen.getByTestId("ov-slider-clear-override");
    fireEvent.click(clearBtn);
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("does not show override status row when isOverride is undefined", () => {
    render(
      <PremiumSlider
        id="ov-slider"
        min={0}
        max={1000}
        value="200"
        onChange={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("ov-slider-override-status")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tests — onChange fires on range and number input
// ---------------------------------------------------------------------------

describe("PremiumSlider — onChange", () => {
  it("calls onChange when text input changes", () => {
    const onChange = vi.fn();
    render(
      <PremiumSlider
        id="change-slider"
        min={0}
        max={1000}
        value="100"
        onChange={onChange}
      />,
    );
    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "300" } });
    expect(onChange).toHaveBeenCalledWith("300");
  });
});

/**
 * Premium levers — boolean segmented control tests.
 *
 * Mounts PolicyBooleanLever directly to keep this suite lightweight and avoid
 * OOMs from full CustomerPoliciesPage jsdom integration.
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PolicyBooleanLever } from "@/components/policy-boolean-lever";

describe("PolicyBooleanLever — segmented control", () => {
  it("renders three options with expected labels", () => {
    render(
      <PolicyBooleanLever
        fieldKey="require_simulation_success"
        value=""
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("bool-option-require_simulation_success-default")).toBeInTheDocument();
    expect(screen.getByTestId("bool-option-require_simulation_success-true")).toBeInTheDocument();
    expect(screen.getByTestId("bool-option-require_simulation_success-false")).toBeInTheDocument();

    expect(screen.getByText("Plan default")).toBeInTheDocument();
    expect(screen.getByText("Require simulation")).toBeInTheDocument();
    expect(screen.getByText("Skip simulation")).toBeInTheDocument();
  });

  it("calls onChange with target value on option click", () => {
    const onChange = vi.fn();
    render(
      <PolicyBooleanLever
        fieldKey="require_simulation_success"
        value=""
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByTestId("bool-option-require_simulation_success-true"));
    expect(onChange).toHaveBeenCalledWith("true");
  });
});

describe("PolicyBooleanLever — override row", () => {
  it('shows "Using plan default" for empty value', () => {
    render(
      <PolicyBooleanLever
        fieldKey="require_simulation_success"
        value=""
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId("override-status-require_simulation_success")).toHaveTextContent("Using plan default");
  });

  it('shows "Override active" for non-empty value', () => {
    render(
      <PolicyBooleanLever
        fieldKey="require_simulation_success"
        value="true"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId("override-status-require_simulation_success")).toHaveTextContent("Override active");
  });

  it("shows and triggers clear override when stored override exists", () => {
    const onChange = vi.fn();
    render(
      <PolicyBooleanLever
        fieldKey="require_simulation_success"
        value="true"
        onChange={onChange}
        hasStoredOverride={true}
      />,
    );

    const clearBtn = screen.getByTestId("clear-override-require_simulation_success");
    fireEvent.click(clearBtn);
    expect(onChange).toHaveBeenCalledWith("");
  });
});

describe("PolicyBooleanLever — PIL / gating", () => {
  it("renders PIL tag when provided", () => {
    render(
      <PolicyBooleanLever
        fieldKey="require_simulation_success"
        value=""
        onChange={vi.fn()}
        pilTag="Met"
      />,
    );
    expect(screen.getByTestId("pil-tag-require_simulation_success")).toHaveTextContent("Met");
  });

  it("disables options when overrides are not enabled", () => {
    render(
      <PolicyBooleanLever
        fieldKey="require_simulation_success"
        value=""
        onChange={vi.fn()}
        overridesEnabled={false}
      />,
    );
    expect(screen.getByTestId("bool-option-require_simulation_success-default")).toBeDisabled();
    expect(screen.getByTestId("bool-option-require_simulation_success-true")).toBeDisabled();
    expect(screen.getByTestId("bool-option-require_simulation_success-false")).toBeDisabled();
  });
});

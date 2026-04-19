/**
 * docs-policies.test.tsx
 *
 * Verifies the policies docs index renders its key sections, discovery links,
 * and valid heading structure.
 */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import DocsPoliciesPage from "@/app/docs/policies/page";

describe("DocsPoliciesPage", () => {
  it("renders the page title and feature entry point", () => {
    render(<DocsPoliciesPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Policies" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Auto-Dynamic PIL/i })).toBeTruthy();
  });

  it("renders the expected breadcrumb follow-on links", () => {
    render(<DocsPoliciesPage />);

    expect(screen.getByRole("link", { name: /Learn the policy model primitives/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /See concrete policy examples/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Run the quickstart/i })).toBeTruthy();
  });

  it("does not nest heading anchors inside additional h2 wrappers", () => {
    const { container } = render(<DocsPoliciesPage />);

    expect(container.querySelector("h2 h2")).toBeNull();
    expect(container.querySelectorAll("h2").length).toBe(4);
  });
});

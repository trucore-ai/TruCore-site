import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import AgentPage from "@/app/agent/page";

// ---------------------------------------------------------------------------
// Agent page – credential guidance (Phase 89)
// ---------------------------------------------------------------------------

describe("AgentPage - credential guidance section", () => {
  it("renders the customer self-serve credentials heading", () => {
    render(<AgentPage />);
    expect(
      screen.getByText("Customer Self-Serve Credentials"),
    ).toBeTruthy();
  });

  it("renders recommended test scopes card", () => {
    render(<AgentPage />);
    expect(
      screen.getByText("Recommended test scopes"),
    ).toBeTruthy();
    expect(screen.getByText("atf:probe")).toBeTruthy();
    expect(screen.getByText("atf:simulate")).toBeTruthy();
    expect(screen.getByText("atf:verify")).toBeTruthy();
    expect(screen.getByText("atf:explain")).toBeTruthy();
  });

  it("renders using-same-key card with auth header info", () => {
    render(<AgentPage />);
    expect(
      screen.getByText("Using the same key for API, CLI, and MCP"),
    ).toBeTruthy();
    expect(screen.getByText("X-API-Key")).toBeTruthy();
  });

  it("renders rotate/revoke warning with link to /customer/keys", () => {
    render(<AgentPage />);
    const link = screen.getByText("/customer/keys");
    expect(link).toBeTruthy();
    expect(link.closest("a")?.getAttribute("href")).toBe("/customer/keys");
  });

  it("renders 'Create a key' CTA link", () => {
    render(<AgentPage />);
    const cta = screen.getByText("Create a key →");
    expect(cta).toBeTruthy();
    expect(cta.closest("a")?.getAttribute("href")).toBe("/customer/keys");
  });
});

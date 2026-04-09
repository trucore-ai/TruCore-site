import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import AgentPage from "@/app/agent/page";

// ---------------------------------------------------------------------------
// Agent page – bootstrap guidance (Phase 70)
// ---------------------------------------------------------------------------

describe("AgentPage - bootstrap guidance section", () => {
  it("renders the bot bootstrap setup heading", () => {
    render(<AgentPage />);
    expect(
      screen.getByText("Bot Bootstrap Setup"),
    ).toBeTruthy();
  });

  it("renders canonical env conventions card", () => {
    render(<AgentPage />);
    expect(
      screen.getByText("Canonical env conventions"),
    ).toBeTruthy();
    // ATF_API_KEY appears in multiple sections; use getAllByText
    expect(screen.getAllByText("ATF_API_KEY").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("~/.openclaw/secrets/atf.env")).toBeTruthy();
    expect(screen.getByText("source ~/.openclaw/secrets/atf.env")).toBeTruthy();
  });

  it("renders self-verification checklist card", () => {
    render(<AgentPage />);
    expect(
      screen.getByText("Self-verification checklist"),
    ).toBeTruthy();
  });

  it("renders all three verification steps", () => {
    render(<AgentPage />);
    expect(screen.getByText("API check:")).toBeTruthy();
    expect(screen.getByText("MCP check:")).toBeTruthy();
    expect(screen.getByText("CLI check:")).toBeTruthy();
  });

  it("includes OpenClaw exec policy friction disclaimer", () => {
    render(<AgentPage />);
    expect(
      screen.getByText(/environment friction, not an ATF failure/i),
    ).toBeTruthy();
  });
});

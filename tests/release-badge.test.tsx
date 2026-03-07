import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReleaseBadge } from "@/components/status/release-badge";

describe("ReleaseBadge", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders prod shorthand, commit SHA, and cli vX.Y.Z when all env vars are set", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "68845a6deadbeef");
    vi.stubEnv("NEXT_PUBLIC_ATF_CLI_VERSION", "1.4.0");

    render(<ReleaseBadge />);
    const badge = screen.getByTestId("release-badge");
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toContain("prod");
    expect(badge.textContent).toContain("68845a6");
    expect(badge.textContent).toContain("cli v1.4.0");
  });

  it("shows em-dash when VERCEL_GIT_COMMIT_SHA is unset", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("NEXT_PUBLIC_ATF_CLI_VERSION", "0.1.0");
    delete process.env.VERCEL_GIT_COMMIT_SHA;

    render(<ReleaseBadge />);
    const badge = screen.getByTestId("release-badge");
    expect(badge.textContent).toContain("preview");
    expect(badge.textContent).toContain("\u2014");
    expect(badge.textContent).toContain("cli v0.1.0");
  });

  it("shows unknown when VERCEL_ENV is unset", () => {
    delete process.env.VERCEL_ENV;
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "def5678901234");
    vi.stubEnv("NEXT_PUBLIC_ATF_CLI_VERSION", "0.1.0");

    render(<ReleaseBadge />);
    const badge = screen.getByTestId("release-badge");
    expect(badge.textContent).toContain("unknown");
    expect(badge.textContent).toContain("def5678");
    expect(badge.textContent).toContain("cli v0.1.0");
  });

  it("does not throw when all env vars are missing", () => {
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL_GIT_COMMIT_SHA;
    vi.stubEnv("NEXT_PUBLIC_ATF_CLI_VERSION", "");

    render(<ReleaseBadge />);
    const badge = screen.getByTestId("release-badge");
    expect(badge.textContent).toContain("cli v");
    expect(badge.textContent).toContain("\u2014");
  });
});

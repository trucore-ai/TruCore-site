import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const LAYOUT_PATH = join(__dirname, "..", "app", "layout.tsx");
const layoutSource = readFileSync(LAYOUT_PATH, "utf-8");

describe("footer Discord link", () => {
  it("renders a Discord link in the footer", () => {
    expect(layoutSource).toContain("Discord");
  });

  it("uses NEXT_PUBLIC_DISCORD_INVITE_URL env var with fallback", () => {
    expect(layoutSource).toContain("process.env.NEXT_PUBLIC_DISCORD_INVITE_URL");
    expect(layoutSource).toContain("https://discord.gg/hZWTn6Vr");
  });

  it("opens in a new tab with safe rel attributes", () => {
    // Find the Discord TrackedLink block
    const trackedLinkBlock = layoutSource.slice(
      layoutSource.lastIndexOf("<TrackedLink", layoutSource.indexOf("NEXT_PUBLIC_DISCORD_INVITE_URL")),
      layoutSource.indexOf("</TrackedLink>", layoutSource.indexOf("NEXT_PUBLIC_DISCORD_INVITE_URL")),
    );
    expect(trackedLinkBlock).toContain('target="_blank"');
    expect(trackedLinkBlock).toContain('rel="noopener noreferrer"');
  });

  it("has an accessible aria-label", () => {
    expect(layoutSource).toContain('aria-label="Join TruCore Discord"');
  });
});

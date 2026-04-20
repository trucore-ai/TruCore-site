import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const homeSrc = readFileSync(join(__dirname, "..", "app", "page.tsx"), "utf-8");
const atfSrc = readFileSync(join(__dirname, "..", "app", "atf", "page.tsx"), "utf-8");
const agentSrc = readFileSync(join(__dirname, "..", "app", "agent", "page.tsx"), "utf-8");

/**
 * Regression test: prevent the / and /atf route contents from being
 * accidentally swapped.  Uses source-level markers instead of module
 * exports because Next.js page files only allow specific named exports.
 *
 * Target layout:
 *   /     = full platform hero (threat model, architecture, enforcement, why-trucore)
 *   /atf  = CLI developer landing (quickstart, doctor, toolbox, waitlist)
 */
describe("route identity", () => {
  it("/ exports the Home component", () => {
    expect(homeSrc).toMatch(/export default function Home\b/);
  });

  it("/atf exports the ATFPage component", () => {
    expect(atfSrc).toMatch(/export default function ATFPage\b/);
  });

  it("/ metadata title references TruCore (not ATF Developer Platform)", () => {
    expect(homeSrc).toContain("TruCore | Policy-Enforced Protection for AI Agents");
    expect(homeSrc).not.toContain('"ATF Developer Platform');
  });

  it("/ metadata pins homepage social image contract", () => {
    expect(homeSrc).toContain('const HOME_SOCIAL_IMAGE_URL = "https://trucore.xyz/twitter-image"');
    expect(homeSrc).toContain('url: "https://trucore.xyz"');
    expect(homeSrc).toContain('siteName: "TruCore"');
    expect(homeSrc).toContain('type: "website"');
    expect(homeSrc).toContain('card: "summary_large_image"');
    expect(homeSrc).toContain('images: [HOME_SOCIAL_IMAGE_URL]');
  });

  it("/atf metadata title references ATF Developer Platform", () => {
    expect(atfSrc).toContain("ATF Developer Platform");
  });

  it("/ page contains the marketing hero headline", () => {
    expect(homeSrc).toContain("AI Capital Management for Safe Execution");
    expect(homeSrc).toContain('id="why-trucore"');
  });

  it("/atf page contains the CLI developer landing (doctor section)", () => {
    expect(atfSrc).toContain("Agent Transaction Firewall");
    expect(atfSrc).toContain('id="doctor"');
  });

  it("/agent metadata pins explicit social image contract", () => {
    expect(agentSrc).toContain('const AGENT_SOCIAL_IMAGE_URL = "https://trucore.xyz/twitter-image"');
    expect(agentSrc).toContain('url: "https://trucore.xyz/agent"');
    expect(agentSrc).toContain('siteName: "TruCore"');
    expect(agentSrc).toContain('type: "website"');
    expect(agentSrc).toContain('card: "summary_large_image"');
    expect(agentSrc).toContain('images: [AGENT_SOCIAL_IMAGE_URL]');
  });

  it("/agent does not fall back to opengraph-image dynamic route", () => {
    expect(agentSrc).not.toContain("/opengraph-image");
  });
});

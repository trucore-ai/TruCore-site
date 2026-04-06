import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const homeSrc = readFileSync(join(__dirname, "..", "app", "page.tsx"), "utf-8");
const atfSrc = readFileSync(join(__dirname, "..", "app", "atf", "page.tsx"), "utf-8");

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

  it("/atf metadata title references ATF Developer Platform", () => {
    expect(atfSrc).toContain("ATF Developer Platform");
  });

  it("/ page contains the marketing hero headline", () => {
    expect(homeSrc).toContain("Agent Transaction Control");
    expect(homeSrc).toContain('id="why-trucore"');
  });

  it("/atf page contains the CLI developer landing (doctor section)", () => {
    expect(atfSrc).toContain("Agent Transaction Firewall");
    expect(atfSrc).toContain('id="doctor"');
  });
});

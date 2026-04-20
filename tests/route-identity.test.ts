import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const homeSrc = readFileSync(join(__dirname, "..", "app", "page.tsx"), "utf-8");
const atfSrc = readFileSync(join(__dirname, "..", "app", "atf", "page.tsx"), "utf-8");
const agentSrc = readFileSync(join(__dirname, "..", "app", "agent", "page.tsx"), "utf-8");
const docsSrc = readFileSync(join(__dirname, "..", "app", "docs", "page.tsx"), "utf-8");
const verifyDemoLayoutSrc = readFileSync(join(__dirname, "..", "app", "verify-demo", "layout.tsx"), "utf-8");
const buildersSrc = readFileSync(join(__dirname, "..", "app", "builders", "page.tsx"), "utf-8");
const enterpriseSrc = readFileSync(join(__dirname, "..", "app", "enterprise", "page.tsx"), "utf-8");
const pricingSrc = readFileSync(join(__dirname, "..", "app", "pricing", "page.tsx"), "utf-8");
const demoSrc = readFileSync(join(__dirname, "..", "app", "demo", "page.tsx"), "utf-8");

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

  it("/docs metadata pins explicit stable social image contract", () => {
    expect(docsSrc).toContain('const DOCS_SOCIAL_IMAGE_URL = "https://trucore.xyz/twitter-image"');
    expect(docsSrc).toContain('url: "https://trucore.xyz/docs"');
    expect(docsSrc).toContain('siteName: "TruCore"');
    expect(docsSrc).toContain('type: "website"');
    expect(docsSrc).toContain('card: "summary_large_image"');
    expect(docsSrc).toContain('images: [DOCS_SOCIAL_IMAGE_URL]');
  });

  it("/verify-demo metadata is defined at route layout with stable social image", () => {
    expect(verifyDemoLayoutSrc).toContain('const VERIFY_DEMO_SOCIAL_IMAGE_URL = "https://trucore.xyz/twitter-image"');
    expect(verifyDemoLayoutSrc).toContain('url: "https://trucore.xyz/verify-demo"');
    expect(verifyDemoLayoutSrc).toContain('siteName: "TruCore"');
    expect(verifyDemoLayoutSrc).toContain('type: "website"');
    expect(verifyDemoLayoutSrc).toContain('card: "summary_large_image"');
    expect(verifyDemoLayoutSrc).toContain('images: [VERIFY_DEMO_SOCIAL_IMAGE_URL]');
  });

  it("/builders metadata pins explicit stable social image contract", () => {
    expect(buildersSrc).toContain('const BUILDERS_SOCIAL_IMAGE_URL = "https://trucore.xyz/twitter-image"');
    expect(buildersSrc).toContain('url: "https://trucore.xyz/builders"');
    expect(buildersSrc).toContain('siteName: "TruCore"');
    expect(buildersSrc).toContain('type: "website"');
    expect(buildersSrc).toContain('card: "summary_large_image"');
    expect(buildersSrc).toContain('images: [BUILDERS_SOCIAL_IMAGE_URL]');
  });

  it("/enterprise metadata pins explicit stable social image contract", () => {
    expect(enterpriseSrc).toContain('const ENTERPRISE_SOCIAL_IMAGE_URL = "https://trucore.xyz/twitter-image"');
    expect(enterpriseSrc).toContain('url: "https://trucore.xyz/enterprise"');
    expect(enterpriseSrc).toContain('siteName: "TruCore"');
    expect(enterpriseSrc).toContain('type: "website"');
    expect(enterpriseSrc).toContain('card: "summary_large_image"');
    expect(enterpriseSrc).toContain('images: [ENTERPRISE_SOCIAL_IMAGE_URL]');
  });

  it("/pricing metadata pins explicit stable social image contract", () => {
    expect(pricingSrc).toContain('const PRICING_SOCIAL_IMAGE_URL = "https://trucore.xyz/twitter-image"');
    expect(pricingSrc).toContain('url: "https://trucore.xyz/pricing"');
    expect(pricingSrc).toContain('siteName: "TruCore"');
    expect(pricingSrc).toContain('type: "website"');
    expect(pricingSrc).toContain('card: "summary_large_image"');
    expect(pricingSrc).toContain('images: [PRICING_SOCIAL_IMAGE_URL]');
  });

  it("/demo keeps intentional route-specific image with explicit OG/Twitter contract", () => {
    expect(demoSrc).toContain('const DEMO_SOCIAL_IMAGE_URL = "https://trucore.xyz/demo/opengraph-image"');
    expect(demoSrc).toContain('url: "https://trucore.xyz/demo"');
    expect(demoSrc).toContain('siteName: "TruCore"');
    expect(demoSrc).toContain('type: "website"');
    expect(demoSrc).toContain('card: "summary_large_image"');
    expect(demoSrc).toContain('images: [DEMO_SOCIAL_IMAGE_URL]');
  });
});

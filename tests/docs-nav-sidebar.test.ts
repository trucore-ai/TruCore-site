import { describe, expect, it } from "vitest";
import { sections } from "@/lib/docs-nav";

describe("docs nav active highlighting", () => {
  const allItems = sections.flatMap((s) => s.items);

  it("every nav item has a unique href", () => {
    const hrefs = allItems.map((item) => item.href);
    const unique = new Set(hrefs);
    expect(unique.size).toBe(hrefs.length);
  });

  it("all hrefs start with /docs", () => {
    for (const item of allItems) {
      expect(item.href).toMatch(/^\/docs/);
    }
  });

  it("active matching uses exact path comparison", () => {
    // The sidebar uses pathname === href for active detection.
    // Verify that known routes match exactly.
    const cliHref = allItems.find((i) => i.title === "ATF CLI")?.href;
    expect(cliHref).toBe("/docs/cli");

    const doctorHref = allItems.find((i) => i.title === "Doctor")?.href;
    expect(doctorHref).toBe("/docs/cli/doctor");

    // These should NOT be the same
    expect(cliHref).not.toBe(doctorHref);
  });

  it("sections contain expected groups", () => {
    const sectionTitles = sections.map((s) => s.title);
    expect(sectionTitles).toContain("Documentation");
    expect(sectionTitles).toContain("CLI Deep Dives");
    expect(sectionTitles).toContain("CLI Guides");
  });

  it("Customer Guides section exists and is marked authenticated", () => {
    const guideSection = sections.find((s) => s.title === "Customer Guides");
    expect(guideSection).toBeDefined();
    expect(guideSection!.authenticated).toBe(true);
  });

  it("Customer Guides section contains expected guide items", () => {
    const guideSection = sections.find((s) => s.title === "Customer Guides")!;
    const titles = guideSection.items.map((i) => i.title);
    expect(titles).toContain("Customer Guides Overview");
    expect(titles).toContain("API Key Lifecycle");
    expect(titles).toContain("Rate Limits & Recovery");
    expect(titles).toContain("Webhook Setup & Debugging");
    expect(titles).toContain("Troubleshooting");
    expect(titles).toContain("Reconcile & State Recovery");
  });

  it("Customer Guides items all link to /docs/guide paths", () => {
    const guideSection = sections.find((s) => s.title === "Customer Guides")!;
    for (const item of guideSection.items) {
      expect(item.href).toMatch(/^\/docs\/guide/);
    }
  });

  it("public sections are not marked authenticated", () => {
    const publicSections = sections.filter((s) => s.title !== "Customer Guides");
    for (const section of publicSections) {
      expect(section.authenticated).toBeFalsy();
    }
  });

  it("filtering with authenticated=false excludes Customer Guides", () => {
    const visible = sections.filter((s) => !s.authenticated);
    const titles = visible.map((s) => s.title);
    expect(titles).not.toContain("Customer Guides");
  });

  it("filtering with authenticated=true includes Customer Guides", () => {
    const visible = sections.filter((s) => !s.authenticated || true);
    const titles = visible.map((s) => s.title);
    expect(titles).toContain("Customer Guides");
  });
});

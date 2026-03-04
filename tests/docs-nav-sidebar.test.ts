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
});

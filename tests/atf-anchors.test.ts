import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const ATF_PAGE_PATH = join(__dirname, "..", "app", "atf", "page.tsx");
const pageSource = readFileSync(ATF_PAGE_PATH, "utf-8");

/**
 * Every anchor that /atf internal links and documentation reference.
 * Each must appear exactly once as id="<anchor>" in the page source.
 */
const REQUIRED_ANCHORS = [
  "doctor",
  "burner",
  "helius",
  "flow",
  "toolbox",
  "designed-for",
  "roadmap",
  "get-started",
  "updates",
];

describe("/atf anchor integrity", () => {
  for (const anchor of REQUIRED_ANCHORS) {
    it(`has exactly one id="${anchor}" in the rendered tree`, () => {
      const pattern = new RegExp(`id=["']${anchor}["']`, "g");
      const matches = pageSource.match(pattern);
      expect(matches, `Anchor #${anchor} should exist exactly once`).toHaveLength(1);
    });
  }

  it("has no duplicate section IDs", () => {
    // Extract all id="..." values from Section/section elements
    const idPattern = /id=["']([^"']+)["']/g;
    const ids: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = idPattern.exec(pageSource)) !== null) {
      ids.push(match[1]);
    }

    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const id of ids) {
      if (seen.has(id)) duplicates.push(id);
      seen.add(id);
    }

    expect(duplicates, `Duplicate IDs found: ${duplicates.join(", ")}`).toEqual([]);
  });

  it("every hero nav href points to an existing anchor", () => {
    // Match href="#..." patterns within the page
    const hrefPattern = /href=["']#([^"']+)["']/g;
    const hrefs: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = hrefPattern.exec(pageSource)) !== null) {
      hrefs.push(match[1]);
    }

    // Collect all section IDs
    const idPattern = /id=["']([^"']+)["']/g;
    const existingIds = new Set<string>();
    while ((match = idPattern.exec(pageSource)) !== null) {
      existingIds.add(match[1]);
    }

    for (const href of hrefs) {
      expect(
        existingIds.has(href),
        `href="#${href}" points to a non-existent section ID`
      ).toBe(true);
    }
  });
});

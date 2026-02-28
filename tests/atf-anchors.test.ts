import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const HOME_PAGE_PATH = join(__dirname, "..", "app", "page.tsx");
const ATF_PAGE_PATH = join(__dirname, "..", "app", "atf", "page.tsx");
const pageSource = readFileSync(HOME_PAGE_PATH, "utf-8");
const atfPageSource = readFileSync(ATF_PAGE_PATH, "utf-8");

/**
 * Anchors that live on the home page (/) after the hero swap.
 * These sections moved from /atf to / and are referenced by nav links.
 */
const HOME_REQUIRED_ANCHORS = [
  "hero",
  "integrations",
  "why-trucore",
  "verify",
  "waitlist",
];

/**
 * Anchors that live on the ATF page (/atf).
 */
const ATF_REQUIRED_ANCHORS = [
  "hero",
  "doctor",
  "burner",
  "updates",
];

describe("/ (home) anchor integrity", () => {
  for (const anchor of HOME_REQUIRED_ANCHORS) {
    it(`has exactly one id="${anchor}" in the rendered tree`, () => {
      const pattern = new RegExp(`id=["']${anchor}["']`, "g");
      const matches = pageSource.match(pattern);
      expect(matches, `Anchor #${anchor} should exist exactly once`).toHaveLength(1);
    });
  }
});

describe("/atf anchor integrity", () => {
  for (const anchor of ATF_REQUIRED_ANCHORS) {
    it(`has exactly one id="${anchor}" in the rendered tree`, () => {
      const pattern = new RegExp(`id=["']${anchor}["']`, "g");
      const matches = atfPageSource.match(pattern);
      expect(matches, `Anchor #${anchor} should exist exactly once`).toHaveLength(1);
    });
  }
});

describe("no duplicate section IDs", () => {
  for (const [label, source] of [["/ (home)", pageSource], ["/atf", atfPageSource]] as const) {
    it(`${label} has no duplicate section IDs`, () => {
      const idPattern = /id=["']([^"']+)["']/g;
      const ids: string[] = [];
      let match: RegExpExecArray | null;
      while ((match = idPattern.exec(source)) !== null) {
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
  }
});

describe("internal href anchors point to existing IDs", () => {
  for (const [label, source] of [["/ (home)", pageSource], ["/atf", atfPageSource]] as const) {
    it(`${label} every href="#..." points to an existing anchor`, () => {
      const hrefPattern = /href=["']#([^"']+)["']/g;
      const hrefs: string[] = [];
      let match: RegExpExecArray | null;
      while ((match = hrefPattern.exec(source)) !== null) {
        hrefs.push(match[1]);
      }

      const idPattern = /id=["']([^"']+)["']/g;
      const existingIds = new Set<string>();
      while ((match = idPattern.exec(source)) !== null) {
        existingIds.add(match[1]);
      }

      for (const href of hrefs) {
        expect(
          existingIds.has(href),
          `href="#${href}" points to a non-existent section ID`
        ).toBe(true);
      }
    });
  }
});

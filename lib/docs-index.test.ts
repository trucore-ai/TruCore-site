import { describe, expect, it } from "vitest";

import { docsIndex } from "./docs-index";

function searchDocs(term: string): string[] {
  const needle = term.toLowerCase();
  return docsIndex
    .filter((entry) => {
      const haystack = [entry.title, entry.href, ...entry.tags, ...entry.contentSnippets].join(" ").toLowerCase();
      return haystack.includes(needle);
    })
    .map((entry) => entry.href);
}

describe("docsIndex", () => {
  it("returns documentation entries", () => {
    expect(docsIndex.length).toBeGreaterThan(0);
  });

  it("matches expected documents for key search terms", () => {
    expect(searchDocs("quickstart")).toContain("/docs/quickstart");
    expect(searchDocs("permit")).toContain("/docs/permits");
    expect(searchDocs("policy")).toContain("/docs/policy-model");
  });
});

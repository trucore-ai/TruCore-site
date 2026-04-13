import { describe, expect, it } from "vitest";

import { docsIndex } from "./docs-index";
import { sections } from "./docs-nav";

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
    expect(docsIndex.length).toBeGreaterThanOrEqual(47);
  });

  it("matches expected documents for key search terms", () => {
    expect(searchDocs("quickstart")).toContain("/docs/quickstart");
    expect(searchDocs("permit")).toContain("/docs/permits");
    expect(searchDocs("policy")).toContain("/docs/policy-model");
  });

  it("covers all public docs-nav sections", () => {
    const publicNavHrefs = sections
      .filter((s) => !s.authenticated)
      .flatMap((s) => s.items.map((i) => i.href));
    const indexHrefs = new Set(docsIndex.map((e) => e.href));
    const missing = publicNavHrefs.filter((href) => !indexHrefs.has(href));
    expect(missing).toEqual([]);
  });

  it("matches key CLI search terms", () => {
    expect(searchDocs("doctor")).toContain("/docs/cli/doctor");
    expect(searchDocs("helius")).toContain("/docs/cli/guides/helius-setup");
    expect(searchDocs("burner")).toContain("/docs/cli/burner");
  });

  it("matches key onboarding search terms", () => {
    expect(searchDocs("getting started")).toContain("/docs/getting-started");
    expect(searchDocs("api key")).toContain("/docs/auth");
    expect(searchDocs("hello world")).toContain("/docs/hello-world-bot");
  });

  it("each entry has at least one snippet and one tag", () => {
    for (const entry of docsIndex) {
      expect(entry.contentSnippets.length, `${entry.href} missing snippets`).toBeGreaterThanOrEqual(1);
      expect(entry.tags.length, `${entry.href} missing tags`).toBeGreaterThanOrEqual(1);
    }
  });
});

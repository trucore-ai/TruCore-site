import { describe, expect, it } from "vitest";
import { extractTocFromDom, type TocItem } from "@/lib/docs/toc";

/**
 * Unit tests for DocsToc heading discovery and re-scan resilience.
 *
 * DocsToc uses a MutationObserver to re-scan #docs-content when content
 * appears after the initial render (e.g. auth-gated routes). These tests
 * validate the underlying extraction logic that the re-scan depends on,
 * including delayed-content scenarios.
 */

function createContainer(
  headings: Array<{ tag: string; id: string; text: string }>,
): HTMLElement {
  const el = document.createElement("div");
  el.id = "docs-content";
  for (const h of headings) {
    const heading = document.createElement(h.tag);
    heading.id = h.id;
    heading.textContent = h.text;
    el.appendChild(heading);
  }
  return el;
}

describe("DocsToc heading discovery", () => {
  it("extracts h2 and h3 headings with correct levels", () => {
    const container = createContainer([
      { tag: "h2", id: "overview", text: "Overview" },
      { tag: "h3", id: "details", text: "Details" },
      { tag: "h2", id: "setup", text: "Setup" },
    ]);

    const items = extractTocFromDom(container);
    expect(items).toEqual([
      { id: "overview", text: "Overview", level: 2 },
      { id: "details", text: "Details", level: 3 },
      { id: "setup", text: "Setup", level: 2 },
    ]);
  });

  it("returns empty when container has no headings", () => {
    const el = document.createElement("div");
    el.innerHTML = "<p>No headings</p>";
    expect(extractTocFromDom(el)).toEqual([]);
  });

  it("skips headings without id attribute", () => {
    const el = document.createElement("div");
    const h2 = document.createElement("h2");
    h2.id = "valid";
    h2.textContent = "Valid";
    el.appendChild(h2);

    const h2NoId = document.createElement("h2");
    h2NoId.textContent = "No ID";
    el.appendChild(h2NoId);

    const items = extractTocFromDom(el);
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("valid");
  });
});

describe("DocsToc delayed-content re-scan", () => {
  it("initially empty container returns no items, then discovers headings after content appears", () => {
    const container = document.createElement("div");
    container.id = "docs-content";

    // Phase 1: empty content (simulates auth gate loading state)
    expect(extractTocFromDom(container)).toEqual([]);

    // Phase 2: content appears (simulates auth gate completing)
    const h2a = document.createElement("h2");
    h2a.id = "getting-started";
    h2a.textContent = "Getting Started";
    container.appendChild(h2a);

    const h2b = document.createElement("h2");
    h2b.id = "configuration";
    h2b.textContent = "Configuration";
    container.appendChild(h2b);

    const h3a = document.createElement("h3");
    h3a.id = "env-vars";
    h3a.textContent = "Environment Variables";
    container.appendChild(h3a);

    // Re-scan now discovers the new headings
    const items = extractTocFromDom(container);
    expect(items).toEqual([
      { id: "getting-started", text: "Getting Started", level: 2 },
      { id: "configuration", text: "Configuration", level: 2 },
      { id: "env-vars", text: "Environment Variables", level: 3 },
    ]);
  });

  it("detects when headings change between scans", () => {
    const container = document.createElement("div");
    container.id = "docs-content";

    // Initial content
    const h2 = document.createElement("h2");
    h2.id = "intro";
    h2.textContent = "Introduction";
    container.appendChild(h2);

    const scan1 = extractTocFromDom(container);
    expect(scan1).toHaveLength(1);

    // Content updates (e.g., client-side navigation within same layout)
    container.innerHTML = "";
    const h2a = document.createElement("h2");
    h2a.id = "overview";
    h2a.textContent = "Overview";
    container.appendChild(h2a);

    const h2b = document.createElement("h2");
    h2b.id = "deploy";
    h2b.textContent = "Deploy";
    container.appendChild(h2b);

    const scan2 = extractTocFromDom(container);
    expect(scan2).toHaveLength(2);
    expect(scan2.map((i: TocItem) => i.id)).toEqual(["overview", "deploy"]);

    // Verify scans are different
    expect(scan1.map((i: TocItem) => i.id)).not.toEqual(scan2.map((i: TocItem) => i.id));
  });

  it("same headings on re-scan produce identical results (no spurious updates)", () => {
    const container = createContainer([
      { tag: "h2", id: "a", text: "Section A" },
      { tag: "h2", id: "b", text: "Section B" },
    ]);

    const scan1 = extractTocFromDom(container);
    const scan2 = extractTocFromDom(container);

    // Same structure, so IDs match (DocsToc uses ID comparison to avoid re-renders)
    const ids1 = scan1.map((i: TocItem) => i.id);
    const ids2 = scan2.map((i: TocItem) => i.id);
    expect(ids1).toEqual(ids2);
  });

  it("loading-state content (spinner) yields empty, then real content yields headings", () => {
    const container = document.createElement("div");
    container.id = "docs-content";

    // Simulate auth gate loading spinner
    const spinner = document.createElement("div");
    spinner.className = "animate-spin";
    container.appendChild(spinner);

    expect(extractTocFromDom(container)).toEqual([]);

    // Auth gate resolves — replace spinner with real content
    container.innerHTML = "";
    for (const [id, text] of [
      ["key-rotation", "Key Rotation"],
      ["revocation", "Revocation"],
      ["expiry-policy", "Expiry Policy"],
      ["audit-trail", "Audit Trail"],
    ]) {
      const h2 = document.createElement("h2");
      h2.id = id;
      h2.textContent = text;
      container.appendChild(h2);
    }

    const items = extractTocFromDom(container);
    expect(items).toHaveLength(4);
    expect(items.every((i: TocItem) => i.level === 2)).toBe(true);
  });
});

describe("DocsToc guide-route suppression", () => {
  it("guide-route pathname detection identifies /docs/guide paths", () => {
    // This mirrors the DocsToc component's pathname check.
    // DocsToc early-returns on guide routes, delegating to GuideProgress.
    function isGuideRoute(p: string) {
      return p === "/docs/guide" || p.startsWith("/docs/guide/");
    }

    const guidePaths = [
      "/docs/guide",
      "/docs/guide/key-lifecycle",
      "/docs/guide/troubleshooting",
      "/docs/guide/rate-limits",
    ];
    const nonGuidePaths = [
      "/docs",
      "/docs/atf-architecture",
      "/docs/quickstart",
      "/docs/guidelines",
    ];

    for (const p of guidePaths) {
      expect(isGuideRoute(p)).toBe(true);
    }
    for (const p of nonGuidePaths) {
      expect(isGuideRoute(p)).toBe(false);
    }
  });
});

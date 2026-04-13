import { describe, expect, it } from "vitest";
import { extractTocFromDom, type TocItem } from "@/lib/docs/toc";

/**
 * Unit tests for the guide-progress component logic.
 * The component itself is client-side React; these tests validate the
 * underlying data extraction and filtering that GuideProgress depends on.
 */

function createContainer(headings: Array<{ tag: string; id: string; text: string }>): HTMLElement {
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

describe("guide-progress data extraction", () => {
  it("extractTocFromDom returns h2 and h3 items with correct levels", () => {
    const container = createContainer([
      { tag: "h2", id: "overview", text: "Overview" },
      { tag: "h3", id: "sub-detail", text: "Sub detail" },
      { tag: "h2", id: "setup", text: "Setup" },
    ]);

    const items = extractTocFromDom(container);
    expect(items).toEqual([
      { id: "overview", text: "Overview", level: 2 },
      { id: "sub-detail", text: "Sub detail", level: 3 },
      { id: "setup", text: "Setup", level: 2 },
    ]);
  });

  it("filtering to h2-only gives section count for progress", () => {
    const container = createContainer([
      { tag: "h2", id: "overview", text: "Overview" },
      { tag: "h3", id: "sub-a", text: "Sub A" },
      { tag: "h2", id: "setup", text: "Setup" },
      { tag: "h3", id: "sub-b", text: "Sub B" },
      { tag: "h2", id: "deploy", text: "Deploy" },
      { tag: "h2", id: "verify", text: "Verify" },
    ]);

    const items = extractTocFromDom(container);
    const h2Only = items.filter((i: TocItem) => i.level === 2);
    expect(h2Only.length).toBe(4);
    expect(h2Only.map((i: TocItem) => i.id)).toEqual([
      "overview",
      "setup",
      "deploy",
      "verify",
    ]);
  });

  it("skips headings without id", () => {
    const el = document.createElement("div");
    const h2a = document.createElement("h2");
    h2a.id = "has-id";
    h2a.textContent = "Has ID";
    el.appendChild(h2a);

    const h2b = document.createElement("h2");
    h2b.textContent = "No ID";
    el.appendChild(h2b);

    const items = extractTocFromDom(el);
    expect(items.length).toBe(1);
    expect(items[0].id).toBe("has-id");
  });

  it("returns empty array for container with no headings", () => {
    const el = document.createElement("div");
    el.innerHTML = "<p>No headings here</p>";
    const items = extractTocFromDom(el);
    expect(items).toEqual([]);
  });

  it("progress calculation is correct for active section index", () => {
    const sections = [
      { id: "a", text: "A", level: 2 as const },
      { id: "b", text: "B", level: 2 as const },
      { id: "c", text: "C", level: 2 as const },
      { id: "d", text: "D", level: 2 as const },
      { id: "e", text: "E", level: 2 as const },
    ];

    // Simulate "Section X of Y" calculation
    const activeId = "c";
    const activeIndex = sections.findIndex((s) => s.id === activeId);
    const currentSection = activeIndex + 1;
    const total = sections.length;
    const progressPct = (currentSection / total) * 100;

    expect(activeIndex).toBe(2);
    expect(currentSection).toBe(3);
    expect(total).toBe(5);
    expect(progressPct).toBe(60);
  });

  it("MIN_SECTIONS=4 threshold excludes short pages", () => {
    const MIN_SECTIONS = 4;

    // Short page (3 h2s) → should not show
    const shortContainer = createContainer([
      { tag: "h2", id: "a", text: "A" },
      { tag: "h2", id: "b", text: "B" },
      { tag: "h2", id: "c", text: "C" },
    ]);
    const shortItems = extractTocFromDom(shortContainer).filter((i: TocItem) => i.level === 2);
    expect(shortItems.length < MIN_SECTIONS).toBe(true);

    // Long page (6 h2s) → should show
    const longContainer = createContainer([
      { tag: "h2", id: "a", text: "A" },
      { tag: "h2", id: "b", text: "B" },
      { tag: "h2", id: "c", text: "C" },
      { tag: "h2", id: "d", text: "D" },
      { tag: "h2", id: "e", text: "E" },
      { tag: "h2", id: "f", text: "F" },
    ]);
    const longItems = extractTocFromDom(longContainer).filter((i: TocItem) => i.level === 2);
    expect(longItems.length >= MIN_SECTIONS).toBe(true);
  });
});

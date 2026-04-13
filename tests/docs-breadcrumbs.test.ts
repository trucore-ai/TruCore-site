import { describe, expect, it } from "vitest";
import { buildBreadcrumbs, type BreadcrumbSegment } from "@/lib/docs/breadcrumbs";

function labels(crumbs: BreadcrumbSegment[]): string[] {
  return crumbs.map((c) => c.label);
}

describe("buildBreadcrumbs", () => {
  it("returns only 'Documentation' for /docs root", () => {
    const crumbs = buildBreadcrumbs("/docs");
    expect(labels(crumbs)).toEqual(["Documentation"]);
  });

  it("returns section + page crumb for a Getting Started item", () => {
    const crumbs = buildBreadcrumbs("/docs/getting-started");
    expect(crumbs[0]).toEqual({ label: "Documentation", href: "/docs" });
    expect(crumbs.length).toBeGreaterThanOrEqual(2);
  });

  it("returns Documentation > page for a Documentation section item", () => {
    const crumbs = buildBreadcrumbs("/docs/atf-architecture");
    expect(labels(crumbs)).toEqual(["Documentation", "ATF Architecture"]);
  });

  /* ── Guide breadcrumbs ── */

  it("guide overview shows section title as terminal crumb, not duplicated", () => {
    const crumbs = buildBreadcrumbs("/docs/guide");
    expect(labels(crumbs)).toEqual(["Documentation", "Customer Guides"]);
    expect(crumbs[1].href).toBe("/docs/guide");
  });

  it("individual guide page shows full 3-level trail", () => {
    const crumbs = buildBreadcrumbs("/docs/guide/key-lifecycle");
    expect(labels(crumbs)).toEqual([
      "Documentation",
      "Customer Guides",
      "API Key Lifecycle",
    ]);
    expect(crumbs[1].href).toBe("/docs/guide");
    expect(crumbs[2].href).toBe("/docs/guide/key-lifecycle");
  });

  it("another individual guide shows correct 3-level trail", () => {
    const crumbs = buildBreadcrumbs("/docs/guide/troubleshooting");
    expect(labels(crumbs)).toEqual([
      "Documentation",
      "Customer Guides",
      "Troubleshooting",
    ]);
  });

  /* ── CLI Guides parallel consistency ── */

  it("CLI Guides overview also collapses to section title", () => {
    const crumbs = buildBreadcrumbs("/docs/cli/guides");
    expect(labels(crumbs)).toEqual(["Documentation", "CLI Guides"]);
    expect(crumbs[1].href).toBe("/docs/cli/guides");
  });

  it("individual CLI guide shows full 3-level trail", () => {
    const crumbs = buildBreadcrumbs("/docs/cli/guides/swap-permits");
    expect(labels(crumbs)).toEqual([
      "Documentation",
      "CLI Guides",
      "Swap Permit Parameters",
    ]);
  });

  /* ── Fallback ── */

  it("falls back to title-cased slug for unknown paths", () => {
    const crumbs = buildBreadcrumbs("/docs/unknown/deep/path");
    expect(labels(crumbs)).toContain("Unknown");
    expect(labels(crumbs)).toContain("Deep");
    expect(labels(crumbs)).toContain("Path");
  });
});

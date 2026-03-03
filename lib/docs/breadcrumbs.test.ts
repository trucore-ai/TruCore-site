import { describe, expect, it } from "vitest";
import { buildBreadcrumbs } from "./breadcrumbs";

describe("buildBreadcrumbs", () => {
  it("returns only Documentation for /docs", () => {
    const crumbs = buildBreadcrumbs("/docs");
    expect(crumbs).toEqual([{ label: "Documentation", href: "/docs" }]);
  });

  it("matches a top-level doc nav item", () => {
    const crumbs = buildBreadcrumbs("/docs/quickstart");
    expect(crumbs).toHaveLength(2);
    expect(crumbs[0]).toEqual({ label: "Documentation", href: "/docs" });
    expect(crumbs[1]).toEqual({ label: "Quickstart", href: "/docs/quickstart" });
  });

  it("includes section crumb for CLI Deep Dives items", () => {
    const crumbs = buildBreadcrumbs("/docs/cli/doctor");
    expect(crumbs.length).toBeGreaterThanOrEqual(3);
    expect(crumbs[0].label).toBe("Documentation");
    expect(crumbs[1].label).toBe("CLI Deep Dives");
    expect(crumbs[crumbs.length - 1].label).toBe("Doctor");
  });

  it("includes section crumb for CLI Guides items", () => {
    const crumbs = buildBreadcrumbs("/docs/cli/guides/simulate-verify-execute");
    expect(crumbs[0].label).toBe("Documentation");
    expect(crumbs.some((c) => c.label === "CLI Guides")).toBe(true);
    expect(crumbs[crumbs.length - 1].label).toBe("Simulate, Verify, Execute");
  });

  it("falls back to title-cased segments for unknown paths", () => {
    const crumbs = buildBreadcrumbs("/docs/some/unknown/path");
    expect(crumbs[0]).toEqual({ label: "Documentation", href: "/docs" });
    expect(crumbs[1].label).toBe("Some");
    expect(crumbs[2].label).toBe("Unknown");
    expect(crumbs[3].label).toBe("Path");
  });
});

/**
 * CI guardrail: manifest internal path integrity
 *
 * Reads public/.well-known/atf.json and asserts that every internal
 * site path referenced by the manifest resolves to a real file on disk
 * (either an app route or a public static asset).
 *
 * This test runs in vitest (no network, no server needed) so it is fast
 * and can gate every commit/PR.
 *
 * How each path type is resolved:
 *  - /docs/...  → app/docs/.../page.tsx  (Next.js app route)
 *  - /docs/agent/atf_toolcard.json → public/docs/agent/atf_toolcard.json (static asset)
 *  - Any path starting with / → checked first as public/<path>, then app/<path>/page.tsx
 */

import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join, extname } from "path";

const ROOT = join(__dirname, "..");
const MANIFEST_PATH = join(ROOT, "public", ".well-known", "atf.json");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if a given absolute site path (e.g. "/docs/agent-discovery")
 * maps to a real file that will be served by Next.js / Vercel.
 *
 * Resolution order:
 *   1. public/<path>            (static asset served verbatim)
 *   2. app/<path>/page.tsx      (Next.js app router page)
 *   3. app/<path>/route.ts      (Next.js app router API)
 *   4. app/<path>/page.mdx      (MDX page)
 */
function sitePathExists(sitePath: string): boolean {
  // Strip leading slash for fs joins
  const rel = sitePath.replace(/^\//, "");

  // 1. Public static asset (e.g. /docs/agent/atf_toolcard.json)
  if (existsSync(join(ROOT, "public", rel))) return true;

  // 2-4. App router routes
  for (const candidate of ["page.tsx", "route.ts", "page.mdx", "page.jsx"]) {
    if (existsSync(join(ROOT, "app", rel, candidate))) return true;
  }

  return false;
}

/** Extract all top-level string values from a plain object that look like site paths (start with /). */
function extractSitePaths(obj: Record<string, unknown>): Array<{ field: string; path: string }> {
  const results: Array<{ field: string; path: string }> = [];
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string" && value.startsWith("/")) {
      results.push({ field: key, path: value });
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("manifest internal path integrity", () => {
  let manifest: Record<string, unknown>;

  it("manifest file exists and is valid JSON", () => {
    expect(existsSync(MANIFEST_PATH)).toBe(true);
    const raw = readFileSync(MANIFEST_PATH, "utf-8");
    expect(() => { manifest = JSON.parse(raw) as Record<string, unknown>; }).not.toThrow();
  });

  it("discovery.openclaw_runbook starts with /", () => {
    const raw = readFileSync(MANIFEST_PATH, "utf-8");
    manifest = JSON.parse(raw) as Record<string, unknown>;
    const discovery = manifest.discovery as Record<string, unknown> | undefined;
    expect(discovery).toBeDefined();
    const runbook = discovery!.openclaw_runbook as string;
    expect(runbook).toMatch(/^\//);
  });

  it("discovery.universal_runbook starts with /", () => {
    const raw = readFileSync(MANIFEST_PATH, "utf-8");
    manifest = JSON.parse(raw) as Record<string, unknown>;
    const discovery = manifest.discovery as Record<string, unknown> | undefined;
    const runbook = discovery!.universal_runbook as string;
    expect(runbook).toMatch(/^\//);
  });

  it("discovery.toolcard_path starts with /", () => {
    const raw = readFileSync(MANIFEST_PATH, "utf-8");
    manifest = JSON.parse(raw) as Record<string, unknown>;
    const discovery = manifest.discovery as Record<string, unknown> | undefined;
    const toolcard = discovery!.toolcard_path as string;
    expect(toolcard).toMatch(/^\//);
  });

  it("discovery.openclaw_runbook resolves to a real file", () => {
    const raw = readFileSync(MANIFEST_PATH, "utf-8");
    manifest = JSON.parse(raw) as Record<string, unknown>;
    const discovery = manifest.discovery as Record<string, unknown>;
    const path = discovery.openclaw_runbook as string;
    expect(
      sitePathExists(path),
      `discovery.openclaw_runbook "${path}" does not resolve to a real app route or public asset`,
    ).toBe(true);
  });

  it("discovery.universal_runbook resolves to a real file", () => {
    const raw = readFileSync(MANIFEST_PATH, "utf-8");
    manifest = JSON.parse(raw) as Record<string, unknown>;
    const discovery = manifest.discovery as Record<string, unknown>;
    const path = discovery.universal_runbook as string;
    expect(
      sitePathExists(path),
      `discovery.universal_runbook "${path}" does not resolve to a real app route or public asset`,
    ).toBe(true);
  });

  it("discovery.toolcard_path resolves to a real file", () => {
    const raw = readFileSync(MANIFEST_PATH, "utf-8");
    manifest = JSON.parse(raw) as Record<string, unknown>;
    const discovery = manifest.discovery as Record<string, unknown>;
    const path = discovery.toolcard_path as string;
    expect(
      sitePathExists(path),
      `discovery.toolcard_path "${path}" does not resolve to a real app route or public asset`,
    ).toBe(true);
  });

  it("all discovery string fields that start with / resolve to real files", () => {
    const raw = readFileSync(MANIFEST_PATH, "utf-8");
    manifest = JSON.parse(raw) as Record<string, unknown>;
    const discovery = manifest.discovery as Record<string, unknown> | undefined;
    if (!discovery) return;

    const paths = extractSitePaths(discovery);
    const broken: string[] = [];

    for (const { field, path } of paths) {
      // Skip bare fragment/anchor-only values and non-path strings
      if (!path.startsWith("/")) continue;
      // Skip paths that have a file extension that is not .json or .md (API keys, etc.)
      const ext = extname(path);
      if (ext && !["", ".json", ".md", ".mdx", ".txt"].includes(ext)) continue;

      if (!sitePathExists(path)) {
        broken.push(`  ${field}: "${path}"`);
      }
    }

    expect(
      broken,
      `The following manifest discovery paths do not resolve:\n${broken.join("\n")}`,
    ).toHaveLength(0);
  });
});

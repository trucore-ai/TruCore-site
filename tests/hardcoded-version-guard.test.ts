import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";

const ROOT = join(__dirname, "..");

/**
 * Recursively collect file paths under `dir` that match the given extensions,
 * skipping directories in the skip list.
 */
function collectFiles(
  dir: string,
  extensions: string[],
  skipDirs: string[]
): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (skipDirs.includes(entry)) continue;
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...collectFiles(full, extensions, skipDirs));
    } else if (extensions.some((ext) => entry.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

const UI_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs"];
const SKIP_DIRS = [
  "node_modules",
  ".next",
  ".git",
  "coverage",
  "test-results",
  "content",      // changelog / release notes may reference versions
  "ops",
];

/**
 * Pattern that catches hardcoded numeric CLI versions in UI code, e.g.
 *   @trucore/atf@0.1.0
 *   @trucore/atf@1.2.3
 *
 * Allowed patterns (via getAtfCliVersion interpolation) use a template
 * variable like ${cliVersion}, which won't match this regex.
 */
const HARDCODED_VERSION_RE = /@trucore\/atf@\d+\.\d+/;

/** @latest must never appear */
const AT_LATEST_RE = /@trucore\/atf@latest/;

describe("CI guard: no hardcoded CLI versions in UI source", () => {
  const files = collectFiles(ROOT, UI_EXTENSIONS, SKIP_DIRS);

  it("scans at least some source files", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("no UI file contains a hardcoded @trucore/atf@<version>", () => {
    const violations: string[] = [];

    for (const file of files) {
      const relPath = relative(ROOT, file);

      // Whitelist: test files that intentionally assert version strings
      if (relPath.startsWith("tests/") || relPath.startsWith("tests\\")) continue;

      const content = readFileSync(file, "utf-8");
      if (HARDCODED_VERSION_RE.test(content)) {
        violations.push(relPath);
      }
    }

    expect(
      violations,
      `Found hardcoded @trucore/atf@<version> in:\n  ${violations.join("\n  ")}\nUse getAtfCliVersion() from lib/version.ts instead.`
    ).toEqual([]);
  });

  it("no UI file contains @trucore/atf@latest", () => {
    const violations: string[] = [];

    for (const file of files) {
      const relPath = relative(ROOT, file);
      if (relPath.startsWith("tests/") || relPath.startsWith("tests\\")) continue;

      const content = readFileSync(file, "utf-8");
      if (AT_LATEST_RE.test(content)) {
        violations.push(relPath);
      }
    }

    expect(
      violations,
      `Found @trucore/atf@latest in:\n  ${violations.join("\n  ")}\nNever use @latest. Pin via NEXT_PUBLIC_ATF_CLI_VERSION.`
    ).toEqual([]);
  });
});

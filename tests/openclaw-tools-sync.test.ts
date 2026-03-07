/**
 * CI guardrail: OPENCLAW_TOOLS array in agent-discovery page stays in sync.
 *
 * Statically parses the source file for the OPENCLAW_TOOLS array and confirms
 * the count of tool entries matches the canonical count in atf.json. This
 * catches accidental additions/deletions in the UI page that are not reflected
 * in the manifest (or vice versa).
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..");
const DISCOVERY_PAGE = join(ROOT, "app", "docs", "agent-discovery", "page.tsx");
const MANIFEST_PATH = join(ROOT, "public", ".well-known", "atf.json");

describe("OPENCLAW_TOOLS array matches canonical manifest", () => {
  const pageSource = readFileSync(DISCOVERY_PAGE, "utf-8");
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"));
  const canonicalTools: string[] = manifest.openclaw_plugin.tools;

  // Extract the OPENCLAW_TOOLS array block (between `= [` and `];`)
  const arrayMatch = pageSource.match(
    /const\s+OPENCLAW_TOOLS\s*=\s*\[([\s\S]*?)\];/,
  );

  it("OPENCLAW_TOOLS array exists in agent-discovery page", () => {
    expect(arrayMatch, "Could not locate OPENCLAW_TOOLS array").not.toBeNull();
  });

  it("OPENCLAW_TOOLS entry count equals canonical tool count", () => {
    // Each tool object has a `name:` property
    const nameMatches = arrayMatch![1].match(/name:\s*["']/g);
    expect(nameMatches).not.toBeNull();
    expect(
      nameMatches!.length,
      `Expected ${canonicalTools.length} tools but found ${nameMatches?.length ?? 0}`,
    ).toBe(canonicalTools.length);
  });

  it("every canonical tool name appears in OPENCLAW_TOOLS", () => {
    const block = arrayMatch![1];
    const missing = canonicalTools.filter(
      (t: string) => !block.includes(`"${t}"`) && !block.includes(`'${t}'`),
    );
    expect(
      missing,
      `Canonical tools missing from OPENCLAW_TOOLS: ${missing.join(", ")}`,
    ).toEqual([]);
  });
});

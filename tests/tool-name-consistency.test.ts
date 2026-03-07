/**
 * CI guardrail: tool-name consistency between atf.json and atf_toolcard.json
 *
 * Reads the canonical manifest and the toolcard JSON file, then asserts:
 *   1. Both list exactly 13 tools.
 *   2. Every tool name in atf.json appears in atf_toolcard.json (and vice versa).
 *
 * If tool names drift between these two files, the test fails with a clear
 * diff showing which names are missing or extra.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..");
const MANIFEST_PATH = join(ROOT, "public", ".well-known", "atf.json");
const TOOLCARD_PATH = join(ROOT, "public", "docs", "agent", "atf_toolcard.json");

const EXPECTED_TOOL_COUNT = 13;

interface Manifest {
  openclaw_plugin: {
    tools: string[];
    version: string;
  };
}

interface Toolcard {
  plugin_version: string;
  tools: Array<{ name: string }>;
}

function loadManifest(): Manifest {
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf-8")) as Manifest;
}

function loadToolcard(): Toolcard {
  return JSON.parse(readFileSync(TOOLCARD_PATH, "utf-8")) as Toolcard;
}

describe("tool-name consistency: atf.json <-> atf_toolcard.json", () => {
  const manifest = loadManifest();
  const toolcard = loadToolcard();

  const manifestTools = manifest.openclaw_plugin.tools;
  const toolcardTools = toolcard.tools.map((t) => t.name);

  it(`atf.json openclaw_plugin.tools has exactly ${EXPECTED_TOOL_COUNT} entries`, () => {
    expect(manifestTools).toHaveLength(EXPECTED_TOOL_COUNT);
  });

  it(`atf_toolcard.json tools has exactly ${EXPECTED_TOOL_COUNT} entries`, () => {
    expect(toolcardTools).toHaveLength(EXPECTED_TOOL_COUNT);
  });

  it("every manifest tool name appears in the toolcard", () => {
    const missing = manifestTools.filter((t) => !toolcardTools.includes(t));
    expect(missing, `Tools in atf.json but missing from atf_toolcard.json: ${missing.join(", ")}`).toEqual([]);
  });

  it("every toolcard tool name appears in the manifest", () => {
    const extra = toolcardTools.filter((t) => !manifestTools.includes(t));
    expect(extra, `Tools in atf_toolcard.json but missing from atf.json: ${extra.join(", ")}`).toEqual([]);
  });

  it("manifest and toolcard versions both equal 0.2.3", () => {
    expect(manifest.openclaw_plugin.version).toBe("0.2.3");
    expect(toolcard.plugin_version).toBe("0.2.3");
  });
});

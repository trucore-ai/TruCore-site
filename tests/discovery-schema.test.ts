/**
 * CI guardrail: machine-readable discovery schema validation.
 *
 * Ensures all three discovery JSON assets are structurally valid,
 * internally consistent, and contain the fields that bots and
 * OpenClaw plugin consumers depend on.
 *
 * Files under test:
 *   public/.well-known/atf.json
 *   public/docs/agent/openclaw_plugin.json
 *   public/docs/agent/openclaw_install.json
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..");
const MANIFEST_PATH = join(ROOT, "public", ".well-known", "atf.json");
const PLUGIN_PATH = join(ROOT, "public", "docs", "agent", "openclaw_plugin.json");
const INSTALL_PATH = join(ROOT, "public", "docs", "agent", "openclaw_install.json");

interface PluginJSON {
  schema_version: string;
  package_name: string;
  plugin_id: string;
  version: string;
  install_command: string;
  onboarding_flow: string[];
  verification_sequence: Array<{ step: number }>;
  migration: { previous_package_name: string; current_package_name: string; note: string };
  deny_behavior_note: string;
  tools: string[];
}

interface InstallJSON {
  package_name: string;
  plugin_id: string;
  version: string;
  onboarding: { type: string; steps: Array<{ step: number }> };
  verification_sequence: Array<{ step: number }>;
  migration: { previous_package_name: string; current_package_name: string };
  deny_behavior_note: string;
}

interface Manifest {
  manifest_hash: string;
  recipes_v2_hash: string;
  openclaw_plugin: {
    npm: string;
    plugin_id: string;
    tools: string[];
    install_command?: string;
    install?: string;
  };
}

function load<T>(p: string): T {
  return JSON.parse(readFileSync(p, "utf-8")) as T;
}

const manifest = load<Manifest>(MANIFEST_PATH);
const plugin = load<PluginJSON>(PLUGIN_PATH);
const install = load<InstallJSON>(INSTALL_PATH);

// ---------------------------------------------------------------------------
// openclaw_plugin.json
// ---------------------------------------------------------------------------
describe("openclaw_plugin.json schema", () => {
  it("has required top-level fields", () => {
    expect(plugin.package_name).toBeTruthy();
    expect(plugin.plugin_id).toBeTruthy();
    expect(plugin.install_command).toBeTruthy();
    expect(plugin.version).toBeTruthy();
  });

  it("package_name is @trucore/trucore-atf", () => {
    expect(plugin.package_name).toBe("@trucore/trucore-atf");
  });

  it("tools array has >= 13 entries", () => {
    expect(plugin.tools.length).toBeGreaterThanOrEqual(13);
  });

  it("onboarding_flow is a non-empty array", () => {
    expect(Array.isArray(plugin.onboarding_flow)).toBe(true);
    expect(plugin.onboarding_flow.length).toBeGreaterThanOrEqual(1);
  });

  it("verification_sequence is a non-empty array", () => {
    expect(Array.isArray(plugin.verification_sequence)).toBe(true);
    expect(plugin.verification_sequence.length).toBeGreaterThanOrEqual(1);
  });

  it("migration block has previous and current package names", () => {
    expect(plugin.migration).toBeTruthy();
    expect(plugin.migration.previous_package_name).toBe("@trucore/openclaw-atf");
    expect(plugin.migration.current_package_name).toBe("@trucore/trucore-atf");
  });

  it("deny_behavior_note is a non-empty string", () => {
    expect(typeof plugin.deny_behavior_note).toBe("string");
    expect(plugin.deny_behavior_note.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// openclaw_install.json
// ---------------------------------------------------------------------------
describe("openclaw_install.json schema", () => {
  it("has required top-level fields", () => {
    expect(install.package_name).toBeTruthy();
    expect(install.plugin_id).toBeTruthy();
    expect(install.version).toBeTruthy();
  });

  it("package_name matches plugin JSON", () => {
    expect(install.package_name).toBe(plugin.package_name);
  });

  it("onboarding has steps array", () => {
    expect(install.onboarding).toBeTruthy();
    expect(Array.isArray(install.onboarding.steps)).toBe(true);
    expect(install.onboarding.steps.length).toBeGreaterThanOrEqual(1);
  });

  it("verification_sequence is present", () => {
    expect(Array.isArray(install.verification_sequence)).toBe(true);
    expect(install.verification_sequence.length).toBeGreaterThanOrEqual(1);
  });

  it("migration block is present and consistent", () => {
    expect(install.migration).toBeTruthy();
    expect(install.migration.previous_package_name).toBe(plugin.migration.previous_package_name);
    expect(install.migration.current_package_name).toBe(plugin.migration.current_package_name);
  });

  it("deny_behavior_note is present", () => {
    expect(typeof install.deny_behavior_note).toBe("string");
    expect(install.deny_behavior_note.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Cross-file consistency with atf.json manifest
// ---------------------------------------------------------------------------
describe("cross-file discovery consistency", () => {
  it("manifest openclaw_plugin.npm matches plugin package_name", () => {
    expect(manifest.openclaw_plugin.npm).toBe(plugin.package_name);
  });

  it("manifest tool list matches plugin tool list", () => {
    const mTools = [...manifest.openclaw_plugin.tools].sort();
    const pTools = [...plugin.tools].sort();
    expect(mTools).toEqual(pTools);
  });

  it("plugin_id is consistent across all files", () => {
    expect(manifest.openclaw_plugin.plugin_id).toBe(plugin.plugin_id);
    expect(install.plugin_id).toBe(plugin.plugin_id);
  });

  it("version is consistent across plugin and install", () => {
    expect(install.version).toBe(plugin.version);
  });
});

// ---------------------------------------------------------------------------
// Hash fields (externally sourced, presence + format only)
// ---------------------------------------------------------------------------
describe("manifest hash fields", () => {
  it("manifest_hash is a non-empty hex string", () => {
    expect(manifest.manifest_hash).toMatch(/^[0-9a-f]{8,}$/i);
  });

  it("recipes_v2_hash is a non-empty hex string", () => {
    expect(manifest.recipes_v2_hash).toMatch(/^[0-9a-f]{8,}$/i);
  });
});

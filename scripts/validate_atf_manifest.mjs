#!/usr/bin/env node
/**
 * validate_atf_manifest.mjs
 *
 * Canonical zero-dependency validator for the machine-readable discovery
 * surfaces published by the TruCore site:
 *
 *   public/.well-known/atf.json          (primary manifest)
 *   public/docs/agent/openclaw_plugin.json (OpenClaw plugin metadata)
 *   public/docs/agent/openclaw_install.json (OpenClaw install guide)
 *
 * Validates required keys, structural shapes, cross-file consistency,
 * and hash freshness before the site is built or deployed.
 *
 * This is the single source of truth for machine-readable validation.
 * The former secondary validator (validate-atf-manifest.mjs) has been
 * retired and now delegates to this script.
 *
 * Exit codes:
 *   0 - manifest is valid
 *   1 - manifest is missing, unparseable, or a required key fails validation
 *
 * Usage:
 *   node scripts/validate_atf_manifest.mjs
 *   npm run check:atf-manifest
 *   npm run test:manifest          (same script)
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const MANIFEST_PATH = join(ROOT, "public", ".well-known", "atf.json");
const PLUGIN_PATH = join(ROOT, "public", "docs", "agent", "openclaw_plugin.json");
const INSTALL_PATH = join(ROOT, "public", "docs", "agent", "openclaw_install.json");

// ---------------------------------------------------------------------------
// Read + parse helpers
// ---------------------------------------------------------------------------
function loadJSON(filePath, label) {
  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    console.log(`✓ ${label} parsed (${raw.length} bytes)`);
    return { raw, parsed };
  } catch (err) {
    console.error(`✗ Failed to read or parse ${label} at ${filePath}`);
    console.error(`  ${err.message}`);
    process.exit(1);
  }
}

const { raw: manifestRaw, parsed: manifest } = loadJSON(MANIFEST_PATH, "atf.json");
const { parsed: plugin } = loadJSON(PLUGIN_PATH, "openclaw_plugin.json");
const { parsed: install } = loadJSON(INSTALL_PATH, "openclaw_install.json");

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------
const errors = [];

function requireNonEmptyString(path, value) {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`✗ ${path}: expected non-empty string, got ${JSON.stringify(value)}`);
    return false;
  }
  console.log(`✓ ${path} = ${value}`);
  return true;
}

function requirePresent(path, value) {
  if (value === undefined || value === null) {
    errors.push(`✗ ${path}: required key is missing`);
    return false;
  }
  console.log(`✓ ${path} present`);
  return true;
}

function requireArrayMinLength(path, value, minLength) {
  if (!Array.isArray(value)) {
    errors.push(`✗ ${path}: expected array, got ${typeof value}`);
    return false;
  }
  if (value.length < minLength) {
    errors.push(
      `✗ ${path}: expected array with >= ${minLength} entries, found ${value.length}`
    );
    return false;
  }
  console.log(`✓ ${path} has ${value.length} entries`);
  return true;
}

// ---------------------------------------------------------------------------
// 1. Primary manifest: required top-level keys
// ---------------------------------------------------------------------------
requireNonEmptyString("manifest_hash", manifest.manifest_hash);
requirePresent("recipes_v2", manifest.recipes_v2);
requireNonEmptyString("recipes_v2_hash", manifest.recipes_v2_hash);

// ---------------------------------------------------------------------------
// 2. openclaw_plugin block (inside atf.json)
// ---------------------------------------------------------------------------
if (!requirePresent("openclaw_plugin", manifest.openclaw_plugin)) {
  errors.push("  (openclaw_plugin sub-checks skipped, block missing)");
} else {
  const op = manifest.openclaw_plugin;

  // 2a. npm package name
  requireNonEmptyString("openclaw_plugin.npm", op.npm);

  // 2b. plugin_id
  requireNonEmptyString("openclaw_plugin.plugin_id", op.plugin_id);

  // 2c. tools array: at least 13 entries (future tools may be added)
  requireArrayMinLength("openclaw_plugin.tools", op.tools, 13);

  // 2d. install_command (or legacy .install for transition)
  const installCmd = op.install_command || op.install;
  if (typeof installCmd !== "string" || installCmd.trim() === "") {
    errors.push(
      "✗ openclaw_plugin.install_command (or legacy .install): " +
        "at least one must be a non-empty string"
    );
  } else {
    const field = op.install_command ? "install_command" : "install (legacy)";
    console.log(`✓ openclaw_plugin.${field} = ${installCmd}`);
  }

  // 2e. toolsOptional (or legacy safety_defaults.tools_optional)
  const toolsOptionalVal =
    typeof op.toolsOptional === "boolean"
      ? op.toolsOptional
      : op.safety_defaults?.tools_optional;
  if (typeof toolsOptionalVal !== "boolean") {
    errors.push(
      "✗ openclaw_plugin.toolsOptional (or legacy safety_defaults.tools_optional): " +
        "at least one must be a boolean"
    );
  } else {
    const field =
      typeof op.toolsOptional === "boolean"
        ? "toolsOptional"
        : "safety_defaults.tools_optional (legacy)";
    console.log(`✓ openclaw_plugin.${field} = ${toolsOptionalVal}`);
  }

  // 2f. onboarding_flow (array of tool names for first-run sequence)
  if (op.onboarding_flow !== undefined) {
    requireArrayMinLength("openclaw_plugin.onboarding_flow", op.onboarding_flow, 1);
  }

  // 2g. migration block (backward-compat rename note)
  if (op.migration !== undefined) {
    requireNonEmptyString(
      "openclaw_plugin.migration.previous_package_name",
      op.migration?.previous_package_name
    );
    requireNonEmptyString(
      "openclaw_plugin.migration.current_package_name",
      op.migration?.current_package_name
    );
  }

  // 2h. deny_behavior_note
  if (op.deny_behavior_note !== undefined) {
    requireNonEmptyString("openclaw_plugin.deny_behavior_note", op.deny_behavior_note);
  }
}

// ---------------------------------------------------------------------------
// 3. Cross-file consistency: openclaw_plugin.json
// ---------------------------------------------------------------------------
console.log("\n--- Cross-file consistency: openclaw_plugin.json ---");

requireNonEmptyString("plugin.package_name", plugin.package_name);
requireNonEmptyString("plugin.plugin_id", plugin.plugin_id);
requireNonEmptyString("plugin.install_command", plugin.install_command);
requireArrayMinLength("plugin.tools", plugin.tools, 13);

// package_name must match the npm field in the manifest
if (
  manifest.openclaw_plugin?.npm &&
  plugin.package_name &&
  manifest.openclaw_plugin.npm !== plugin.package_name
) {
  errors.push(
    `✗ package_name mismatch: atf.json openclaw_plugin.npm="${manifest.openclaw_plugin.npm}" ` +
      `vs openclaw_plugin.json package_name="${plugin.package_name}"`
  );
} else if (manifest.openclaw_plugin?.npm && plugin.package_name) {
  console.log(`✓ package_name consistent across atf.json and openclaw_plugin.json`);
}

// tool lists must match
if (Array.isArray(manifest.openclaw_plugin?.tools) && Array.isArray(plugin.tools)) {
  const manifestTools = [...manifest.openclaw_plugin.tools].sort();
  const pluginTools = [...plugin.tools].sort();
  const manifestStr = JSON.stringify(manifestTools);
  const pluginStr = JSON.stringify(pluginTools);
  if (manifestStr !== pluginStr) {
    errors.push(
      `✗ tool list mismatch between atf.json and openclaw_plugin.json`
    );
  } else {
    console.log(`✓ tool lists match between atf.json and openclaw_plugin.json`);
  }
}

// onboarding_flow must exist in plugin
requireArrayMinLength("plugin.onboarding_flow", plugin.onboarding_flow, 1);

// verification_sequence must exist in plugin
requireArrayMinLength("plugin.verification_sequence", plugin.verification_sequence, 1);

// migration block must exist in plugin
if (!requirePresent("plugin.migration", plugin.migration)) {
  errors.push("  (migration sub-checks skipped, block missing)");
} else {
  requireNonEmptyString("plugin.migration.previous_package_name", plugin.migration.previous_package_name);
  requireNonEmptyString("plugin.migration.current_package_name", plugin.migration.current_package_name);
}

// deny_behavior_note
requireNonEmptyString("plugin.deny_behavior_note", plugin.deny_behavior_note);

// ---------------------------------------------------------------------------
// 4. Cross-file consistency: openclaw_install.json
// ---------------------------------------------------------------------------
console.log("\n--- Cross-file consistency: openclaw_install.json ---");

requireNonEmptyString("install.package_name", install.package_name);
requireNonEmptyString("install.plugin_id", install.plugin_id);

if (plugin.package_name && install.package_name && plugin.package_name !== install.package_name) {
  errors.push(
    `✗ package_name mismatch: openclaw_plugin.json="${plugin.package_name}" ` +
      `vs openclaw_install.json="${install.package_name}"`
  );
} else if (plugin.package_name && install.package_name) {
  console.log(`✓ package_name consistent across plugin and install JSONs`);
}

requirePresent("install.onboarding", install.onboarding);
requirePresent("install.verification_sequence", install.verification_sequence);
requirePresent("install.migration", install.migration);
requireNonEmptyString("install.deny_behavior_note", install.deny_behavior_note);

// ---------------------------------------------------------------------------
// 5. Hash freshness
//
// manifest_hash and recipes_v2_hash are externally generated by the ATF
// monorepo's build_manifest pipeline and embedded in atf.json at export time.
// This repo does NOT regenerate them. They are treated as opaque integrity
// tokens provided by the upstream source of truth.
//
// What we CAN verify here: the hashes are present, non-empty, look like
// hex strings, and we record a content fingerprint of the manifest so
// future maintainers can detect if the file content changed but the
// embedded hashes were not updated.
// ---------------------------------------------------------------------------
console.log("\n--- Hash freshness ---");

function looksLikeHex(str) {
  return /^[0-9a-f]{8,}$/i.test(str);
}

const mHash = manifest.manifest_hash;
const rHash = manifest.recipes_v2_hash;

if (mHash && !looksLikeHex(mHash)) {
  errors.push(`✗ manifest_hash "${mHash}" does not look like a hex digest`);
} else if (mHash) {
  console.log(`✓ manifest_hash looks like a valid hex digest`);
}

if (rHash && !looksLikeHex(rHash)) {
  errors.push(`✗ recipes_v2_hash "${rHash}" does not look like a hex digest`);
} else if (rHash) {
  console.log(`✓ recipes_v2_hash looks like a valid hex digest`);
}

// Compute a local SHA-256 fingerprint of the manifest file for auditability.
// This is NOT the same as manifest_hash (which is upstream-generated).
// It simply lets CI detect when the file content changes.
const localFingerprint = createHash("sha256")
  .update(manifestRaw)
  .digest("hex")
  .slice(0, 16);
console.log(`  local content fingerprint: ${localFingerprint}`);
console.log(
  `  Note: manifest_hash and recipes_v2_hash are externally sourced from the ATF monorepo.`
);
console.log(
  `  They should only change when a new atf.json is exported from agent-transaction-firewall.`
);

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------
if (errors.length > 0) {
  console.error(`\n✗ Manifest validation FAILED (${errors.length} error(s)):`);
  for (const e of errors) {
    console.error(`  ${e}`);
  }
  console.error(
    "\nHint: Re-export atf.json from agent-transaction-firewall:\n" +
      "  python3 scripts/export_manifest.py --out public/.well-known/atf.json"
  );
  process.exit(1);
}

console.log("\n✓ All machine-readable discovery surfaces are valid and consistent");

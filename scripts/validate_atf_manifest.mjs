#!/usr/bin/env node
/**
 * validate_atf_manifest.mjs
 *
 * Zero-dependency validator for public/.well-known/atf.json.
 *
 * Validates that the manifest exported from agent-transaction-firewall
 * (build_manifest source of truth) contains all contractual required keys
 * before the site is built or deployed.
 *
 * Required keys / shapes:
 *   manifest_hash       — non-empty string
 *   recipes_v2          — present (any truthy value)
 *   recipes_v2_hash     — non-empty string
 *   openclaw_plugin.npm — non-empty string
 *   openclaw_plugin.tools — array of length == 7
 *
 * Exit codes:
 *   0 — manifest is valid
 *   1 — manifest is missing, unparseable, or a required key fails validation
 *
 * Usage:
 *   node scripts/validate_atf_manifest.mjs
 *   npm run check:atf-manifest
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = join(__dirname, "..", "public", ".well-known", "atf.json");

// ---------------------------------------------------------------------------
// Read + parse
// ---------------------------------------------------------------------------
let manifest;
try {
  const raw = readFileSync(MANIFEST_PATH, "utf-8");
  manifest = JSON.parse(raw);
  console.log(`✓ atf.json parsed (${raw.length} bytes)`);
} catch (err) {
  console.error(`✗ Failed to read or parse atf.json at ${MANIFEST_PATH}`);
  console.error(`  ${err.message}`);
  process.exit(1);
}

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

function requireArrayLength(path, value, expectedLength) {
  if (!Array.isArray(value)) {
    errors.push(`✗ ${path}: expected array, got ${typeof value}`);
    return false;
  }
  if (value.length !== expectedLength) {
    errors.push(
      `✗ ${path}: expected array of length ${expectedLength}, found ${value.length}`
    );
    return false;
  }
  console.log(`✓ ${path} has ${value.length} entries`);
  return true;
}

// ---------------------------------------------------------------------------
// Required key checks
// ---------------------------------------------------------------------------

// 1. manifest_hash — non-empty string
requireNonEmptyString("manifest_hash", manifest.manifest_hash);

// 2. recipes_v2 — present
requirePresent("recipes_v2", manifest.recipes_v2);

// 3. recipes_v2_hash — non-empty string
requireNonEmptyString("recipes_v2_hash", manifest.recipes_v2_hash);

// 4. openclaw_plugin block
if (!requirePresent("openclaw_plugin", manifest.openclaw_plugin)) {
  errors.push("  (openclaw_plugin sub-checks skipped — block missing)");
} else {
  const op = manifest.openclaw_plugin;

  // 4a. openclaw_plugin.npm — non-empty string
  requireNonEmptyString("openclaw_plugin.npm", op.npm);

  // 4b. openclaw_plugin.tools — array of exactly 7 entries
  requireArrayLength("openclaw_plugin.tools", op.tools, 7);

  // 4c. install command — accept canonical install_command OR legacy install
  //     (transition window: at least one must exist and be non-empty)
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

  // 4d. toolsOptional — accept canonical top-level toolsOptional OR
  //     legacy safety_defaults.tools_optional (transition window)
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
}

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

console.log("\n✓ atf.json manifest is valid — all required keys present");

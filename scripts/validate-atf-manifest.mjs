#!/usr/bin/env node
// Validates public/.well-known/atf.json contains all required fields for agent discovery.
// Run via: node scripts/validate-atf-manifest.js
// Or:      npm run test:manifest

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifestPath = join(__dirname, "..", "public", ".well-known", "atf.json");

let manifest;
try {
  const raw = readFileSync(manifestPath, "utf-8");
  manifest = JSON.parse(raw);
  console.log("✓ JSON parsed successfully");
} catch (err) {
  console.error("✗ Failed to read/parse atf.json:", err.message);
  process.exit(1);
}

const errors = [];

// Required top-level keys
const requiredKeys = ["manifest_hash", "recipes_v2", "recipes_v2_hash", "openclaw_plugin"];
for (const key of requiredKeys) {
  if (manifest[key] === undefined) {
    errors.push(`Missing required key: ${key}`);
  } else {
    console.log(`✓ ${key} present`);
  }
}

// openclaw_plugin shape
const op = manifest.openclaw_plugin;
if (op) {
  if (!op.npm) {
    errors.push("openclaw_plugin.npm is missing");
  } else {
    console.log(`✓ openclaw_plugin.npm = ${op.npm}`);
  }

  const toolCount = Array.isArray(op.tools) ? op.tools.length : 0;
  if (toolCount !== 6) {
    errors.push(`openclaw_plugin.tools must have 6 entries, found ${toolCount}`);
  } else {
    console.log(`✓ openclaw_plugin.tools has ${toolCount} entries`);
  }

  if (!op.plugin_id) {
    errors.push("openclaw_plugin.plugin_id is missing");
  } else {
    console.log(`✓ openclaw_plugin.plugin_id = ${op.plugin_id}`);
  }

  if (!op.install) {
    errors.push("openclaw_plugin.install is missing");
  } else {
    console.log(`✓ openclaw_plugin.install = ${op.install}`);
  }
}

if (errors.length > 0) {
  console.error("\n✗ Manifest validation FAILED:");
  for (const e of errors) console.error("  -", e);
  process.exit(1);
}

console.log("\n✓ atf.json manifest is valid");

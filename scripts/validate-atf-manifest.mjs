#!/usr/bin/env node
// validate-atf-manifest.mjs (legacy entry point)
//
// This script previously contained its own validation logic but expected an
// outdated 6-tool model. It has been replaced with a thin wrapper that
// delegates to the canonical validator: validate_atf_manifest.mjs
//
// Both npm scripts now invoke the same validation:
//   npm run check:atf-manifest  -> validate_atf_manifest.mjs (direct)
//   npm run test:manifest        -> validate-atf-manifest.mjs -> same file

import { execFileSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const canonical = join(__dirname, "validate_atf_manifest.mjs");

try {
  execFileSync(process.execPath, [canonical], { stdio: "inherit" });
} catch {
  process.exit(1);
}


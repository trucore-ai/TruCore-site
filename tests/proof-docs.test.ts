/**
 * Proof system documentation integrity tests.
 *
 * Validates that:
 * - All proof documentation files exist
 * - Key phrases are present in the docs
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

const DOCS_DIR = join(process.cwd(), "docs", "proof");

describe("Proof Documentation", () => {
  describe("File existence", () => {
    const requiredFiles = [
      "README.md",
      "proof-links.md",
      "proof-bundle.md",
      "PROOF_PACKET.md",
      "distribution.md",
    ];

    it.each(requiredFiles)("docs/proof/%s exists", (filename) => {
      const filePath = join(DOCS_DIR, filename);
      expect(existsSync(filePath)).toBe(true);
    });
  });

  describe("Key phrases in README.md", () => {
    const readmePath = join(DOCS_DIR, "README.md");
    let content: string;

    beforeAll(() => {
      content = readFileSync(readmePath, "utf-8");
    });

    const requiredPhrases = [
      "Proof Packet",
      "Verify URL",
      "Distribution",
      "hash",
      "Proof Bundle",
      "Proof Links",
      "OG Preview",
      "canonical",
    ];

    it.each(requiredPhrases)("contains phrase: %s", (phrase) => {
      expect(content.toLowerCase()).toContain(phrase.toLowerCase());
    });

    it("contains proof surfaces table", () => {
      expect(content).toContain("| Surface");
      expect(content).toContain("| Purpose");
    });

    it("contains end-to-end flow", () => {
      expect(content).toContain("trade");
      expect(content).toContain("protect");
      expect(content).toContain("receipt");
      expect(content).toContain("verify");
    });
  });

  describe("Key phrases in PROOF_PACKET.md", () => {
    const packetPath = join(DOCS_DIR, "PROOF_PACKET.md");
    let content: string;

    beforeAll(() => {
      content = readFileSync(packetPath, "utf-8");
    });

    const requiredPhrases = [
      "Designed for Autonomous Agents",
      "/api/proof/packet",
      "hash",
      "decision",
      "verified",
      "deterministic",
    ];

    it.each(requiredPhrases)("contains phrase: %s", (phrase) => {
      expect(content.toLowerCase()).toContain(phrase.toLowerCase());
    });
  });

  describe("Key phrases in distribution.md", () => {
    const distPath = join(DOCS_DIR, "distribution.md");
    let content: string;

    beforeAll(() => {
      content = readFileSync(distPath, "utf-8");
    });

    const requiredPhrases = [
      "Share Text",
      "Bot Line",
      "ATF_PROOF",
      "hash=",
      "verify_url=",
    ];

    it.each(requiredPhrases)("contains phrase: %s", (phrase) => {
      expect(content).toContain(phrase);
    });
  });

  describe("Key phrases in proof-links.md", () => {
    const linksPath = join(DOCS_DIR, "proof-links.md");
    let content: string;

    beforeAll(() => {
      content = readFileSync(linksPath, "utf-8");
    });

    const requiredPhrases = [
      "Verify URL",
      "OG Preview URL",
      "www.trucore.xyz",
      "hash",
    ];

    it.each(requiredPhrases)("contains phrase: %s", (phrase) => {
      expect(content).toContain(phrase);
    });
  });

  describe("Key phrases in proof-bundle.md", () => {
    const bundlePath = join(DOCS_DIR, "proof-bundle.md");
    let content: string;

    beforeAll(() => {
      content = readFileSync(bundlePath, "utf-8");
    });

    const requiredPhrases = [
      "trucore_proof_bundle",
      "receipt_id",
      "version",
      "exported_at",
    ];

    it.each(requiredPhrases)("contains phrase: %s", (phrase) => {
      expect(content).toContain(phrase);
    });
  });
});

// Import beforeAll for vitest
import { beforeAll } from "vitest";

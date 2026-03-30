import { beforeEach, describe, expect, it, vi } from "vitest";

/* ────────────────────────────────────────────────────────────────
 *  Canonical Proof Contract Tests
 *
 *  Enforces the canonical proof URL contract across all surfaces:
 *
 *  Verify URL:
 *    https://www.trucore.xyz/verify?hash=<encoded>&from=share
 *
 *  OG Preview URL:
 *    https://www.trucore.xyz/api/og/receipt?hash=<encoded>
 *
 *  Query parameter:
 *    hash (NOT h, id, receipt_id, or any other alias)
 *
 *  These tests exist to prevent URL drift between surfaces.
 *  All outbound proof/share/distribution URLs must be canonical.
 * ──────────────────────────────────────────────────────────────── */

import {
  buildVerifyUrl,
  buildOgPreviewUrl,
  buildProofBundle,
  getCanonicalSiteOrigin,
} from "@/lib/share-utils";

import {
  generateShareText,
  generateBotLine,
  generateDistributionBundle,
} from "@/lib/distribution-utils";

import { buildProofBundleData } from "@/lib/proof-bundle";
import { buildProofPacket } from "@/lib/proof-packet";

// ── Mock Environment ─────────────────────────────────────────────

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://www.trucore.xyz");
});

// ── Sample Data ──────────────────────────────────────────────────

const SAMPLE_HASH = "0xdeadbeef12345678901234567890123456789012";

// ────────────────────────────────────────────────────────────────
// Domain Contract
// ────────────────────────────────────────────────────────────────

describe("Canonical Domain Contract", () => {
  describe("getCanonicalSiteOrigin", () => {
    it("returns www.trucore.xyz domain", () => {
      const origin = getCanonicalSiteOrigin();
      expect(origin).toBe("https://www.trucore.xyz");
    });

    it("does NOT return non-www domain", () => {
      const origin = getCanonicalSiteOrigin();
      expect(origin).not.toBe("https://trucore.xyz");
    });

    it("does NOT return trucore.ai", () => {
      const origin = getCanonicalSiteOrigin();
      expect(origin).not.toContain("trucore.ai");
    });
  });

  describe("buildVerifyUrl", () => {
    it("uses www.trucore.xyz domain", () => {
      const url = buildVerifyUrl(SAMPLE_HASH);
      expect(url).toContain("https://www.trucore.xyz");
    });

    it("does NOT use non-www domain", () => {
      const url = buildVerifyUrl(SAMPLE_HASH);
      expect(url).not.toMatch(/https:\/\/trucore\.xyz[^.]/);
    });
  });

  describe("buildOgPreviewUrl", () => {
    it("uses www.trucore.xyz domain", () => {
      const url = buildOgPreviewUrl(SAMPLE_HASH);
      expect(url).toContain("https://www.trucore.xyz");
    });

    it("does NOT use non-www domain", () => {
      const url = buildOgPreviewUrl(SAMPLE_HASH);
      expect(url).not.toMatch(/https:\/\/trucore\.xyz[^.]/);
    });
  });
});

// ────────────────────────────────────────────────────────────────
// Verify URL Contract
// ────────────────────────────────────────────────────────────────

describe("Verify URL Contract", () => {
  describe("query parameter format", () => {
    it("uses hash= parameter (not h=)", () => {
      const url = buildVerifyUrl(SAMPLE_HASH);
      expect(url).toContain("?hash=");
      expect(url).not.toMatch(/[?&]h=/);
    });

    it("does NOT use id= parameter", () => {
      const url = buildVerifyUrl(SAMPLE_HASH);
      expect(url).not.toMatch(/[?&]id=/);
    });

    it("does NOT use receipt_id= parameter", () => {
      const url = buildVerifyUrl(SAMPLE_HASH);
      expect(url).not.toMatch(/[?&]receipt_id=/);
    });
  });

  describe("from=share tracking", () => {
    it("always includes from=share", () => {
      const url = buildVerifyUrl(SAMPLE_HASH);
      expect(url).toContain("&from=share");
    });

    it("includes from=share after hash parameter", () => {
      const url = buildVerifyUrl(SAMPLE_HASH);
      const hashIndex = url.indexOf("?hash=");
      const fromIndex = url.indexOf("&from=share");
      expect(fromIndex).toBeGreaterThan(hashIndex);
    });
  });

  describe("path format", () => {
    it("uses /verify path", () => {
      const url = buildVerifyUrl(SAMPLE_HASH);
      expect(url).toContain("/verify?");
    });

    it("does NOT use /v/ path alias", () => {
      const url = buildVerifyUrl(SAMPLE_HASH);
      expect(url).not.toContain("/v?");
    });
  });

  describe("encoding", () => {
    it("URL-encodes the hash", () => {
      const hashWithSpecial = "hash with spaces & special=chars";
      const url = buildVerifyUrl(hashWithSpecial);
      expect(url).toContain(encodeURIComponent(hashWithSpecial));
      expect(url).not.toContain("hash with spaces");
    });
  });
});

// ────────────────────────────────────────────────────────────────
// OG Preview URL Contract
// ────────────────────────────────────────────────────────────────

describe("OG Preview URL Contract", () => {
  describe("path format", () => {
    it("uses /api/og/receipt path", () => {
      const url = buildOgPreviewUrl(SAMPLE_HASH);
      expect(url).toContain("/api/og/receipt?");
    });

    it("does NOT use /api/og? path (without /receipt)", () => {
      const url = buildOgPreviewUrl(SAMPLE_HASH);
      expect(url).not.toMatch(/\/api\/og\?/);
    });
  });

  describe("query parameter format", () => {
    it("uses hash= parameter", () => {
      const url = buildOgPreviewUrl(SAMPLE_HASH);
      expect(url).toContain("?hash=");
    });

    it("does NOT use h= parameter", () => {
      const url = buildOgPreviewUrl(SAMPLE_HASH);
      expect(url).not.toMatch(/[?&]h=/);
    });
  });

  describe("encoding", () => {
    it("URL-encodes the hash", () => {
      const hashWithSpecial = "hash&special";
      const url = buildOgPreviewUrl(hashWithSpecial);
      expect(url).toContain(encodeURIComponent(hashWithSpecial));
    });
  });
});

// ────────────────────────────────────────────────────────────────
// Proof Bundle URL Contract
// ────────────────────────────────────────────────────────────────

describe("Proof Bundle URL Contract", () => {
  describe("buildProofBundle", () => {
    it("verifyUrl uses canonical domain", () => {
      const bundle = buildProofBundle(SAMPLE_HASH);
      expect(bundle.verifyUrl).toContain("https://www.trucore.xyz");
    });

    it("verifyUrl uses hash= parameter", () => {
      const bundle = buildProofBundle(SAMPLE_HASH);
      expect(bundle.verifyUrl).toContain("?hash=");
    });

    it("verifyUrl includes from=share", () => {
      const bundle = buildProofBundle(SAMPLE_HASH);
      expect(bundle.verifyUrl).toContain("&from=share");
    });

    it("ogPreviewUrl uses canonical domain", () => {
      const bundle = buildProofBundle(SAMPLE_HASH);
      expect(bundle.ogPreviewUrl).toContain("https://www.trucore.xyz");
    });

    it("ogPreviewUrl uses /api/og/receipt path", () => {
      const bundle = buildProofBundle(SAMPLE_HASH);
      expect(bundle.ogPreviewUrl).toContain("/api/og/receipt?hash=");
    });
  });

  describe("buildProofBundleData", () => {
    it("verify_url uses canonical domain", () => {
      const data = buildProofBundleData(SAMPLE_HASH);
      expect(data.links.verify_url).toContain("https://www.trucore.xyz");
    });

    it("verify_url uses hash= parameter", () => {
      const data = buildProofBundleData(SAMPLE_HASH);
      expect(data.links.verify_url).toContain("?hash=");
    });

    it("verify_url includes from=share", () => {
      const data = buildProofBundleData(SAMPLE_HASH);
      expect(data.links.verify_url).toContain("&from=share");
    });

    it("og_preview_url uses canonical domain", () => {
      const data = buildProofBundleData(SAMPLE_HASH);
      expect(data.links.og_preview_url).toContain("https://www.trucore.xyz");
    });

    it("og_preview_url uses /api/og/receipt path", () => {
      const data = buildProofBundleData(SAMPLE_HASH);
      expect(data.links.og_preview_url).toContain("/api/og/receipt?hash=");
    });
  });
});

// ────────────────────────────────────────────────────────────────
// Proof Packet URL Contract
// ────────────────────────────────────────────────────────────────

describe("Proof Packet URL Contract", () => {
  it("verify_url uses canonical domain", () => {
    const packet = buildProofPacket(SAMPLE_HASH);
    expect(packet.links.verify_url).toContain("https://www.trucore.xyz");
  });

  it("verify_url uses hash= parameter", () => {
    const packet = buildProofPacket(SAMPLE_HASH);
    expect(packet.links.verify_url).toContain("?hash=");
  });

  it("verify_url includes from=share", () => {
    const packet = buildProofPacket(SAMPLE_HASH);
    expect(packet.links.verify_url).toContain("&from=share");
  });

  it("og_preview_url uses canonical domain", () => {
    const packet = buildProofPacket(SAMPLE_HASH);
    expect(packet.links.og_preview_url).toContain("https://www.trucore.xyz");
  });

  it("og_preview_url uses /api/og/receipt path", () => {
    const packet = buildProofPacket(SAMPLE_HASH);
    expect(packet.links.og_preview_url).toContain("/api/og/receipt?hash=");
  });
});

// ────────────────────────────────────────────────────────────────
// Distribution URL Contract
// ────────────────────────────────────────────────────────────────

describe("Distribution URL Contract", () => {
  describe("generateShareText", () => {
    it("includes canonical domain in verify URL", () => {
      const text = generateShareText({ hash: SAMPLE_HASH });
      expect(text).toContain("https://www.trucore.xyz");
    });

    it("includes hash= parameter", () => {
      const text = generateShareText({ hash: SAMPLE_HASH });
      expect(text).toContain("?hash=");
    });

    it("includes from=share tracking", () => {
      const text = generateShareText({ hash: SAMPLE_HASH });
      expect(text).toContain("&from=share");
    });
  });

  describe("generateBotLine", () => {
    it("includes canonical domain in verify_url", () => {
      const line = generateBotLine({ hash: SAMPLE_HASH });
      expect(line).toContain("verify_url=https://www.trucore.xyz");
    });

    it("includes hash= in verify_url", () => {
      const line = generateBotLine({ hash: SAMPLE_HASH });
      expect(line).toContain("/verify?hash=");
    });

    it("includes from=share in verify_url", () => {
      const line = generateBotLine({ hash: SAMPLE_HASH });
      expect(line).toContain("&from=share");
    });
  });

  describe("generateDistributionBundle", () => {
    it("verifyUrl uses canonical domain", () => {
      const bundle = generateDistributionBundle(SAMPLE_HASH);
      expect(bundle.verifyUrl).toContain("https://www.trucore.xyz");
    });

    it("verifyUrl uses hash= parameter", () => {
      const bundle = generateDistributionBundle(SAMPLE_HASH);
      expect(bundle.verifyUrl).toContain("?hash=");
    });

    it("verifyUrl includes from=share", () => {
      const bundle = generateDistributionBundle(SAMPLE_HASH);
      expect(bundle.verifyUrl).toContain("&from=share");
    });

    it("ogPreviewUrl uses canonical domain", () => {
      const bundle = generateDistributionBundle(SAMPLE_HASH);
      expect(bundle.ogPreviewUrl).toContain("https://www.trucore.xyz");
    });

    it("ogPreviewUrl uses /api/og/receipt path", () => {
      const bundle = generateDistributionBundle(SAMPLE_HASH);
      expect(bundle.ogPreviewUrl).toContain("/api/og/receipt?hash=");
    });

    it("shareText contains canonical verify URL", () => {
      const bundle = generateDistributionBundle(SAMPLE_HASH);
      expect(bundle.shareText).toContain("https://www.trucore.xyz/verify");
    });

    it("botLine contains canonical verify URL", () => {
      const bundle = generateDistributionBundle(SAMPLE_HASH);
      expect(bundle.botLine).toContain("https://www.trucore.xyz/verify");
    });
  });
});

// ────────────────────────────────────────────────────────────────
// Anti-Drift Regression Tests
// ────────────────────────────────────────────────────────────────

describe("Anti-Drift Regression", () => {
  describe("trucore.ai must never appear in outbound URLs", () => {
    it("buildVerifyUrl does not use trucore.ai", () => {
      const url = buildVerifyUrl(SAMPLE_HASH);
      expect(url).not.toContain("trucore.ai");
    });

    it("buildOgPreviewUrl does not use trucore.ai", () => {
      const url = buildOgPreviewUrl(SAMPLE_HASH);
      expect(url).not.toContain("trucore.ai");
    });

    it("generateShareText does not use trucore.ai", () => {
      const text = generateShareText({ hash: SAMPLE_HASH });
      expect(text).not.toContain("trucore.ai");
    });

    it("generateBotLine does not use trucore.ai", () => {
      const line = generateBotLine({ hash: SAMPLE_HASH });
      expect(line).not.toContain("trucore.ai");
    });
  });

  describe("legacy query aliases must not appear in outbound URLs", () => {
    const allBuilders = [
      { name: "buildVerifyUrl", fn: () => buildVerifyUrl(SAMPLE_HASH) },
      { name: "buildOgPreviewUrl", fn: () => buildOgPreviewUrl(SAMPLE_HASH) },
      { name: "buildProofBundle.verifyUrl", fn: () => buildProofBundle(SAMPLE_HASH).verifyUrl },
      { name: "buildProofBundle.ogPreviewUrl", fn: () => buildProofBundle(SAMPLE_HASH).ogPreviewUrl },
      { name: "generateShareText", fn: () => generateShareText({ hash: SAMPLE_HASH }) },
      { name: "generateBotLine", fn: () => generateBotLine({ hash: SAMPLE_HASH }) },
    ];

    for (const { name, fn } of allBuilders) {
      it(`${name} does not use ?h= alias`, () => {
        const output = fn();
        expect(output).not.toMatch(/[?&]h=[^a]/);
      });

      it(`${name} does not use ?id= alias`, () => {
        const output = fn();
        expect(output).not.toMatch(/[?&]id=/);
      });

      it(`${name} does not use ?receipt_id= alias`, () => {
        const output = fn();
        expect(output).not.toMatch(/[?&]receipt_id=/);
      });
    }
  });

  describe("path consistency", () => {
    it("OG URL never uses /api/og? without /receipt", () => {
      const url = buildOgPreviewUrl(SAMPLE_HASH);
      expect(url).toMatch(/\/api\/og\/receipt\?/);
      expect(url).not.toMatch(/\/api\/og\?/);
    });
  });
});

// ────────────────────────────────────────────────────────────────
// Receipt ID vs Content Hash Contract
// ────────────────────────────────────────────────────────────────

describe("Receipt ID vs Content Hash Contract", () => {
  // UUID format (receipt_id) - should NOT be used in verify URLs
  const SAMPLE_RECEIPT_ID = "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d";
  // 64-char hex format (content_hash) - should be used in verify URLs
  const SAMPLE_CONTENT_HASH = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2";

  describe("content hash format is valid for verify URLs", () => {
    it("accepts 64-char hex content_hash", () => {
      const url = buildVerifyUrl(SAMPLE_CONTENT_HASH);
      expect(url).toContain(SAMPLE_CONTENT_HASH);
      expect(url).toContain("/verify?hash=");
    });

    it("64-char hex produces canonical verify URL structure", () => {
      const url = buildVerifyUrl(SAMPLE_CONTENT_HASH);
      expect(url).toMatch(/\/verify\?hash=[a-f0-9]{64}&from=share/);
    });
  });

  describe("receipt_id format recognition", () => {
    // These tests document the expected behavior - receipt_id should NOT be put in verify URLs
    // The fix ensures code calling buildVerifyUrl passes content_hash, not receipt_id
    
    it("UUID format differs from 64-char hex format", () => {
      // Receipt IDs are UUIDs (36 chars with hyphens)
      expect(SAMPLE_RECEIPT_ID).toHaveLength(36);
      expect(SAMPLE_RECEIPT_ID).toMatch(/^[a-f0-9-]{36}$/);
      
      // Content hashes are 64-char hex
      expect(SAMPLE_CONTENT_HASH).toHaveLength(64);
      expect(SAMPLE_CONTENT_HASH).toMatch(/^[a-f0-9]{64}$/);
    });

    it("UUID format is distinguishable by hyphen pattern", () => {
      expect(SAMPLE_RECEIPT_ID).toContain("-");
      expect(SAMPLE_CONTENT_HASH).not.toContain("-");
    });
  });

  describe("verify URL never uses receipt_id= parameter", () => {
    it("buildVerifyUrl never outputs receipt_id in query string", () => {
      const urlWithHash = buildVerifyUrl(SAMPLE_CONTENT_HASH);
      const urlWithUuid = buildVerifyUrl(SAMPLE_RECEIPT_ID);
      
      expect(urlWithHash).not.toContain("receipt_id=");
      expect(urlWithUuid).not.toContain("receipt_id=");
    });

    it("OG preview URL never uses receipt_id parameter", () => {
      const url = buildOgPreviewUrl(SAMPLE_CONTENT_HASH);
      expect(url).not.toContain("receipt_id=");
    });
  });

  describe("distribution utilities use content_hash format", () => {
    it("generateShareText includes content_hash in verify URL", () => {
      const text = generateShareText({ hash: SAMPLE_CONTENT_HASH });
      expect(text).toContain(SAMPLE_CONTENT_HASH);
      expect(text).toContain("/verify?hash=");
    });

    it("generateBotLine includes content_hash in verify URL", () => {
      const line = generateBotLine({ hash: SAMPLE_CONTENT_HASH });
      expect(line).toContain(SAMPLE_CONTENT_HASH);
      expect(line).toContain("hash=");
    });

    it("generateDistributionBundle uses content_hash throughout", () => {
      const bundle = generateDistributionBundle(SAMPLE_CONTENT_HASH);
      expect(bundle.verifyUrl).toContain(SAMPLE_CONTENT_HASH);
      expect(bundle.ogPreviewUrl).toContain(SAMPLE_CONTENT_HASH);
      expect(bundle.shareText).toContain(SAMPLE_CONTENT_HASH);
      expect(bundle.botLine).toContain(SAMPLE_CONTENT_HASH);
    });
  });

  describe("proof packet uses content_hash", () => {
    it("buildProofPacket includes content_hash in proof.hash field", () => {
      const packet = buildProofPacket(SAMPLE_CONTENT_HASH);
      expect(packet.proof.hash).toBe(SAMPLE_CONTENT_HASH);
    });

    it("buildProofPacket links.verify_url contains content_hash", () => {
      const packet = buildProofPacket(SAMPLE_CONTENT_HASH);
      expect(packet.links.verify_url).toContain(SAMPLE_CONTENT_HASH);
    });
  });
});

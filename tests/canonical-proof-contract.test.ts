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

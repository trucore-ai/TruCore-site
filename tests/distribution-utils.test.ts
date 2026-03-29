import { beforeEach, describe, expect, it, vi } from "vitest";

/* ────────────────────────────────────────────────────────────────
 *  Distribution Utils Tests
 *
 *  Verifies that the distribution utilities:
 *  - Generate correct share text format
 *  - Generate correct bot line format
 *  - Build complete distribution bundles
 *  - Handle edge cases gracefully
 *  - Produce deterministic outputs
 * ──────────────────────────────────────────────────────────────── */

import {
  generateShareText,
  generateBotLine,
  generateDistributionBundle,
  isValidDistributionHash,
  sanitizeDistributionHash,
} from "@/lib/distribution-utils";

// ── Mock Environment ─────────────────────────────────────────────

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://trucore.xyz");
});

// ── Sample Data ──────────────────────────────────────────────────

const SAMPLE_HASH = "0xdeadbeef12345678901234567890123456789012";
const SHORT_HASH = "abc123";
const WHITESPACE_HASH = "  0xhash123  ";

// ────────────────────────────────────────────────────────────────
// generateShareText Tests
// ────────────────────────────────────────────────────────────────

describe("generateShareText", () => {
  describe("basic functionality", () => {
    it("returns non-empty string for valid hash", () => {
      const text = generateShareText({ hash: SAMPLE_HASH });
      expect(text).toBeTruthy();
      expect(typeof text).toBe("string");
      expect(text.length).toBeGreaterThan(0);
    });

    it("includes verify URL", () => {
      const text = generateShareText({ hash: SAMPLE_HASH });
      expect(text).toContain("/verify?hash=");
      expect(text).toContain(encodeURIComponent(SAMPLE_HASH));
    });

    it("includes ATF branding", () => {
      const text = generateShareText({ hash: SAMPLE_HASH });
      expect(text).toContain("TruCore ATF");
    });

    it("includes hashtags", () => {
      const text = generateShareText({ hash: SAMPLE_HASH });
      expect(text).toContain("#AITrading");
      expect(text).toContain("#DeFi");
    });
  });

  describe("optional fields", () => {
    it("includes action when provided", () => {
      const text = generateShareText({ hash: SAMPLE_HASH, action: "swap" });
      expect(text).toContain("Action: swap");
    });

    it("includes status when provided", () => {
      const text = generateShareText({ hash: SAMPLE_HASH, status: "verified" });
      expect(text).toContain("Status: verified");
    });

    it("includes both action and status when provided", () => {
      const text = generateShareText({
        hash: SAMPLE_HASH,
        action: "swap",
        status: "verified",
      });
      expect(text).toContain("Action: swap");
      expect(text).toContain("Status: verified");
    });

    it("omits action line when action is empty", () => {
      const text = generateShareText({ hash: SAMPLE_HASH, action: "" });
      expect(text).not.toContain("Action:");
    });

    it("omits status line when status is empty", () => {
      const text = generateShareText({ hash: SAMPLE_HASH, status: "" });
      expect(text).not.toContain("Status:");
    });

    it("handles whitespace-only action", () => {
      const text = generateShareText({ hash: SAMPLE_HASH, action: "   " });
      expect(text).not.toContain("Action:");
    });

    it("handles whitespace-only status", () => {
      const text = generateShareText({ hash: SAMPLE_HASH, status: "   " });
      expect(text).not.toContain("Status:");
    });
  });

  describe("edge cases", () => {
    it("returns empty string for empty hash", () => {
      const text = generateShareText({ hash: "" });
      expect(text).toBe("");
    });

    it("returns empty string for whitespace-only hash", () => {
      const text = generateShareText({ hash: "   " });
      expect(text).toBe("");
    });

    it("trims whitespace from hash", () => {
      const text = generateShareText({ hash: WHITESPACE_HASH });
      expect(text).toContain("0xhash123");
      expect(text).not.toContain("  0xhash123  ");
    });

    it("handles short hashes", () => {
      const text = generateShareText({ hash: SHORT_HASH });
      expect(text).toContain(SHORT_HASH);
    });
  });

  describe("encoding safety", () => {
    it("produces Twitter-safe output with special characters", () => {
      const text = generateShareText({ hash: "hash&special=chars" });
      // Should not contain raw & or = in unsafe positions
      expect(text).not.toMatch(/[<>"]/);
    });

    it("URL-encodes hash in verify link", () => {
      const text = generateShareText({ hash: "hash with spaces" });
      expect(text).toContain("hash%20with%20spaces");
    });
  });

  describe("determinism", () => {
    it("produces identical output for same input", () => {
      const text1 = generateShareText({ hash: SAMPLE_HASH });
      const text2 = generateShareText({ hash: SAMPLE_HASH });
      expect(text1).toBe(text2);
    });

    it("produces identical output with optional fields", () => {
      const input = { hash: SAMPLE_HASH, action: "swap", status: "verified" };
      const text1 = generateShareText(input);
      const text2 = generateShareText(input);
      expect(text1).toBe(text2);
    });
  });
});

// ────────────────────────────────────────────────────────────────
// generateBotLine Tests
// ────────────────────────────────────────────────────────────────

describe("generateBotLine", () => {
  describe("format compliance", () => {
    it("starts with ATF_PROOF", () => {
      const line = generateBotLine({ hash: SAMPLE_HASH });
      expect(line.startsWith("ATF_PROOF")).toBe(true);
    });

    it("is a single line", () => {
      const line = generateBotLine({ hash: SAMPLE_HASH });
      expect(line.split("\n").length).toBe(1);
    });

    it("uses space as separator", () => {
      const line = generateBotLine({ hash: SAMPLE_HASH });
      const parts = line.split(" ");
      expect(parts.length).toBeGreaterThanOrEqual(3);
    });

    it("is not JSON", () => {
      const line = generateBotLine({ hash: SAMPLE_HASH });
      expect(() => JSON.parse(line)).toThrow();
    });
  });

  describe("field presence", () => {
    it("includes hash field", () => {
      const line = generateBotLine({ hash: SAMPLE_HASH });
      expect(line).toContain(`hash=${SAMPLE_HASH}`);
    });

    it("includes status field", () => {
      const line = generateBotLine({ hash: SAMPLE_HASH, status: "verified" });
      expect(line).toContain("status=verified");
    });

    it("includes verify_url field", () => {
      const line = generateBotLine({ hash: SAMPLE_HASH });
      expect(line).toContain("verify_url=https://trucore.xyz/verify");
    });

    it("defaults status to verified", () => {
      const line = generateBotLine({ hash: SAMPLE_HASH });
      expect(line).toContain("status=verified");
    });
  });

  describe("field order", () => {
    it("maintains deterministic field order", () => {
      const line1 = generateBotLine({ hash: SAMPLE_HASH });
      const line2 = generateBotLine({ hash: SAMPLE_HASH });

      const parts1 = line1.split(" ");
      const parts2 = line2.split(" ");

      expect(parts1).toEqual(parts2);
    });

    it("orders prefix, hash, status, verify_url", () => {
      const line = generateBotLine({ hash: SAMPLE_HASH, status: "verified" });
      const parts = line.split(" ");

      expect(parts[0]).toBe("ATF_PROOF");
      expect(parts[1]).toMatch(/^hash=/);
      expect(parts[2]).toMatch(/^status=/);
      expect(parts[3]).toMatch(/^verify_url=/);
    });
  });

  describe("edge cases", () => {
    it("returns empty string for empty hash", () => {
      const line = generateBotLine({ hash: "" });
      expect(line).toBe("");
    });

    it("returns empty string for whitespace-only hash", () => {
      const line = generateBotLine({ hash: "   " });
      expect(line).toBe("");
    });

    it("trims whitespace from hash", () => {
      const line = generateBotLine({ hash: WHITESPACE_HASH });
      expect(line).toContain("hash=0xhash123");
      expect(line).not.toContain("  0xhash123  ");
    });

    it("trims whitespace from status", () => {
      const line = generateBotLine({ hash: SAMPLE_HASH, status: "  pending  " });
      expect(line).toContain("status=pending");
      expect(line).not.toContain("  pending  ");
    });

    it("handles empty status gracefully", () => {
      const line = generateBotLine({ hash: SAMPLE_HASH, status: "" });
      expect(line).toContain("status=verified"); // defaults to verified
    });
  });
});

// ────────────────────────────────────────────────────────────────
// generateDistributionBundle Tests
// ────────────────────────────────────────────────────────────────

describe("generateDistributionBundle", () => {
  describe("bundle structure", () => {
    it("returns object with all required fields", () => {
      const bundle = generateDistributionBundle(SAMPLE_HASH);

      expect(bundle).toHaveProperty("shareText");
      expect(bundle).toHaveProperty("botLine");
      expect(bundle).toHaveProperty("verifyUrl");
      expect(bundle).toHaveProperty("ogPreviewUrl");
    });

    it("shareText is non-empty string for valid hash", () => {
      const bundle = generateDistributionBundle(SAMPLE_HASH);
      expect(typeof bundle.shareText).toBe("string");
      expect(bundle.shareText.length).toBeGreaterThan(0);
    });

    it("botLine is non-empty string for valid hash", () => {
      const bundle = generateDistributionBundle(SAMPLE_HASH);
      expect(typeof bundle.botLine).toBe("string");
      expect(bundle.botLine.length).toBeGreaterThan(0);
    });

    it("verifyUrl is valid URL", () => {
      const bundle = generateDistributionBundle(SAMPLE_HASH);
      expect(() => new URL(bundle.verifyUrl)).not.toThrow();
    });

    it("ogPreviewUrl is valid URL", () => {
      const bundle = generateDistributionBundle(SAMPLE_HASH);
      expect(() => new URL(bundle.ogPreviewUrl)).not.toThrow();
    });
  });

  describe("URL consistency", () => {
    it("verifyUrl contains hash", () => {
      const bundle = generateDistributionBundle(SAMPLE_HASH);
      expect(bundle.verifyUrl).toContain(encodeURIComponent(SAMPLE_HASH));
    });

    it("ogPreviewUrl contains hash", () => {
      const bundle = generateDistributionBundle(SAMPLE_HASH);
      expect(bundle.ogPreviewUrl).toContain(encodeURIComponent(SAMPLE_HASH));
    });

    it("shareText verify URL matches verifyUrl", () => {
      const bundle = generateDistributionBundle(SAMPLE_HASH);
      expect(bundle.shareText).toContain(bundle.verifyUrl.replace("&from=share", ""));
    });
  });

  describe("edge cases", () => {
    it("handles empty hash", () => {
      const bundle = generateDistributionBundle("");
      expect(bundle.shareText).toBe("");
      expect(bundle.botLine).toBe("");
    });

    it("handles whitespace-only hash", () => {
      const bundle = generateDistributionBundle("   ");
      expect(bundle.shareText).toBe("");
      expect(bundle.botLine).toBe("");
    });
  });
});

// ────────────────────────────────────────────────────────────────
// Validation Helpers Tests
// ────────────────────────────────────────────────────────────────

describe("isValidDistributionHash", () => {
  it("returns true for valid hash", () => {
    expect(isValidDistributionHash(SAMPLE_HASH)).toBe(true);
  });

  it("returns true for short hash", () => {
    expect(isValidDistributionHash(SHORT_HASH)).toBe(true);
  });

  it("returns true for hash with whitespace (after trim)", () => {
    expect(isValidDistributionHash(WHITESPACE_HASH)).toBe(true);
  });

  it("returns false for empty string", () => {
    expect(isValidDistributionHash("")).toBe(false);
  });

  it("returns false for whitespace-only string", () => {
    expect(isValidDistributionHash("   ")).toBe(false);
  });

  it("returns false for null", () => {
    expect(isValidDistributionHash(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isValidDistributionHash(undefined)).toBe(false);
  });
});

describe("sanitizeDistributionHash", () => {
  it("trims leading whitespace", () => {
    expect(sanitizeDistributionHash("  hash")).toBe("hash");
  });

  it("trims trailing whitespace", () => {
    expect(sanitizeDistributionHash("hash  ")).toBe("hash");
  });

  it("trims both leading and trailing whitespace", () => {
    expect(sanitizeDistributionHash("  hash  ")).toBe("hash");
  });

  it("returns empty string for empty input", () => {
    expect(sanitizeDistributionHash("")).toBe("");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(sanitizeDistributionHash("   ")).toBe("");
  });

  it("preserves hash content", () => {
    expect(sanitizeDistributionHash(SAMPLE_HASH)).toBe(SAMPLE_HASH);
  });
});

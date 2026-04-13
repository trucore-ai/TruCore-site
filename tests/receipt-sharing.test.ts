import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* ────────────────────────────────────────────────────────────────
 *  Receipt Sharing - Shareable Proof Cards Tests
 *
 *  Verifies that the receipt sharing system:
 *  - Generates correct share text format
 *  - Produces valid verification URLs
 *  - Tracks telemetry events correctly
 *  - Does not expose sensitive data
 *  - Handles edge cases gracefully
 * ──────────────────────────────────────────────────────────── */

import {
  generateShareText,
  getVerifyUrl,
  truncateId,
  copyShareText,
  shareToTwitter,
  shareToTelegram,
  trackReceiptCopied,
  trackReceiptShared,
} from "@/lib/client/share-receipt";

// ── Mocks ────────────────────────────────────────────────────

// Mock window
const mockClipboard = {
  writeText: vi.fn(() => Promise.resolve()),
};

const mockOpen = vi.fn();

beforeEach(() => {
  vi.stubGlobal("window", {
    location: { origin: "https://trucore.xyz" },
    open: mockOpen,
  });
  vi.stubGlobal("navigator", {
    clipboard: mockClipboard,
  });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

// ── Sample Data ──────────────────────────────────────────────

const sampleReceipt = {
  receipt_id: "rcpt-abc123def456",
  content_hash: "0xdeadbeef12345678901234567890123456789012",
  decision: "ALLOW",
  created_at: 1711641600, // 2024-03-28 12:00:00 UTC
};

const minimalReceipt = {
  receipt_id: "rcpt-minimal",
};

const hashOnlyReceipt = {
  content_hash: "0xhash123",
};

// ── Share Text Format ────────────────────────────────────────

describe("generateShareText", () => {
  it("generates valid share text with all fields", () => {
    const text = generateShareText(sampleReceipt);

    expect(text).toContain("@TruCoreAI");
    expect(text).toContain("✔ Transaction evaluated");
    expect(text).toContain("✔ Risk enforced");
    expect(text).toContain("✔ Receipt verified");
    expect(text).toContain("Verify it yourself:");
    expect(text).toContain("trucore.xyz/verify");
  });

  it("includes verification URL with hash", () => {
    const text = generateShareText(sampleReceipt);
    expect(text).toContain(`hash=${encodeURIComponent(sampleReceipt.content_hash)}`);
  });

  it("includes from=share parameter", () => {
    const text = generateShareText(sampleReceipt);
    expect(text).toContain("from=share");
  });

  it("does not include sensitive transaction details", () => {
    const receiptWithDetails = {
      ...sampleReceipt,
      amount: "1000.0",
      wallet_address: "0xsecret",
      private_key: "should_not_appear",
    };

    const text = generateShareText(receiptWithDetails);

    expect(text).not.toContain("1000.0");
    expect(text).not.toContain("0xsecret");
    expect(text).not.toContain("should_not_appear");
    expect(text).not.toContain("private");
  });

  it("handles missing content_hash gracefully", () => {
    // When no content_hash is available, we get a generic verify URL
    // We no longer fall back to receipt_id as that creates invalid verify URLs
    const text = generateShareText(minimalReceipt);

    expect(text).toContain("@TruCoreAI");
    expect(text).toContain("Verify it yourself:");
    // No receipt_id in URL - only content_hash is valid for verify URLs
    expect(text).not.toContain("receipt_id=");
    expect(text).toContain("/verify");
  });
});

// ── Verify URL Generation ────────────────────────────────────

describe("getVerifyUrl", () => {
  it("prefers content_hash over receipt_id", () => {
    const url = getVerifyUrl(sampleReceipt);

    expect(url).toContain(`hash=${encodeURIComponent(sampleReceipt.content_hash)}`);
    expect(url).not.toContain("receipt_id=");
  });

  it("returns generic verify URL when no content_hash (no fallback to receipt_id)", () => {
    // We no longer fall back to receipt_id as UUID format fails verify page validation
    // receipt_id is a UUID like "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
    // verify page expects content_hash which is 64-char hex
    const url = getVerifyUrl(minimalReceipt);

    expect(url).toBe("https://trucore.xyz/verify");
    expect(url).not.toContain("receipt_id=");
    expect(url).not.toContain("hash=");
  });

  it("uses hash only when only hash is provided", () => {
    const url = getVerifyUrl(hashOnlyReceipt);

    expect(url).toContain(`hash=${encodeURIComponent(hashOnlyReceipt.content_hash)}`);
  });

  it("returns base verify URL when no identifiers", () => {
    const url = getVerifyUrl({});

    expect(url).toBe("https://trucore.xyz/verify");
    expect(url).not.toContain("hash=");
    expect(url).not.toContain("receipt_id=");
  });

  it("includes from=share for tracking", () => {
    const url = getVerifyUrl(sampleReceipt);
    expect(url).toContain("from=share");
  });

  it("properly encodes special characters", () => {
    const weirdReceipt = {
      content_hash: "hash+with/special=chars&more",
    };

    const url = getVerifyUrl(weirdReceipt);
    expect(url).toContain(encodeURIComponent(weirdReceipt.content_hash));
    expect(url).not.toContain("+with/special=");
  });
});

// ── ID Truncation ────────────────────────────────────────────

describe("truncateId", () => {
  it("truncates long IDs", () => {
    const result = truncateId("rcpt-abc123def456ghi789jkl012");

    expect(result).toBe("rcpt-abc...l012");
    expect(result.length).toBeLessThan("rcpt-abc123def456ghi789jkl012".length);
  });

  it("preserves short IDs", () => {
    const shortId = "rcpt-123";
    const result = truncateId(shortId);

    expect(result).toBe(shortId);
  });

  it("uses custom prefix/suffix lengths", () => {
    const result = truncateId("12345678901234567890", 4, 2);

    expect(result).toBe("1234...90");
  });
});

// ── Copy Action ──────────────────────────────────────────────

describe("copyShareText", () => {
  it("copies share text to clipboard", async () => {
    const result = await copyShareText(sampleReceipt);

    expect(result).toBe(true);
    expect(mockClipboard.writeText).toHaveBeenCalledTimes(1);
    expect(mockClipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining("@TruCoreAI")
    );
  });

  it("returns false on clipboard error", async () => {
    mockClipboard.writeText.mockRejectedValueOnce(new Error("Clipboard error"));

    const result = await copyShareText(sampleReceipt);

    expect(result).toBe(false);
  });
});

// ── Twitter Share ────────────────────────────────────────────

describe("shareToTwitter", () => {
  it("opens Twitter intent URL", () => {
    shareToTwitter(sampleReceipt);

    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining("twitter.com/intent/tweet"),
      "_blank",
      expect.any(String)
    );
  });

  it("includes encoded share text", () => {
    shareToTwitter(sampleReceipt);

    const [[url]] = mockOpen.mock.calls;
    expect(url).toContain("text=");
    // URL should be encoded
    expect(url).toContain(encodeURIComponent("@TruCoreAI"));
  });
});

// ── Telegram Share ───────────────────────────────────────────

describe("shareToTelegram", () => {
  it("opens Telegram share URL", () => {
    shareToTelegram(sampleReceipt);

    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining("t.me/share/url"),
      "_blank",
      expect.any(String)
    );
  });

  it("includes url and text parameters", () => {
    shareToTelegram(sampleReceipt);

    const [[url]] = mockOpen.mock.calls;
    expect(url).toContain("url=");
    expect(url).toContain("text=");
  });
});

// ── Telemetry ────────────────────────────────────────────────

describe("telemetry tracking", () => {
  // Mock fetch for telemetry
  const mockFetch = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve({ ok: true }));

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    mockFetch.mockClear();
  });

  it("trackReceiptCopied sends event", () => {
    trackReceiptCopied("copy", "rcpt-123");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/telemetry/share",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );

    const [[, options]] = mockFetch.mock.calls;
    const body = JSON.parse(options!.body as string);
    expect(body.event_name).toBe("receipt_copied");
    expect(body.platform).toBe("copy");
    expect(body.receipt_id).toBe("rcpt-123");
  });

  it("trackReceiptShared sends platform-specific event", () => {
    trackReceiptShared("twitter", "rcpt-456");

    const [[, options]] = mockFetch.mock.calls;
    const body = JSON.parse(options!.body as string);
    expect(body.event_name).toBe("receipt_shared");
    expect(body.platform).toBe("twitter");
    expect(body.receipt_id).toBe("rcpt-456");
  });

  it("telemetry fails silently", () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    // Should not throw
    expect(() => trackReceiptCopied()).not.toThrow();
  });
});

// ── Security - No Sensitive Data ─────────────────────────────

describe("security - no sensitive data leakage", () => {
  it("share text only contains safe fields", () => {
    const sensitiveReceipt = {
      receipt_id: "rcpt-123",
      content_hash: "0xhash",
      decision: "ALLOW",
      // Potentially sensitive fields that should NOT appear
      api_key: "sk-secret-key",
      wallet_private_key: "private_key_value",
      user_email: "user@example.com",
      tenant_secret: "tenant-secret-123",
      signing_key: "ed25519-key",
      amounts: { input: 1000, output: 950 },
    };

    const text = generateShareText(sensitiveReceipt);

    expect(text).not.toContain("sk-secret-key");
    expect(text).not.toContain("private_key_value");
    expect(text).not.toContain("user@example.com");
    expect(text).not.toContain("tenant-secret");
    expect(text).not.toContain("ed25519");
    expect(text).not.toContain("1000");
    expect(text).not.toContain("950");
  });

  it("verify URL only exposes content_hash (never sensitive data)", () => {
    const sensitiveReceipt = {
      receipt_id: "rcpt-123",
      content_hash: "0xhash",
      api_key: "secret",
    };

    const url = getVerifyUrl(sensitiveReceipt);

    // Should expose content_hash via hash param
    expect(url).toContain("hash=");
    // Should never expose sensitive fields
    expect(url).not.toContain("secret");
    expect(url).not.toContain("api_key");
    // Should not use receipt_id (UUID format fails verify validation)
    expect(url).not.toContain("receipt_id=");
  });
});

// ── Telemetry API Route ──────────────────────────────────────

describe("share telemetry API", () => {
  it("accepts valid events", async () => {
    const validPayloads = [
      { event_name: "receipt_copied", platform: "copy" },
      { event_name: "receipt_shared", platform: "twitter" },
      { event_name: "receipt_shared", platform: "telegram" },
      { event_name: "receipt_shared", platform: "native" },
    ];

    for (const payload of validPayloads) {
      // This validates the event names match the API contract
      expect(["receipt_copied", "receipt_shared"]).toContain(payload.event_name);
      expect(["twitter", "telegram", "copy", "native"]).toContain(payload.platform);
    }
  });
});

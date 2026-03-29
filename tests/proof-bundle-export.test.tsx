import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  buildProofBundleData,
  downloadProofBundle,
  getProofBundleFilename,
  sanitizeReceiptForBundle,
  EXCLUDED_BUNDLE_FIELDS,
  PROOF_BUNDLE_VERSION,
  PROOF_BUNDLE_TYPE,
} from "@/lib/proof-bundle";
import { ProofBundleActions } from "@/components/proof-bundle-actions";

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

vi.mock("@/lib/track", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@/lib/track";

// Silence console.error for cleaner test output
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:mock-url"),
    revokeObjectURL: vi.fn(),
  });
  vi.stubGlobal("window", {
    open: vi.fn(),
  });
});

// ---------------------------------------------------------------------------
// lib/proof-bundle — buildProofBundleData
// ---------------------------------------------------------------------------

describe("buildProofBundleData — schema shape", () => {
  const hash = "deadbeef1234567890abcdef";

  it("returns correct version and type", () => {
    const data = buildProofBundleData(hash);
    expect(data.version).toBe(PROOF_BUNDLE_VERSION);
    expect(data.type).toBe(PROOF_BUNDLE_TYPE);
  });

  it("includes hash in proof.hash", () => {
    const data = buildProofBundleData(hash);
    expect(data.proof.hash).toBe(hash);
  });

  it("always sets source to trucore", () => {
    const data = buildProofBundleData(hash);
    expect(data.proof.source).toBe("trucore");
  });

  it("always includes exported_at as ISO string", () => {
    const before = Date.now();
    const data = buildProofBundleData(hash);
    const after = Date.now();
    const ts = new Date(data.proof.exported_at).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it("includes verify_url in links", () => {
    const data = buildProofBundleData(hash);
    expect(data.links.verify_url).toContain("/verify?hash=");
    expect(data.links.verify_url).toContain(hash);
  });

  it("includes og_preview_url in links", () => {
    const data = buildProofBundleData(hash);
    expect(data.links.og_preview_url).toContain("/api/og/receipt?hash=");
    expect(data.links.og_preview_url).toContain(hash);
  });

  it("trims whitespace from hash", () => {
    const data = buildProofBundleData("  deadbeef  ");
    expect(data.proof.hash).toBe("deadbeef");
  });
});

describe("buildProofBundleData — optional fields", () => {
  const hash = "abc1234567890";

  it("includes receipt_id when provided", () => {
    const data = buildProofBundleData(hash, { receiptId: "rcpt_abc" });
    expect(data.proof.receipt_id).toBe("rcpt_abc");
  });

  it("omits receipt_id when not provided", () => {
    const data = buildProofBundleData(hash);
    expect(data.proof.receipt_id).toBeUndefined();
  });

  it("omits receipt_id when empty string", () => {
    const data = buildProofBundleData(hash, { receiptId: "" });
    expect(data.proof.receipt_id).toBeUndefined();
  });

  it("includes decision uppercased when provided", () => {
    const data = buildProofBundleData(hash, { decision: "allow" });
    expect(data.proof.decision).toBe("ALLOW");
  });

  it("omits decision when not provided", () => {
    const data = buildProofBundleData(hash);
    expect(data.proof.decision).toBeUndefined();
  });

  it("includes verified=true when provided", () => {
    const data = buildProofBundleData(hash, { verified: true });
    expect(data.proof.verified).toBe(true);
  });

  it("includes verified=false when explicitly set to false", () => {
    const data = buildProofBundleData(hash, { verified: false });
    expect(data.proof.verified).toBe(false);
  });

  it("omits verified when not provided", () => {
    const data = buildProofBundleData(hash);
    expect(data.proof.verified).toBeUndefined();
  });

  it("includes created_at when timestamp provided", () => {
    const ts = "2026-01-15T10:00:00.000Z";
    const data = buildProofBundleData(hash, { timestamp: ts });
    expect(data.proof.created_at).toBe(ts);
  });

  it("omits created_at when timestamp not provided", () => {
    const data = buildProofBundleData(hash);
    expect(data.proof.created_at).toBeUndefined();
  });
});

describe("buildProofBundleData — safe field exclusion", () => {
  const hash = "abc123def456";

  it("does not include wallet_address", () => {
    const data = buildProofBundleData(hash, {});
    const json = JSON.stringify(data);
    expect(json).not.toContain("wallet_address");
  });

  it("does not include private_key", () => {
    const data = buildProofBundleData(hash);
    const json = JSON.stringify(data);
    expect(json).not.toContain("private_key");
  });

  it("does not include token or secret", () => {
    const data = buildProofBundleData(hash);
    const json = JSON.stringify(data);
    expect(json).not.toContain('"token"');
    expect(json).not.toContain('"secret"');
  });

  it("does not include amount", () => {
    const data = buildProofBundleData(hash);
    const json = JSON.stringify(data);
    expect(json).not.toContain('"amount"');
  });

  it("EXCLUDED_BUNDLE_FIELDS lists expected sensitive field names", () => {
    expect(EXCLUDED_BUNDLE_FIELDS).toContain("wallet_address");
    expect(EXCLUDED_BUNDLE_FIELDS).toContain("private_key");
    expect(EXCLUDED_BUNDLE_FIELDS).toContain("token");
    expect(EXCLUDED_BUNDLE_FIELDS).toContain("secret");
    expect(EXCLUDED_BUNDLE_FIELDS).toContain("amount");
  });
});

// ---------------------------------------------------------------------------
// lib/proof-bundle — getProofBundleFilename
// ---------------------------------------------------------------------------

describe("getProofBundleFilename", () => {
  it("returns trucore-proof-<prefix>.json", () => {
    expect(getProofBundleFilename("deadbeef1234567890")).toBe(
      "trucore-proof-deadbeef1234.json",
    );
  });

  it("uses first 12 alphanumeric characters of hash", () => {
    const name = getProofBundleFilename("abcdefghijklmnopqrst");
    expect(name).toBe("trucore-proof-abcdefghijkl.json");
  });

  it("strips non-alphanumeric characters from prefix", () => {
    // "abc/def+ghi=" is the first 12 chars of slice; non-alphanum removed = "abcdefghi"
    const name = getProofBundleFilename("abc/def+ghi=123456");
    expect(name).toBe("trucore-proof-abcdefghi.json");
  });

  it("falls back to 'bundle' when hash is empty after trim", () => {
    expect(getProofBundleFilename("")).toBe("trucore-proof-bundle.json");
  });

  it("falls back to 'bundle' when hash is only whitespace", () => {
    expect(getProofBundleFilename("   ")).toBe("trucore-proof-bundle.json");
  });

  it("handles short hashes correctly", () => {
    expect(getProofBundleFilename("abc123")).toBe(
      "trucore-proof-abc123.json",
    );
  });
});

// ---------------------------------------------------------------------------
// lib/proof-bundle — sanitizeReceiptForBundle
// ---------------------------------------------------------------------------

describe("sanitizeReceiptForBundle", () => {
  it("extracts receipt_id", () => {
    const opts = sanitizeReceiptForBundle({ receipt_id: "rcpt_abc" });
    expect(opts.receiptId).toBe("rcpt_abc");
  });

  it("extracts decision", () => {
    const opts = sanitizeReceiptForBundle({ decision: "ALLOW" });
    expect(opts.decision).toBe("ALLOW");
  });

  it("extracts verified boolean", () => {
    const opts = sanitizeReceiptForBundle({ verified: true });
    expect(opts.verified).toBe(true);
  });

  it("extracts created_at timestamp", () => {
    const ts = "2026-01-01T00:00:00.000Z";
    const opts = sanitizeReceiptForBundle({ created_at: ts });
    expect(opts.timestamp).toBe(ts);
  });

  it("falls back to timestamp field for created_at", () => {
    const ts = "2026-02-01T00:00:00.000Z";
    const opts = sanitizeReceiptForBundle({ timestamp: ts });
    expect(opts.timestamp).toBe(ts);
  });

  it("prefers created_at over timestamp", () => {
    const opts = sanitizeReceiptForBundle({
      created_at: "2026-01-01",
      timestamp: "2026-02-01",
    });
    expect(opts.timestamp).toBe("2026-01-01");
  });

  it("drops wallet_address", () => {
    const opts = sanitizeReceiptForBundle({
      wallet_address: "0xdeadbeef",
      receipt_id: "r1",
    });
    expect(JSON.stringify(opts)).not.toContain("wallet_address");
    expect(opts.receiptId).toBe("r1");
  });

  it("drops amount", () => {
    const opts = sanitizeReceiptForBundle({ amount: 1.5, receipt_id: "r2" });
    expect(JSON.stringify(opts)).not.toContain("1.5");
    expect(opts.receiptId).toBe("r2");
  });

  it("drops private_key and token", () => {
    const opts = sanitizeReceiptForBundle({
      private_key: "sk_abc",
      token: "tok_123",
    });
    expect(JSON.stringify(opts)).not.toContain("sk_abc");
    expect(JSON.stringify(opts)).not.toContain("tok_123");
  });

  it("returns undefined for missing optional fields", () => {
    const opts = sanitizeReceiptForBundle({});
    expect(opts.receiptId).toBeUndefined();
    expect(opts.decision).toBeUndefined();
    expect(opts.verified).toBeUndefined();
    expect(opts.timestamp).toBeUndefined();
  });

  it("returns undefined for wrong-type fields", () => {
    const opts = sanitizeReceiptForBundle({
      receipt_id: 42,
      decision: true,
      verified: "yes",
    });
    expect(opts.receiptId).toBeUndefined();
    expect(opts.decision).toBeUndefined();
    expect(opts.verified).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// lib/proof-bundle — downloadProofBundle
// ---------------------------------------------------------------------------

describe("downloadProofBundle", () => {
  it("creates a Blob element and triggers click", () => {
    const mockClick = vi.fn();
    const mockCreateElement = vi.spyOn(document, "createElement");
    mockCreateElement.mockReturnValueOnce({
      href: "",
      download: "",
      click: mockClick,
    } as unknown as HTMLAnchorElement);

    const data = buildProofBundleData("abc123");
    downloadProofBundle(data, "trucore-proof-abc123.json");

    expect(mockClick).toHaveBeenCalled();
    mockCreateElement.mockRestore();
  });

  it("does not throw when Blob is unavailable", () => {
    const origBlob = globalThis.Blob;
    // @ts-expect-error intentionally breaking Blob
    globalThis.Blob = undefined;
    const data = buildProofBundleData("abc123");
    expect(() => downloadProofBundle(data, "trucore-proof-abc123.json")).not.toThrow();
    globalThis.Blob = origBlob;
  });
});

// ---------------------------------------------------------------------------
// ProofBundleActions component
// ---------------------------------------------------------------------------

describe("ProofBundleActions — rendering", () => {
  const hash = "deadbeef1234567890abcdef";

  it("renders when hash is valid", () => {
    render(<ProofBundleActions hash={hash} />);
    expect(screen.getByTestId("proof-bundle-actions")).toBeInTheDocument();
  });

  it("renders Export JSON button", () => {
    render(<ProofBundleActions hash={hash} />);
    expect(screen.getByTestId("export-proof-bundle-btn")).toBeInTheDocument();
  });

  it("renders Open share card button", () => {
    render(<ProofBundleActions hash={hash} />);
    expect(screen.getByTestId("open-share-card-btn")).toBeInTheDocument();
  });

  it("renders nothing when hash is empty string", () => {
    const { container } = render(<ProofBundleActions hash="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when hash is only whitespace", () => {
    const { container } = render(<ProofBundleActions hash="   " />);
    expect(container.firstChild).toBeNull();
  });

  it("shows label text 'Export JSON'", () => {
    render(<ProofBundleActions hash={hash} />);
    expect(screen.getByText("Export JSON")).toBeInTheDocument();
  });

  it("shows label text 'Open share card'", () => {
    render(<ProofBundleActions hash={hash} />);
    expect(screen.getByText("Open share card")).toBeInTheDocument();
  });

  it("shows export bundle label in non-compact mode", () => {
    render(<ProofBundleActions hash={hash} compact={false} />);
    expect(screen.getByText(/export proof bundle/i)).toBeInTheDocument();
  });

  it("hides export bundle label in compact mode", () => {
    render(<ProofBundleActions hash={hash} compact />);
    expect(screen.queryByText(/export proof bundle/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// ProofBundleActions — Export JSON action
// ---------------------------------------------------------------------------

describe("ProofBundleActions — Export JSON action", () => {
  const hash = "deadbeef1234567890abcdef";

  it("fires proof_bundle_exported telemetry on click", () => {
    render(<ProofBundleActions hash={hash} surface="verify" />);
    fireEvent.click(screen.getByTestId("export-proof-bundle-btn"));
    expect(trackEvent).toHaveBeenCalledWith("proof_bundle_exported", {
      surface: "verify",
      has_verified_status: false,
      has_receipt_id: false,
    });
  });

  it("includes has_verified_status=true when verified prop passed", () => {
    render(
      <ProofBundleActions hash={hash} verified={true} surface="dashboard" />,
    );
    fireEvent.click(screen.getByTestId("export-proof-bundle-btn"));
    expect(trackEvent).toHaveBeenCalledWith("proof_bundle_exported", {
      surface: "dashboard",
      has_verified_status: true,
      has_receipt_id: false,
    });
  });

  it("includes has_receipt_id=true when receiptId prop passed", () => {
    render(
      <ProofBundleActions hash={hash} receiptId="rcpt_abc" surface="receipts" />,
    );
    fireEvent.click(screen.getByTestId("export-proof-bundle-btn"));
    expect(trackEvent).toHaveBeenCalledWith("proof_bundle_exported", {
      surface: "receipts",
      has_verified_status: false,
      has_receipt_id: true,
    });
  });

  it("does not throw when Blob is unavailable", () => {
    const origBlob = globalThis.Blob;
    // @ts-expect-error intentionally breaking Blob
    globalThis.Blob = undefined;
    render(<ProofBundleActions hash={hash} />);
    expect(() => {
      fireEvent.click(screen.getByTestId("export-proof-bundle-btn"));
    }).not.toThrow();
    globalThis.Blob = origBlob;
  });
});

// ---------------------------------------------------------------------------
// ProofBundleActions — Open share card action
// ---------------------------------------------------------------------------

describe("ProofBundleActions — Open share card action", () => {
  const hash = "deadbeef1234567890abcdef";

  it("fires proof_share_card_opened telemetry on click", () => {
    render(<ProofBundleActions hash={hash} surface="verify" />);
    fireEvent.click(screen.getByTestId("open-share-card-btn"));
    expect(trackEvent).toHaveBeenCalledWith("proof_share_card_opened", {
      surface: "verify",
      has_verified_status: false,
      has_receipt_id: false,
    });
  });

  it("opens canonical OG preview URL", () => {
    render(<ProofBundleActions hash={hash} surface="verify" />);
    fireEvent.click(screen.getByTestId("open-share-card-btn"));
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining("/api/og/receipt?hash="),
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("OG preview URL contains the hash", () => {
    render(<ProofBundleActions hash={hash} />);
    fireEvent.click(screen.getByTestId("open-share-card-btn"));
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining(hash),
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("fires telemetry with has_verified_status=true when verified passed", () => {
    render(<ProofBundleActions hash={hash} verified={false} surface="receipts" />);
    fireEvent.click(screen.getByTestId("open-share-card-btn"));
    expect(trackEvent).toHaveBeenCalledWith("proof_share_card_opened", {
      surface: "receipts",
      has_verified_status: true,
      has_receipt_id: false,
    });
  });

  it("does not throw when window.open is unavailable", () => {
    vi.stubGlobal("window", { open: undefined });
    render(<ProofBundleActions hash={hash} />);
    expect(() => {
      fireEvent.click(screen.getByTestId("open-share-card-btn"));
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// ProofBundleActions — telemetry surface defaults
// ---------------------------------------------------------------------------

describe("ProofBundleActions — telemetry surface defaults", () => {
  const hash = "abc123defabc";

  it("uses 'unknown' as default surface", () => {
    render(<ProofBundleActions hash={hash} />);
    fireEvent.click(screen.getByTestId("export-proof-bundle-btn"));
    expect(trackEvent).toHaveBeenCalledWith("proof_bundle_exported", {
      surface: "unknown",
      has_verified_status: false,
      has_receipt_id: false,
    });
  });
});

// ---------------------------------------------------------------------------
// Integration: bundle JSON shape and filename via lib functions
// ---------------------------------------------------------------------------

describe("ProofBundleActions — exported bundle shape", () => {
  const hash = "aabbccddeeff00112233445566778899";

  it("buildProofBundleData produces correct manifest with all options", () => {
    const data = buildProofBundleData(hash, {
      decision: "ALLOW",
      verified: true,
      receiptId: "rcpt_xyz",
      timestamp: "2026-01-01T00:00:00.000Z",
    });
    expect(data.version).toBe(1);
    expect(data.type).toBe("trucore_proof_bundle");
    expect(data.proof.hash).toBe(hash);
    expect(data.proof.decision).toBe("ALLOW");
    expect(data.proof.verified).toBe(true);
    expect(data.proof.receipt_id).toBe("rcpt_xyz");
    expect(data.proof.source).toBe("trucore");
    expect(data.links.verify_url).toContain(hash);
    expect(data.links.og_preview_url).toContain(hash);
    // Sensitive fields must not appear in serialised output
    const json = JSON.stringify(data);
    expect(json).not.toContain("wallet_address");
    expect(json).not.toContain("\"amount\"");
    expect(json).not.toContain("private_key");
    expect(json).not.toContain('"token"');
  });

  it("getProofBundleFilename produces correctly prefixed filename for hash", () => {
    const filename = getProofBundleFilename(hash);
    expect(filename).toMatch(/^trucore-proof-[a-z0-9]+\.json$/);
    expect(filename).toContain(hash.slice(0, 12));
  });
});

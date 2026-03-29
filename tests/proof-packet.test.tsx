import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, act } from "@testing-library/react";
import {
  buildProofPacket,
  downloadProofPacket,
  getProofPacketFilename,
  PROOF_PACKET_VERSION,
  PROOF_PACKET_TYPE,
} from "@/lib/proof-packet";
import { ProofPacketView } from "@/components/proof-packet-view";

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

vi.mock("@/lib/track", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@/lib/track";

const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("navigator", { clipboard: mockClipboard });
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:mock-url"),
    revokeObjectURL: vi.fn(),
  });
});

// ---------------------------------------------------------------------------
// lib/proof-packet — buildProofPacket schema
// ---------------------------------------------------------------------------

describe("buildProofPacket — schema shape", () => {
  const hash = "deadbeef1234567890abcdef";

  it("returns correct version and type", () => {
    const packet = buildProofPacket(hash);
    expect(packet.version).toBe(PROOF_PACKET_VERSION);
    expect(packet.type).toBe(PROOF_PACKET_TYPE);
  });

  it("always sets status to success", () => {
    const packet = buildProofPacket(hash);
    expect(packet.status).toBe("success");
  });

  it("includes hash in proof.hash", () => {
    const packet = buildProofPacket(hash);
    expect(packet.proof.hash).toBe(hash);
  });

  it("defaults decision to UNKNOWN when not provided", () => {
    const packet = buildProofPacket(hash);
    expect(packet.proof.decision).toBe("UNKNOWN");
  });

  it("defaults verified to false when not provided", () => {
    const packet = buildProofPacket(hash);
    expect(packet.proof.verified).toBe(false);
  });

  it("sets decision to ALLOW or DENY from opts", () => {
    expect(buildProofPacket(hash, { decision: "ALLOW" }).proof.decision).toBe("ALLOW");
    expect(buildProofPacket(hash, { decision: "DENY" }).proof.decision).toBe("DENY");
  });

  it("normalises decision to uppercase", () => {
    expect(buildProofPacket(hash, { decision: "allow" }).proof.decision).toBe("ALLOW");
    expect(buildProofPacket(hash, { decision: "deny" }).proof.decision).toBe("DENY");
  });

  it("maps unknown decision string to UNKNOWN", () => {
    const packet = buildProofPacket(hash, { decision: "PENDING" });
    expect(packet.proof.decision).toBe("UNKNOWN");
  });

  it("sets verified when provided", () => {
    expect(buildProofPacket(hash, { verified: true }).proof.verified).toBe(true);
    expect(buildProofPacket(hash, { verified: false }).proof.verified).toBe(false);
  });

  it("omits created_at when timestamp not provided", () => {
    const packet = buildProofPacket(hash);
    expect(packet.proof.created_at).toBeUndefined();
  });

  it("includes created_at when timestamp provided", () => {
    const ts = "2026-03-28T10:00:00.000Z";
    const packet = buildProofPacket(hash, { timestamp: ts });
    expect(packet.proof.created_at).toBe(ts);
  });

  it("includes links.verify_url", () => {
    const packet = buildProofPacket(hash);
    expect(packet.links.verify_url).toContain(hash);
  });

  it("includes links.og_preview_url", () => {
    const packet = buildProofPacket(hash);
    expect(packet.links.og_preview_url).toContain(hash);
  });

  it("sets meta.source to trucore-site", () => {
    const packet = buildProofPacket(hash);
    expect(packet.meta.source).toBe("trucore-site");
  });

  it("always includes meta.exported_at as ISO string", () => {
    const before = Date.now();
    const packet = buildProofPacket(hash);
    const after = Date.now();
    const exported = new Date(packet.meta.exported_at).getTime();
    expect(exported).toBeGreaterThanOrEqual(before);
    expect(exported).toBeLessThanOrEqual(after);
  });

  it("trims whitespace from hash", () => {
    const packet = buildProofPacket("  deadbeef  ");
    expect(packet.proof.hash).toBe("deadbeef");
  });
});

// ---------------------------------------------------------------------------
// lib/proof-packet — no sensitive fields exposed
// ---------------------------------------------------------------------------

describe("buildProofPacket — sensitive field exclusion", () => {
  const hash = "safehashonly";

  it("does not expose receipt_id in proof", () => {
    const packet = buildProofPacket(hash, { receiptId: "rcpt_999" });
    const json = JSON.stringify(packet);
    expect((packet.proof as Record<string, unknown>).receipt_id).toBeUndefined();
    // receipt_id should not appear anywhere in the output
    expect(json).not.toContain("rcpt_999");
  });

  it("does not expose wallet_address", () => {
    const packet = buildProofPacket(hash);
    const json = JSON.stringify(packet);
    expect(json).not.toContain("wallet_address");
  });

  it("does not expose private_key", () => {
    const packet = buildProofPacket(hash);
    const json = JSON.stringify(packet);
    expect(json).not.toContain("private_key");
  });

  it("does not expose amount", () => {
    const packet = buildProofPacket(hash);
    const json = JSON.stringify(packet);
    expect(json).not.toContain('"amount"');
  });
});

// ---------------------------------------------------------------------------
// lib/proof-packet — getProofPacketFilename
// ---------------------------------------------------------------------------

describe("getProofPacketFilename", () => {
  it("returns trucore-packet-<prefix>.json", () => {
    expect(getProofPacketFilename("abc123def456xyz")).toBe("trucore-packet-abc123def456.json");
  });

  it("strips non-alphanumeric characters", () => {
    expect(getProofPacketFilename("ab-cd_ef!gh")).toBe("trucore-packet-abcdefgh.json");
  });

  it("uses exactly 12 character prefix", () => {
    const name = getProofPacketFilename("abcdefghijklmnopqrstuvwxyz");
    expect(name).toBe("trucore-packet-abcdefghijkl.json");
  });

  it("falls back to packet when hash is empty", () => {
    expect(getProofPacketFilename("")).toBe("trucore-packet-packet.json");
  });

  it("falls back to packet when only non-alphanumeric", () => {
    expect(getProofPacketFilename("---")).toBe("trucore-packet-packet.json");
  });
});

// ---------------------------------------------------------------------------
// lib/proof-packet — downloadProofPacket
// ---------------------------------------------------------------------------

describe("downloadProofPacket", () => {
  let createElementSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    const mockClick = vi.fn();
    createElementSpy = vi.spyOn(document, "createElement").mockReturnValue({
      href: "",
      download: "",
      click: mockClick,
    } as unknown as HTMLAnchorElement);
  });

  afterEach(() => {
    createElementSpy.mockRestore();
  });

  it("creates a Blob and triggers a click for download", () => {
    const packet = buildProofPacket("testhash");
    downloadProofPacket(packet, "test.json");
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("does not throw when Blob is unavailable", () => {
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => { throw new Error("no blob"); }),
      revokeObjectURL: vi.fn(),
    });
    expect(() =>
      downloadProofPacket(buildProofPacket("hash123"), "test.json")
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// ProofPacketView — rendering
// ---------------------------------------------------------------------------

describe("ProofPacketView — rendering", () => {
  it("renders nothing when hash is empty", () => {
    const { container } = render(<ProofPacketView hash="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when hash is whitespace only", () => {
    const { container } = render(<ProofPacketView hash="   " />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the component when hash is valid", () => {
    render(<ProofPacketView hash="abc123" />);
    expect(screen.getByTestId("proof-packet-view")).toBeTruthy();
  });

  it("shows the toggle button with correct label", () => {
    render(<ProofPacketView hash="abc123" />);
    expect(screen.getByTestId("proof-packet-toggle")).toBeTruthy();
    expect(screen.getByText(/machine-readable proof/i)).toBeTruthy();
  });

  it("is expanded by default (non-compact)", () => {
    render(<ProofPacketView hash="abc123" />);
    expect(screen.getByTestId("proof-packet-json")).toBeTruthy();
    expect(screen.getByTestId("proof-packet-copy-btn")).toBeTruthy();
    expect(screen.getByTestId("proof-packet-download-btn")).toBeTruthy();
  });

  it("is collapsed by default in compact mode", () => {
    render(<ProofPacketView hash="abc123" compact />);
    expect(screen.queryByTestId("proof-packet-json")).toBeNull();
    expect(screen.queryByTestId("proof-packet-copy-btn")).toBeNull();
  });

  it("expands when toggle is clicked in compact mode", () => {
    render(<ProofPacketView hash="abc123" compact />);
    fireEvent.click(screen.getByTestId("proof-packet-toggle"));
    expect(screen.getByTestId("proof-packet-json")).toBeTruthy();
  });

  it("collapses when toggle is clicked in expanded state", () => {
    render(<ProofPacketView hash="abc123" />);
    fireEvent.click(screen.getByTestId("proof-packet-toggle"));
    expect(screen.queryByTestId("proof-packet-json")).toBeNull();
  });

  it("renders valid JSON in the pre block", () => {
    render(<ProofPacketView hash="abc123" decision="ALLOW" verified />);
    const pre = screen.getByTestId("proof-packet-json");
    const parsed = JSON.parse(pre.textContent ?? "");
    expect(parsed.type).toBe(PROOF_PACKET_TYPE);
    expect(parsed.proof.hash).toBe("abc123");
    expect(parsed.proof.decision).toBe("ALLOW");
    expect(parsed.proof.verified).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ProofPacketView — copy button
// ---------------------------------------------------------------------------

describe("ProofPacketView — copy", () => {
  it("fires proof_packet_copied telemetry on click", async () => {
    render(<ProofPacketView hash="abc123" surface="test-surface" />);
    await act(async () => {
      fireEvent.click(screen.getByTestId("proof-packet-copy-btn"));
    });
    expect(trackEvent).toHaveBeenCalledWith("proof_packet_copied", {
      surface: "test-surface",
      has_verified_status: false,
    });
  });

  it("passes has_verified_status=true when verified provided", async () => {
    render(<ProofPacketView hash="abc123" verified={true} surface="v" />);
    await act(async () => {
      fireEvent.click(screen.getByTestId("proof-packet-copy-btn"));
    });
    expect(trackEvent).toHaveBeenCalledWith("proof_packet_copied", expect.objectContaining({
      has_verified_status: true, // true != null
    }));
  });

  it("shows Copied! after copy", async () => {
    render(<ProofPacketView hash="abc123" />);
    await act(async () => {
      fireEvent.click(screen.getByTestId("proof-packet-copy-btn"));
    });
    await waitFor(() => {
      expect(screen.getByTestId("proof-packet-copy-btn").textContent).toBe("Copied!");
    });
  });

  it("does not throw when clipboard unavailable", async () => {
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error("no clipboard")),
      },
    });
    render(<ProofPacketView hash="abc123" />);
    await act(async () => {
      fireEvent.click(screen.getByTestId("proof-packet-copy-btn"));
    });
    // No throw — component handles clipboard failure silently
  });
});

// ---------------------------------------------------------------------------
// ProofPacketView — download button
// ---------------------------------------------------------------------------

describe("ProofPacketView — download", () => {
  it("fires proof_packet_downloaded telemetry on click", () => {
    render(<ProofPacketView hash="abc123" surface="test-dl" />);
    fireEvent.click(screen.getByTestId("proof-packet-download-btn"));
    expect(trackEvent).toHaveBeenCalledWith("proof_packet_downloaded", {
      surface: "test-dl",
      has_verified_status: false,
    });
  });

  it("passes has_verified_status=true when verified provided", () => {
    render(<ProofPacketView hash="abc123" verified={false} surface="v" />);
    fireEvent.click(screen.getByTestId("proof-packet-download-btn"));
    expect(trackEvent).toHaveBeenCalledWith("proof_packet_downloaded", expect.objectContaining({
      has_verified_status: true, // false != null, so has_verified_status=true
    }));
  });

  it("triggers Blob download on click", () => {
    render(<ProofPacketView hash="abc123" />);
    fireEvent.click(screen.getByTestId("proof-packet-download-btn"));
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it("defaults surface to unknown", () => {
    render(<ProofPacketView hash="abc123" />);
    fireEvent.click(screen.getByTestId("proof-packet-download-btn"));
    expect(trackEvent).toHaveBeenCalledWith("proof_packet_downloaded", expect.objectContaining({
      surface: "unknown",
    }));
  });
});

// ---------------------------------------------------------------------------
// Integration: buildProofPacket reuses bundle logic
// ---------------------------------------------------------------------------

describe("buildProofPacket — integration with bundle logic", () => {
  it("supports object input signature", () => {
    const packet = buildProofPacket({
      hash: "objhash123",
      decision: "allow",
      verified: true,
      created_at: "2026-03-28T10:00:00.000Z",
    });
    expect(packet.proof.hash).toBe("objhash123");
    expect(packet.proof.decision).toBe("ALLOW");
    expect(packet.proof.verified).toBe(true);
    expect(packet.proof.created_at).toBe("2026-03-28T10:00:00.000Z");
  });

  it("reuses receipt sanitization path for object.receipt", () => {
    const packet = buildProofPacket({
      hash: "receipt-path-hash",
      receipt: {
        receipt_id: "rcpt_777",
        decision: "DENY",
        verified: false,
        created_at: "2026-03-28T12:00:00.000Z",
        wallet_address: "0xabc",
      },
    });

    expect(packet.proof.decision).toBe("DENY");
    expect(packet.proof.verified).toBe(false);
    expect(packet.proof.created_at).toBe("2026-03-28T12:00:00.000Z");
    expect(JSON.stringify(packet)).not.toContain("wallet_address");
    expect(JSON.stringify(packet)).not.toContain("0xabc");
  });

  it("produces same hash as input bundle would use", () => {
    const hash = "  integrationhash  ";
    const packet = buildProofPacket(hash);
    expect(packet.proof.hash).toBe("integrationhash");
  });

  it("produces same verify_url as bundle for same hash", () => {
    const hash = "testhash789";
    const packet = buildProofPacket(hash);
    expect(packet.links.verify_url).toContain(encodeURIComponent(hash));
  });

  it("packet type differs from bundle type", () => {
    expect(PROOF_PACKET_TYPE).toBe("trucore_proof_packet");
    expect(PROOF_PACKET_TYPE).not.toBe("trucore_proof_bundle");
  });

  it("meta.source is trucore-site (not trucore)", () => {
    const packet = buildProofPacket("hash");
    expect(packet.meta.source).toBe("trucore-site");
  });

  it("packet has no receipt_id at top level", () => {
    const packet = buildProofPacket("hash", { receiptId: "rcpt_abc" });
    expect(JSON.stringify(packet)).not.toContain("receipt_id");
  });
});

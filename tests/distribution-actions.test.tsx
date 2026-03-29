import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor, act } from "@testing-library/react";
import { DistributionActions } from "@/components/distribution-actions";

/* ────────────────────────────────────────────────────────────────
 *  Distribution Actions Component Tests
 *
 *  Verifies that DistributionActions:
 *  - Renders only when hash is present
 *  - Copy share text → clipboard
 *  - Copy bot line → clipboard
 *  - Telemetry fires correctly
 *  - No crash on clipboard failure
 * ──────────────────────────────────────────────────────────────── */

// ── Mock Dependencies ───────────────────────────────────────────

vi.mock("@/lib/track", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@/lib/track";

// Mock clipboard
const mockWriteText = vi.fn(() => Promise.resolve());

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://trucore.xyz");

  // Use vi.stubGlobal for navigator
  vi.stubGlobal("navigator", {
    clipboard: {
      writeText: mockWriteText,
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ── Sample Data ──────────────────────────────────────────────────

const VALID_HASH = "0xdeadbeef12345678901234567890123456789012";

// ────────────────────────────────────────────────────────────────
// Rendering Tests
// ────────────────────────────────────────────────────────────────

describe("DistributionActions — rendering", () => {
  it("renders when hash is provided", () => {
    render(<DistributionActions hash={VALID_HASH} />);
    expect(screen.getByTestId("distribution-actions")).toBeInTheDocument();
  });

  it("renders Copy Share Text button", () => {
    render(<DistributionActions hash={VALID_HASH} />);
    expect(screen.getByTestId("copy-share-text-btn")).toBeInTheDocument();
    expect(screen.getByTestId("copy-share-text-btn")).toHaveTextContent("Copy Share Text");
  });

  it("renders Copy Bot Line button", () => {
    render(<DistributionActions hash={VALID_HASH} />);
    expect(screen.getByTestId("copy-bot-line-btn")).toBeInTheDocument();
    expect(screen.getByTestId("copy-bot-line-btn")).toHaveTextContent("Copy Bot Line");
  });

  it("renders section title when not compact", () => {
    render(<DistributionActions hash={VALID_HASH} compact={false} />);
    expect(screen.getByText(/share \/ distribute/i)).toBeInTheDocument();
  });

  it("does not render section title when compact", () => {
    render(<DistributionActions hash={VALID_HASH} compact={true} />);
    expect(screen.queryByText(/share \/ distribute/i)).not.toBeInTheDocument();
  });
});

describe("DistributionActions — conditional rendering", () => {
  it("renders nothing when hash is empty string", () => {
    const { container } = render(<DistributionActions hash="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when hash is whitespace only", () => {
    const { container } = render(<DistributionActions hash="   " />);
    expect(container.firstChild).toBeNull();
  });

  it("renders when hash has leading/trailing whitespace", () => {
    render(<DistributionActions hash={`  ${VALID_HASH}  `} />);
    expect(screen.getByTestId("distribution-actions")).toBeInTheDocument();
  });
});

// ────────────────────────────────────────────────────────────────
// Copy Share Text Tests
// ────────────────────────────────────────────────────────────────

describe("DistributionActions — Copy Share Text", () => {
  it("copies share text to clipboard on click", async () => {
    render(<DistributionActions hash={VALID_HASH} />);

    fireEvent.click(screen.getByTestId("copy-share-text-btn"));

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledTimes(1);
    });

    const copiedText = mockWriteText.mock.calls[0][0];
    expect(copiedText).toContain("Protected trade verified via TruCore ATF");
    expect(copiedText).toContain(VALID_HASH);
  });

  it("shows Copied! state after successful copy", async () => {
    render(<DistributionActions hash={VALID_HASH} />);

    fireEvent.click(screen.getByTestId("copy-share-text-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("copy-share-text-btn")).toHaveTextContent("Copied!");
    });
  });

  it("reverts to original text after delay", async () => {
    vi.useFakeTimers();
    render(<DistributionActions hash={VALID_HASH} />);

    await act(async () => {
      fireEvent.click(screen.getByTestId("copy-share-text-btn"));
    });

    expect(screen.getByTestId("copy-share-text-btn")).toHaveTextContent("Copied!");

    await act(async () => {
      vi.advanceTimersByTime(1600);
    });

    expect(screen.getByTestId("copy-share-text-btn")).toHaveTextContent("Copy Share Text");

    vi.useRealTimers();
  });

  it("fires telemetry event on copy", async () => {
    render(<DistributionActions hash={VALID_HASH} surface="verify" />);

    await act(async () => {
      fireEvent.click(screen.getByTestId("copy-share-text-btn"));
    });

    expect(trackEvent).toHaveBeenCalledWith("distribution_share_text_copied", {
      surface: "verify",
      hash_length: VALID_HASH.length,
    });
  });
});

// ────────────────────────────────────────────────────────────────
// Copy Bot Line Tests
// ────────────────────────────────────────────────────────────────

describe("DistributionActions — Copy Bot Line", () => {
  it("copies bot line to clipboard on click", async () => {
    render(<DistributionActions hash={VALID_HASH} />);

    await act(async () => {
      fireEvent.click(screen.getByTestId("copy-bot-line-btn"));
    });

    expect(mockWriteText).toHaveBeenCalledTimes(1);

    const copiedText = mockWriteText.mock.calls[0][0];
    expect(copiedText).toContain("ATF_PROOF");
    expect(copiedText).toContain(`hash=${VALID_HASH}`);
    expect(copiedText).toContain("status=verified");
    expect(copiedText).toContain("verify_url=");
  });

  it("shows Copied! state after successful copy", async () => {
    render(<DistributionActions hash={VALID_HASH} />);

    await act(async () => {
      fireEvent.click(screen.getByTestId("copy-bot-line-btn"));
    });

    expect(screen.getByTestId("copy-bot-line-btn")).toHaveTextContent("Copied!");
  });

  it("fires telemetry event on copy", async () => {
    render(<DistributionActions hash={VALID_HASH} surface="dashboard" />);

    await act(async () => {
      fireEvent.click(screen.getByTestId("copy-bot-line-btn"));
    });

    expect(trackEvent).toHaveBeenCalledWith("distribution_bot_line_copied", {
      surface: "dashboard",
      hash_length: VALID_HASH.length,
    });
  });
});

// ────────────────────────────────────────────────────────────────
// Clipboard Failure Handling
// ────────────────────────────────────────────────────────────────

describe("DistributionActions — clipboard failure handling", () => {
  it("does not crash when clipboard.writeText fails for share text", async () => {
    mockWriteText.mockRejectedValueOnce(new Error("Clipboard error"));

    render(<DistributionActions hash={VALID_HASH} />);

    // Should not throw
    await act(async () => {
      fireEvent.click(screen.getByTestId("copy-share-text-btn"));
    });

    // Component should still be rendered
    expect(screen.getByTestId("distribution-actions")).toBeInTheDocument();
  });

  it("does not crash when clipboard.writeText fails for bot line", async () => {
    mockWriteText.mockRejectedValueOnce(new Error("Clipboard error"));

    render(<DistributionActions hash={VALID_HASH} />);

    // Should not throw
    await act(async () => {
      fireEvent.click(screen.getByTestId("copy-bot-line-btn"));
    });

    // Component should still be rendered
    expect(screen.getByTestId("distribution-actions")).toBeInTheDocument();
  });

  it("still fires telemetry even when clipboard fails", async () => {
    mockWriteText.mockRejectedValueOnce(new Error("Clipboard error"));

    render(<DistributionActions hash={VALID_HASH} surface="receipts" />);

    await act(async () => {
      fireEvent.click(screen.getByTestId("copy-share-text-btn"));
    });

    expect(trackEvent).toHaveBeenCalledWith("distribution_share_text_copied", {
      surface: "receipts",
      hash_length: VALID_HASH.length,
    });
  });
});

// ────────────────────────────────────────────────────────────────
// Surface Prop Tests
// ────────────────────────────────────────────────────────────────

describe("DistributionActions — surface prop", () => {
  it("defaults surface to unknown", async () => {
    render(<DistributionActions hash={VALID_HASH} />);

    await act(async () => {
      fireEvent.click(screen.getByTestId("copy-share-text-btn"));
    });

    expect(trackEvent).toHaveBeenCalledWith(
      "distribution_share_text_copied",
      expect.objectContaining({ surface: "unknown" })
    );
  });

  it("passes custom surface to telemetry", async () => {
    render(<DistributionActions hash={VALID_HASH} surface="custom-surface" />);

    await act(async () => {
      fireEvent.click(screen.getByTestId("copy-bot-line-btn"));
    });

    expect(trackEvent).toHaveBeenCalledWith(
      "distribution_bot_line_copied",
      expect.objectContaining({ surface: "custom-surface" })
    );
  });
});

// ────────────────────────────────────────────────────────────────
// Style Variants
// ────────────────────────────────────────────────────────────────

describe("DistributionActions — compact mode", () => {
  it("applies compact button styles when compact=true", () => {
    render(<DistributionActions hash={VALID_HASH} compact={true} />);
    const btn = screen.getByTestId("copy-share-text-btn");
    expect(btn.className).toContain("text-[10px]");
  });

  it("applies regular button styles when compact=false", () => {
    render(<DistributionActions hash={VALID_HASH} compact={false} />);
    const btn = screen.getByTestId("copy-share-text-btn");
    expect(btn.className).toContain("text-xs");
  });
});

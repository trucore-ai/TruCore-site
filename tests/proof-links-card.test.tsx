import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ProofLinksCard } from "@/components/proof-links-card";
import { buildOgPreviewUrl, buildVerifyUrl } from "@/lib/share-utils";

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

vi.mock("@/lib/track", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@/lib/track";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("navigator", {
    clipboard: {
      writeText: vi.fn(() => Promise.resolve()),
    },
  });
});

// ---------------------------------------------------------------------------
// share-utils: canonical URL helpers
// ---------------------------------------------------------------------------

describe("share-utils canonical URLs", () => {
  it("buildVerifyUrl returns canonical verify URL", () => {
    expect(buildVerifyUrl("abc123")).toBe(
      "https://trucore.xyz/verify?hash=abc123&from=share",
    );
  });

  it("buildOgPreviewUrl returns canonical OG preview URL", () => {
    expect(buildOgPreviewUrl("abc123")).toBe(
      "https://trucore.xyz/api/og/receipt?hash=abc123",
    );
  });

  it("buildVerifyUrl encodes special characters in hash", () => {
    const url = buildVerifyUrl("abc/def?123");
    expect(url).toBe(
      "https://trucore.xyz/verify?hash=abc%2Fdef%3F123&from=share",
    );
  });

  it("buildOgPreviewUrl encodes special characters in hash", () => {
    const url = buildOgPreviewUrl("abc/def?123");
    expect(url).toBe(
      "https://trucore.xyz/api/og/receipt?hash=abc%2Fdef%3F123",
    );
  });

  it("buildVerifyUrl trims whitespace from hash", () => {
    expect(buildVerifyUrl("  abc123  ")).toBe(
      "https://trucore.xyz/verify?hash=abc123&from=share",
    );
  });
});

// ---------------------------------------------------------------------------
// ProofLinksCard rendering
// ---------------------------------------------------------------------------

describe("ProofLinksCard", () => {
  const hash = "deadbeef1234567890abcdef";

  it("renders verify URL correctly", () => {
    render(<ProofLinksCard hash={hash} />);
    const code = screen.getByTestId("proof-verify-url");
    expect(code.textContent).toBe(buildVerifyUrl(hash));
  });

  it("renders OG preview URL correctly", () => {
    render(<ProofLinksCard hash={hash} />);
    const code = screen.getByTestId("proof-og-url");
    expect(code.textContent).toBe(buildOgPreviewUrl(hash));
  });

  it("renders nothing when hash is empty string", () => {
    const { container } = render(<ProofLinksCard hash="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when hash is only whitespace", () => {
    const { container } = render(<ProofLinksCard hash="   " />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the card when hash is provided", () => {
    render(<ProofLinksCard hash={hash} />);
    expect(screen.getByTestId("proof-links-card")).toBeInTheDocument();
  });

  it("shows default title 'Proof links'", () => {
    render(<ProofLinksCard hash={hash} />);
    expect(screen.getByText("Proof links")).toBeInTheDocument();
  });

  it("shows custom title when provided", () => {
    render(<ProofLinksCard hash={hash} title="Distribution URLs" />);
    expect(screen.getByText("Distribution URLs")).toBeInTheDocument();
  });

  it("copy verify URL button writes correct URL to clipboard", async () => {
    render(<ProofLinksCard hash={hash} />);
    fireEvent.click(screen.getByTestId("copy-verify-url-button"));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        buildVerifyUrl(hash),
      );
    });
  });

  it("copy OG URL button writes correct URL to clipboard", async () => {
    render(<ProofLinksCard hash={hash} />);
    fireEvent.click(screen.getByTestId("copy-og-url-button"));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        buildOgPreviewUrl(hash),
      );
    });
  });

  it("copy verify URL fires telemetry event", async () => {
    render(<ProofLinksCard hash={hash} />);
    fireEvent.click(screen.getByTestId("copy-verify-url-button"));
    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledWith("proof_verify_url_copied", {
        surface: "proof_links_card",
      });
    });
  });

  it("copy OG URL fires telemetry event", async () => {
    render(<ProofLinksCard hash={hash} />);
    fireEvent.click(screen.getByTestId("copy-og-url-button"));
    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledWith("proof_og_url_copied", {
        surface: "proof_links_card",
      });
    });
  });

  it("button shows 'Copied' feedback after clicking copy verify URL", async () => {
    render(<ProofLinksCard hash={hash} />);
    const btn = screen.getByTestId("copy-verify-url-button");
    expect(btn.textContent).toBe("Copy");
    fireEvent.click(btn);
    await waitFor(() => expect(btn.textContent).toBe("Copied"));
  });

  it("does not throw when clipboard is unavailable", () => {
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: vi.fn(() => Promise.reject(new Error("denied"))),
      },
    });
    render(<ProofLinksCard hash={hash} />);
    // Should not throw synchronously
    expect(() => {
      fireEvent.click(screen.getByTestId("copy-verify-url-button"));
    }).not.toThrow();
    expect(screen.getByTestId("proof-links-card")).toBeInTheDocument();
  });

  it("URLs are canonical and encoded correctly for hash with special chars", () => {
    const specialHash = "abc/def+ghi=jkl";
    render(<ProofLinksCard hash={specialHash} />);
    const verifyCode = screen.getByTestId("proof-verify-url");
    const ogCode = screen.getByTestId("proof-og-url");
    expect(verifyCode.textContent).toBe(buildVerifyUrl(specialHash));
    expect(ogCode.textContent).toBe(buildOgPreviewUrl(specialHash));
    // Ensure they are properly encoded
    expect(verifyCode.textContent).not.toContain("/def+ghi=jkl");
    expect(ogCode.textContent).not.toContain("/def+ghi=jkl");
  });
});

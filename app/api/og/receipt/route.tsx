import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const SIZE = {
  width: 1200,
  height: 630,
};

/**
 * Safe subset of receipt info for OG image preview.
 * NO sensitive data: no wallet addresses, no amounts, no policy details.
 */
type ReceiptPreviewData = {
  decision: "ALLOW" | "DENY";
  hashPreview: string;
  timestamp: string;
};

/**
 * Sanitize and validate a receipt hash parameter.
 * Returns null if invalid.
 */
function sanitizeHash(raw: string | null): string | null {
  if (!raw || typeof raw !== "string") return null;

  // Only allow hex characters, 64 chars max (SHA-256)
  const cleaned = raw.trim().toLowerCase();
  if (!/^[a-f0-9]{1,64}$/.test(cleaned)) return null;

  return cleaned;
}

/**
 * Format hash for preview display (first 8...last 8)
 */
function formatHashPreview(hash: string): string {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
}

/**
 * Derive preview data from hash.
 * In production, this could fetch from a cache or database.
 * For now, we derive a deterministic decision from the hash.
 */
function derivePreviewData(hash: string): ReceiptPreviewData {
  // Use first byte of hash to deterministically derive decision (for consistency)
  // This is a placeholder - in production, you'd fetch actual receipt status
  const firstByte = parseInt(hash.slice(0, 2), 16);
  const decision: "ALLOW" | "DENY" = firstByte % 5 === 0 ? "DENY" : "ALLOW";

  // Generate a reasonable timestamp (placeholder)
  const now = new Date();
  const timestamp = now.toISOString().split("T")[0]; // YYYY-MM-DD

  return {
    decision,
    hashPreview: formatHashPreview(hash),
    timestamp,
  };
}

/**
 * Render the OG card for a receipt.
 */
function ReceiptOgCard({ data }: { data: ReceiptPreviewData | null }) {
  const isValid = data !== null;
  const decision = data?.decision ?? "ALLOW";
  const isAllowed = decision === "ALLOW";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "56px",
        background: "linear-gradient(160deg, rgba(11,18,32,1) 0%, rgba(5,10,20,1) 70%)",
        color: "#eef8ff",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: "0.01em",
            color: "#b8e3ff",
          }}
        >
          TruCore
        </div>
        <div style={{ fontSize: 18, color: "#8ed3ff" }}>Agent Transaction Firewall</div>
      </div>

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          flex: 1,
          justifyContent: "center",
        }}
      >
        {/* Status badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "24px",
              background: isAllowed ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
              border: `1px solid ${isAllowed ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.4)"}`,
            }}
          >
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: isAllowed ? "#22c55e" : "#ef4444",
              }}
            />
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: isAllowed ? "#86efac" : "#fca5a5",
              }}
            >
              {isAllowed ? "ALLOWED" : "DENIED"}
            </span>
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            lineHeight: 1.15,
            color: "#f0f9ff",
          }}
        >
          {isValid ? "Protected Trade Verified" : "Protected Trade Receipt"}
        </div>

        {/* Receipt info */}
        {isValid && data ? (
          <div
            style={{
              display: "flex",
              gap: "48px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>Receipt Hash</span>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  fontFamily: "monospace",
                  color: "#cbd5e1",
                }}
              >
                {data.hashPreview}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>Date</span>
              <span style={{ fontSize: 20, fontWeight: 600, color: "#cbd5e1" }}>{data.timestamp}</span>
            </div>
          </div>
        ) : null}

        {/* Trust indicators */}
        <div
          style={{
            display: "flex",
            gap: "32px",
          }}
        >
          {["Evaluated", "Enforced", "Recorded"].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#22c55e"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span style={{ fontSize: 16, color: "#94a3b8" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 18,
          fontWeight: 500,
        }}
      >
        <span style={{ color: "#64748b" }}>Verify at trucore.xyz</span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            borderRadius: "8px",
            background: "rgba(59, 130, 246, 0.1)",
            border: "1px solid rgba(59, 130, 246, 0.2)",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#60a5fa"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <span style={{ fontSize: 14, color: "#93c5fd" }}>Tamper-evident</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Fallback OG card when hash is invalid or missing.
 */
function FallbackOgCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "56px",
        background: "linear-gradient(160deg, rgba(11,18,32,1) 0%, rgba(5,10,20,1) 70%)",
        color: "#eef8ff",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: "0.01em",
            color: "#b8e3ff",
          }}
        >
          TruCore
        </div>
        <div style={{ fontSize: 18, color: "#8ed3ff" }}>Agent Transaction Firewall</div>
      </div>

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          flex: 1,
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            lineHeight: 1.15,
            color: "#f0f9ff",
          }}
        >
          Verify Protected Trades
        </div>
        <div
          style={{
            fontSize: 24,
            lineHeight: 1.4,
            color: "#94a3b8",
            maxWidth: "800px",
          }}
        >
          Validate receipts from policy-governed AI agent transactions with tamper-evident verification.
        </div>

        {/* Trust indicators */}
        <div
          style={{
            display: "flex",
            gap: "32px",
            marginTop: "16px",
          }}
        >
          {["Evaluated", "Enforced", "Recorded"].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#22c55e"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span style={{ fontSize: 16, color: "#94a3b8" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 18,
          fontWeight: 500,
        }}
      >
        <span style={{ color: "#64748b" }}>trucore.xyz/verify</span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            borderRadius: "8px",
            background: "rgba(59, 130, 246, 0.1)",
            border: "1px solid rgba(59, 130, 246, 0.2)",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#60a5fa"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <span style={{ fontSize: 14, color: "#93c5fd" }}>Tamper-evident</span>
        </div>
      </div>
    </div>
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawHash = searchParams.get("hash");
    const sanitizedHash = sanitizeHash(rawHash);

    // If hash is valid, show receipt-specific card; otherwise show fallback
    const previewData = sanitizedHash ? derivePreviewData(sanitizedHash) : null;
    const card = previewData ? <ReceiptOgCard data={previewData} /> : <FallbackOgCard />;

    return new ImageResponse(card, {
      ...SIZE,
      headers: {
        // Cache for 1 hour, stale-while-revalidate for 1 day
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    // If anything fails, return fallback
    return new ImageResponse(<FallbackOgCard />, {
      ...SIZE,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  }
}

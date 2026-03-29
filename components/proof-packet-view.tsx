"use client";

import { useState } from "react";
import {
  buildProofPacket,
  downloadProofPacket,
  getProofPacketFilename,
} from "@/lib/proof-packet";
import { trackEvent } from "@/lib/track";

export interface ProofPacketViewProps {
  /** Receipt hash. Component renders nothing when empty. */
  hash: string;
  /** Decision string, e.g. "ALLOW" or "DENY". */
  decision?: string;
  /** Whether the receipt has been independently verified. */
  verified?: boolean;
  /** ISO timestamp of the receipt. */
  timestamp?: string;
  /** Render in a more compact / collapsible style for embedding in panels. */
  compact?: boolean;
  /** Telemetry surface label. */
  surface?: string;
}

/**
 * Machine-readable proof packet viewer for agents and developers.
 *
 * Renders formatted JSON with copy + download actions.
 * Collapsible in compact mode.
 * Returns null when hash is missing or empty.
 */
export function ProofPacketView({
  hash,
  decision,
  verified,
  timestamp,
  compact = false,
  surface = "unknown",
}: ProofPacketViewProps) {
  const trimmed = hash.trim();
  const [expanded, setExpanded] = useState(!compact);
  const [copied, setCopied] = useState(false);

  const packet = trimmed
    ? buildProofPacket(trimmed, { decision, verified, timestamp })
    : null;
  const packetJson = packet ? JSON.stringify(packet, null, 2) : "";

  const handleCopy = () => {
    if (!packetJson) return;
    navigator.clipboard.writeText(packetJson).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      },
      () => {
        // Clipboard API unavailable — fail silently.
      },
    );
    trackEvent("proof_packet_copied", {
      surface,
      has_verified_status: verified != null,
    });
  };

  const handleDownload = () => {
    if (!packet) return;
    const filename = getProofPacketFilename(trimmed);
    downloadProofPacket(packet, filename);
    trackEvent("proof_packet_downloaded", {
      surface,
      has_verified_status: verified != null,
    });
  };

  if (!trimmed || !packet) return null;

  const btnBase =
    "rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-mono font-medium text-slate-400 transition hover:bg-white/10 hover:text-slate-200";

  return (
    <div data-testid="proof-packet-view" className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          data-testid="proof-packet-toggle"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 transition hover:text-slate-300"
          aria-expanded={expanded}
        >
          <svg
            className={`h-2.5 w-2.5 transition-transform ${expanded ? "rotate-90" : ""}`}
            viewBox="0 0 6 10"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="M1 1l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Machine-readable proof
        </button>

        {expanded && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              data-testid="proof-packet-copy-btn"
              onClick={handleCopy}
              className={btnBase}
            >
              {copied ? "Copied!" : "Copy JSON"}
            </button>
            <button
              type="button"
              data-testid="proof-packet-download-btn"
              onClick={handleDownload}
              className={btnBase}
            >
              Download .json
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <pre
          data-testid="proof-packet-json"
          className="overflow-x-auto whitespace-pre rounded-lg border border-white/[0.06] bg-black/40 p-3 font-mono text-[10px] leading-relaxed text-slate-300"
        >
          {packetJson}
        </pre>
      )}
    </div>
  );
}

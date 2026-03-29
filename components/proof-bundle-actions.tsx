"use client";

import { useCallback } from "react";
import {
  buildProofBundleData,
  downloadProofBundle,
  getProofBundleFilename,
} from "@/lib/proof-bundle";
import { buildOgPreviewUrl } from "@/lib/share-utils";
import { trackEvent } from "@/lib/track";

export interface ProofBundleActionsProps {
  /** Receipt hash. Component renders nothing when empty. */
  hash: string;
  /** Decision string, e.g. "ALLOW" or "DENY". */
  decision?: string;
  /** Whether the receipt has been independently verified. */
  verified?: boolean;
  /** ISO timestamp of the receipt. */
  timestamp?: string;
  /** Stable receipt ID if different from content hash. */
  receiptId?: string;
  /** Render in a more compact style for embedding in detail panels. */
  compact?: boolean;
  /** Telemetry surface label. */
  surface?: string;
}

/**
 * Compact export actions for a receipt proof bundle.
 *
 * Renders two actions:
 *   - Export JSON  — client-side download of the proof manifest
 *   - Open share card — opens the canonical OG preview in a new tab
 *
 * Returns null when hash is missing or empty.
 * Fires fire-and-forget telemetry on each action; never blocks the UI.
 */
export function ProofBundleActions({
  hash,
  decision,
  verified,
  timestamp,
  receiptId,
  compact = false,
  surface = "unknown",
}: ProofBundleActionsProps) {
  const trimmed = hash.trim();

  const handleExportJson = useCallback(() => {
    const data = buildProofBundleData(trimmed, {
      decision,
      verified,
      timestamp,
      receiptId,
    });
    const filename = getProofBundleFilename(trimmed);
    downloadProofBundle(data, filename);
    trackEvent("proof_bundle_exported", {
      surface,
      has_verified_status: verified != null,
      has_receipt_id: !!receiptId,
    });
  }, [trimmed, decision, verified, timestamp, receiptId, surface]);

  const handleOpenShareCard = useCallback(() => {
    try {
      window.open(buildOgPreviewUrl(trimmed), "_blank", "noopener,noreferrer");
    } catch {
      // window.open unavailable — fail silently.
    }
    trackEvent("proof_share_card_opened", {
      surface,
      has_verified_status: verified != null,
      has_receipt_id: !!receiptId,
    });
  }, [trimmed, verified, receiptId, surface]);

  if (!trimmed) return null;

  const btnClass = compact
    ? "rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-mono font-medium text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
    : "rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-slate-100";

  return (
    <div
      data-testid="proof-bundle-actions"
      className={`flex flex-wrap items-center gap-2 ${compact ? "" : "mt-1"}`}
    >
      {!compact && (
        <span className="w-full font-mono text-[10px] uppercase tracking-widest text-slate-600">
          export proof bundle
        </span>
      )}
      <button
        type="button"
        data-testid="export-proof-bundle-btn"
        onClick={handleExportJson}
        className={btnClass}
      >
        Export JSON
      </button>
      <button
        type="button"
        data-testid="open-share-card-btn"
        onClick={handleOpenShareCard}
        className={btnClass}
      >
        Open share card
      </button>
    </div>
  );
}

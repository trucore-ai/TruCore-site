"use client";

import { useCallback, useState } from "react";
import { generateShareText, generateBotLine } from "@/lib/distribution-utils";
import { trackEvent } from "@/lib/track";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DistributionActionsProps {
  /** Receipt hash. Component renders nothing when empty. */
  hash: string;
  /** Render in a more compact style for embedding in detail panels. */
  compact?: boolean;
  /** Telemetry surface label. */
  surface?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Share / Distribute actions for a verified receipt.
 *
 * Renders two actions:
 *   - Copy Share Text — copies human-readable share text to clipboard
 *   - Copy Bot Line — copies machine-readable bot line to clipboard
 *
 * Returns null when hash is missing or empty.
 * Fires fire-and-forget telemetry on each action; never blocks the UI.
 * Handles clipboard failures gracefully without UI breakage.
 */
export function DistributionActions({
  hash,
  compact = false,
  surface = "unknown",
}: DistributionActionsProps) {
  const trimmed = hash?.trim() ?? "";

  // Copy state
  const [shareTextCopied, setShareTextCopied] = useState(false);
  const [botLineCopied, setBotLineCopied] = useState(false);

  // -------------------------------------------------------------------------
  // Copy Share Text
  // -------------------------------------------------------------------------

  const handleCopyShareText = useCallback(async () => {
    if (!trimmed) return;

    const shareText = generateShareText({ hash: trimmed });

    try {
      await navigator.clipboard.writeText(shareText);
      setShareTextCopied(true);
      setTimeout(() => setShareTextCopied(false), 1500);
    } catch {
      // Clipboard may not be available — fail silently.
      // We still fire telemetry to track the attempt.
    }

    // Fire-and-forget telemetry
    trackEvent("distribution_share_text_copied", {
      surface,
      hash_length: trimmed.length,
    });
  }, [trimmed, surface]);

  // -------------------------------------------------------------------------
  // Copy Bot Line
  // -------------------------------------------------------------------------

  const handleCopyBotLine = useCallback(async () => {
    if (!trimmed) return;

    const botLine = generateBotLine({ hash: trimmed });

    try {
      await navigator.clipboard.writeText(botLine);
      setBotLineCopied(true);
      setTimeout(() => setBotLineCopied(false), 1500);
    } catch {
      // Clipboard may not be available — fail silently.
    }

    // Fire-and-forget telemetry
    trackEvent("distribution_bot_line_copied", {
      surface,
      hash_length: trimmed.length,
    });
  }, [trimmed, surface]);

  // -------------------------------------------------------------------------
  // Guard: Don't render if hash is empty
  // -------------------------------------------------------------------------

  if (!trimmed) return null;

  // -------------------------------------------------------------------------
  // Styles
  // -------------------------------------------------------------------------

  const btnClass = compact
    ? "rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-mono font-medium text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
    : "rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-slate-100";

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div
      data-testid="distribution-actions"
      className={`flex flex-wrap items-center gap-2 ${compact ? "" : "mt-1"}`}
    >
      {!compact && (
        <span className="w-full font-mono text-[10px] uppercase tracking-widest text-slate-600">
          share / distribute
        </span>
      )}
      <button
        type="button"
        data-testid="copy-share-text-btn"
        onClick={handleCopyShareText}
        className={btnClass}
      >
        {shareTextCopied ? "Copied!" : "Copy Share Text"}
      </button>
      <button
        type="button"
        data-testid="copy-bot-line-btn"
        onClick={handleCopyBotLine}
        className={btnClass}
      >
        {botLineCopied ? "Copied!" : "Copy Bot Line"}
      </button>
    </div>
  );
}

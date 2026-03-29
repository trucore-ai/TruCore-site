"use client";

import { useMemo, useState } from "react";
import { buildProofBundle } from "@/lib/share-utils";
import { trackEvent } from "@/lib/track";

interface ProofLinksCardProps {
  hash: string;
  title?: string;
  compact?: boolean;
}

/**
 * Compact, copy-friendly proof distribution surface.
 *
 * Renders canonical verify and OG preview URLs for a receipt hash.
 * Renders nothing when hash is missing.
 * Secondary to the main trust card — intentionally low-visual-weight.
 */
export function ProofLinksCard({
  hash,
  title = "Proof links",
  compact = false,
}: ProofLinksCardProps) {
  const [verifyUrlCopied, setVerifyUrlCopied] = useState(false);
  const [ogUrlCopied, setOgUrlCopied] = useState(false);

  const trimmed = hash.trim();

  const { verifyUrl, ogPreviewUrl } = useMemo(
    () => buildProofBundle(trimmed),
    [trimmed],
  );

  if (!trimmed) return null;

  async function handleCopyVerifyUrl() {
    try {
      await navigator.clipboard.writeText(verifyUrl);
      setVerifyUrlCopied(true);
      setTimeout(() => setVerifyUrlCopied(false), 1800);
      trackEvent("proof_verify_url_copied", { surface: "proof_links_card" });
    } catch {
      // clipboard unavailable — fail silently
    }
  }

  async function handleCopyOgUrl() {
    try {
      await navigator.clipboard.writeText(ogPreviewUrl);
      setOgUrlCopied(true);
      setTimeout(() => setOgUrlCopied(false), 1800);
      trackEvent("proof_og_url_copied", { surface: "proof_links_card" });
    } catch {
      // clipboard unavailable — fail silently
    }
  }

  return (
    <div
      data-testid="proof-links-card"
      className={`rounded-lg border border-white/10 bg-white/[0.02] ${compact ? "p-3 space-y-2" : "p-4 space-y-3"}`}
    >
      <p className={`font-mono font-semibold text-slate-400 ${compact ? "text-[10px] uppercase tracking-widest" : "text-xs uppercase tracking-widest"}`}>
        {title}
      </p>

      {/* Verify URL row */}
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-wider text-slate-600 font-mono">verify url</p>
        <div className="flex items-center gap-2">
          <code
            data-testid="proof-verify-url"
            className="flex-1 truncate rounded bg-neutral-900 px-2 py-1 text-xs font-mono text-slate-300"
          >
            {verifyUrl}
          </code>
          <button
            type="button"
            data-testid="copy-verify-url-button"
            onClick={handleCopyVerifyUrl}
            className="shrink-0 rounded border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
          >
            {verifyUrlCopied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* OG preview URL row */}
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-wider text-slate-600 font-mono">og preview url</p>
        <div className="flex items-center gap-2">
          <code
            data-testid="proof-og-url"
            className="flex-1 truncate rounded bg-neutral-900 px-2 py-1 text-xs font-mono text-slate-300"
          >
            {ogPreviewUrl}
          </code>
          <button
            type="button"
            data-testid="copy-og-url-button"
            onClick={handleCopyOgUrl}
            className="shrink-0 rounded border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
          >
            {ogUrlCopied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {!compact && (
        <p className="text-[10px] text-slate-600 font-mono">
          Use these links to share independently verifiable proof.
        </p>
      )}
    </div>
  );
}

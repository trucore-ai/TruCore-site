"use client";

import { useMemo, useState } from "react";
import { buildTelegramUrl, buildTwitterUrl, buildVerifyUrl } from "@/lib/share-utils";

interface ReceiptShareActionsProps {
  hash: string;
  className?: string;
  title?: string;
  subtext?: string;
  copyLabel?: string;
  ogPreviewLabel?: string;
  twitterLabel?: string;
  telegramLabel?: string;
  includeSocial?: boolean;
}

export function ReceiptShareActions({
  hash,
  className,
  title = "Share this receipt",
  subtext = "Anyone can independently verify this transaction",
  copyLabel = "Copy Link",
  ogPreviewLabel = "Open OG Preview",
  twitterLabel = "Twitter",
  telegramLabel = "Telegram",
  includeSocial = true,
}: ReceiptShareActionsProps) {
  const [copied, setCopied] = useState(false);

  const trimmedHash = hash.trim();

  const verifyUrl = useMemo(() => buildVerifyUrl(trimmedHash), [trimmedHash]);
  const ogPreviewPath = useMemo(
    () => `/api/og/receipt?hash=${encodeURIComponent(trimmedHash)}`,
    [trimmedHash],
  );
  const twitterUrl = useMemo(() => buildTwitterUrl(verifyUrl), [verifyUrl]);
  const telegramUrl = useMemo(() => buildTelegramUrl(verifyUrl), [verifyUrl]);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      data-testid="receipt-share-actions"
      className={`rounded-xl border border-primary-500/20 bg-primary-500/[0.04] p-4 space-y-3 ${className ?? ""}`}
    >
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-accent-200">{title}</h2>
        <p className="text-xs text-slate-400">{subtext}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-testid="copy-share-link-button"
          onClick={handleCopyLink}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10"
        >
          {copied ? "Copied" : copyLabel}
        </button>

        <a
          data-testid="open-og-preview-link"
          href={ogPreviewPath}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10"
        >
          {ogPreviewLabel}
        </a>

        {includeSocial ? (
          <>
            <a
              data-testid="twitter-share-link"
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10"
            >
              {twitterLabel}
            </a>
            <a
              data-testid="telegram-share-link"
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10"
            >
              {telegramLabel}
            </a>
          </>
        ) : null}
      </div>
    </div>
  );
}

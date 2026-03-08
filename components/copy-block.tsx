"use client";

import { useEffect, useState } from "react";

type CopyBlockProps = {
  label?: string;
  value: string;
  helperText?: string;
  copyButtonLabel?: string;
  onCopy?: () => void;
};

export function CopyBlock({
  label,
  value,
  helperText,
  copyButtonLabel = "Copy",
  onCopy,
}: CopyBlockProps) {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) {
      return;
    }

    const timer = window.setTimeout(() => setIsCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [isCopied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
      onCopy?.();
    } catch {
      // Clipboard errors are non-blocking.
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-white/[0.08] bg-neutral-950/70 p-4">
      {label ? (
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-slate-400 transition-all hover:border-primary-300/30 hover:bg-primary-500/10 hover:text-primary-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
            {isCopied ? "Copied" : copyButtonLabel}
          </button>
        </div>
      ) : null}
      <pre className="overflow-x-auto rounded-lg border border-white/[0.06] bg-neutral-950/80 px-4 py-3 font-mono text-xs leading-relaxed text-slate-200 whitespace-pre-wrap break-words">
        <code>{value}</code>
      </pre>
      {helperText ? <p className="mt-2.5 text-xs leading-relaxed text-slate-500">{helperText}</p> : null}
      {!label ? (
        <button
          type="button"
          onClick={handleCopy}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-400 transition-all hover:border-primary-300/30 hover:bg-primary-500/10 hover:text-primary-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
        >
          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
          {isCopied ? "Copied" : copyButtonLabel}
        </button>
      ) : null}
    </div>
  );
}

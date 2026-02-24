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
    <div className="mt-3 rounded-lg border border-white/10 bg-neutral-950/50 p-3">
      {label ? (
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-200">{label}</p>
      ) : null}
      <pre className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 px-3 py-2 font-mono text-xs text-slate-200 whitespace-pre-wrap break-words">
        <code>{value}</code>
      </pre>
      {helperText ? <p className="mt-2 text-xs text-slate-400">{helperText}</p> : null}
      <button
        type="button"
        onClick={handleCopy}
        className="mt-3 inline-flex items-center justify-center rounded-xl border border-primary-300/40 bg-primary-500/15 px-3 py-2 text-xs font-semibold text-primary-100 transition-colors hover:bg-primary-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
      >
        {isCopied ? "Copied" : copyButtonLabel}
      </button>
    </div>
  );
}

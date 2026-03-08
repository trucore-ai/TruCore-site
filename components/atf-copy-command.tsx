"use client";

import { useCallback, useEffect, useState } from "react";

type CopyState = "idle" | "copied" | "failed";

type AtfCopyCommandProps = {
  command: string;
  label?: string;
};

/**
 * Attempts to copy text using the Clipboard API with fallback to the legacy
 * execCommand approach for older browsers and insecure contexts.
 */
async function copyToClipboard(text: string): Promise<boolean> {
  // Primary: Clipboard API (requires secure context in most browsers)
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Permission denied or insecure context, fall through to legacy.
    }
  }

  // Fallback: textarea + execCommand (works in older Safari, http contexts)
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    // Keep the element off-screen to avoid layout shift
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function AtfCopyCommand({ command, label }: AtfCopyCommandProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");

  useEffect(() => {
    if (copyState === "idle") return;
    const timer = window.setTimeout(() => setCopyState("idle"), 2400);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(command);
    setCopyState(success ? "copied" : "failed");
  }, [command]);

  const buttonLabel =
    copyState === "copied"
      ? "Copied"
      : copyState === "failed"
        ? "Copy failed, select manually"
        : "Copy";

  return (
    <div className="group relative mt-4 overflow-hidden rounded-xl border border-white/[0.08] bg-neutral-950/70" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02), 0 1px 3px rgba(0,0,0,0.3)' }}>
      {label ? (
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5" style={{ background: 'rgba(255,255,255,0.015)' }}>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
            {label}
          </p>
          <button
            type="button"
            onClick={handleCopy}
            aria-live="polite"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-slate-400 transition-all hover:border-primary-300/30 hover:bg-primary-500/10 hover:text-primary-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
            {buttonLabel}
          </button>
        </div>
      ) : null}
      <div className="p-5">
        <pre className="overflow-x-auto font-mono text-[0.8125rem] leading-relaxed text-slate-200 whitespace-pre-wrap break-words">
          <code>{command}</code>
        </pre>
        {!label ? (
          <button
            type="button"
            onClick={handleCopy}
            aria-live="polite"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-400 transition-all hover:border-primary-300/30 hover:bg-primary-500/10 hover:text-primary-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
            {buttonLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

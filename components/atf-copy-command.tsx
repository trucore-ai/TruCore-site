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
    <div className="group relative mt-3 rounded-xl border border-white/10 bg-neutral-950/60 p-4">
      {label ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary-200">
          {label}
        </p>
      ) : null}
      <pre className="overflow-x-auto font-mono text-sm text-slate-200 whitespace-pre-wrap break-words">
        <code>{command}</code>
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        aria-live="polite"
        className="mt-3 inline-flex items-center justify-center rounded-xl border border-primary-300/40 bg-primary-500/15 px-3 py-2 text-xs font-semibold text-primary-100 transition-colors hover:bg-primary-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
      >
        {buttonLabel}
      </button>
    </div>
  );
}

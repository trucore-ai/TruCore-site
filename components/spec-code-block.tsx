"use client";

import { useEffect, useState } from "react";

type SpecCodeBlockProps = {
  id: string;
  code: string;
  copyButtonLabel?: string;
};

export function SpecCodeBlock({ id, code, copyButtonLabel = "Copy" }: SpecCodeBlockProps) {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) {
      return;
    }

    const timer = window.setTimeout(() => setIsCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [isCopied]);

  const lines = code.split("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
    } catch {
      setIsCopied(false);
    }
  };

  return (
    <div className="code-panel">
      <div className="code-panel-header">
        <span className="code-panel-label">{id}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-slate-400 transition-all hover:border-primary-300/30 hover:bg-primary-500/10 hover:text-primary-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
        >
          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
          {isCopied ? "Copied" : copyButtonLabel}
        </button>
      </div>
      <pre className="overflow-x-auto p-5 text-xs leading-relaxed text-slate-200">
        <code>
          {lines.map((line, index) => {
            const lineNumber = index + 1;
            const anchorId = `${id}-L${lineNumber}`;

            return (
              <div key={anchorId} id={anchorId} className="group grid grid-cols-[auto_1fr] gap-4">
                <a
                  href={`#${anchorId}`}
                  className="select-none text-right text-slate-600 tabular-nums transition-colors hover:text-primary-200"
                  aria-label={`Link to line ${lineNumber}`}
                >
                  {String(lineNumber).padStart(2, "0")}
                </a>
                <span className="whitespace-pre">{line || " "}</span>
              </div>
            );
          })}
        </code>
      </pre>
    </div>
  );
}

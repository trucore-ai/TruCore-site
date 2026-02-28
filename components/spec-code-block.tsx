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
    <div className="rounded-lg border border-white/10 bg-neutral-950/50 p-3">
      <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-xs text-slate-200">
        <code>
          {lines.map((line, index) => {
            const lineNumber = index + 1;
            const anchorId = `${id}-L${lineNumber}`;

            return (
              <div key={anchorId} id={anchorId} className="group grid grid-cols-[auto_1fr] gap-3">
                <a
                  href={`#${anchorId}`}
                  className="select-none text-slate-500 transition-colors hover:text-primary-100"
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

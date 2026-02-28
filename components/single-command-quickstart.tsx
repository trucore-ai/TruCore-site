"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { ONE_LINE_EXPECTED_OUTPUT, oneLineCommandFor, type OneLineMethod } from "@/lib/one-line-quickstart";
import { getAtfCliTag } from "@/lib/version";

type SingleCommandQuickstartProps = {
  location: "atf" | "quickstart" | "launch";
  compact?: boolean;
  showV1StabilityContract?: boolean;
};

const METHODS: Array<{ id: OneLineMethod; label: string }> = [
  { id: "npx", label: "npx" },
  { id: "curl", label: "curl" },
];

export function SingleCommandQuickstart({
  location,
  compact = false,
  showV1StabilityContract = false,
}: SingleCommandQuickstartProps) {
  const [method, setMethod] = useState<OneLineMethod>("npx");
  const [isCopied, setIsCopied] = useState(false);

  const command = useMemo(() => oneLineCommandFor(method), [method]);

  useEffect(() => {
    if (!isCopied) {
      return;
    }

    const timeout = window.setTimeout(() => setIsCopied(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [isCopied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setIsCopied(true);
      trackEvent("one_line_copy_click", { method, location });
    } catch {
      // Clipboard errors are non-blocking.
    }
  };

  return (
    <section
      data-testid="one-line-quickstart"
      className={`rounded-xl border border-white/10 bg-neutral-900/40 p-4 sm:p-5 ${compact ? "max-w-3xl" : ""}`}
    >
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary-200">Single Command Quickstart</p>
      <p className="mt-2 text-lg text-slate-200">
        Run one command. Get a deterministic decision + receipt hash.
      </p>
      <p className="mt-2 text-sm text-slate-300">
        CLI pinned: <span className="font-mono text-slate-200">@trucore/atf@{getAtfCliTag()}</span>
      </p>

      {showV1StabilityContract ? (
        <div className="mt-3 rounded-lg border border-white/10 bg-neutral-950/40 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">v1 launch mode</p>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-300">
            <li>This CLI version is pinned for reproducibility.</li>
            <li>Simulator is deterministic and produces verifiable receipt hashes.</li>
            <li>Use /verify to validate integrity; signatures may be enabled depending on environment.</li>
          </ul>
        </div>
      ) : null}

      <div role="tablist" aria-label="Single command methods" className="mt-3 flex flex-wrap gap-2">
        {METHODS.map((option) => {
          const isActive = option.id === method;

          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setMethod(option.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 ${
                isActive
                  ? "border-accent-400 bg-accent-500/20 text-accent-300"
                  : "border-primary-300/40 bg-primary-500/20 text-primary-100 hover:border-primary-300/70"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <pre className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 px-3 py-2 font-mono text-xs text-slate-200 whitespace-pre-wrap break-words">
        <code>{command}</code>
      </pre>

      <button
        type="button"
        onClick={handleCopy}
        className="mt-3 inline-flex items-center justify-center rounded-xl border border-primary-300/40 bg-primary-500/15 px-3 py-2 text-xs font-semibold text-primary-100 transition-colors hover:bg-primary-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
      >
        {isCopied ? "Copied" : `Copy ${method} command`}
      </button>

      <details className="mt-4 rounded-lg border border-white/10 bg-neutral-950/40 px-3 py-2">
        <summary className="cursor-pointer text-sm font-medium text-slate-200">What you&apos;ll see</summary>
        <pre className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 px-3 py-2 font-mono text-xs text-slate-200 whitespace-pre-wrap break-words">
          <code>{ONE_LINE_EXPECTED_OUTPUT}</code>
        </pre>
        <p className="mt-3 text-sm text-slate-300">
          Paste the receipt hash into <Link href="/verify" className="font-semibold text-primary-100 hover:text-primary-200">/verify</Link> to confirm deterministic integrity.
        </p>
      </details>

      <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-300">
        <Link href="/verify" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
          Verify a receipt hash
        </Link>
        <Link
          href="/docs/integration-pattern"
          className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
        >
          Integration pattern
        </Link>
      </div>
    </section>
  );
}

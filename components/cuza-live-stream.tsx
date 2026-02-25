"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildVerifyUrl } from "@/lib/verification-kit";
import type { CuzaLiveReceipt } from "@/lib/cuza-live";

type CuzaLivePayload = {
  ok: boolean;
  generated_at: string;
  receipts: CuzaLiveReceipt[];
};

function truncateHash(hash: string): string {
  return `${hash.slice(0, 12)}...${hash.slice(-8)}`;
}

export function CuzaLiveStream() {
  const [receipts, setReceipts] = useState<CuzaLiveReceipt[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;

    async function loadCuzaLive() {
      try {
        const response = await fetch("/api/cuza-live", { cache: "no-store" });
        const payload = (await response.json()) as CuzaLivePayload | { ok?: false; error?: string };

        if (!response.ok || !("ok" in payload) || !payload.ok) {
          throw new Error("failed_request");
        }

        if (!isMounted) {
          return;
        }

        setReceipts(payload.receipts);
        setGeneratedAt(payload.generated_at);
        setError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setError("Unable to load demo stream right now.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadCuzaLive();
    const intervalId = window.setInterval(() => {
      void loadCuzaLive();
    }, 30_000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const generatedLabel = useMemo(() => {
    if (!generatedAt) {
      return "";
    }

    return new Date(generatedAt).toLocaleString();
  }, [generatedAt]);

  function toggleExpanded(id: string) {
    setExpandedIds((current) => ({
      ...current,
      [id]: !current[id],
    }));
  }

  return (
    <div className="space-y-5 rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Live Stream Panel</p>
        <p className="text-sm text-slate-300">Updated: {generatedLabel || "Loading..."}</p>
      </div>

      {isLoading ? <p className="text-sm text-slate-300">Loading stream...</p> : null}
      {error ? <p className="text-sm text-red-200">{error}</p> : null}

      <ul className="space-y-3">
        {receipts.map((receipt) => {
          const isExpanded = Boolean(expandedIds[receipt.id]);

          return (
            <li key={receipt.id} className="rounded-lg border border-white/10 bg-neutral-950/70 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${
                        receipt.result.status === "allowed"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {receipt.result.status}
                    </span>
                    <span className="rounded-full bg-primary-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary-100">
                      {receipt.anchor_status.state}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-slate-200">{truncateHash(receipt.result.receipt_hash)}</p>
                  <p className="text-xs text-slate-400">{receipt.created_at}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={buildVerifyUrl({ hash: receipt.result.receipt_hash })}
                    className="inline-flex rounded border border-primary-300/40 bg-primary-500/10 px-3 py-1.5 text-sm font-medium text-primary-100 transition-colors hover:bg-primary-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                  >
                    Verify
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleExpanded(receipt.id)}
                    className="inline-flex rounded border border-white/20 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-100 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                  >
                    {isExpanded ? "Hide receipt JSON" : "View receipt JSON"}
                  </button>
                </div>
              </div>

              {isExpanded ? (
                <div className="mt-3 rounded-lg border border-white/10 bg-neutral-950/70 p-3">
                  <pre className="max-h-[24rem] overflow-auto text-xs text-slate-200">
                    {JSON.stringify(receipt, null, 2)}
                  </pre>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <details className="rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-300">
        <summary className="cursor-pointer font-semibold text-slate-100">What am I looking at?</summary>
        <ul className="mt-3 space-y-2">
          <li>
            <span className="font-semibold text-slate-100">Policy checks:</span> each receipt includes deterministic
            pass or fail invariants from the simulator policy.
          </li>
          <li>
            <span className="font-semibold text-slate-100">Receipt hash determinism:</span> the same normalized input
            always computes the same receipt hash.
          </li>
          <li>
            <span className="font-semibold text-slate-100">Signature availability:</span> signatures are not embedded
            in this stream and are fetched through verify flow when enabled.
          </li>
        </ul>
      </details>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/atf/simulator"
          className="inline-flex items-center justify-center rounded-xl border border-primary-300/40 bg-primary-500/15 px-6 py-3 text-base font-semibold text-primary-100 transition-colors hover:bg-primary-500/25"
        >
          Try the Simulator
        </Link>
        <Link
          href="/docs/integration-pattern"
          className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-base font-semibold text-slate-100 transition-colors hover:bg-white/10"
        >
          Read Integration Pattern
        </Link>
        <Link
          href="/atf/apply"
          className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-base font-semibold text-slate-100 transition-colors hover:bg-white/10"
        >
          Apply for Pilot
        </Link>
      </div>
    </div>
  );
}

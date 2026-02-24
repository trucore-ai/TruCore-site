"use client";

import { trackEvent } from "@/lib/analytics";
import type { DemoReceipt } from "@/lib/demo-receipts";
import { useMemo, useState } from "react";

type ReceiptViewerProps = {
  receipt: DemoReceipt | null;
};

function getInvariantSummary(check: string): { label: string; outcome: "pass" | "fail" | "unknown" } {
  if (check.endsWith(": pass")) {
    return {
      label: check.replace(/: pass$/, ""),
      outcome: "pass",
    };
  }

  if (check.endsWith(": fail")) {
    return {
      label: check.replace(/: fail$/, ""),
      outcome: "fail",
    };
  }

  return {
    label: check,
    outcome: "unknown",
  };
}

export function ReceiptViewer({ receipt }: ReceiptViewerProps) {
  const [jsonCopied, setJsonCopied] = useState(false);
  const [hashCopied, setHashCopied] = useState(false);
  const formattedJson = useMemo(() => (receipt ? JSON.stringify(receipt, null, 2) : ""), [receipt]);

  async function copyJson() {
    if (!receipt) {
      return;
    }

    try {
      await navigator.clipboard.writeText(formattedJson);
      setJsonCopied(true);
      setTimeout(() => setJsonCopied(false), 1400);
      trackEvent("receipt_copy_json_click", {
        receipt_status: receipt.result.status,
      });
    } catch {
      setJsonCopied(false);
    }
  }

  async function copyHash() {
    if (!receipt) {
      return;
    }

    try {
      await navigator.clipboard.writeText(receipt.result.receipt_hash);
      setHashCopied(true);
      setTimeout(() => setHashCopied(false), 1400);
      trackEvent("receipt_copy_hash_click", {
        receipt_status: receipt.result.status,
      });
    } catch {
      setHashCopied(false);
    }
  }

  if (!receipt) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm text-slate-300">Select a receipt to inspect full deterministic output.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-sm text-slate-300">Receipts are deterministic outputs of the ATF policy engine.</p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyJson}
          className="rounded border border-primary-300/40 bg-primary-500/10 px-3 py-1.5 text-sm font-medium text-primary-100 transition-colors hover:bg-primary-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
        >
          {jsonCopied ? "Copied" : "Copy JSON"}
        </button>
        <button
          type="button"
          onClick={copyHash}
          className="rounded border border-primary-300/40 bg-primary-500/10 px-3 py-1.5 text-sm font-medium text-primary-100 transition-colors hover:bg-primary-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
        >
          {hashCopied ? "Copied" : "Copy hash"}
        </button>
      </div>

      <div className="rounded-lg border border-white/10 bg-neutral-950/70 p-3">
        <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Invariant check explanation</p>
        <ul className="mt-2 space-y-1 text-sm text-slate-200">
          {receipt.result.invariant_checks.map((check) => {
            const summary = getInvariantSummary(check);

            return (
              <li key={check} className="rounded border border-white/10 bg-neutral-950/70 px-2 py-1">
                <span>{summary.label}. </span>
                <span
                  className={
                    summary.outcome === "pass"
                      ? "text-emerald-300"
                      : summary.outcome === "fail"
                        ? "text-red-300"
                        : "text-slate-300"
                  }
                >
                  {summary.outcome === "unknown" ? "Outcome not specified." : `Outcome: ${summary.outcome}.`}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-lg border border-white/10 bg-neutral-950/70 p-3">
        <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Full receipt JSON</p>
        <pre className="mt-2 max-h-[28rem] overflow-auto text-xs text-slate-200">{formattedJson}</pre>
      </div>
    </div>
  );
}

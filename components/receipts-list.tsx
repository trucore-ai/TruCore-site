"use client";

import { ReceiptViewer } from "@/components/receipt-viewer";
import { trackEvent } from "@/lib/analytics";
import type { DemoReceipt } from "@/lib/demo-receipts";
import { useEffect, useMemo, useState } from "react";

type ReceiptsListProps = {
  receipts: DemoReceipt[];
};

function truncateHash(hash: string): string {
  return `${hash.slice(0, 12)}...${hash.slice(-8)}`;
}

export function ReceiptsList({ receipts }: ReceiptsListProps) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>(receipts[0]?.id ?? "");

  useEffect(() => {
    trackEvent("receipts_page_view", { location: "receipts_page" });
  }, []);

  const filteredReceipts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return receipts;
    }

    return receipts.filter((receipt) => {
      return (
        receipt.result.status.includes(normalizedQuery) ||
        receipt.result.receipt_hash.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [query, receipts]);

  const selectedReceipt =
    filteredReceipts.find((receipt) => receipt.id === selectedId) ?? filteredReceipts[0] ?? null;

  function onSelectReceipt(receipt: DemoReceipt) {
    setSelectedId(receipt.id);
    trackEvent("receipt_view_open", {
      receipt_status: receipt.result.status,
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <section className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <label htmlFor="receipt-search" className="text-sm font-medium text-slate-200">
          Search by hash or status
        </label>
        <input
          id="receipt-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="allowed, denied, 9d9e..."
          className="w-full rounded border border-white/10 bg-neutral-950/70 px-3 py-2 text-sm text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
        />

        <ul className="space-y-2">
          {filteredReceipts.map((receipt) => {
            const isActive = receipt.id === selectedId;
            return (
              <li key={receipt.id}>
                <button
                  type="button"
                  onClick={() => onSelectReceipt(receipt)}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 ${
                    isActive
                      ? "border-primary-300/50 bg-primary-500/15"
                      : "border-white/10 bg-neutral-950/60 hover:bg-neutral-900/70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-xs text-slate-200">{truncateHash(receipt.result.receipt_hash)}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${
                        receipt.result.status === "allowed"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {receipt.result.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{receipt.created_at}</p>
                </button>
              </li>
            );
          })}
        </ul>

        {!filteredReceipts.length ? (
          <p className="rounded border border-white/10 bg-neutral-950/60 px-3 py-2 text-sm text-slate-300">
            No receipts match this query.
          </p>
        ) : null}
      </section>

      <section>
        <ReceiptViewer receipt={selectedReceipt} />
      </section>
    </div>
  );
}

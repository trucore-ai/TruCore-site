"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  isLoggedIn,
  clearAuth,
  fetchReceipts,
  fetchReceiptDetail,
  verifyReceipt,
  ApiError,
} from "@/lib/customer-auth";
import { trackReceiptViewed, trackReceiptVerified } from "@/lib/client/journey";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReceiptSummary {
  receipt_id: string;
  created_at: number;
  decision: string;
  dry_run: boolean;
  content_hash: string;
  protected_by: string;
  summary: string;
  intent_type: string;
}

interface ReceiptsResponse {
  receipts?: ReceiptSummary[];
  count?: number;
}

interface VerifyResult {
  verified?: boolean;
  valid?: boolean;
  matches?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncateId(id: string): string {
  if (id.length <= 16) return id;
  return `${id.slice(0, 8)}…${id.slice(-6)}`;
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts > 1e12 ? ts : ts * 1000);
  return d.toLocaleString();
}

function decisionBadge(decision: string) {
  const isAllow =
    decision === "ALLOW" ||
    decision === "allowed" ||
    decision === "approved";
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${
        isAllow
          ? "bg-emerald-500/20 text-emerald-300"
          : "bg-red-500/20 text-red-300"
      }`}
    >
      {decision}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CustomerReceiptsPage() {
  const router = useRouter();

  // List state
  const [receipts, setReceipts] = useState<ReceiptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Detail state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [jsonCopied, setJsonCopied] = useState(false);

  // Verify state
  const [verifyStatus, setVerifyStatus] = useState<
    "idle" | "loading" | "verified" | "tampered" | "error"
  >("idle");

  // -----------------------------------------------------------------------
  // Load receipts on mount
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }

    // Track receipt page view for journey telemetry
    trackReceiptViewed();

    fetchReceipts({ limit: 20 })
      .then((res) => {
        const r = res as ReceiptsResponse;
        setReceipts(
          (r.receipts ?? []).sort(
            (a, b) => (b.created_at ?? 0) - (a.created_at ?? 0),
          ),
        );
      })
      .catch((err) => {
        if (err instanceof ApiError && err.code === "unauthorized") {
          router.replace("/login");
        } else {
          setError(
            err instanceof Error ? err.message : "Failed to load receipts",
          );
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  // -----------------------------------------------------------------------
  // Select / detail
  // -----------------------------------------------------------------------

  const handleSelect = useCallback(
    async (receiptId: string) => {
      if (selectedId === receiptId) {
        // Toggle off
        setSelectedId(null);
        setDetail(null);
        setVerifyStatus("idle");
        return;
      }

      setSelectedId(receiptId);
      setDetail(null);
      setDetailError("");
      setDetailLoading(true);
      setVerifyStatus("idle");

      try {
        const d = await fetchReceiptDetail(receiptId);
        setDetail(d);
      } catch (err) {
        if (err instanceof ApiError && err.code === "unauthorized") {
          router.replace("/login");
        } else {
          setDetailError(
            err instanceof Error ? err.message : "Failed to load receipt",
          );
        }
      } finally {
        setDetailLoading(false);
      }
    },
    [selectedId, router],
  );

  // -----------------------------------------------------------------------
  // Verify
  // -----------------------------------------------------------------------

  const handleVerify = useCallback(async () => {
    if (!selectedId) return;
    setVerifyStatus("loading");
    try {
      const res = (await verifyReceipt(selectedId)) as VerifyResult;
      const ok = res.verified ?? res.valid ?? res.matches ?? false;
      setVerifyStatus(ok ? "verified" : "tampered");

      // Track receipt verification for journey telemetry
      trackReceiptVerified(ok);
    } catch {
      setVerifyStatus("error");
      // Track failed verification attempt
      trackReceiptVerified(false);
    }
  }, [selectedId]);

  // -----------------------------------------------------------------------
  // Copy JSON
  // -----------------------------------------------------------------------

  const handleCopyJson = useCallback(async () => {
    if (!detail) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(detail, null, 2));
      setJsonCopied(true);
      setTimeout(() => setJsonCopied(false), 1500);
    } catch {
      // clipboard may not be available
    }
  }, [detail]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  if (typeof window !== "undefined" && !isLoggedIn()) return null;

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">
              Protected Trade Receipts
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              View and verify your ATF protection receipts. Each receipt is a tamper-evident record.
            </p>
          </div>
          <Link
            href="/customer/dashboard"
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
          >
            &larr; Dashboard
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-lg border border-white/5 bg-white/[0.02]"
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && receipts.length === 0 && (
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-10 text-center">
            <p className="text-lg text-slate-300">No receipts yet</p>
            <p className="mt-2 text-sm text-slate-500">
              Receipts appear here after you run a protected trade.
            </p>
            <Link
              href="/customer/dashboard"
              className="mt-6 inline-block rounded-lg bg-accent-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-accent-400"
            >
              Run your first protected trade
            </Link>
          </section>
        )}

        {/* Receipts table */}
        {!loading && receipts.length > 0 && (
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs text-slate-500">
                    <th className="pb-2 pr-4 font-medium">Receipt ID</th>
                    <th className="pb-2 pr-4 font-medium">Decision</th>
                    <th className="pb-2 pr-4 font-medium">Timestamp</th>
                    <th className="pb-2 font-medium">Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((r) => (
                    <tr
                      key={r.receipt_id}
                      onClick={() => handleSelect(r.receipt_id)}
                      className={`cursor-pointer border-b border-white/5 transition last:border-0 ${
                        selectedId === r.receipt_id
                          ? "bg-primary-500/10"
                          : "hover:bg-white/[0.03]"
                      }`}
                    >
                      <td className="py-3 pr-4 font-mono text-xs text-slate-200">
                        {truncateId(r.receipt_id)}
                      </td>
                      <td className="py-3 pr-4">{decisionBadge(r.decision)}</td>
                      <td className="py-3 pr-4 text-slate-400">
                        {formatTimestamp(r.created_at)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            r.dry_run
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-blue-500/20 text-blue-300"
                          }`}
                        >
                          {r.dry_run ? "mock" : "real"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Detail panel */}
        {selectedId && (
          <section className="rounded-xl border border-primary-400/20 bg-primary-500/5 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-primary-300">
                Receipt Detail
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopyJson}
                  disabled={!detail}
                  className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
                >
                  {jsonCopied ? "Copied!" : "Copy JSON"}
                </button>
                <button
                  onClick={handleVerify}
                  disabled={verifyStatus === "loading"}
                  className="rounded-md bg-primary-500 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-primary-400 disabled:opacity-50"
                >
                  {verifyStatus === "loading"
                    ? "Verifying…"
                    : "Verify Receipt"}
                </button>
              </div>
            </div>

            {/* Verify result */}
            {verifyStatus === "verified" && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                ✅ Verified - receipt integrity confirmed.
              </div>
            )}
            {verifyStatus === "tampered" && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                ❌ Tampered - receipt integrity check failed.
              </div>
            )}
            {verifyStatus === "error" && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                Verification request failed. Please try again.
              </div>
            )}

            {/* Loading detail */}
            {detailLoading && (
              <div className="animate-pulse rounded-lg border border-white/5 bg-white/[0.02] p-4">
                <div className="h-4 w-1/3 rounded bg-white/10" />
                <div className="mt-3 h-3 w-full rounded bg-white/5" />
                <div className="mt-2 h-3 w-2/3 rounded bg-white/5" />
              </div>
            )}

            {/* Detail error */}
            {detailError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {detailError}
              </div>
            )}

            {/* Detail content */}
            {detail && !detailLoading && (
              <div className="space-y-4">
                {/* Policy breakdown */}
                {Array.isArray(
                  (detail as Record<string, unknown>).policy_breakdown,
                ) && (
                  <div className="rounded-lg border border-white/10 bg-neutral-900 p-4 space-y-2">
                    <h3 className="text-xs font-medium text-slate-400">
                      Policy Breakdown
                    </h3>
                    <div className="space-y-1">
                      {(
                        (detail as Record<string, unknown>)
                          .policy_breakdown as Array<{
                          policy: string;
                          result: string;
                        }>
                      ).map((p) => (
                        <div
                          key={p.policy}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-slate-300 font-mono">
                            {p.policy}
                          </span>
                          <span
                            className={
                              p.result === "PASS"
                                ? "text-emerald-400"
                                : "text-red-400"
                            }
                          >
                            {p.result}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="rounded-lg border border-white/10 bg-neutral-900 p-4 space-y-2">
                  <h3 className="text-xs font-medium text-slate-400">
                    Metadata
                  </h3>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    {(detail as Record<string, unknown>).content_hash != null && (
                      <>
                        <dt className="text-slate-500">Content Hash</dt>
                        <dd className="font-mono text-slate-200 break-all">
                          {String(
                            (detail as Record<string, unknown>).content_hash,
                          )}
                        </dd>
                      </>
                    )}
                    {(detail as Record<string, unknown>).protected_by != null && (
                      <>
                        <dt className="text-slate-500">Protected By</dt>
                        <dd className="text-slate-200">
                          {String(
                            (detail as Record<string, unknown>).protected_by,
                          )}
                        </dd>
                      </>
                    )}
                  </dl>
                </div>

                {/* Full JSON */}
                <div className="rounded-lg border border-white/10 bg-neutral-900 p-4">
                  <h3 className="text-xs font-medium text-slate-400 mb-2">
                    Full Receipt JSON
                  </h3>
                  <pre className="overflow-x-auto text-xs text-slate-200 font-mono max-h-80 overflow-y-auto">
                    {JSON.stringify(detail, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

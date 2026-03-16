/* ────────────────────────────────────────────────────────────────
 *  AdminDegradedTelemetry — operator-visible degraded-page counters
 *
 *  Fetches aggregate degraded admin-page counts from the authenticated
 *  /api/admin/security endpoint and renders a compact summary card.
 *
 *  - No secrets, IPs, stack traces, or raw backend errors displayed.
 *  - Aggregate counts only, derived from process-local in-memory state.
 *  - Fails gracefully if the telemetry endpoint is unreachable.
 * ──────────────────────────────────────────────────────────── */

"use client";

import { useEffect, useState } from "react";

interface DegradedTelemetry {
  admin_page_degraded_total: number;
  admin_page_degraded_by_page: Record<string, number>;
}

export function AdminDegradedTelemetry() {
  const [data, setData] = useState<DegradedTelemetry | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/security", {
          credentials: "same-origin",
        });
        if (!res.ok) {
          setError(true);
          return;
        }
        const json = await res.json();
        if (!cancelled) {
          setData({
            admin_page_degraded_total:
              json.admin_page_degraded_total ?? 0,
            admin_page_degraded_by_page:
              json.admin_page_degraded_by_page ?? {},
          });
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-4">
        <p className="text-xs text-slate-400">
          Degraded-page telemetry unavailable.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-4">
        <p className="text-xs text-slate-400">Loading degraded-page telemetry…</p>
      </div>
    );
  }

  const total = data.admin_page_degraded_total;
  const byPage = data.admin_page_degraded_by_page;
  const pageEntries = Object.entries(byPage).sort(
    ([, a], [, b]) => b - a,
  );
  const hasAny = total > 0;

  return (
    <div
      data-testid="degraded-telemetry-panel"
      className={`rounded-lg border px-4 py-4 ${
        hasAny
          ? "border-amber-500/20 bg-amber-500/[0.04]"
          : "border-white/10 bg-white/5"
      }`}
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
        Admin Page Stability
      </h2>

      <div className="mt-3 flex items-center gap-3">
        <span
          data-testid="degraded-total"
          className={`text-2xl font-bold ${
            hasAny ? "text-amber-300" : "text-slate-100"
          }`}
        >
          {total}
        </span>
        <span className="text-xs text-slate-400">
          degraded admin renders (process lifetime)
        </span>
      </div>

      {hasAny && (
        <p className="mt-2 text-xs text-amber-400/80">
          Backend instability observed — some admin pages returned
          temporary fallback content.
        </p>
      )}

      {!hasAny && (
        <p className="mt-2 text-xs text-emerald-400/70">
          No degraded admin renders detected.
        </p>
      )}

      {pageEntries.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">
            By page
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {pageEntries.map(([page, count]) => (
              <div
                key={page}
                className="rounded border border-white/10 bg-neutral-900/60 px-3 py-2"
              >
                <p className="text-xs text-slate-400">{page}</p>
                <p className="text-sm font-semibold text-slate-100">
                  {count}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-3 text-[10px] text-slate-500">
        Process-local aggregate counters. Resets on deploy or restart.
      </p>
    </div>
  );
}

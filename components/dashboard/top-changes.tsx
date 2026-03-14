/* ────────────────────────────────────────────────────────────────
 *  TopChanges - concise directional change summary strip
 *
 *  Surfaces the most meaningful recent directional changes in
 *  the current dashboard view. Summarizes trend deltas so the
 *  operator can quickly identify what shifted without scanning
 *  every detail panel.
 *
 *  When no material changes are detected, shows a calm fallback.
 *  All signals are grounded in existing trend + data utilities.
 * ──────────────────────────────────────────────────────────── */

"use client";

import { useCallback } from "react";
import type { ChangeItem } from "@/lib/dashboard-queue";
import { sectionLabel } from "@/lib/dashboard-queue";
import { trendText, trendIndicator } from "@/lib/trend";

type TopChangesProps = {
  items: ChangeItem[];
};

/** Map section targets to aria-label of dashboard <section> elements. */
const SECTION_ARIA: Record<string, string> = {
  health: "System health",
  enforcement: "Enforcement posture",
  tenants: "Tenant summary",
  activity: "Activity trends",
};

export function TopChanges({ items }: TopChangesProps) {
  const scrollTo = useCallback((target: string) => {
    const ariaLabel = SECTION_ARIA[target];
    if (!ariaLabel) return;
    const el = document.querySelector(`section[aria-label="${ariaLabel}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  /* ── No material changes ────────────────────────────────── */
  if (items.length === 0) {
    return (
      <div className="dashboard-panel p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
            Top Changes
          </span>
          <span className="text-[11px] text-slate-500">
            No material changes in current interval
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-panel p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
          Top Changes
        </span>
        <span className="text-[10px] tabular-nums text-slate-600">
          {items.length} {items.length === 1 ? "signal" : "signals"}
        </span>
      </div>
      <p className="mb-2 text-[10px] text-slate-600">
        Derived from current interval trend data
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <div
            key={`${item.target ?? "x"}-${i}`}
            className="
              flex items-center gap-2 rounded-lg border
              border-slate-500/10 bg-slate-950/30
              px-3 py-1.5
            "
          >
            <span
              className={`text-[12px] leading-none ${trendText[item.direction]}`}
              aria-hidden="true"
            >
              {trendIndicator[item.direction]}
            </span>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-slate-300">
                {item.title}
              </span>
              <span className="text-[10px] text-slate-500 ml-1.5">
                {item.detail}
              </span>
            </div>
            {item.target && (
              <button
                type="button"
                onClick={() => scrollTo(item.target!)}
                className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors cursor-pointer shrink-0 ml-1"
                title={`Review in ${sectionLabel[item.target]}`}
              >
                {sectionLabel[item.target]}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

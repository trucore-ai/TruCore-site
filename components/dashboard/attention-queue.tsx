/* ────────────────────────────────────────────────────────────────
 *  AttentionQueue - compact ranked priority queue for operators
 *
 *  Surfaces the highest-priority current items in a short list
 *  so the operator can decide what to inspect first without
 *  scanning every panel. Each item includes a concise title,
 *  reason, priority level, and optional section destination.
 *
 *  When nothing requires attention, shows a calm all-clear state.
 *  All signals are derived from existing grounded data.
 * ──────────────────────────────────────────────────────────── */

"use client";

import { useCallback } from "react";
import type { QueueItem } from "@/lib/dashboard-queue";
import { sectionLabel } from "@/lib/dashboard-queue";
import { attentionDot, attentionText, attentionBorder } from "@/lib/attention";
import { EvidenceRow } from "@/components/dashboard/evidence-row";

type AttentionQueueProps = {
  items: QueueItem[];
};

/** Map section targets to the aria-label used on dashboard <section> elements. */
const SECTION_ARIA: Record<string, string> = {
  health: "System health",
  enforcement: "Enforcement posture",
  tenants: "Tenant summary",
  activity: "Activity trends",
};

export function AttentionQueue({ items }: AttentionQueueProps) {
  const scrollTo = useCallback((target: string) => {
    const ariaLabel = SECTION_ARIA[target];
    if (!ariaLabel) return;
    const el = document.querySelector(`section[aria-label="${ariaLabel}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  /* ── All-clear state ────────────────────────────────────── */
  if (items.length === 0) {
    return (
      <div className="dashboard-panel p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="inline-block h-2 w-2 rounded-full bg-emerald-400"
              aria-hidden="true"
            />
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
              Attention Queue
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            No items require review in current interval
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-panel p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`inline-block h-2 w-2 rounded-full ${attentionDot[items[0].level]}`}
          aria-hidden="true"
        />
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
          Attention Queue
        </span>
        <span className="text-[10px] tabular-nums text-slate-600">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>
      <p className="mb-2 text-[10px] text-slate-600">
        Derived from current health, enforcement, and tenant signals
      </p>
      <ul className="space-y-2" role="list">
        {items.map((item, i) => (
          <li
            key={`${item.target ?? "x"}-${i}`}
            className={`
              flex items-start gap-2.5 rounded-lg border px-3 py-2
              ${attentionBorder[item.level]}
              bg-slate-950/30
            `}
          >
            <span
              className={`mt-1.5 inline-block h-1.5 w-1.5 rounded-full shrink-0 ${attentionDot[item.level]}`}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span
                  className={`text-[12px] font-medium leading-snug ${attentionText[item.level]}`}
                >
                  {item.title}
                </span>
                {item.target && (
                  <button
                    type="button"
                    onClick={() => scrollTo(item.target!)}
                    className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    title={`Review in ${sectionLabel[item.target]}`}
                  >
                    {sectionLabel[item.target]} &darr;
                  </button>
                )}
              </div>
              <p className="text-[10px] leading-snug text-slate-500 mt-0.5">
                {item.reason}
              </p>
              {item.note && (
                <p className="text-[10px] leading-snug text-slate-600 mt-0.5">
                  {item.note}
                </p>
              )}
              {item.basis && (
                <EvidenceRow label="basis" basis={item.basis} />
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

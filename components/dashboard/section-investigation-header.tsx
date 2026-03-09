/* ────────────────────────────────────────────────────────────────
 *  SectionInvestigationHeader - compact local status bar
 *
 *  A lightweight, reusable investigation header for dashboard
 *  sections. Provides a one-line local status summary so
 *  operators immediately understand section state after jumping
 *  from the Attention Queue or Top Changes modules.
 *
 *  Intentionally smaller and tighter than page-level summaries.
 *  Uses existing badge/divider language and restrained metadata
 *  styling to preserve dashboard hierarchy.
 * ──────────────────────────────────────────────────────────── */

import type { PanelStatus } from "@/lib/attention";
import { panelStatusBadge } from "@/lib/attention";

export type InvestigationState = {
  /** Panel-level status classification. */
  status: PanelStatus;
  /** One-line investigation summary, concise and operator-grade. */
  summary: string;
  /** Optional secondary context (e.g. recency, directional note). */
  detail?: string;
};

type Props = {
  state: InvestigationState;
};

/** Left-border accent color per panel status. */
const accentBorder: Record<PanelStatus, string> = {
  stable: "border-emerald-500/15",
  review: "border-amber-500/20",
  idle: "border-slate-500/12",
  reduced: "border-amber-500/15",
  degraded: "border-red-500/20",
  offline: "border-red-500/25",
};

export function SectionInvestigationHeader({ state }: Props) {
  const badge = panelStatusBadge[state.status];

  return (
    <div
      className={`mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-md border-l-2 bg-white/[0.015] px-3.5 py-2.5 ${accentBorder[state.status]}`}
      role="status"
      aria-label="Section investigation summary"
    >
      <span
        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium leading-none ${badge.bg} ${badge.text} ${badge.border}`}
      >
        {badge.label}
      </span>
      <p className="text-[11px] leading-snug text-slate-400">
        {state.summary}
      </p>
      {state.detail && (
        <p className="basis-full text-[10px] leading-snug text-slate-600 pl-0.5">
          {state.detail}
        </p>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
 *  AcquisitionStrip — server-rendered acquisition funnel summary
 *
 *  Lightweight top-of-funnel snapshot for the operator dashboard.
 *  Data sourced from the site waitlist DB, not from ATF. Renders
 *  independently from the DashboardShell polling mechanism.
 *
 *  Shows: signup volume (7d/30d), design partner count, pipeline
 *  status breakdown, activation linkage rate, and a link to the
 *  full /admin/acquisition page for detail.
 *
 *  Operator-only. Never shown to tenant users.
 * ──────────────────────────────────────────────────────────── */

import {
  getAcquisitionFunnelSnapshot,
  type AcquisitionFunnelSnapshot,
} from "@/lib/db";
import {
  enrichWithGuidance,
  computePrioritySummary,
  PRIORITY_CONFIG,
} from "@/lib/acquisition-followup";

export async function AcquisitionStrip() {
  let data: AcquisitionFunnelSnapshot | null = null;
  try {
    data = await getAcquisitionFunnelSnapshot();
  } catch {
    // DB may not be connected — degrade silently
  }

  if (!data || data.total_signups === 0) {
    return (
      <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
        <p className="text-xs text-slate-600">
          Acquisition funnel data not available. Waitlist signups will
          appear here once builders start applying.
        </p>
      </div>
    );
  }

  const linkageRate =
    data.total_signups > 0
      ? ((data.signups_with_api_key / data.total_signups) * 100).toFixed(1)
      : "0";

  /* Derive follow-up priority summary for recent leads */
  const guidedRows = enrichWithGuidance(data.recent);
  const prioritySummary = computePrioritySummary(guidedRows);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Top-of-Funnel Acquisition
        </h3>
        <a
          href="/admin/acquisition"
          className="text-[10px] font-medium text-primary-400 hover:text-primary-300 transition"
        >
          Full detail →
        </a>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-9">
        <Chip label="Total" value={data.total_signups} />
        <Chip label="7d" value={data.signups_7d} accent />
        <Chip label="30d" value={data.signups_30d} />
        <Chip label="DPs" value={data.design_partner_count} />
        <Chip label="Qualified" value={data.by_status.qualified} />
        <Chip label="API key" value={data.signups_with_api_key} />
        <Chip
          label="Link rate"
          valueStr={`${linkageRate}%`}
          hint="Signups → API key"
        />
        <Chip
          label="No key yet"
          value={data.stalled_before_api_key}
          hint="Signed up but no API key"
        />
        <Chip
          label="Key, no portal"
          value={data.stalled_before_portal}
          hint="Has API key but not portal-active"
        />
      </div>

      {/* Follow-up priority summary */}
      {prioritySummary.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
          <span className="font-medium text-slate-400">Follow-up:</span>
          {prioritySummary.map((ps) => (
            <span
              key={ps.priority}
              className="inline-flex items-center gap-1 rounded bg-white/5 px-1.5 py-0.5"
            >
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${ps.color}`} />
              <span className="font-semibold text-slate-400">{ps.count}</span>
              <span>{PRIORITY_CONFIG[ps.priority as keyof typeof PRIORITY_CONFIG].label}</span>
            </span>
          ))}
        </div>
      )}

      {data.top_sources.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
          <span className="font-medium text-slate-400">Top paths:</span>
          {data.top_sources.slice(0, 4).map((s) => (
            <span
              key={s.source}
              className="rounded bg-white/5 px-1.5 py-0.5"
            >
              {s.source}{" "}
              <span className="font-semibold text-slate-400">{s.count}</span>
            </span>
          ))}
        </div>
      )}

      {data.top_utm_sources.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
          <span className="font-medium text-slate-400">UTM sources:</span>
          {data.top_utm_sources.slice(0, 4).map((s) => (
            <span
              key={s.source}
              className="rounded bg-white/5 px-1.5 py-0.5"
            >
              {s.source}{" "}
              <span className="font-semibold text-slate-400">{s.count}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────── */

function Chip({
  label,
  value,
  valueStr,
  accent,
  hint,
}: {
  label: string;
  value?: number;
  valueStr?: string;
  accent?: boolean;
  hint?: string;
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        accent
          ? "border-primary-300/15 bg-primary-500/[0.04]"
          : "border-white/10 bg-white/5"
      }`}
      title={hint}
    >
      <p className="text-[10px] uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="text-lg font-semibold text-slate-100">
        {valueStr ?? value}
      </p>
    </div>
  );
}

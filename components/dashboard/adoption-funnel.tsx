/* ────────────────────────────────────────────────────────────────
 *  AdoptionFunnel - platform-wide adoption metrics for operators
 *
 *  Displays activation milestones, source attribution, and
 *  platform-wide usage aggregates to help operators measure
 *  early-user-acquisition progress. Platform-scoped, read-only,
 *  never shown to tenants.
 *
 *  Milestone funnel:
 *    Onboarded → First protect → First receipt → First verify → Repeat active
 *
 *  Source attribution:
 *    Inferred from endpoint patterns — bounded approximation,
 *    not guaranteed accurate. See docs for limitations.
 * ──────────────────────────────────────────────────────────── */

import type {
  AdoptionFunnel as AdoptionFunnelData,
  TenantActivationSnapshot,
} from "@/lib/dashboard-client";

type Props = {
  data: AdoptionFunnelData;
};

function compactNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "Never";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return iso;
  }
}

function FunnelBar({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  const ratio = pct(count, total);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono text-slate-300">
          {count} / {total}{" "}
          <span className="text-slate-500">({ratio}%)</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-primary-500/60 transition-all duration-500"
          style={{ width: `${Math.max(ratio, 1)}%` }}
        />
      </div>
    </div>
  );
}

function DropOff({ from, to }: { from: number; to: number }) {
  if (from <= 0) return null;
  const dropped = from - to;
  const dropPct = pct(dropped, from);
  if (dropped <= 0) return null;
  return (
    <div className="flex items-center gap-2 pl-2 text-[10px] text-slate-600">
      <span className="text-red-400/70">&darr; {dropped} dropped</span>
      <span>({dropPct}% drop-off)</span>
    </div>
  );
}

function MilestoneIcon({ reached }: { reached: boolean }) {
  return (
    <span
      className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
        reached
          ? "bg-emerald-500/20 text-emerald-400"
          : "bg-white/5 text-slate-600"
      }`}
    >
      {reached ? "✓" : "·"}
    </span>
  );
}

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  onboarded: { label: "Onboarded", color: "bg-slate-500/20 text-slate-400" },
  first_protect: { label: "Protected", color: "bg-blue-500/20 text-blue-400" },
  first_receipt: { label: "Receipt", color: "bg-violet-500/20 text-violet-400" },
  first_verify: { label: "Verified", color: "bg-emerald-500/20 text-emerald-400" },
  repeat_active: { label: "Repeat", color: "bg-amber-500/20 text-amber-300" },
};

function stalledLabel(stage: string): string {
  const map: Record<string, string> = {
    first_protect: "Stalled at Protect",
    first_receipt: "Stalled at Receipt",
    first_verify: "Stalled at Verify",
  };
  return map[stage] ?? "Stalled";
}

function StageBadge({ stage }: { stage: string }) {
  const cfg = STAGE_LABELS[stage] ?? STAGE_LABELS.onboarded;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const colors: Record<string, string> = {
    cli: "bg-cyan-500/20 text-cyan-400",
    http: "bg-blue-500/20 text-blue-400",
    python: "bg-yellow-500/20 text-yellow-400",
    typescript: "bg-indigo-500/20 text-indigo-400",
    openclaw: "bg-purple-500/20 text-purple-400",
    unknown: "bg-white/5 text-slate-500",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${colors[source] ?? colors.unknown}`}
    >
      {source}
    </span>
  );
}

function TenantRow({ snap }: { snap: TenantActivationSnapshot }) {
  const stage = snap.activation_stage ?? "onboarded";
  const source = snap.dominant_source ?? "unknown";
  const isStalled = !!(snap.stalled_stage && snap.stalled_stage.length > 0);
  const dormantDays = snap.dormant_days ?? 0;
  return (
    <tr className={`border-b border-white/5 text-xs transition-colors hover:bg-white/[0.02] ${isStalled ? "bg-amber-500/[0.04]" : ""}`}>
      <td className="py-2 pr-3 font-medium text-slate-300">
        <span>{snap.display_name || snap.tenant_id}</span>
        {isStalled && (
          <span className="ml-2 inline-flex items-center rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-medium text-amber-300">
            {stalledLabel(snap.stalled_stage!)} · {dormantDays}d
          </span>
        )}
      </td>
      <td className="py-2 pr-3 text-slate-500">{snap.plan_tier}</td>
      <td className="py-2 pr-3 text-center">
        <StageBadge stage={stage} />
      </td>
      <td className="py-2 pr-3 text-center">
        <MilestoneIcon reached={snap.has_first_protect} />
      </td>
      <td className="py-2 pr-3 text-center">
        <MilestoneIcon reached={snap.has_first_receipt} />
      </td>
      <td className="py-2 pr-3 text-center">
        <MilestoneIcon reached={snap.has_first_verify} />
      </td>
      <td className="py-2 pr-3 text-center">
        <SourceBadge source={source} />
      </td>
      <td className="py-2 pr-3 text-right font-mono text-slate-400">
        {compactNum(snap.requests_total)}
      </td>
      <td className="py-2 text-right text-slate-500">
        {relativeTime(snap.last_seen_at ?? snap.last_activity_ts)}
      </td>
    </tr>
  );
}

export function AdoptionFunnelPanel({ data }: Props) {
  const total = data.total_tenants;
  const repeatActive = data.repeat_active_tenants ?? 0;
  const stalledCount = data.stalled_tenants ?? 0;
  const dormantCount = data.dormant_tenants ?? 0;

  // Sort tenants: stalled first, then by last_seen descending
  const sortedSnapshots = [...data.tenant_snapshots].sort((a, b) => {
    const aStalled = a.stalled_stage ? 1 : 0;
    const bStalled = b.stalled_stage ? 1 : 0;
    if (aStalled !== bStalled) return bStalled - aStalled;
    const aTime = a.last_seen_at ?? a.last_activity_ts ?? "";
    const bTime = b.last_seen_at ?? b.last_activity_ts ?? "";
    return bTime.localeCompare(aTime);
  });

  const topEndpoints = Object.entries(data.endpoint_mix)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);
  const sourceSummary = Object.entries(data.source_summary ?? {})
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-6">
      {/* ── Platform summary cards ─────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Total Tenants", value: total },
          { label: "Active", value: data.active_tenants },
          { label: "Repeat Active", value: repeatActive },
          { label: "Stalled", value: stalledCount },
          { label: "Total Requests", value: data.total_requests },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-white/10 bg-white/[0.02] p-3"
          >
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              {card.label}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-slate-100">
              {compactNum(card.value)}
            </p>
          </div>
        ))}
      </div>

      {/* ── Activation funnel ──────────────────────────────── */}
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Activation Funnel
        </h3>
        <div className="space-y-2">
          <FunnelBar label="Onboarded" count={total} total={total} />
          <DropOff from={total} to={data.tenants_with_requests} />
          <FunnelBar
            label="First Protect"
            count={data.tenants_with_requests}
            total={total}
          />
          <DropOff from={data.tenants_with_requests} to={data.tenants_with_receipts} />
          <FunnelBar
            label="First Receipt"
            count={data.tenants_with_receipts}
            total={total}
          />
          <DropOff from={data.tenants_with_receipts} to={data.tenants_with_verifies} />
          <FunnelBar
            label="First Verify"
            count={data.tenants_with_verifies}
            total={total}
          />
          <DropOff from={data.tenants_with_verifies} to={repeatActive} />
          <FunnelBar
            label="Repeat Active (~7d)"
            count={repeatActive}
            total={total}
          />
        </div>
      </div>

      {/* ── Volume totals + Source mix (side by side on wide) ─ */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Protects", value: data.total_requests },
            { label: "Total Receipts", value: data.total_receipts_written },
            { label: "Total Verifies", value: data.total_receipts_verified },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-lg border border-white/10 bg-white/[0.02] p-3"
            >
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                {card.label}
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-slate-100">
                {compactNum(card.value)}
              </p>
            </div>
          ))}
        </div>

        {/* ── Source attribution ────────────────────────────── */}
        {sourceSummary.length > 0 && (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Integration Sources
            </h3>
            <p className="mb-3 text-[9px] leading-relaxed text-slate-600">
              Best-effort attribution. Clients that send the{" "}
              <code className="rounded bg-white/5 px-1 font-mono text-[9px] text-slate-500">
                X-ATF-Client
              </code>{" "}
              header are attributed directly; remaining traffic is
              inferred from endpoint patterns. Python &amp; TypeScript
              require the explicit header for accurate counts.
            </p>
            <div className="space-y-2">
              {sourceSummary.map(([src, count]) => (
                <div
                  key={src}
                  className="flex items-center justify-between text-xs"
                >
                  <SourceBadge source={src} />
                  <span className="font-mono text-slate-300">
                    {compactNum(count)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Endpoint mix ───────────────────────────────────── */}
      {topEndpoints.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Endpoint Mix
          </h3>
          <div className="space-y-2">
            {topEndpoints.map(([ep, count]) => (
              <div
                key={ep}
                className="flex items-center justify-between text-xs"
              >
                <span className="font-mono text-slate-400">{ep}</span>
                <span className="font-mono text-slate-300">
                  {compactNum(count)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tenant activation table ────────────────────────── */}
      {sortedSnapshots.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Tenant Activation Status
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="pb-2 pr-3 font-medium">Tenant</th>
                  <th className="pb-2 pr-3 font-medium">Plan</th>
                  <th className="pb-2 pr-3 text-center font-medium">Stage</th>
                  <th className="pb-2 pr-3 text-center font-medium">
                    Protect
                  </th>
                  <th className="pb-2 pr-3 text-center font-medium">
                    Receipt
                  </th>
                  <th className="pb-2 pr-3 text-center font-medium">
                    Verify
                  </th>
                  <th className="pb-2 pr-3 text-center font-medium">
                    Source
                  </th>
                  <th className="pb-2 pr-3 text-right font-medium">
                    Requests
                  </th>
                  <th className="pb-2 text-right font-medium">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {sortedSnapshots.map((snap) => (
                  <TenantRow key={snap.tenant_id} snap={snap} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

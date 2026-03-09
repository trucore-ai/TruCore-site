/* ────────────────────────────────────────────────────────────────
 *  TenantDetailHero - identity, plan, and status at a glance
 *
 *  Premium header card for the tenant drill-down page.
 *  Shows the tenant name, ID, plan tier, status badge, key count,
 *  creation date, last seen timestamp, and v1.45.0 activity
 *  signals (requests today, last hour, receipts today, last
 *  activity). Designed to give operators instant context before
 *  scanning the detail panels.
 * ──────────────────────────────────────────────────────────── */

import type { TenantDetail } from "@/lib/dashboard-client";
import { StatusChip } from "@/components/dashboard/status-chip";

function compactNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function relativeTime(iso: string | null): string {
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

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

const tierColors: Record<string, string> = {
  free: "text-slate-400",
  starter: "text-sky-300",
  pro: "text-primary-300",
  enterprise: "text-amber-300",
};

type TenantDetailHeroProps = {
  tenant: TenantDetail;
};

export function TenantDetailHero({ tenant }: TenantDetailHeroProps) {
  const tierAccent =
    tierColors[tenant.plan_tier.toLowerCase()] ?? "text-primary-300";

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025] shadow-sm shadow-black/10">
      {/* Top gradient highlight */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(180,220,248,0.08) 30%, rgba(200,235,255,0.14) 50%, rgba(180,220,248,0.08) 70%, transparent 100%)",
        }}
      />

      <div className="p-6 sm:p-8">
        {/* Name + status row */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-[1.75rem] font-bold tracking-tight text-slate-50">
              {tenant.name}
            </h1>
            <p className="mt-1.5 font-mono text-xs text-slate-600">
              {tenant.id}
            </p>
          </div>
          <StatusChip
            status={tenant.status}
            pulse={tenant.status === "active"}
          />
        </div>

        {/* Separator */}
        <div className="mt-6 h-px bg-white/[0.05]" />

        {/* Meta strip */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <MetaItem
            label="Plan Tier"
            value={tenant.plan_tier}
            className={tierAccent}
          />
          <MetaItem
            label="API Keys"
            value={tenant.key_count.toLocaleString()}
          />
          <MetaItem label="Created" value={formatDate(tenant.created_at)} />
          <MetaItem
            label="Last Seen"
            value={relativeTime(tenant.last_activity_ts ?? tenant.last_seen)}
          />
        </div>

        {/* v1.45.0 activity strip (only when data is present) */}
        {(tenant.requests_today != null ||
          tenant.requests_last_hour != null ||
          tenant.receipts_written_today != null) && (
          <>
            <div className="mt-5 h-px bg-white/[0.04]" />
            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              {tenant.requests_today != null && (
                <MetaItem
                  label="Requests Today"
                  value={compactNum(tenant.requests_today)}
                  className="text-slate-100"
                />
              )}
              {tenant.requests_last_hour != null && (
                <MetaItem
                  label="Requests (1h)"
                  value={compactNum(tenant.requests_last_hour)}
                  className="text-sky-300"
                />
              )}
              {tenant.receipts_written_today != null && (
                <MetaItem
                  label="Receipts Today"
                  value={compactNum(tenant.receipts_written_today)}
                  className="text-slate-100"
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Small inline metadata item ───────────────────────────── */

function MetaItem({
  label,
  value,
  className = "text-slate-200",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-sm font-medium ${className}`}>{value}</p>
    </div>
  );
}

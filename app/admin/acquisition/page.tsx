import { redirect } from "next/navigation";
import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import {
  getAcquisitionFunnelSnapshot,
  type AcquisitionFunnelSnapshot,
  type AcquisitionRecentRow,
} from "@/lib/db";

/* ────────────────────────────────────────────────────────────────
 *  /admin/acquisition — Operator Acquisition Funnel
 *
 *  Internal-only view of top-of-funnel builder acquisition signals.
 *  Shows signup volume, time-windowed trends, source/UTM breakdowns,
 *  pipeline progression, recent submissions, and activation linkage.
 *
 *  Gated behind admin session. Never shown to public users.
 * ──────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminAcquisitionPage() {
  const isValid = await getAdminSessionFromCookies();
  if (!isValid) redirect("/admin/login");

  const data = await getAcquisitionFunnelSnapshot();

  return (
    <div className="min-h-screen bg-neutral-950 p-6 text-slate-100 md:p-10">
      {/* ── Header + nav ──────────────────────────────────── */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Acquisition Funnel
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Top-of-funnel builder interest, application volume, and
            activation linkage — operator only
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NavLink href="/admin/waitlist" label="Waitlist" />
          <NavLink href="/admin/metrics" label="Metrics" />
          <NavLink href="/admin/keys" label="API Keys" />
          <NavLink href="/dashboard" label="Dashboard" />
          <form method="POST" action="/admin/logout">
            <button
              type="submit"
              className="rounded border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
            >
              Logout
            </button>
          </form>
        </div>
      </div>

      {/* ── KPI cards ─────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Total signups" value={data.total_signups} />
        <KpiCard label="Last 7d" value={data.signups_7d} accent />
        <KpiCard label="Last 30d" value={data.signups_30d} />
        <KpiCard
          label="Design partners"
          value={data.design_partner_count}
        />
        <KpiCard label="DPs (7d)" value={data.design_partners_7d} accent />
        <KpiCard label="DPs (30d)" value={data.design_partners_30d} />
      </div>

      {/* ── Pipeline funnel ───────────────────────────────── */}
      <div className="mb-8">
        <SectionHeading>Pipeline Progression</SectionHeading>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <FunnelStep label="New" value={data.by_status.new} color="bg-emerald-500/20 text-emerald-300" />
          <FunnelStep label="Contacted" value={data.by_status.contacted} color="bg-sky-500/20 text-sky-300" />
          <FunnelStep label="Qualified" value={data.by_status.qualified} color="bg-violet-500/20 text-violet-300" />
          <FunnelStep label="Closed" value={data.by_status.closed} color="bg-neutral-500/20 text-neutral-400" />
        </div>
      </div>

      {/* ── Activation linkage ────────────────────────────── */}
      <div className="mb-8">
        <SectionHeading>Acquisition → Activation Linkage</SectionHeading>
        <p className="mt-1 text-[10px] text-slate-600">
          Signups whose email matches an issued API key or active portal
          token. Identity linkage is email-based and partial — not all
          ATF tenants enter via the waitlist.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <LinkageCard
            label="Total signups"
            value={data.total_signups}
          />
          <LinkageCard
            label="Have API key"
            value={data.signups_with_api_key}
            pct={pct(data.signups_with_api_key, data.total_signups)}
          />
          <LinkageCard
            label="Active portal token"
            value={data.signups_with_portal_token}
            pct={pct(data.signups_with_portal_token, data.total_signups)}
          />
          <LinkageCard
            label="Qualified in pipeline"
            value={data.by_status.qualified}
            pct={pct(data.by_status.qualified, data.total_signups)}
          />
        </div>
      </div>

      {/* ── Source breakdowns (2-col) ─────────────────────── */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <RankTable
          title="Entry Path (source)"
          emptyLabel="No source data yet."
          rows={data.top_sources.map((r) => ({
            key: r.source,
            count: r.count,
          }))}
        />
        <RankTable
          title="UTM Source"
          emptyLabel="No UTM source data yet."
          rows={data.top_utm_sources.map((r) => ({
            key: r.source,
            count: r.count,
          }))}
        />
        <RankTable
          title="UTM Campaign"
          emptyLabel="No campaign data yet."
          rows={data.top_campaigns.map((r) => ({
            key: r.campaign,
            count: r.count,
          }))}
        />
      </div>

      {/* ── Recent submissions ────────────────────────────── */}
      <div className="mb-8">
        <SectionHeading>Recent Submissions</SectionHeading>
        <RecentTable rows={data.recent} />
      </div>

      {/* ── Interpretation note ───────────────────────────── */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 text-[10px] leading-relaxed text-slate-600">
        <strong className="text-slate-500">Interpretation notes:</strong>{" "}
        Activation linkage is email-based. Builders who sign up on the
        site and later register an ATF API key with the same email are
        counted as linked. Not all ATF tenants enter via the waitlist,
        and not all waitlist entries result in ATF activation. This view
        is directional, not exhaustive. Vercel Analytics events
        (builder page views, tracked link clicks) are not joined here —
        they live in the Vercel dashboard.
      </div>
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────── */

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="rounded border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
    >
      {label}
    </a>
  );
}

function KpiCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 ${
        accent
          ? "border-primary-300/20 bg-primary-500/[0.06]"
          : "border-white/10 bg-white/5"
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function FunnelStep({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-neutral-900/60 px-4 py-3 text-center">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-100">{value}</p>
      <span
        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${color}`}
      >
        {label}
      </span>
    </div>
  );
}

function LinkageCard({
  label,
  value,
  pct: pctVal,
}: {
  label: string;
  value: number;
  pct?: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-neutral-900/60 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-xl font-semibold text-slate-100">{value}</span>
        {pctVal && (
          <span className="text-xs text-slate-500">{pctVal}</span>
        )}
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
      {children}
    </h2>
  );
}

function RankTable({
  title,
  rows,
  emptyLabel,
}: {
  title: string;
  rows: Array<{ key: string; count: number }>;
  emptyLabel: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      <div className="border-b border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200">
        {title}
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-5 text-sm text-slate-400">{emptyLabel}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3 text-right">Count</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.key}
                className="border-b border-white/5 last:border-b-0"
              >
                <td className="px-4 py-3 text-slate-200">{row.key}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-100">
                  {row.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function RecentTable({ rows }: { rows: AcquisitionRecentRow[] }) {
  if (rows.length === 0) {
    return <p className="mt-2 text-sm text-slate-400">No submissions yet.</p>;
  }

  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Intent</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">UTM</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Project</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-white/5 last:border-b-0"
            >
              <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                {fmtDate(row.created_at)}
              </td>
              <td className="px-4 py-3 text-slate-200">
                {maskEmail(row.email)}
              </td>
              <td className="px-4 py-3">
                {row.intent === "design_partner" ? (
                  <span className="inline-block rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300">
                    DP
                  </span>
                ) : (
                  <span className="inline-block rounded-full bg-sky-500/20 px-2 py-0.5 text-xs font-semibold text-sky-300">
                    Std
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-slate-400">
                {row.source ?? "—"}
              </td>
              <td className="px-4 py-3 text-slate-400">
                {row.utm_source ?? "—"}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={row.status} />
              </td>
              <td className="px-4 py-3 text-slate-400">
                {row.project_name ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-emerald-500/20 text-emerald-300",
  contacted: "bg-sky-500/20 text-sky-300",
  qualified: "bg-violet-500/20 text-violet-300",
  closed: "bg-neutral-500/20 text-neutral-400",
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? STATUS_COLORS.new;
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}
    >
      {status}
    </span>
  );
}

/* ── Helpers ──────────────────────────────────────────────── */

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, 3);
  return `${visible}***@${domain}`;
}

function pct(numerator: number, denominator: number): string | undefined {
  if (denominator === 0) return undefined;
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

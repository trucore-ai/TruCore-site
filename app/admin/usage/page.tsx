import { listApiKeysWithUsageSummary } from "@/lib/db";
import { AdminDegradedState } from "@/components/dashboard/admin-degraded-state";
import { logSecurityEvent } from "@/lib/security-log";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function fmtDate(iso: string | null) {
  if (!iso) return "-";
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

function parseIncludeRevoked(raw: string | string[] | undefined): boolean {
  return raw === "1";
}

export default async function AdminUsagePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const includeRevoked = parseIncludeRevoked(params.includeRevoked);

  let rows: Awaited<ReturnType<typeof listApiKeysWithUsageSummary>>;
  let degraded = false;
  try {
    rows = await listApiKeysWithUsageSummary(300, { includeRevoked });
  } catch {
    logSecurityEvent("admin_page_degraded", {
      meta: { page: "usage", reason: "db_unavailable" },
    });
    degraded = true;
    rows = [];
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-6 text-slate-100 md:p-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Usage</h1>
        <div className="flex items-center gap-3">
          <a
            href="/admin/waitlist"
            className="rounded border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            Waitlist
          </a>
          <a
            href="/admin/keys"
            className="rounded border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            API Keys
          </a>
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

      <div className="mb-5 flex flex-wrap items-center gap-3 text-xs">
        <a
          href="/admin/usage"
          className={`rounded px-2.5 py-1 transition ${
            !includeRevoked
              ? "bg-primary-500/20 font-medium text-primary-300"
              : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
          }`}
        >
          Active only
        </a>
        <a
          href="/admin/usage?includeRevoked=1"
          className={`rounded px-2.5 py-1 transition ${
            includeRevoked
              ? "bg-primary-500/20 font-medium text-primary-300"
              : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
          }`}
        >
          Include revoked
        </a>
      </div>

      {degraded ? (
        <AdminDegradedState
          title="Usage"
          description="Usage data could not be loaded right now."
        />
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-400">No usage data available yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Label</th>
                <th className="px-4 py-3">Owner Email</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Revoked</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Last 24h</th>
                <th className="px-4 py-3">Last 7d</th>
                <th className="px-4 py-3">Last Seen</th>
                <th className="px-4 py-3">Top Endpoint</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-white/5 last:border-b-0">
                  <td className="px-4 py-3 text-slate-200">{row.label ?? row.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-300">{row.owner_email ?? "-"}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(row.created_at)}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {row.revoked_at ? fmtDate(row.revoked_at) : <span className="text-emerald-300">Active</span>}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-100">{row.total_requests}</td>
                  <td className="px-4 py-3 text-slate-200">{row.last_24h}</td>
                  <td className="px-4 py-3 text-slate-200">{row.last_7d}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(row.last_seen_at)}</td>
                  <td className="px-4 py-3 text-xs text-slate-300">
                    {row.top_endpoint ? `${row.top_endpoint} (${row.top_endpoint_count})` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

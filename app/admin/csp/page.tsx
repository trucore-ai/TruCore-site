import { redirect } from "next/navigation";
import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import { listCspReports, type CspReportRow } from "@/lib/db";

/* ---------- helpers ---------- */

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

function truncate(val: string | null, max = 80): string {
  if (!val) return "-";
  return val.length > max ? val.slice(0, max) + "..." : val;
}

const DISPOSITION_COLORS: Record<string, string> = {
  enforce: "bg-red-500/20 text-red-300",
  report: "bg-amber-500/20 text-amber-300",
};

function dispositionBadge(disposition: string | null) {
  const label = disposition ?? "unknown";
  const color = DISPOSITION_COLORS[label] ?? "bg-neutral-500/20 text-neutral-400";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
      {label}
    </span>
  );
}

/* ---------- page ---------- */

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminCspPage() {
  const isValid = await getAdminSessionFromCookies();
  if (!isValid) redirect("/admin/login");

  const reports: CspReportRow[] = await listCspReports(50);

  return (
    <div className="min-h-screen bg-neutral-950 text-slate-100 p-6 md:p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">CSP Reports</h1>
        <div className="flex items-center gap-3">
          <a
            href="/admin/waitlist"
            className="rounded bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/20 transition"
          >
            Back to Waitlist
          </a>
          <a
            href="/admin/audit"
            className="rounded bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/20 transition"
          >
            Audit Log
          </a>
          <form method="POST" action="/admin/logout">
            <button
              type="submit"
              className="rounded bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/20 transition"
            >
              Logout
            </button>
          </form>
        </div>
      </div>

      <p className="text-sm text-slate-400 mb-6">
        Last 50 CSP violation reports, newest first. Read-only. No blocked URIs or query strings are stored.
      </p>

      {/* Table */}
      {reports.length === 0 ? (
        <p className="text-slate-400">No CSP reports yet. That is a good sign.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Time (UTC)</th>
                <th className="px-4 py-3">Disposition</th>
                <th className="px-4 py-3">Effective Directive</th>
                <th className="px-4 py-3">Violated Directive</th>
                <th className="px-4 py-3">Document Origin</th>
                <th className="px-4 py-3">User Agent</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-white/5 hover:bg-white/[0.03] transition"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-slate-400 text-xs">
                    {fmtDate(r.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    {dispositionBadge(r.disposition)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {r.effective_directive ?? <span className="text-slate-600">-</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {r.violated_directive ?? <span className="text-slate-600">-</span>}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {r.document_origin ?? <span className="text-slate-600">-</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 max-w-xs truncate">
                    {truncate(r.user_agent, 60)}
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

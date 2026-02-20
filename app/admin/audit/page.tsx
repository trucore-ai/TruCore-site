import { redirect } from "next/navigation";
import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import { listAuditLogEntries, type AuditLogRow } from "@/lib/audit-log";

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

function truncateJson(obj: Record<string, unknown> | null, max = 120): string {
  if (!obj) return "-";
  const str = JSON.stringify(obj);
  return str.length > max ? str.slice(0, max) + "..." : str;
}

const ACTION_COLORS: Record<string, string> = {
  status_change: "bg-violet-500/20 text-violet-300",
  note_update: "bg-sky-500/20 text-sky-300",
  csv_export: "bg-amber-500/20 text-amber-300",
  admin_login: "bg-emerald-500/20 text-emerald-300",
  admin_logout: "bg-red-500/20 text-red-300",
};

function actionBadge(action: string) {
  const color =
    ACTION_COLORS[action] ?? "bg-neutral-500/20 text-neutral-400";
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}
    >
      {action}
    </span>
  );
}

/* ---------- page ---------- */

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminAuditPage() {
  const isValid = await getAdminSessionFromCookies();
  if (!isValid) redirect("/admin/login");

  const entries: AuditLogRow[] = await listAuditLogEntries(50);

  return (
    <div className="min-h-screen bg-neutral-950 text-slate-100 p-6 md:p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
        <div className="flex items-center gap-3">
          <a
            href="/admin/waitlist"
            className="rounded bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/20 transition"
          >
            Back to Waitlist
          </a>
          <a
            href="/admin/csp"
            className="rounded bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/20 transition"
          >
            CSP Reports
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
        Last 50 admin actions, newest first. Read-only.
      </p>

      {/* Table */}
      {entries.length === 0 ? (
        <p className="text-slate-400">No audit entries yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Time (UTC)</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target Email</th>
                <th className="px-4 py-3">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-white/5 hover:bg-white/[0.03] transition"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-slate-400 text-xs">
                    {fmtDate(entry.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    {actionBadge(entry.action)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {entry.target_email ?? (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 max-w-xs truncate">
                    {truncateJson(entry.metadata)}
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

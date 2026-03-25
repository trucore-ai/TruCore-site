import {
  fetchAdminUpgradeRequests,
  type UpgradeRequestEntry,
} from "@/lib/dashboard-client";
import { AdminDegradedState } from "@/components/dashboard/admin-degraded-state";
import { logSecurityEvent } from "@/lib/security-log";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-900/40 text-amber-300",
  approved: "bg-emerald-900/40 text-emerald-300",
  rejected: "bg-red-900/40 text-red-300",
  cancelled: "bg-slate-700/40 text-slate-400",
};

const PLAN_COLORS: Record<string, string> = {
  pro: "bg-blue-900/40 text-blue-300",
  enterprise: "bg-purple-900/40 text-purple-300",
};

function fmtDate(epoch: number) {
  if (!epoch) return "-";
  return new Date(epoch * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminUpgradesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; plan?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status || "";
  const planFilter = params.plan || "";

  let degraded = false;
  let requests: UpgradeRequestEntry[] = [];

  try {
    const result = await fetchAdminUpgradeRequests(
      statusFilter || undefined,
      planFilter || undefined,
    );
    if (result.ok) {
      requests = result.data.requests;
    } else {
      degraded = true;
    }
  } catch {
    logSecurityEvent("admin_page_degraded", {
      meta: { page: "upgrades", reason: "atf_unavailable" },
    });
    degraded = true;
  }

  const statuses = ["all", "pending", "approved", "rejected", "cancelled"];
  const plans = ["all", "pro", "enterprise"];

  return (
    <div className="min-h-screen bg-neutral-950 p-6 text-slate-100 md:p-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Upgrade Requests
        </h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="rounded border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/20"
          >
            Users
          </Link>
          <Link
            href="/admin/features"
            className="rounded border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/20"
          >
            Features
          </Link>
          <a
            href="/admin/audit"
            className="rounded border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/20"
          >
            Audit Log
          </a>
          <form method="POST" action="/admin/logout">
            <button
              type="submit"
              className="rounded border border-red-700/40 bg-red-900/30 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-900/50"
            >
              Logout
            </button>
          </form>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="mr-1 self-center text-xs text-slate-500">Status:</span>
        {statuses.map((s) => {
          const active =
            (s === "all" && !statusFilter) || s === statusFilter;
          const href =
            s === "all"
              ? `/admin/upgrades${planFilter ? `?plan=${planFilter}` : ""}`
              : `/admin/upgrades?status=${s}${planFilter ? `&plan=${planFilter}` : ""}`;
          return (
            <a
              key={s}
              href={href}
              className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "bg-primary-600 text-white"
                  : "bg-white/10 text-slate-400 hover:bg-white/20"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </a>
          );
        })}

        <span className="ml-4 mr-1 self-center text-xs text-slate-500">
          Plan:
        </span>
        {plans.map((p) => {
          const active =
            (p === "all" && !planFilter) || p === planFilter;
          const href =
            p === "all"
              ? `/admin/upgrades${statusFilter ? `?status=${statusFilter}` : ""}`
              : `/admin/upgrades?plan=${p}${statusFilter ? `&status=${statusFilter}` : ""}`;
          return (
            <a
              key={p}
              href={href}
              className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "bg-primary-600 text-white"
                  : "bg-white/10 text-slate-400 hover:bg-white/20"
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </a>
          );
        })}
      </div>

      {degraded && <AdminDegradedState title="Upgrade Requests" />}

      {!degraded && requests.length === 0 && (
        <p className="text-sm text-slate-400">
          No upgrade requests found
          {statusFilter ? ` with status "${statusFilter}"` : ""}
          {planFilter ? ` for plan "${planFilter}"` : ""}.
        </p>
      )}

      {!degraded && requests.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-300">
                  Tenant
                </th>
                <th className="px-4 py-3 font-medium text-slate-300">
                  User
                </th>
                <th className="px-4 py-3 font-medium text-slate-300">
                  Requested Plan
                </th>
                <th className="px-4 py-3 font-medium text-slate-300">
                  Features
                </th>
                <th className="px-4 py-3 font-medium text-slate-300">
                  Status
                </th>
                <th className="px-4 py-3 font-medium text-slate-300">
                  Created
                </th>
                <th className="px-4 py-3 font-medium text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {requests.map((req) => (
                <tr
                  key={req.request_id}
                  className="transition hover:bg-white/5"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-accent-200">
                      {req.tenant_id.slice(0, 12)}…
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-slate-400">
                      {req.user_id.slice(0, 12)}…
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        PLAN_COLORS[req.requested_plan] ||
                        "bg-white/10 text-slate-300"
                      }`}
                    >
                      {req.requested_plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {req.requested_features.length > 0
                      ? req.requested_features.length
                      : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[req.status] || "bg-white/10 text-slate-300"
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {fmtDate(req.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/upgrades/${encodeURIComponent(req.request_id)}`}
                      className="rounded bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-white/20"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-xs text-slate-500">
        {requests.length} request{requests.length !== 1 ? "s" : ""} shown.
      </p>
    </div>
  );
}

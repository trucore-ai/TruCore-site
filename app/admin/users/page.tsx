import { fetchAdminUsers } from "@/lib/dashboard-client";
import { AdminDegradedState } from "@/components/dashboard/admin-degraded-state";
import { logSecurityEvent } from "@/lib/security-log";
import { AdminUserSearch } from "./search";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function fmtEpoch(epoch: number | null) {
  if (!epoch) return "-";
  const d = new Date(epoch * 1000);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  const emailQuery = params.email?.trim() || "";

  let degraded = false;
  let users: Awaited<ReturnType<typeof fetchAdminUsers>> = {
    ok: true,
    data: { users: [], count: 0 },
  };

  try {
    users = await fetchAdminUsers(emailQuery || undefined, 100);
  } catch {
    logSecurityEvent("admin_page_degraded", {
      meta: { page: "users", reason: "atf_unavailable" },
    });
    degraded = true;
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-6 text-slate-100 md:p-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <div className="flex items-center gap-3">
          <a
            href="/admin/keys"
            className="rounded border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            Keys
          </a>
          <a
            href="/admin/audit"
            className="rounded border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            Audit Log
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

      <div className="mb-6">
        <AdminUserSearch initialEmail={emailQuery} />
      </div>

      {degraded || !users.ok ? (
        <AdminDegradedState
          title="Users"
          description="User data could not be loaded right now."
        />
      ) : users.data.count === 0 ? (
        <p className="text-sm text-slate-400">
          {emailQuery ? "No users match that query." : "No users found."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Verified</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Tenant</th>
                <th className="px-4 py-3">Last Verification Sent</th>
                <th className="px-4 py-3">Last Reset Sent</th>
              </tr>
            </thead>
            <tbody>
              {users.data.users.map((u) => (
                <tr
                  key={u.user_id}
                  className="border-b border-white/5 last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <a
                      href={`/admin/users/${u.user_id}`}
                      className="text-primary-400 underline-offset-2 hover:underline"
                    >
                      {u.email}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    {u.email_verified ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                        Unverified
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {fmtEpoch(u.created_at)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">
                    {u.tenant_id}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {fmtEpoch(u.email_verification_sent_at)}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {fmtEpoch(u.password_reset_sent_at)}
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

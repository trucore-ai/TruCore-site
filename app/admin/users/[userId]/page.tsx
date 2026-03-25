import { fetchAdminUserDetail } from "@/lib/dashboard-client";
import { AdminDegradedState } from "@/components/dashboard/admin-degraded-state";
import { logSecurityEvent } from "@/lib/security-log";
import { UserActionPanel } from "./action-panel";
import { notFound } from "next/navigation";
import Link from "next/link";

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

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  let degraded = false;
  let result: Awaited<ReturnType<typeof fetchAdminUserDetail>> | null = null;

  try {
    result = await fetchAdminUserDetail(userId);
  } catch {
    logSecurityEvent("admin_page_degraded", {
      meta: { page: "user_detail", reason: "atf_unavailable" },
    });
    degraded = true;
  }

  if (!degraded && result && !result.ok) {
    notFound();
  }

  const u = result?.ok ? result.data.user : null;

  return (
    <div className="min-h-screen bg-neutral-950 p-6 text-slate-100 md:p-10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="rounded border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            &larr; Users
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">User Detail</h1>
        </div>
        <form method="POST" action="/admin/logout">
          <button
            type="submit"
            className="rounded border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            Logout
          </button>
        </form>
      </div>

      {degraded || !u ? (
        <AdminDegradedState
          title="User Detail"
          description="User data could not be loaded right now."
        />
      ) : (
        <div className="space-y-8">
          {/* Identity */}
          <section className="rounded-lg border border-white/10 p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Identity
            </h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
              <div>
                <dt className="text-xs text-slate-500">User ID</dt>
                <dd className="font-mono text-slate-200">{u.user_id}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Email</dt>
                <dd className="text-slate-200">{u.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Tenant</dt>
                <dd className="font-mono text-slate-200">{u.tenant_id}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Created</dt>
                <dd className="text-slate-200">{fmtEpoch(u.created_at)}</dd>
              </div>
            </dl>
          </section>

          {/* Verification State */}
          <section className="rounded-lg border border-white/10 p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Verification
            </h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Status</dt>
                <dd>
                  {u.email_verified ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                      Unverified
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Verified At</dt>
                <dd className="text-slate-200">
                  {fmtEpoch(u.email_verified_at)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Last Sent</dt>
                <dd className="text-slate-200">
                  {fmtEpoch(u.email_verification_sent_at)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Pending Token</dt>
                <dd>
                  {u.has_pending_verification_token ? (
                    <span className="text-amber-400">Yes</span>
                  ) : (
                    <span className="text-slate-500">No</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Token Expires</dt>
                <dd className="text-slate-200">
                  {fmtEpoch(u.verification_token_expires_at)}
                </dd>
              </div>
            </dl>
          </section>

          {/* Password Reset State */}
          <section className="rounded-lg border border-white/10 p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Password Reset
            </h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Last Sent</dt>
                <dd className="text-slate-200">
                  {fmtEpoch(u.password_reset_sent_at)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Expires</dt>
                <dd className="text-slate-200">
                  {fmtEpoch(u.password_reset_expires_at)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Used At</dt>
                <dd className="text-slate-200">
                  {fmtEpoch(u.password_reset_used_at)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Pending Token</dt>
                <dd>
                  {u.has_pending_reset_token ? (
                    <span className="text-amber-400">Yes</span>
                  ) : (
                    <span className="text-slate-500">No</span>
                  )}
                </dd>
              </div>
            </dl>
          </section>

          {/* Actions */}
          <section className="rounded-lg border border-white/10 p-5">
            <UserActionPanel
              userId={u.user_id}
              emailVerified={u.email_verified}
              hasPendingVerificationToken={u.has_pending_verification_token}
              hasPendingResetToken={u.has_pending_reset_token}
            />
          </section>
        </div>
      )}
    </div>
  );
}

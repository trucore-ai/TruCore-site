import {
  fetchAdminUpgradeDetail,
  type UpgradeRequestEntry,
} from "@/lib/dashboard-client";
import { AdminDegradedState } from "@/components/dashboard/admin-degraded-state";
import { logSecurityEvent } from "@/lib/security-log";
import { UpgradeReviewActions } from "./review-actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-900/40 text-amber-300 border-amber-400/30",
  approved: "bg-emerald-900/40 text-emerald-300 border-emerald-400/30",
  rejected: "bg-red-900/40 text-red-300 border-red-400/30",
  cancelled: "bg-slate-700/40 text-slate-400 border-slate-400/30",
};

const PLAN_COLORS: Record<string, string> = {
  pro: "bg-blue-900/40 text-blue-300",
  enterprise: "bg-purple-900/40 text-purple-300",
};

function fmtDate(epoch: number) {
  if (!epoch) return "—";
  return new Date(epoch * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function UpgradeDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;

  let degraded = false;
  let request: UpgradeRequestEntry | null = null;

  try {
    const result = await fetchAdminUpgradeDetail(requestId);
    if (result.ok) {
      request = result.data.request;
    } else {
      degraded = true;
    }
  } catch {
    logSecurityEvent("admin_page_degraded", {
      meta: { page: "upgrade-detail", reason: "atf_unavailable" },
    });
    degraded = true;
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-6 text-slate-100 md:p-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <a
            href="/admin/upgrades"
            className="text-xs text-slate-400 transition hover:text-slate-200"
          >
            &larr; Upgrade Requests
          </a>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Review Upgrade Request
          </h1>
          <p className="mt-1 font-mono text-xs text-slate-500">
            {requestId}
          </p>
        </div>
        <form method="POST" action="/admin/logout">
          <button
            type="submit"
            className="rounded border border-red-700/40 bg-red-900/30 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-900/50"
          >
            Logout
          </button>
        </form>
      </div>

      {degraded && <AdminDegradedState title="Upgrade Detail" />}

      {!degraded && !request && (
        <p className="text-sm text-red-400">
          Upgrade request not found.
        </p>
      )}

      {!degraded && request && (
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left: Request details */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-200">
              Request Details
            </h2>

            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Status</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[request.status] || "bg-white/10 text-slate-300 border-white/20"
                    }`}
                  >
                    {request.status}
                  </span>
                </dd>
              </div>

              <div>
                <dt className="text-xs text-slate-500">Tenant ID</dt>
                <dd className="mt-1 font-mono text-xs text-accent-200">
                  {request.tenant_id}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-slate-500">User ID</dt>
                <dd className="mt-1 font-mono text-xs text-slate-300">
                  {request.user_id}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-slate-500">Requested Plan</dt>
                <dd className="mt-1">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      PLAN_COLORS[request.requested_plan] || "bg-white/10 text-slate-300"
                    }`}
                  >
                    {request.requested_plan}
                  </span>
                </dd>
              </div>

              {request.requested_features.length > 0 && (
                <div>
                  <dt className="text-xs text-slate-500">
                    Requested Features
                  </dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {request.requested_features.map((f) => (
                      <span
                        key={f}
                        className="rounded bg-white/10 px-2 py-0.5 font-mono text-xs text-slate-300"
                      >
                        {f}
                      </span>
                    ))}
                  </dd>
                </div>
              )}

              {request.reason && (
                <div>
                  <dt className="text-xs text-slate-500">
                    Use Case / Reason
                  </dt>
                  <dd className="mt-1 text-sm text-slate-300">
                    {request.reason}
                  </dd>
                </div>
              )}

              <div>
                <dt className="text-xs text-slate-500">Submitted</dt>
                <dd className="mt-1 text-xs text-slate-400">
                  {fmtDate(request.created_at)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Right: Review section */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-200">
              Review
            </h2>

            {request.status !== "pending" ? (
              <div className="space-y-4 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Reviewed By</dt>
                  <dd className="mt-1 font-mono text-xs text-slate-300">
                    {request.reviewed_by || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Reviewed At</dt>
                  <dd className="mt-1 text-xs text-slate-400">
                    {fmtDate(request.reviewed_at)}
                  </dd>
                </div>
                {request.review_note && (
                  <div>
                    <dt className="text-xs text-slate-500">Review Note</dt>
                    <dd className="mt-1 text-sm italic text-slate-300">
                      &ldquo;{request.review_note}&rdquo;
                    </dd>
                  </div>
                )}
              </div>
            ) : (
              <UpgradeReviewActions requestId={request.request_id} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

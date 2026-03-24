import { fetchAdminFeatureDetail, type FeatureEntry } from "@/lib/dashboard-client";
import { AdminDegradedState } from "@/components/dashboard/admin-degraded-state";
import { logSecurityEvent } from "@/lib/security-log";
import Link from "next/link";
import { FeatureEditorForm } from "./editor-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PLAN_COLORS: Record<string, string> = {
  free: "bg-green-900/40 text-green-300",
  pro: "bg-blue-900/40 text-blue-300",
  enterprise: "bg-purple-900/40 text-purple-300",
};

export default async function FeatureDetailPage({
  params,
}: {
  params: Promise<{ featureKey: string }>;
}) {
  const { featureKey } = await params;
  const decodedKey = decodeURIComponent(featureKey);

  let degraded = false;
  let feature: { feature: FeatureEntry } | null = null;

  try {
    const result = await fetchAdminFeatureDetail(decodedKey);
    if (result.ok) {
      feature = result.data;
    } else {
      degraded = true;
    }
  } catch {
    logSecurityEvent("admin_page_degraded", {
      meta: { page: "feature-detail", reason: "atf_unavailable" },
    });
    degraded = true;
  }

  const f = feature?.feature;

  return (
    <div className="min-h-screen bg-neutral-950 p-6 text-slate-100 md:p-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/admin/features"
            className="text-xs text-slate-400 transition hover:text-slate-200"
          >
            &larr; Feature Matrix
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            {f?.title || decodedKey}
          </h1>
          <p className="mt-1 font-mono text-sm text-slate-400">
            {decodedKey}
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

      {degraded && <AdminDegradedState title="Feature Detail" />}

      {!degraded && !f && (
        <p className="text-sm text-red-400">
          Feature &ldquo;{decodedKey}&rdquo; not found in catalog.
        </p>
      )}

      {!degraded && f && (
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left: Summary */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-200">
              Current Policy
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">Surface</dt>
                <dd className="text-slate-200">{f.surface}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Enabled</dt>
                <dd>
                  <span
                    className={f.enabled ? "text-green-400" : "text-red-400"}
                  >
                    {f.enabled ? "Yes" : "No"}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Visibility</dt>
                <dd className="text-slate-200">{f.visibility}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Required Plan</dt>
                <dd>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      PLAN_COLORS[f.required_plan] || ""
                    }`}
                  >
                    {f.required_plan}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Access Mode</dt>
                <dd className="text-slate-200">{f.access_mode}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Metered</dt>
                <dd className="text-slate-200">
                  {f.metered ? "Yes" : "No"}
                </dd>
              </div>
              {f.billing_dimension && (
                <div className="flex justify-between">
                  <dt className="text-slate-400">Billing Dimension</dt>
                  <dd className="font-mono text-xs text-slate-200">
                    {f.billing_dimension}
                  </dd>
                </div>
              )}
              {f.tags && f.tags.length > 0 && (
                <div className="flex justify-between">
                  <dt className="text-slate-400">Tags</dt>
                  <dd className="flex flex-wrap gap-1">
                    {f.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-slate-300"
                      >
                        {t}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
            {f.description && (
              <p className="mt-4 text-xs text-slate-400">{f.description}</p>
            )}
          </div>

          {/* Right: Editor */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-200">
              Edit Policy
            </h2>
            <FeatureEditorForm
              featureKey={decodedKey}
              initialData={{
                enabled: f.enabled,
                visibility: f.visibility,
                required_plan: f.required_plan,
                access_mode: f.access_mode,
                metered: f.metered,
                title: f.title,
                description: f.description,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

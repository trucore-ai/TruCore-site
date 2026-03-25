import { fetchAdminFeatures, type FeatureEntry } from "@/lib/dashboard-client";
import { AdminDegradedState } from "@/components/dashboard/admin-degraded-state";
import { LaunchModeBanner } from "@/components/dashboard/launch-mode-banner";
import { getFeatureFlags } from "@/lib/feature-flags";
import { logSecurityEvent } from "@/lib/security-log";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PLAN_COLORS: Record<string, string> = {
  free: "bg-green-900/40 text-green-300",
  pro: "bg-blue-900/40 text-blue-300",
  enterprise: "bg-purple-900/40 text-purple-300",
};

const VIS_COLORS: Record<string, string> = {
  visible: "text-green-400",
  hidden: "text-red-400",
  gated: "text-yellow-400",
};

const ACCESS_LABELS: Record<string, string> = {
  self_serve: "Self-serve",
  request_only: "Request only",
  admin_only: "Admin only",
};

export default async function AdminFeaturesPage({
  searchParams,
}: {
  searchParams: Promise<{ surface?: string }>;
}) {
  const params = await searchParams;
  const surfaceFilter = params.surface || "";

  let degraded = false;
  let features: FeatureEntry[] = [];
  let launchMode: string | null = null;

  try {
    const [result, flags] = await Promise.all([
      fetchAdminFeatures(surfaceFilter || undefined),
      getFeatureFlags(),
    ]);
    launchMode = flags.launch_mode;
    if (result.ok) {
      features = result.data.features;
    } else {
      degraded = true;
    }
  } catch {
    logSecurityEvent("admin_page_degraded", {
      meta: { page: "features", reason: "atf_unavailable" },
    });
    degraded = true;
  }

  const surfaces = ["all", "api", "cli", "plugin", "other"];

  return (
    <div className="min-h-screen bg-neutral-950 p-6 text-slate-100 md:p-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">
            Feature Entitlement Matrix
          </h1>
          <LaunchModeBanner launchMode={launchMode} />
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="rounded border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/20"
          >
            Users
          </Link>
          <a
            href="/admin/keys"
            className="rounded border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/20"
          >
            Keys
          </a>
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

      {/* Surface filter tabs */}
      <div className="mb-4 flex gap-2">
        {surfaces.map((s) => (
          <a
            key={s}
            href={`/admin/features${s === "all" ? "" : `?surface=${s}`}`}
            className={`rounded px-3 py-1.5 text-xs font-medium transition ${
              (s === "all" && !surfaceFilter) || s === surfaceFilter
                ? "bg-primary-600 text-white"
                : "bg-white/10 text-slate-400 hover:bg-white/20"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </a>
        ))}
      </div>

      {degraded && <AdminDegradedState title="Feature Matrix" />}

      {!degraded && features.length === 0 && (
        <p className="text-sm text-slate-400">
          No features found{surfaceFilter ? ` for surface "${surfaceFilter}"` : ""}.
        </p>
      )}

      {!degraded && features.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-300">
                  Feature Key
                </th>
                <th className="px-4 py-3 font-medium text-slate-300">
                  Surface
                </th>
                <th className="px-4 py-3 font-medium text-slate-300">
                  Enabled
                </th>
                <th className="px-4 py-3 font-medium text-slate-300">
                  Visibility
                </th>
                <th className="px-4 py-3 font-medium text-slate-300">
                  Plan
                </th>
                <th className="px-4 py-3 font-medium text-slate-300">
                  Access
                </th>
                <th className="px-4 py-3 font-medium text-slate-300">
                  Metered
                </th>
                <th className="px-4 py-3 font-medium text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {features.map((f) => (
                <tr
                  key={f.feature_key}
                  className="transition hover:bg-white/5"
                >
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs text-accent-200">
                      {f.feature_key}
                    </div>
                    {f.title && (
                      <div className="mt-0.5 text-xs text-slate-400">
                        {f.title}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {f.surface}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        f.enabled ? "bg-green-400" : "bg-red-400"
                      }`}
                    />
                    <span className="ml-1.5 text-xs text-slate-300">
                      {f.enabled ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium ${
                        VIS_COLORS[f.visibility] || "text-slate-400"
                      }`}
                    >
                      {f.visibility}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        PLAN_COLORS[f.required_plan] || "bg-white/10 text-slate-300"
                      }`}
                    >
                      {f.required_plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {ACCESS_LABELS[f.access_mode] || f.access_mode}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs ${
                        f.metered ? "text-yellow-300" : "text-slate-500"
                      }`}
                    >
                      {f.metered ? "Yes" : "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/features/${encodeURIComponent(f.feature_key)}`}
                      className="rounded bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-white/20"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-xs text-slate-500">
        {features.length} feature{features.length !== 1 ? "s" : ""} in catalog.
        Changes are persisted and take effect immediately.
      </p>
    </div>
  );
}

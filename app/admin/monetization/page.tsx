import { fetchMonetizationSettings } from "@/lib/dashboard-client";
import { AdminDegradedState } from "@/components/dashboard/admin-degraded-state";
import { logSecurityEvent } from "@/lib/security-log";
import { MonetizationForm } from "@/components/admin-monetization-form";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminMonetizationPage() {
  let degraded = false;
  let settings: Awaited<ReturnType<typeof fetchMonetizationSettings>> = {
    ok: false,
    error: "not loaded",
  };

  try {
    settings = await fetchMonetizationSettings();
  } catch {
    logSecurityEvent("admin_page_degraded", {
      meta: { page: "monetization", reason: "atf_unavailable" },
    });
    degraded = true;
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-6 text-slate-100 md:p-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Monetization Controls
        </h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="rounded border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            Users
          </Link>
          <Link
            href="/admin/keys"
            className="rounded border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            Keys
          </Link>
          <Link
            href="/admin/usage"
            className="rounded border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            Usage
          </Link>
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

      <p className="mb-6 text-sm text-slate-400">
        Control monetization rollout switches. Toggle pricing surfaces,
        quota enforcement, and paid feature gates without code changes.
      </p>

      {degraded || !settings.ok ? (
        <AdminDegradedState
          title="Monetization Settings"
          description="Settings could not be loaded right now."
        />
      ) : (
        <MonetizationForm initial={settings.data} />
      )}
    </div>
  );
}

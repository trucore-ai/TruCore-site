"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  isLoggedIn,
  getApiKey,
  fetchDashboard,
  clearAuth,
} from "@/lib/customer-auth";

interface DashboardData {
  user_id: string;
  email: string;
  tenant_id: string;
  tenant: { plan_tier: string; status: string } | null;
  api_keys: Array<{
    key_id: string;
    label: string;
    status: string;
    created_at: number;
  }>;
}

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // API key from signup (only available once)
  const savedApiKey = typeof window !== "undefined" ? getApiKey() : null;

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }

    fetchDashboard()
      .then((d) => setData(d as unknown as DashboardData))
      .catch((err) => {
        if (err instanceof Error && err.message === "Session expired") {
          router.replace("/login");
        } else {
          setError(err instanceof Error ? err.message : "Failed to load dashboard");
        }
      });
  }, [router]);

  function handleCopy() {
    if (!savedApiKey) return;
    navigator.clipboard.writeText(savedApiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  if (typeof window !== "undefined" && !isLoggedIn()) return null;

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">
              Dashboard
            </h1>
            {data && (
              <p className="mt-1 text-sm text-slate-400">
                {data.email} &middot;{" "}
                <span className="capitalize">
                  {data.tenant?.plan_tier ?? "free"} plan
                </span>
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
          >
            Sign out
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* API Key card */}
        {savedApiKey && (
          <section className="rounded-xl border border-primary-400/20 bg-primary-500/5 p-6">
            <h2 className="text-sm font-medium text-primary-300">
              Your API Key
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Copy this now — it will not be shown again.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <code className="flex-1 overflow-x-auto rounded-lg border border-white/10 bg-neutral-900 px-4 py-2.5 font-mono text-sm text-slate-100">
                {savedApiKey}
              </code>
              <button
                onClick={handleCopy}
                className="shrink-0 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-400"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </section>
        )}

        {/* Tenant info */}
        {data && (
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
            <h2 className="text-sm font-medium text-slate-300">
              Account details
            </h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">Tenant ID</dt>
                <dd className="mt-0.5 font-mono text-slate-200">
                  {data.tenant_id}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Plan</dt>
                <dd className="mt-0.5 capitalize text-slate-200">
                  {data.tenant?.plan_tier ?? "free"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd className="mt-0.5 text-slate-200">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      data.tenant?.status === "active"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {data.tenant?.status ?? "active"}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">API keys</dt>
                <dd className="mt-0.5 text-slate-200">
                  {data.api_keys?.length ?? 0}
                </dd>
              </div>
            </dl>
          </section>
        )}

        {/* API Keys table */}
        {data && data.api_keys && data.api_keys.length > 0 && (
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="mb-4 text-sm font-medium text-slate-300">
              API Keys
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs text-slate-500">
                    <th className="pb-2 pr-4 font-medium">Key ID</th>
                    <th className="pb-2 pr-4 font-medium">Label</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.api_keys.map((k) => (
                    <tr
                      key={k.key_id}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="py-2.5 pr-4 font-mono text-slate-200">
                        {k.key_id}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-300">
                        {k.label || "—"}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            k.status === "active"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-red-500/20 text-red-300"
                          }`}
                        >
                          {k.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-400">
                        {new Date(k.created_at * 1000).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="rounded-xl border border-accent-400/20 bg-accent-500/5 p-6 text-center">
          <h2 className="text-lg font-semibold text-slate-100">
            Run your first protected trade
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Use your API key to submit an intent to the ATF and get a
            cryptographic permit.
          </p>
          <Link
            href="/quickstart"
            className="mt-4 inline-block rounded-lg bg-accent-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-accent-400"
          >
            View quickstart guide
          </Link>
        </section>
      </div>
    </main>
  );
}

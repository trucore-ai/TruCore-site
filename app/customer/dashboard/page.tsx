"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  isLoggedIn,
  getApiKey,
  fetchDashboard,
  clearAuth,
  fetchSampleIntent,
  simulateProtection,
  executeSample,
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

  // Onboarding state
  const [obStep, setObStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [obLoading, setObLoading] = useState(false);
  const [obIntent, setObIntent] = useState<Record<string, unknown> | null>(null);
  const [obDryRun, setObDryRun] = useState<Record<string, unknown> | null>(null);
  const [obReceipt, setObReceipt] = useState<Record<string, unknown> | null>(null);
  const [obError, setObError] = useState("");
  const [receiptCopied, setReceiptCopied] = useState(false);

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

  // --- Onboarding handlers ---

  const handleGenerateSample = useCallback(async () => {
    setObLoading(true);
    setObError("");
    try {
      const res = await fetchSampleIntent();
      setObIntent(res.intent as Record<string, unknown>);
      setObStep(1);
    } catch (e) {
      setObError(e instanceof Error ? e.message : "Failed to generate sample");
    } finally {
      setObLoading(false);
    }
  }, []);

  const handleSimulate = useCallback(async () => {
    if (!obIntent) return;
    setObLoading(true);
    setObError("");
    try {
      const res = await simulateProtection(obIntent);
      setObDryRun(res);
      setObStep(2);
    } catch (e) {
      setObError(e instanceof Error ? e.message : "Simulation failed");
    } finally {
      setObLoading(false);
    }
  }, [obIntent]);

  const handleExecute = useCallback(async () => {
    if (!obIntent) return;
    setObLoading(true);
    setObError("");
    try {
      const res = await executeSample(obIntent);
      setObReceipt(res);
      setObStep(3);
    } catch (e) {
      setObError(e instanceof Error ? e.message : "Execution failed");
    } finally {
      setObLoading(false);
    }
  }, [obIntent]);

  function handleCopyReceipt() {
    if (!obReceipt) return;
    navigator.clipboard.writeText(JSON.stringify(obReceipt, null, 2));
    setReceiptCopied(true);
    setTimeout(() => setReceiptCopied(false), 2000);
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

        {/* First Protected Trade — Onboarding Flow */}
        <section className="rounded-xl border border-accent-400/20 bg-accent-500/5 p-6 space-y-5">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-slate-100">
              \uD83D\uDE80 Run Your First Protected Trade
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Experience ATF protection in 3 clicks — no code required.
            </p>
          </div>

          {obError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {obError}
            </div>
          )}

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            {["Generate", "Simulate", "Execute", "Receipt"].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    obStep > i
                      ? "bg-emerald-500/20 text-emerald-300"
                      : obStep === i
                        ? "bg-accent-500/30 text-accent-300"
                        : "bg-white/5 text-slate-500"
                  }`}
                >
                  {obStep > i ? "\u2713" : i + 1}
                </span>
                <span className={obStep >= i ? "text-slate-300" : ""}>
                  {label}
                </span>
                {i < 3 && (
                  <span className="mx-1 text-slate-600">\u2014</span>
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Generate */}
          {obStep === 0 && (
            <div className="text-center">
              <button
                onClick={handleGenerateSample}
                disabled={obLoading}
                className="rounded-lg bg-accent-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-accent-400 disabled:opacity-50"
              >
                {obLoading ? "Generating\u2026" : "Generate Sample Trade"}
              </button>
            </div>
          )}

          {/* Step 1 result: show intent */}
          {obStep >= 1 && obIntent && (
            <div className="rounded-lg border border-white/10 bg-neutral-900 p-4">
              <h3 className="text-xs font-medium text-slate-400 mb-2">
                Sample Intent
              </h3>
              <pre className="overflow-x-auto text-xs text-slate-200 font-mono">
                {JSON.stringify(obIntent, null, 2)}
              </pre>
            </div>
          )}

          {/* Step 2: Simulate */}
          {obStep === 1 && (
            <div className="text-center">
              <button
                onClick={handleSimulate}
                disabled={obLoading}
                className="rounded-lg bg-accent-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-accent-400 disabled:opacity-50"
              >
                {obLoading ? "Simulating\u2026" : "Simulate Protection"}
              </button>
            </div>
          )}

          {/* Step 2 result: policy breakdown */}
          {obStep >= 2 && obDryRun && (
            <div className="rounded-lg border border-white/10 bg-neutral-900 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-slate-400">
                  Policy Evaluation
                </h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    (obDryRun as Record<string, unknown>).decision === "ALLOW"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {(obDryRun as Record<string, unknown>).decision as string}
                </span>
              </div>
              <div className="space-y-1">
                {((obDryRun as Record<string, unknown>).policy_breakdown as Array<{
                  policy: string;
                  result: string;
                  reason: string;
                }>)?.map((p) => (
                  <div
                    key={p.policy}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-300 font-mono">
                      {p.policy}
                    </span>
                    <span
                      className={
                        p.result === "PASS"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }
                    >
                      {p.result}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 italic">
                Protected by ATF &middot; Dry run (no on-chain transaction)
              </p>
            </div>
          )}

          {/* Step 3: Execute */}
          {obStep === 2 && (
            <div className="text-center">
              <button
                onClick={handleExecute}
                disabled={obLoading}
                className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
              >
                {obLoading ? "Executing\u2026" : "Execute Sample Trade"}
              </button>
            </div>
          )}

          {/* Step 3 result: receipt */}
          {obStep >= 3 && obReceipt && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-emerald-300">
                  \u2705 Trade Receipt
                </h3>
                <button
                  onClick={handleCopyReceipt}
                  className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 transition hover:bg-white/10"
                >
                  {receiptCopied ? "Copied!" : "Copy JSON"}
                </button>
              </div>
              <pre className="overflow-x-auto rounded-lg bg-neutral-900 p-3 text-xs text-slate-200 font-mono">
                {JSON.stringify(obReceipt, null, 2)}
              </pre>
              <p className="text-xs text-slate-500 italic">
                Protected by ATF &middot; Your first trade is complete!
              </p>
            </div>
          )}

          {/* Quickstart link fallback */}
          <div className="text-center">
            <Link
              href="/quickstart"
              className="text-xs text-slate-500 underline hover:text-slate-300"
            >
              Or follow the full quickstart guide
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

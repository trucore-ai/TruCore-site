"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  isLoggedIn,
  fetchPolicy,
  type EffectivePolicyResponse,
} from "@/lib/customer-auth";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatLimit(v: number): string {
  if (v < 0) return "Unlimited";
  return v.toLocaleString();
}

function tierLabel(code: string): string {
  const labels: Record<string, string> = {
    free: "Free",
    pro: "Pro",
    advanced: "Advanced",
    enterprise: "Enterprise",
  };
  return labels[code] ?? code;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CustomerPoliciesPage() {
  const router = useRouter();
  const [policy, setPolicy] = useState<EffectivePolicyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }

    fetchPolicy()
      .then((p) => setPolicy(p))
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load policy data. Please try again.",
        );
      })
      .finally(() => setLoading(false));
  }, [router]);

  // -----------------------------------------------------------------------
  // Loading
  // -----------------------------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 px-4 py-20">
        <div className="mx-auto max-w-2xl animate-pulse space-y-4">
          <div className="h-5 w-40 rounded bg-white/10" />
          <div className="h-4 w-64 rounded bg-white/5" />
          <div className="h-48 rounded-xl bg-white/5" />
        </div>
      </main>
    );
  }

  // -----------------------------------------------------------------------
  // Error
  // -----------------------------------------------------------------------

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 px-4 py-20">
        <div className="mx-auto max-w-2xl space-y-6">
          <Link
            href="/customer/dashboard"
            className="text-xs text-primary-400 hover:text-primary-300 transition"
          >
            &larr; Back to dashboard
          </Link>
          <section className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 space-y-3">
            <h1 className="text-sm font-medium text-red-300">
              Policy data unavailable
            </h1>
            <p className="text-xs text-red-200">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
            >
              Retry
            </button>
          </section>
        </div>
      </main>
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const planCode = policy?.plan_code ?? "free";
  const txLimit = policy?.plan_limits?.tx_limit_per_month ?? 0;
  const overridesEnabled = policy?.plan_limits?.policy_overrides_enabled ?? false;
  const overrides = policy?.overrides ?? {};
  const effective = policy?.effective ?? {};
  const hasOverrides = Object.keys(overrides).length > 0;

  // Partition effective keys into categories for display
  const limitKeys = ["tx_limit_per_month", "max_notional_usd"];
  const tokenKeys = ["allowed_mints", "denied_mints", "custom_token_allowlist_enabled"];
  const protectionKeys = ["max_slippage_bps"];

  function renderValue(key: string, val: unknown): string {
    if (val === null || val === undefined) return "—";
    if (typeof val === "boolean") return val ? "Yes" : "No";
    if (typeof val === "number") {
      if (val < 0) return "Unlimited";
      if (key.endsWith("_bps")) return `${val} bps`;
      if (key.endsWith("_usd"))
        return `$${val.toLocaleString()}`;
      return val.toLocaleString();
    }
    if (Array.isArray(val))
      return val.length === 0 ? "None" : `${val.length} item${val.length !== 1 ? "s" : ""}`;
    return String(val);
  }

  function renderSection(
    title: string,
    keys: string[],
    values: Record<string, unknown>,
  ) {
    const entries = keys
      .filter((k) => values[k] !== undefined)
      .map((k) => ({ key: k, value: values[k] }));
    if (entries.length === 0) return null;
    return (
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-slate-400">{title}</h3>
        <div className="divide-y divide-white/5">
          {entries.map(({ key, value }) => (
            <div key={key} className="flex items-center justify-between py-2">
              <span className="text-xs text-slate-400 font-mono">{key}</span>
              <span className="text-xs text-slate-200 font-medium">
                {renderValue(key, value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 px-4 py-20">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <Link
            href="/customer/dashboard"
            className="text-xs text-primary-400 hover:text-primary-300 transition"
          >
            &larr; Back to dashboard
          </Link>
          <h1 className="text-lg font-semibold text-slate-100">
            Policy &amp; Protections
          </h1>
          <p className="text-xs text-slate-500">
            Your effective transaction policy is derived from your{" "}
            <span className="font-medium text-slate-300">
              {tierLabel(planCode)}
            </span>{" "}
            plan defaults{hasOverrides ? " with custom overrides applied" : ""}.
            All values shown are read-only.
          </p>
        </div>

        {/* Plan tier */}
        <section className="rounded-xl border border-primary-400/20 bg-primary-500/5 p-6 space-y-3">
          <h2 className="text-sm font-medium text-slate-300">Plan</h2>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-primary-400/40 bg-primary-500/10 px-3 py-1 text-xs font-semibold capitalize text-primary-300">
              {tierLabel(planCode)}
            </span>
            <span className="text-xs text-slate-400">
              {formatLimit(txLimit)} transactions / month
            </span>
          </div>
          <p className="text-[10px] text-slate-500">
            Policy overrides:{" "}
            {overridesEnabled ? (
              <span className="text-emerald-400">Enabled</span>
            ) : (
              <span className="text-slate-400">
                Not available on this plan
              </span>
            )}
          </p>
        </section>

        {/* Effective policy */}
        <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
          <h2 className="text-sm font-medium text-slate-300">
            Effective Policy
          </h2>
          <p className="text-[10px] text-slate-500">
            These are the merged values that the firewall enforces on every
            transaction. Plan defaults are combined with any custom overrides.
          </p>
          {renderSection("Limits", limitKeys, effective)}
          {renderSection("Token Controls", tokenKeys, effective)}
          {renderSection("Protection Rules", protectionKeys, effective)}

          {/* Catch-all for any extra effective keys */}
          {(() => {
            const known = new Set([...limitKeys, ...tokenKeys, ...protectionKeys]);
            const extra = Object.keys(effective).filter((k) => !known.has(k));
            return extra.length > 0
              ? renderSection("Other", extra, effective)
              : null;
          })()}
        </section>

        {/* Overrides */}
        {hasOverrides && (
          <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-3">
            <h2 className="text-sm font-medium text-amber-300">
              Custom Overrides
            </h2>
            <p className="text-[10px] text-slate-500">
              These values override your plan defaults. Contact your account
              owner to modify.
            </p>
            <div className="divide-y divide-white/5">
              {Object.entries(overrides).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <span className="text-xs text-amber-200/80 font-mono">
                    {key}
                  </span>
                  <span className="text-xs text-amber-200 font-medium">
                    {renderValue(key, value)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Info footer */}
        {!overridesEnabled && (
          <p className="text-[10px] text-slate-500 text-center">
            Policy customization is available on Pro plans and above.{" "}
            <Link
              href="/customer/dashboard"
              className="text-primary-400 hover:text-primary-300 transition"
            >
              Manage your plan &rarr;
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}

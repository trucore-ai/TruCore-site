"use client";

import Link from "next/link";
import type { EffectivePolicyResponse } from "@/lib/customer-auth";

type Props = {
  policy: EffectivePolicyResponse | null;
  loading?: boolean;
  onRetry?: () => void;
};

function formatLimit(value: number): string {
  if (value < 0) return "Unlimited";
  return value.toLocaleString();
}

export function PolicySummaryCard({ policy, loading, onRetry }: Props) {
  if (loading) {
    return (
      <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6 space-y-3 animate-pulse">
        <div className="h-4 w-32 rounded bg-white/10" />
        <div className="h-3 w-48 rounded bg-white/5" />
        <div className="h-3 w-40 rounded bg-white/5" />
      </section>
    );
  }

  if (!policy) {
    return (
      <section
        data-testid="policy-summary-unavailable"
        className="rounded-xl border border-white/10 bg-white/[0.02] p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-300">
            Policy &amp; Protections
          </h2>
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
            Temporarily unavailable
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Policy details could not be loaded. Your transactions are still
          protected by your plan&apos;s default enforcement rules.
        </p>
        <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
          <p className="text-[10px] text-slate-500">
            Protection is active — defaults apply until policy data is available again.
          </p>
        </div>
        {onRetry && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg bg-primary-500/15 border border-primary-400/30 px-3 py-1.5 text-xs font-medium text-primary-300 transition hover:bg-primary-500/25 hover:text-primary-200"
            >
              Try again
            </button>
            <Link
              href="/customer/policies"
              className="text-xs text-slate-400 hover:text-slate-200 transition"
            >
              Open policy view &rarr;
            </Link>
          </div>
        )}
        {!onRetry && (
          <Link
            href="/customer/policies"
            className="inline-block rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
          >
            Open policy view &rarr;
          </Link>
        )}
      </section>
    );
  }

  const tier = policy.plan_code ?? "free";
  const txLimit = policy.plan_limits?.tx_limit_per_month ?? 0;
  const overridesEnabled = policy.plan_limits?.policy_overrides_enabled ?? false;
  const hasOverrides = policy.overrides && Object.keys(policy.overrides).length > 0;

  const effectiveSlippage = policy.effective?.max_slippage_bps as number | undefined;
  const effectiveAllowedMints = policy.effective?.allowed_mints as string[] | undefined;
  const effectiveDeniedMints = policy.effective?.denied_mints as string[] | undefined;

  return (
    <section
      data-testid="policy-summary-card"
      className="rounded-xl border border-white/10 bg-white/[0.02] p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-300">
          Policy &amp; Protections
        </h2>
        <Link
          href="/customer/policies"
          className="text-xs text-primary-400 hover:text-primary-300 transition"
          aria-label="View full policy details"
        >
          View details &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-slate-500">Protection status</span>
          <p className="mt-0.5 font-medium text-emerald-300">Active</p>
        </div>
        <div>
          <span className="text-slate-500">Monthly tx limit</span>
          <p className="mt-0.5 font-medium text-slate-200">
            {formatLimit(txLimit)}
          </p>
        </div>
        {effectiveSlippage !== undefined && (
          <div>
            <span className="text-slate-500">Max slippage</span>
            <p className="mt-0.5 font-medium text-slate-200">
              {effectiveSlippage} bps
            </p>
          </div>
        )}
        <div>
          <span className="text-slate-500">Custom overrides</span>
          <p className="mt-0.5 font-medium text-slate-200">
            {!overridesEnabled
              ? "Not available"
              : hasOverrides
                ? "Active"
                : "None set"}
          </p>
        </div>
      </div>

      {(effectiveAllowedMints && effectiveAllowedMints.length > 0) && (
        <p className="text-[10px] text-slate-500">
          Token allowlist: {effectiveAllowedMints.length} mint{effectiveAllowedMints.length !== 1 ? "s" : ""}
        </p>
      )}
      {(effectiveDeniedMints && effectiveDeniedMints.length > 0) && (
        <p className="text-[10px] text-slate-500">
          Token denylist: {effectiveDeniedMints.length} mint{effectiveDeniedMints.length !== 1 ? "s" : ""}
        </p>
      )}

      <p className="text-[10px] text-slate-500">
        Transactions are evaluated against <span className="capitalize">{tier}</span>-tier
        enforcement rules before execution.
      </p>

      <div className="pt-1 border-t border-white/5">
        <Link
          href="/customer/policies"
          className="text-[11px] font-medium text-primary-400 hover:text-primary-300 transition"
        >
          Manage policy settings &rarr;
        </Link>
      </div>
    </section>
  );
}

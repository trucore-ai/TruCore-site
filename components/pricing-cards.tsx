"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isLoggedIn, fetchDashboard } from "@/lib/customer-auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PlanTier = "free" | "pro" | "enterprise";

type AuthState =
  | { status: "unknown" }
  | { status: "logged-out" }
  | { status: "loading" }
  | { status: "loaded"; tier: PlanTier }
  | { status: "error" };

interface PlanCta {
  label: string;
  href: string;
}

interface Plan {
  tier: string;
  tagline: string;
  price: string;
  priceNote: string;
  highlight: boolean;
  limits: { protect: string; execution: string; receipts: string };
  features: readonly string[];
  cta: PlanCta;
}

interface CatalogFeature {
  feature_key: string;
  title: string;
  access_mode?: string;
}

interface PricingCardsProps {
  plans: readonly Plan[];
  featuresByPlan: Record<string, CatalogFeature[]>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TIER_RANK: Record<string, number> = { free: 0, pro: 1, enterprise: 2 };

function resolvedCta(
  plan: Plan,
  auth: AuthState,
): { label: string; href: string; isCurrent: boolean; loading: boolean } {
  const planTier = plan.tier.toLowerCase();

  // Unknown (SSR / pre-hydration), error, or logged-out → default CTAs
  if (
    auth.status === "unknown" ||
    auth.status === "error" ||
    auth.status === "logged-out"
  ) {
    return { label: plan.cta.label, href: plan.cta.href, isCurrent: false, loading: false };
  }

  // Logged in, tier still loading
  if (auth.status === "loading") {
    return { label: plan.cta.label, href: plan.cta.href, isCurrent: false, loading: true };
  }

  // Tier known
  if (planTier === auth.tier) {
    return { label: "Current Plan", href: "/customer/dashboard", isCurrent: true, loading: false };
  }

  const currentRank = TIER_RANK[auth.tier] ?? 0;
  const cardRank = TIER_RANK[planTier] ?? 0;

  if (cardRank < currentRank) {
    return { label: "Go to Dashboard", href: "/customer/dashboard", isCurrent: false, loading: false };
  }

  // Higher tier → keep default upgrade CTA
  return { label: plan.cta.label, href: plan.cta.href, isCurrent: false, loading: false };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PricingCards({ plans, featuresByPlan }: PricingCardsProps) {
  const [auth, setAuth] = useState<AuthState>({ status: "unknown" });

  useEffect(() => {
    if (!isLoggedIn()) {
      setAuth({ status: "logged-out" });
      return;
    }
    setAuth({ status: "loading" });
    fetchDashboard()
      .then((data) => {
        const raw = data as Record<string, unknown>;
        const tenant = raw.tenant as { plan_tier?: string } | null | undefined;
        const tier = (tenant?.plan_tier ?? "free") as PlanTier;
        setAuth({ status: "loaded", tier });
      })
      .catch(() => {
        setAuth({ status: "error" });
      });
  }, []);

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-3">
      {plans.map((plan) => {
        const cta = resolvedCta(plan, auth);

        return (
          <div
            key={plan.tier}
            className={`relative flex flex-col rounded-xl border p-8 transition-all ${
              cta.isCurrent
                ? "border-emerald-400/40 bg-emerald-500/[0.06] ring-1 ring-emerald-400/20"
                : plan.highlight
                  ? "border-primary-400/40 bg-primary-500/[0.06] shadow-glow"
                  : "border-white/10 bg-white/[0.02]"
            }`}
          >
            {/* Badges */}
            {cta.isCurrent && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-4 py-1 text-xs font-semibold text-white shadow-md">
                Current Plan
              </span>
            )}
            {plan.highlight && !cta.isCurrent && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-500 px-4 py-1 text-xs font-semibold text-white shadow-md">
                Most Popular
              </span>
            )}

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-100">
                {plan.tier}
              </h2>
              <p className="text-sm text-slate-400">{plan.tagline}</p>
            </div>

            <div className="mt-6">
              <span className="text-3xl font-bold text-slate-100">
                {plan.price}
              </span>
              <p className="mt-1 text-xs text-slate-500">{plan.priceNote}</p>
            </div>

            {/* Limits */}
            <div className="mt-6 space-y-2 rounded-lg border border-white/5 bg-white/[0.02] p-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Limits
              </h3>
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-400">Protect calls</dt>
                  <dd className="font-mono text-slate-200">
                    {plan.limits.protect}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Execution calls</dt>
                  <dd className="font-mono text-slate-200">
                    {plan.limits.execution}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Receipt storage</dt>
                  <dd className="font-mono text-slate-200">
                    {plan.limits.receipts}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Features */}
            <ul className="mt-6 flex-1 space-y-2 text-sm text-slate-300">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-400">&#x2713;</span>
                  {f}
                </li>
              ))}

              {/* Catalog-driven features */}
              {(featuresByPlan[plan.tier.toLowerCase()] ?? []).map((cf) => (
                <li key={cf.feature_key} className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-400">&#x2713;</span>
                  <span>
                    {cf.title}
                    {cf.access_mode === "request_only" && (
                      <span className="ml-1 text-[10px] text-amber-400">
                        (request access)
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className="mt-8">
              {cta.loading ? (
                <span className="block w-full rounded-xl py-3 text-center text-sm font-semibold border border-white/10 bg-white/5 text-slate-500 animate-pulse">
                  &hellip;
                </span>
              ) : (
                <Link
                  href={cta.href}
                  className={`block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all duration-200 ${
                    cta.isCurrent
                      ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                      : plan.highlight
                        ? "bg-primary-500 text-white hover:bg-primary-400 shadow-md"
                        : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                  }`}
                >
                  {cta.label}
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

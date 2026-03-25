import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getPublicFeatures, groupFeaturesByPlan } from "@/lib/feature-flags";
import type { PublicFeatureEntry } from "@/lib/dashboard-client";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "TruCore ATF plans: Free, Pro, and Enterprise. Start free with generous limits. Upgrade when you need more capacity.",
};

// ---------------------------------------------------------------------------
// Plan data - canonical source of truth aligned with backend plan definitions
// ---------------------------------------------------------------------------

const plans = [
  {
    tier: "Free",
    tagline: "For builders exploring ATF",
    price: "$0",
    priceNote: "No credit card required",
    highlight: false,
    limits: {
      protect: "100 / day",
      execution: "10 / day",
      receipts: "100 stored",
    },
    features: [
      "Full policy evaluation engine",
      "Tamper-evident receipts",
      "Dashboard & usage tracking",
      "Onboarding flow with sample trade",
      "Community support",
    ],
    cta: { label: "Get Started Free", href: "/signup" },
  },
  {
    tier: "Pro",
    tagline: "For teams shipping real agents",
    price: "Contact us",
    priceNote: "Custom pricing for active builders",
    highlight: true,
    limits: {
      protect: "5,000 / day",
      execution: "500 / day",
      receipts: "10,000 stored",
    },
    features: [
      "Everything in Free",
      "50x protect call capacity",
      "50x execution capacity",
      "100x receipt storage",
      "Priority support",
      "Advanced usage analytics",
    ],
    cta: { label: "Request Pro Access", href: "/upgrade?plan=pro" },
  },
  {
    tier: "Enterprise",
    tagline: "For institutions and high-volume deployments",
    price: "Custom",
    priceNote: "Volume-based, SLA-backed",
    highlight: false,
    limits: {
      protect: "1,000,000 / day",
      execution: "100,000 / day",
      receipts: "10,000,000 stored",
    },
    features: [
      "Everything in Pro",
      "Effectively unlimited capacity",
      "Dedicated support & onboarding",
      "Custom policy configuration",
      "SLA guarantees",
      "Audit log exports",
      "SSO & RBAC (roadmap)",
    ],
    cta: {
      label: "Request Enterprise",
      href: "/upgrade?plan=enterprise",
    },
  },
] as const;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function PricingPage() {
  const catalogFeatures = await getPublicFeatures();
  const featuresByPlan = groupFeaturesByPlan(catalogFeatures);

  return (
    <Container>
      <Section className="fade-in-up">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-xl leading-relaxed text-slate-300">
            Start free. Upgrade when your agents need more capacity.
            <br className="hidden sm:block" />
            No hidden fees, no tricks.
          </p>
        </div>
      </Section>

      <Section divider className="fade-in-up fade-delay-1">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.tier}
              className={`relative flex flex-col rounded-xl border p-8 transition-all ${
                plan.highlight
                  ? "border-primary-400/40 bg-primary-500/[0.06] shadow-glow"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              {plan.highlight && (
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
                <Link
                  href={plan.cta.href}
                  className={`block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all duration-200 ${
                    plan.highlight
                      ? "bg-primary-500 text-white hover:bg-primary-400 shadow-md"
                      : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                  }`}
                >
                  {plan.cta.label}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* FAQ-style bottom section */}
      <Section divider className="fade-in-up fade-delay-2">
        <div className="mx-auto max-w-3xl space-y-8">
          <h2 className="text-2xl font-bold text-slate-100 text-center">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                Can I start without a credit card?
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Yes. The Free plan requires no payment information. Sign up and
                start protecting trades immediately.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                What happens when I hit a limit?
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                You&apos;ll see warnings in your dashboard as you approach limits.
                Depending on enforcement mode, requests may be soft-warned or
                blocked. Upgrade to Pro for higher capacity. See the{" "}
                <Link
                  href="/docs/plans"
                  className="text-primary-400 underline hover:text-primary-300"
                >
                  full feature &amp; plan details
                </Link>{" "}
                for the complete availability matrix.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                How do I upgrade to Pro?
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Request Pro access through our{" "}
                <Link
                  href="/contact?subject=pro-upgrade"
                  className="text-primary-400 underline hover:text-primary-300"
                >
                  contact page
                </Link>
                . We&apos;ll get you set up within 24 hours.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                Do daily limits reset?
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Yes. Protect and execution call limits reset every 24 hours
                (rolling window, UTC). Receipt storage limits are cumulative.
              </p>
            </div>
          </div>
        </div>
      </Section>
    </Container>
  );
}

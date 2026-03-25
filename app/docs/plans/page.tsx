import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";

export const metadata: Metadata = {
  title: "Plans & Feature Tiers",
  description:
    "ATF Free, Pro, and Enterprise plans. Understand limits, feature availability, and how to upgrade.",
};

type FeatureRow = {
  feature: string;
  free: string;
  pro: string;
  enterprise: string;
};

const limits: FeatureRow[] = [
  { feature: "Protect calls / day", free: "100", pro: "5,000", enterprise: "1,000,000" },
  { feature: "Execution calls / day", free: "10", pro: "500", enterprise: "100,000" },
  { feature: "Stored receipts", free: "100", pro: "10,000", enterprise: "10,000,000" },
];

const features: FeatureRow[] = [
  { feature: "Policy evaluation engine", free: "✓", pro: "✓", enterprise: "✓" },
  { feature: "Tamper-evident receipts", free: "✓", pro: "✓", enterprise: "✓" },
  { feature: "Dashboard & usage tracking", free: "✓", pro: "✓", enterprise: "✓" },
  { feature: "Onboarding sample trade", free: "✓", pro: "✓", enterprise: "✓" },
  { feature: "Receipt verification", free: "✓", pro: "✓", enterprise: "✓" },
  { feature: "Community support", free: "✓", pro: "✓", enterprise: "✓" },
  { feature: "Priority support", free: "-", pro: "✓", enterprise: "✓" },
  { feature: "Advanced usage analytics", free: "-", pro: "✓", enterprise: "✓" },
  { feature: "Custom policy configuration", free: "-", pro: "-", enterprise: "✓" },
  { feature: "Dedicated onboarding", free: "-", pro: "-", enterprise: "✓" },
  { feature: "SLA guarantees", free: "-", pro: "-", enterprise: "✓" },
  { feature: "Audit log exports", free: "-", pro: "-", enterprise: "✓" },
  { feature: "SSO & RBAC", free: "-", pro: "-", enterprise: "Roadmap" },
];

const surfaces: FeatureRow[] = [
  { feature: "REST API", free: "✓", pro: "✓", enterprise: "✓" },
  { feature: "ATF CLI", free: "✓", pro: "✓", enterprise: "✓" },
  { feature: "OpenClaw Plugin", free: "✓", pro: "✓", enterprise: "✓" },
  { feature: "Perps enforcement", free: "-", pro: "Request access", enterprise: "✓" },
  { feature: "DEX guardrails (advanced)", free: "-", pro: "✓", enterprise: "✓" },
  { feature: "Agent observability", free: "Basic", pro: "Full", enterprise: "Full + export" },
];

function TierTable({ rows, caption }: { rows: FeatureRow[]; caption: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-white/10 text-left">
            <th className="pb-2 pr-4 font-semibold text-slate-300">Feature</th>
            <th className="pb-2 pr-4 font-semibold text-slate-300">Free</th>
            <th className="pb-2 pr-4 font-semibold text-slate-300">Pro</th>
            <th className="pb-2 font-semibold text-slate-300">Enterprise</th>
          </tr>
        </thead>
        <tbody className="text-slate-400">
          {rows.map((row) => (
            <tr key={row.feature} className="border-b border-white/5">
              <td className="py-2 pr-4 text-slate-200">{row.feature}</td>
              <td className="py-2 pr-4">{row.free}</td>
              <td className="py-2 pr-4">{row.pro}</td>
              <td className="py-2">{row.enterprise}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PlansPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          Plans &amp; Pricing
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Plans &amp; Feature Tiers
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Start free with generous limits. Upgrade to Pro or Enterprise when your agents
          need more capacity, priority support, or advanced features.
        </p>
      </header>

      {/* ── Plan Overview ── */}
      <section className="space-y-4">
        <HeadingAnchor id="plan-overview">Plan Overview</HeadingAnchor>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-white/10 p-5 space-y-3">
            <h3 className="text-xl font-bold text-slate-100">Free</h3>
            <p className="text-2xl font-bold text-slate-100">$0</p>
            <p className="text-sm text-slate-400">No credit card required</p>
            <p className="text-sm text-slate-300">
              Full policy engine, receipts, dashboard, and onboarding flow.
              Perfect for evaluating ATF and building prototypes.
            </p>
            <Link
              href="/signup"
              className="mt-2 inline-block rounded-md bg-primary-500/20 px-4 py-2 text-sm font-semibold text-primary-200 hover:bg-primary-500/30"
            >
              Get Started Free
            </Link>
          </div>
          <div className="rounded-lg border border-primary-400/30 bg-primary-500/[0.04] p-5 space-y-3 relative">
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary-500 px-3 py-0.5 text-[10px] font-semibold text-white">
              Most Popular
            </span>
            <h3 className="text-xl font-bold text-slate-100">Pro</h3>
            <p className="text-2xl font-bold text-slate-100">Contact us</p>
            <p className="text-sm text-slate-400">Custom pricing for active builders</p>
            <p className="text-sm text-slate-300">
              50x capacity, priority support, advanced analytics.
              For teams running real production bots.
            </p>
            <Link
              href="/upgrade?plan=pro"
              className="mt-2 inline-block rounded-md bg-primary-500/20 px-4 py-2 text-sm font-semibold text-primary-200 hover:bg-primary-500/30"
            >
              Request Pro Access
            </Link>
          </div>
          <div className="rounded-lg border border-white/10 p-5 space-y-3">
            <h3 className="text-xl font-bold text-slate-100">Enterprise</h3>
            <p className="text-2xl font-bold text-slate-100">Custom</p>
            <p className="text-sm text-slate-400">Volume-based, SLA-backed</p>
            <p className="text-sm text-slate-300">
              Effectively unlimited capacity, dedicated support, custom policies,
              SLA guarantees, and audit log exports.
            </p>
            <Link
              href="/upgrade?plan=enterprise"
              className="mt-2 inline-block rounded-md bg-primary-500/20 px-4 py-2 text-sm font-semibold text-primary-200 hover:bg-primary-500/30"
            >
              Request Enterprise
            </Link>
          </div>
        </div>
      </section>

      {/* ── Rate Limits ── */}
      <section className="space-y-4">
        <HeadingAnchor id="rate-limits">Rate Limits by Plan</HeadingAnchor>
        <TierTable rows={limits} caption="Rate limits comparison by plan" />
        <p className="text-sm text-slate-400">
          Limits reset daily at midnight UTC. When you approach a limit, ATF returns a
          warning header (<code className="font-mono text-slate-300">X-ATF-Quota-Warning</code>).
          Exceeding limits may result in <code className="font-mono text-slate-300">429</code> responses
          depending on enforcement mode.
        </p>
      </section>

      {/* ── Feature Availability ── */}
      <section className="space-y-4">
        <HeadingAnchor id="feature-availability">Feature Availability</HeadingAnchor>
        <TierTable rows={features} caption="Feature availability by plan" />
      </section>

      {/* ── Surface Availability ── */}
      <section className="space-y-4">
        <HeadingAnchor id="surface-availability">Surface Availability by Plan</HeadingAnchor>
        <TierTable rows={surfaces} caption="Integration surface availability by plan" />
        <p className="text-sm text-slate-400">
          All three integration surfaces (API, CLI, Plugin) are available on every plan.
          Certain advanced features like perps enforcement require Pro or Enterprise.
        </p>
      </section>

      {/* ── Feature Gating ── */}
      <section className="space-y-4">
        <HeadingAnchor id="feature-gating">How Feature Gating Works</HeadingAnchor>
        <p className="text-slate-300">
          Each feature in the ATF catalog has a required plan level and an access mode:
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-white/10 p-5 space-y-2">
            <h4 className="font-bold text-accent-300">Self-serve</h4>
            <p className="text-sm text-slate-400">
              Available automatically when your plan meets the requirement.
              No action needed beyond upgrading.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 p-5 space-y-2">
            <h4 className="font-bold text-accent-300">Request access</h4>
            <p className="text-sm text-slate-400">
              Submit an upgrade request and an operator will review.
              Used for features that need configuration or onboarding.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 p-5 space-y-2">
            <h4 className="font-bold text-accent-300">Contact sales</h4>
            <p className="text-sm text-slate-400">
              Enterprise-only features require a custom agreement.
              Reach out to discuss your requirements.
            </p>
          </div>
        </div>
      </section>

      {/* ── Feature Catalog ── */}
      <section className="space-y-4">
        <HeadingAnchor id="feature-catalog">Public Feature Catalog</HeadingAnchor>
        <p className="text-slate-300">
          The full public feature catalog is available via the API:
        </p>
        <div className="rounded-lg border border-white/5 bg-neutral-950/50 p-4 font-mono text-sm text-slate-200">
          GET https://api.trucore.xyz/features/catalog
        </div>
        <p className="text-slate-400">
          Each feature entry includes: <code className="font-mono text-slate-300">feature_key</code>,{" "}
          <code className="font-mono text-slate-300">surface</code> (api/cli/plugin),{" "}
          <code className="font-mono text-slate-300">required_plan</code>,{" "}
          <code className="font-mono text-slate-300">visibility</code>, and{" "}
          <code className="font-mono text-slate-300">access_mode</code>.
        </p>
      </section>

      {/* ── Next Steps ── */}
      <section className="space-y-4">
        <HeadingAnchor id="next-steps">Next Steps</HeadingAnchor>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/pricing"
            className="group rounded-lg border border-white/10 p-5 transition-colors hover:border-white/20"
          >
            <h3 className="font-bold text-accent-300 group-hover:text-accent-200">Pricing Page &rarr;</h3>
            <p className="mt-1 text-sm text-slate-400">Interactive pricing comparison with FAQ.</p>
          </Link>
          <Link
            href="/docs/upgrade"
            className="group rounded-lg border border-white/10 p-5 transition-colors hover:border-white/20"
          >
            <h3 className="font-bold text-accent-300 group-hover:text-accent-200">Upgrade &amp; Access &rarr;</h3>
            <p className="mt-1 text-sm text-slate-400">How to request Pro or Enterprise and what happens next.</p>
          </Link>
        </div>
      </section>
    </article>
  );
}

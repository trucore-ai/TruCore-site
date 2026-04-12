import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Customer Guides",
  description:
    "Operational guides for TruCore ATF customers — key lifecycle, rate limits, webhook debugging, receipts, and health checks.",
  robots: { index: false, follow: false },
};

/* ── Upcoming guides (Phase B placeholders) ── */

const upcomingGuides = [
  {
    title: "API Key Lifecycle",
    href: "/docs/guide/key-lifecycle",
    description:
      "Create, rotate, revoke, and scope API keys. Understand one-time secret display, environment setup, and key hygiene.",
    publicRef: { label: "Auth & API Keys", href: "/docs/auth" },
    ready: true,
  },
  {
    title: "Rate Limits & Recovery",
    href: "/docs/guide/rate-limits",
    description:
      "Read rate-limit headers, implement exponential backoff, and recover gracefully when limits are hit.",
    publicRef: { label: "Plans & Feature Tiers", href: "/docs/plans" },
    ready: false,
  },
  {
    title: "Webhook Setup & Debugging",
    href: "/docs/guide/webhooks",
    description:
      "Configure webhook endpoints, verify delivery signatures, inspect dead-letter queues, and troubleshoot failures.",
    publicRef: null,
    ready: false,
  },
  {
    title: "Readiness & Health Checks",
    href: "/docs/guide/readiness",
    description:
      "Understand what \"ready\" means for your integration, interpret CLI doctor output, and verify RPC connectivity.",
    publicRef: { label: "CLI Doctor", href: "/docs/cli/doctor" },
    ready: false,
  },
  {
    title: "Receipt Operations",
    href: "/docs/guide/receipts-ops",
    description:
      "Browse, verify, and export your receipts. Understand content_hash, verification guarantees, and retention policies.",
    publicRef: { label: "Receipts & Trust", href: "/docs/receipts-and-trust" },
    ready: false,
  },
] as const;

/* ── Page ── */

export default function CustomerGuidesOverview() {
  return (
    <div className="space-y-10">
      {/* ── Header ── */}
      <header className="space-y-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Authenticated Docs
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Customer Guides
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Operational guidance for teams running TruCore ATF in production.
          These guides build on the{" "}
          <Link
            href="/docs"
            className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            public documentation
          </Link>{" "}
          with account-specific workflows, header references, debugging
          procedures, and recovery patterns that only matter once you are
          actively integrating.
        </p>
        <div className="gradient-divider mt-2" aria-hidden="true" />
      </header>

      {/* ── Start here ── */}
      <section className="space-y-4">
        <HeadingAnchor id="start-here">Start here</HeadingAnchor>
        <ol className="ml-5 list-decimal space-y-3 text-slate-300">
          <li>
            <strong className="text-slate-200">Review the public docs</strong>{" "}
            — if you haven&apos;t already, start with{" "}
            <Link
              href="/docs/getting-started"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              Getting Started
            </Link>{" "}
            and{" "}
            <Link
              href="/docs/first-protected-trade"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              First Protected Trade
            </Link>
            . They cover concepts; these guides cover operations.
          </li>
          <li>
            <strong className="text-slate-200">Verify your API key</strong>{" "}
            — visit your{" "}
            <Link
              href="/customer/keys"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              Keys dashboard
            </Link>{" "}
            to confirm you have an active key with the scopes your workflow needs.
          </li>
          <li>
            <strong className="text-slate-200">Run a health check</strong>{" "}
            — use{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-sm text-slate-200">
              atf doctor
            </code>{" "}
            or call the{" "}
            <Link
              href="/docs/api"
              className="font-semibold text-primary-200 hover:text-primary-100"
            >
              status endpoint
            </Link>{" "}
            to confirm connectivity before diving into operational guides.
          </li>
          <li>
            <strong className="text-slate-200">Pick a guide below</strong>{" "}
            — start with whichever topic matches your current integration step.
          </li>
        </ol>
      </section>

      {/* ── How these guides differ from public docs ── */}
      <section className="space-y-4">
        <HeadingAnchor id="public-vs-customer-guides">
          How these guides differ from public docs
        </HeadingAnchor>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-slate-400">
                <th className="pb-2 pr-6 font-medium">Public docs</th>
                <th className="pb-2 font-medium">Customer Guides</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6">Concepts, specs, and reference</td>
                <td className="py-2.5">Operational procedures and recovery</td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6">Available to everyone</td>
                <td className="py-2.5">Requires a TruCore account (free tier included)</td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-2.5 pr-6">API shape and parameters</td>
                <td className="py-2.5">Header details, backoff strategies, error classification</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-6">What ATF does</td>
                <td className="py-2.5">How to run ATF in production</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Upcoming guides ── */}
      <section className="space-y-4">
        <HeadingAnchor id="guides">Guides</HeadingAnchor>
        <div className="grid gap-4 md:grid-cols-2">
          {upcomingGuides.map((guide) => {
            const inner = (
              <>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold tracking-tight text-accent-300">
                    {guide.title}
                  </h3>
                  {guide.ready ? (
                    <span className="shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                      Available
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                      Coming soon
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {guide.description}
                </p>
                {guide.publicRef && (
                  <p className="mt-3 text-xs text-slate-500">
                    Public reference:{" "}
                    <span className="text-primary-300">
                      {guide.publicRef.label}
                    </span>
                  </p>
                )}
              </>
            );

            return guide.ready ? (
              <Link key={guide.href} href={guide.href} className="block">
                <Card className="group relative h-full p-6 transition-colors hover:border-white/[0.12]">
                  {inner}
                </Card>
              </Link>
            ) : (
              <Card
                key={guide.href}
                className="group relative h-full p-6 transition-colors hover:border-white/[0.12]"
              >
                {inner}
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── What's next ── */}
      <section className="glass-panel rounded-xl p-7">
        <HeadingAnchor id="whats-next">What&apos;s next</HeadingAnchor>
        <p className="mt-3 text-slate-400">
          Guides will be added in phases as the authenticated knowledge layer matures.
          Each guide links back to its public docs counterpart so you always have context.
          If you need help before a guide is published, reach out via{" "}
          <Link
            href="/feedback"
            className="font-semibold text-primary-200 hover:text-primary-100"
          >
            feedback
          </Link>{" "}
          or check the{" "}
          <Link
            href="/customer/dashboard"
            className="font-semibold text-primary-200 hover:text-primary-100"
          >
            customer dashboard
          </Link>{" "}
          for in-product guidance.
        </p>
      </section>
    </div>
  );
}

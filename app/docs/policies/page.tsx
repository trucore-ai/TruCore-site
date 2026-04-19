import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";

export const metadata: Metadata = {
  title: "Policies | TruCore ATF",
  description:
    "Policy Intelligence and adaptive policy tuning for TruCore ATF. Learn about Auto-Dynamic PIL and bounded adaptive execution parameters.",
  keywords: [
    "policies",
    "policy intelligence",
    "PIL",
    "adaptive policies",
    "ATF",
    "TruCore ATF",
  ],
  openGraph: {
    title: "Policies | TruCore ATF",
    description:
      "Explore TruCore's Policy Intelligence Layer, including Auto-Dynamic PIL for bounded adaptive tuning.",
    url: "https://trucore.xyz/docs/policies",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Policies | TruCore ATF",
    description:
      "Explore TruCore's Policy Intelligence Layer and adaptive policy features.",
    images: ["/opengraph-image"],
  },
  alternates: { canonical: "https://trucore.xyz/docs/policies" },
};

export default function DocsPoliciesPage() {
  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          Policy & Intelligence
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Policies
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          TruCore ATF policies define execution guardrails: slippage caps, DEX allowlists,
          rate limits, and more. The Policy Intelligence Layer offers bounded adaptive tuning
          for next-transaction market conditions while preserving your policy intent.
        </p>
      </header>

      <div className="gradient-divider" aria-hidden="true" />

      <section className="space-y-6">
        <div>
          <HeadingAnchor
            id="policy-concepts"
            className="text-2xl font-bold tracking-tight text-accent-100"
          >
            Policy Concepts
          </HeadingAnchor>
          <p className="mt-3 text-base leading-relaxed text-slate-300">
            Policies in TruCore ATF are declarative intent boundaries. They specify the
            conditions under which a trade is permitted, limits on cost and risk, and
            allowlists for safe counterparties and routes.
          </p>
        </div>

        <div>
          <HeadingAnchor
            id="policy-intelligence"
            className="text-2xl font-bold tracking-tight text-accent-100"
          >
            Policy Intelligence Layer
          </HeadingAnchor>
          <p className="mt-3 text-base leading-relaxed text-slate-300">
            The Policy Intelligence Layer (PIL) enhances policy enforcement with adaptive
            assistance. Rather than replacing your policy, PIL provides safety-constrained
            recommendations for bounded parameters to match current market conditions.
          </p>
          <div className="mt-4 rounded-lg border border-primary-400/20 bg-primary-950/30 p-4">
            <p className="text-sm text-slate-200">
              <strong>Premium feature:</strong> Policy Intelligence features require a Pro or
              Enterprise plan.
            </p>
          </div>
        </div>
      </section>

      <div className="gradient-divider" aria-hidden="true" />

      <section className="space-y-6">
        <HeadingAnchor
          id="available-features"
          className="text-2xl font-bold tracking-tight text-accent-100"
        >
          Available Features
        </HeadingAnchor>

        <div className="space-y-4">
          <div className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-5 transition-colors hover:border-slate-600/70">
            <Link href="/docs/policies/auto-dynamic-pil" className="group">
              <h3 className="text-lg font-bold text-primary-100 transition-colors group-hover:text-primary-50">
                Auto-Dynamic PIL →
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Bounded adaptive tuning for the next transaction. Auto-Dynamic PIL
                intelligently adjusts execution parameters (like slippage tolerance) within
                your policy guardrails to match current market conditions, deterministically
                and transparently.
              </p>
              <p className="mt-3 text-xs font-semibold text-primary-300">
                Read Auto-Dynamic PIL documentation
              </p>
            </Link>
          </div>
        </div>
      </section>

      <div className="gradient-divider" aria-hidden="true" />

      <section className="space-y-4">
        <HeadingAnchor
          id="next-steps"
          className="text-lg font-bold tracking-tight text-accent-100"
        >
          Next Steps
        </HeadingAnchor>
        <ul className="space-y-2 text-slate-300">
          <li>
            <Link
              href="/docs/policy-model"
              className="text-primary-200 transition-colors hover:text-primary-100"
            >
              Learn the policy model primitives
            </Link>
            {" — allowlists, limits, slippage bounds, and fail-closed checks."}
          </li>
          <li>
            <Link
              href="/docs/policy-examples"
              className="text-primary-200 transition-colors hover:text-primary-100"
            >
              See concrete policy examples
            </Link>
            {" — copy-paste configurations for common use cases."}
          </li>
          <li>
            <Link
              href="/docs/quickstart"
              className="text-primary-200 transition-colors hover:text-primary-100"
            >
              Run the quickstart
            </Link>
            {" — protect a swap intent with a policy in four steps."}
          </li>
        </ul>
      </section>
    </article>
  );
}

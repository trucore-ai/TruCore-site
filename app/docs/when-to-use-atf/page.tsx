import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";

export const metadata: Metadata = {
  title: "When to Use ATF",
  description:
    "Guidelines on when to use mock vs real execution, when Free is enough, when Pro becomes useful, and what kinds of bots benefit first from ATF.",
};

export default function WhenToUseAtfPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          Guide
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          When to Use ATF
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Not every bot needs every feature. This guide helps you decide when to
          start, which mode to use, and when upgrading makes sense.
        </p>
      </header>

      {/* ── Mock vs Real ── */}
      <section className="space-y-4">
        <HeadingAnchor id="mock-vs-real">
          Mock vs Real Execution
        </HeadingAnchor>
        <p className="max-w-3xl text-base leading-relaxed text-slate-300">
          ATF supports two execution modes. Choosing the right one depends on
          your stage.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm text-slate-300">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 pr-4">Mode</th>
                <th className="py-3 pr-4">What Happens</th>
                <th className="py-3 pr-4">When to Use</th>
                <th className="py-3">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              <tr>
                <td className="py-3 pr-4 font-semibold text-accent-300">
                  Demo / Mock
                </td>
                <td className="py-3 pr-4">
                  ATF evaluates your intent and returns a receipt, but no
                  transaction is sent to Solana.
                </td>
                <td className="py-3 pr-4">
                  First integration. Testing policy rules. CI pipelines.
                  Validating receipt format.
                </td>
                <td className="py-3">Free - no signup required</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-accent-300">
                  Real Execution
                </td>
                <td className="py-3 pr-4">
                  ATF evaluates, and if allowed, the transaction proceeds
                  to Solana. Full enforcement with on-chain settlement.
                </td>
                <td className="py-3 pr-4">
                  Production bots executing real capital. After you have
                  validated policy rules in mock mode.
                </td>
                <td className="py-3">Pro tier (manual approval in beta)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-slate-400">
          Start with mock mode. Validate your policy configuration and receipt
          handling. Move to real execution when your bot is proven and you need
          on-chain settlement.
        </p>
      </section>

      {/* ── When Free Is Enough ── */}
      <section className="space-y-4">
        <HeadingAnchor id="when-free-is-enough">
          When Free Is Enough
        </HeadingAnchor>
        <p className="max-w-3xl text-base leading-relaxed text-slate-300">
          Free tier includes 100 protect calls per day, mock execution, and full
          receipt generation. This is sufficient for:
        </p>
        <ul className="ml-6 list-disc space-y-2 text-base text-slate-300">
          <li>
            <strong className="text-slate-200">
              Evaluating ATF for your bot
            </strong>{" "}
            - test policy enforcement, verify receipt format, check integration
            patterns.
          </li>
          <li>
            <strong className="text-slate-200">Low-frequency bots</strong>  - 
            bots that execute fewer than 100 trades per day and operate within
            default spend caps (25 SOL per tx).
          </li>
          <li>
            <strong className="text-slate-200">CI/CD testing</strong>  - 
            integrate protect calls into your test suite to verify policy
            compliance before deployment.
          </li>
          <li>
            <strong className="text-slate-200">Agent framework testing</strong>{" "}
            - validate that your agent correctly handles ALLOW/DENY responses
            and processes receipts.
          </li>
          <li>
            <strong className="text-slate-200">Demos and proof-of-concept</strong>{" "}
            - show stakeholders how enforcement works without committing to a
            paid plan.
          </li>
        </ul>
        <p className="text-sm text-slate-400">
          If your bot never needs to exceed 100 calls/day and 25 SOL per
          transaction, Free may be all you need.
        </p>
      </section>

      {/* ── When Pro Becomes Useful ── */}
      <section className="space-y-4">
        <HeadingAnchor id="when-pro-helps">
          When Pro Becomes Useful
        </HeadingAnchor>
        <p className="max-w-3xl text-base leading-relaxed text-slate-300">
          You will know Pro is useful when your bot starts hitting limits.
          The deny receipts tell you exactly when that happens.
        </p>
        <ul className="ml-6 list-disc space-y-2 text-base text-slate-300">
          <li>
            <strong className="text-slate-200">
              Rate limit exceeded
            </strong>{" "}
            - your bot makes more than 100 protect calls per day.
          </li>
          <li>
            <strong className="text-slate-200">Spend cap exceeded</strong>  - 
            your trades exceed the 25 SOL per-tx cap on Free.
          </li>
          <li>
            <strong className="text-slate-200">
              Real execution needed
            </strong>{" "}
            - you want ATF-gated real settlement on Solana, not just
            mock evaluation.
          </li>
          <li>
            <strong className="text-slate-200">
              Higher-frequency trading
            </strong>{" "}
            - arbitrage bots, market makers, or agents that execute
            continuously.
          </li>
          <li>
            <strong className="text-slate-200">
              Custom policy configuration
            </strong>{" "}
            - tighter or more specific rules than the defaults allow.
          </li>
        </ul>
        <p className="text-sm text-slate-400">
          During public beta, Pro requires manual approval.{" "}
          <Link
            href="/docs/upgrade"
            className="text-primary-200 hover:text-primary-100"
          >
            Request an upgrade
          </Link>{" "}
          when you are ready.
        </p>
      </section>

      {/* ── Who Benefits First ── */}
      <section className="space-y-4">
        <HeadingAnchor id="who-benefits-first">
          What Kinds of Bots Benefit First
        </HeadingAnchor>
        <p className="max-w-3xl text-base leading-relaxed text-slate-300">
          ATF is designed for any bot that executes transactions on Solana, but
          some use cases benefit more immediately than others.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm text-slate-300">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 pr-4">Bot Type</th>
                <th className="py-3 pr-4">Why ATF Helps</th>
                <th className="py-3">Start With</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              <tr>
                <td className="py-3 pr-4 font-semibold text-accent-300">
                  Arbitrage bots
                </td>
                <td className="py-3 pr-4">
                  High-frequency, high-risk. Spend caps prevent a bad
                  arb from draining the wallet in one trade.
                </td>
                <td className="py-3">Free → Pro when hitting caps</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-accent-300">
                  DCA / scheduling bots
                </td>
                <td className="py-3 pr-4">
                  Predictable execution. Policy ensures each scheduled
                  trade stays within bounds and receipts provide an
                  audit trail.
                </td>
                <td className="py-3">Free (usually sufficient)</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-accent-300">
                  AI agent frameworks
                </td>
                <td className="py-3 pr-4">
                  Agents make autonomous decisions. ATF adds a
                  deterministic constraint layer before execution.
                </td>
                <td className="py-3">Free + OpenClaw plugin</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-accent-300">
                  Treasury / fund automation
                </td>
                <td className="py-3 pr-4">
                  Larger position sizes. Protocol allowlists and spend
                  caps enforce fiduciary constraints.
                </td>
                <td className="py-3">Pro or Enterprise</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-accent-300">
                  Liquidation bots
                </td>
                <td className="py-3 pr-4">
                  Time-sensitive. TTL-bound permits ensure stale
                  decisions do not execute. Receipts prove every action.
                </td>
                <td className="py-3">Pro (real execution needed)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Decision Flowchart ── */}
      <section className="space-y-4">
        <HeadingAnchor id="decision-flow">
          Quick Decision Flow
        </HeadingAnchor>
        <div className="rounded-xl border border-white/[0.07] bg-neutral-900/50 p-6">
          <ol className="ml-6 list-decimal space-y-3 text-base text-slate-300">
            <li>
              <strong className="text-slate-200">Want to see how ATF works?</strong>{" "}
              → Use the{" "}
              <Link
                href="/try"
                className="text-primary-200 hover:text-primary-100"
              >
                web sandbox
              </Link>{" "}
              (no signup)
            </li>
            <li>
              <strong className="text-slate-200">
                Integrating into your bot?
              </strong>{" "}
              → Start with{" "}
              <Link
                href="/docs/getting-started"
                className="text-primary-200 hover:text-primary-100"
              >
                Getting Started
              </Link>{" "}
              (Free tier, mock mode)
            </li>
            <li>
              <strong className="text-slate-200">
                Hitting limits on Free?
              </strong>{" "}
              → Your deny receipts will tell you. Then{" "}
              <Link
                href="/docs/upgrade"
                className="text-primary-200 hover:text-primary-100"
              >
                request Pro
              </Link>
            </li>
            <li>
              <strong className="text-slate-200">
                Need real execution on Solana?
              </strong>{" "}
              → Pro tier with manual approval during beta
            </li>
            <li>
              <strong className="text-slate-200">
                Enterprise compliance needs?
              </strong>{" "}
              →{" "}
              <Link
                href="/enterprise"
                className="text-primary-200 hover:text-primary-100"
              >
                Contact us
              </Link>
            </li>
          </ol>
        </div>
      </section>

      {/* ── Next Steps ── */}
      <section className="space-y-4">
        <HeadingAnchor id="next-steps">
          Next Steps
        </HeadingAnchor>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              title: "Try ATF",
              desc: "Web sandbox - no signup required",
              href: "/try",
            },
            {
              title: "Getting Started",
              desc: "Signup, API key, first protected trade",
              href: "/docs/getting-started",
            },
            {
              title: "Pricing & Plans",
              desc: "Free, Pro, and Enterprise tiers",
              href: "/pricing",
            },
            {
              title: "First Protected Trade",
              desc: "Golden path walkthrough",
              href: "/docs/first-protected-trade",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-lg border border-white/[0.07] bg-neutral-900/40 p-4 transition-colors hover:border-primary-300/30 hover:bg-neutral-900/60"
            >
              <p className="font-semibold text-accent-300 group-hover:text-accent-200">
                {item.title}
              </p>
              <p className="mt-1 text-sm text-slate-400">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}

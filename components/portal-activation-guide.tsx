/* ────────────────────────────────────────────────────────────────
 *  PortalActivationGuide - renders a state-aware next-step block
 *  in the partner portal based on the tenant's activation state.
 *
 *  Replaces the static "Getting Started" checklist with guidance
 *  that adapts to the partner's actual request volume:
 *
 *  - zero_activity  → strongest CTA toward first protected trade
 *  - early_activity → review first results / verify a receipt / builder resources
 *  - active_usage   → advanced docs / permits / CLI / builder hub
 *
 *  States are proxy buckets derived from request volume, NOT proof
 *  of specific user actions. See lib/portal-activation.ts for details.
 *
 *  Server component - no client JS required.
 * ──────────────────────────────────────────────────────────── */

import Link from "next/link";
import type { PortalActivationSummary } from "@/lib/portal-activation";

type Props = {
  activation: PortalActivationSummary;
};

/* ── zero_activity ───────────────────────────────────────────── */

function ZeroActivityGuide() {
  return (
    <section className="space-y-4 rounded-xl border border-accent-500/30 bg-accent-500/[0.06] p-5">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-accent-300">
          Welcome - let&apos;s protect your first trade
        </h2>
        <p className="text-sm text-slate-300">
          Your account is active. Follow the steps below to send your first
          trade intent through the firewall and get a tamper-evident receipt.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/docs/first-protected-trade"
          className="group block rounded-lg border border-accent-400/30 bg-accent-500/[0.08] p-4 transition-colors hover:border-accent-300/50"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-accent-400/50 text-xs font-bold text-accent-200">
            1
          </span>
          <p className="mt-2 font-semibold text-accent-200 group-hover:text-accent-100">
            Protect your first trade
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Submit an intent via HTTP, Python, TypeScript, CLI, or OpenClaw and
            receive your first receipt.
          </p>
        </Link>

        <Link
          href="/docs/5-minute-quickstart"
          className="block rounded-lg border border-white/10 bg-neutral-900/50 p-4 transition-colors hover:border-primary-300/30"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/20 text-xs font-bold text-slate-300">
            2
          </span>
          <p className="mt-2 font-semibold text-slate-200">
            5-minute quickstart
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Copy a curl command, hit the API, and see the policy engine respond
            in seconds.
          </p>
        </Link>

        <Link
          href="/docs/quickstart"
          className="block rounded-lg border border-white/10 bg-neutral-900/50 p-4 transition-colors hover:border-primary-300/30"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/20 text-xs font-bold text-slate-300">
            3
          </span>
          <p className="mt-2 font-semibold text-slate-200">
            Full quickstart guide
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Deeper walkthrough: install, configure, simulate, and verify your
            first protected trade end-to-end.
          </p>
        </Link>
      </div>

      <p className="text-xs text-slate-500">
        Your API keys are listed below. Use any active key with{" "}
        <code className="text-slate-400">x-api-key</code> to get started.
      </p>
    </section>
  );
}

/* ── early_activity ───────────────────────────────────────────── */

function EarlyActivityGuide({
  totalRequests,
}: {
  totalRequests: number;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-primary-500/30 bg-primary-500/[0.06] p-5">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-primary-300">
          Nice progress - keep building
        </h2>
        <p className="text-sm text-slate-300">
          You&apos;ve sent{" "}
          <span className="font-medium text-primary-200">
            {totalRequests} request{totalRequests !== 1 ? "s" : ""}
          </span>{" "}
          through the firewall. Verify a receipt to confirm the integrity chain,
          or explore integration patterns for your bot.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/verify"
          className="group block rounded-lg border border-primary-400/30 bg-primary-500/[0.08] p-4 transition-colors hover:border-primary-300/50"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-primary-400/50 text-xs font-bold text-primary-200">
            ✓
          </span>
          <p className="mt-2 font-semibold text-primary-200 group-hover:text-primary-100">
            Verify a receipt
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Paste any <code className="text-slate-300">content_hash</code> from
            a recent response to confirm integrity on-chain.
          </p>
        </Link>

        <Link
          href="/docs/first-protected-trade"
          className="block rounded-lg border border-white/10 bg-neutral-900/50 p-4 transition-colors hover:border-primary-300/30"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/20 text-xs font-bold text-slate-300">
            ↻
          </span>
          <p className="mt-2 font-semibold text-slate-200">
            Review the trade guide
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Revisit the first-protected-trade walkthrough if you need help
            finding your receipt hash.
          </p>
        </Link>

        <Link
          href="/builders"
          className="block rounded-lg border border-white/10 bg-neutral-900/50 p-4 transition-colors hover:border-primary-300/30"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/20 text-xs font-bold text-slate-300">
            →
          </span>
          <p className="mt-2 font-semibold text-slate-200">
            Builder resources
          </p>
          <p className="mt-1 text-xs text-slate-400">
            CLI reference, policy model, integration patterns, and SDK guides.
          </p>
        </Link>
      </div>

      <p className="text-xs text-slate-500">
        Verifying a receipt confirms it is authentic and tamper-free.
        You can verify from the panel below or use the CLI.
      </p>
    </section>
  );
}

/* ── active_usage ────────────────────────────────────────────── */

function ActiveUsageGuide({ totalRequests }: { totalRequests: number }) {
  return (
    <section className="space-y-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-emerald-300">
          You&apos;re up and running
        </h2>
        <p className="text-sm text-slate-300">
          <span className="font-medium text-emerald-200">
            {totalRequests.toLocaleString()} protected requests
          </span>{" "}
          and counting. Explore advanced features or keep building.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/docs/policy-model"
          className="block rounded-lg border border-white/10 bg-neutral-900/50 p-4 transition-colors hover:border-emerald-300/30"
        >
          <p className="font-semibold text-slate-200">Policy model</p>
          <p className="mt-1 text-xs text-slate-400">
            Customize limits, slippage, token lists, and action-level rules.
          </p>
        </Link>

        <Link
          href="/docs/permits"
          className="block rounded-lg border border-white/10 bg-neutral-900/50 p-4 transition-colors hover:border-emerald-300/30"
        >
          <p className="font-semibold text-slate-200">Permits &amp; receipts</p>
          <p className="mt-1 text-xs text-slate-400">
            Understand the permit lifecycle, receipt signatures, and integrity
            proofs.
          </p>
        </Link>

        <Link
          href="/docs/cli"
          className="block rounded-lg border border-white/10 bg-neutral-900/50 p-4 transition-colors hover:border-emerald-300/30"
        >
          <p className="font-semibold text-slate-200">CLI reference</p>
          <p className="mt-1 text-xs text-slate-400">
            Automate workflows with the ATF command-line interface.
          </p>
        </Link>

        <Link
          href="/builders"
          className="block rounded-lg border border-white/10 bg-neutral-900/50 p-4 transition-colors hover:border-emerald-300/30"
        >
          <p className="font-semibold text-slate-200">Builder hub</p>
          <p className="mt-1 text-xs text-slate-400">
            SDKs, integration patterns, example bots, and community reference
            implementations.
          </p>
        </Link>
      </div>
    </section>
  );
}

/* ── main export ─────────────────────────────────────────────── */

export function PortalActivationGuide({ activation }: Props) {
  switch (activation.state) {
    case "zero_activity":
      return <ZeroActivityGuide />;
    case "early_activity":
      return (
        <EarlyActivityGuide totalRequests={activation.totalRequests} />
      );
    case "active_usage":
      return <ActiveUsageGuide totalRequests={activation.totalRequests} />;
  }
}

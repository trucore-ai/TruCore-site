import type { Metadata } from "next";
import { HeadingAnchor } from "@/components/heading-anchor";

export const metadata: Metadata = {
  title: "Policy Model",
  description:
    "ATF policy primitives including allowlists, spend limits, slippage bounds, cooldowns, and fail-closed behavior.",
};

export default function DocsPolicyModelPage() {
  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Concepts</p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-100 sm:text-5xl">Policy Model</h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Policies encode non-negotiable constraints. Agents can propose intent, but ATF decides whether the action
          fits the approved envelope.
        </p>
      </header>

      <section className="space-y-4">
        <HeadingAnchor id="policy-primitives">Policy primitives</HeadingAnchor>
        <ul className="space-y-3 text-slate-300">
          <li>
            <span className="font-semibold text-slate-100">Allowlists</span>, limit execution to explicitly approved
            protocols, methods, and asset pairs.
          </li>
          <li>
            <span className="font-semibold text-slate-100">Spend limits</span>, cap notional exposure per transaction
            and per rolling window.
          </li>
          <li>
            <span className="font-semibold text-slate-100">Slippage bounds</span>, enforce maximum deviation from
            expected execution price.
          </li>
          <li>
            <span className="font-semibold text-slate-100">Cooldowns</span>, require a minimum wait period between
            high-risk operations.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="fail-closed-behavior">Fail-closed behavior</HeadingAnchor>
        <p className="text-slate-300">
          If any check is missing, malformed, expired, or non-compliant, ATF rejects the action. The default outcome
          is deny, not allow.
        </p>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="example-policy-json">Example policy JSON</HeadingAnchor>
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`{
  "policyId": "pol_live_treasury_v1",
  "protocolAllowlists": ["jupiter", "solend"],
  "spendLimits": {
    "perTransactionUsd": 2500,
    "perHourUsd": 10000
  },
  "slippage": {
    "maxBps": 50
  },
  "cooldowns": {
    "swap.execute": 30,
    "lend.repay": 15
  },
  "defaultDecision": "deny"
}`}
        </pre>
      </section>
    </article>
  );
}
import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";

export const metadata: Metadata = {
  title: "Latency-Positive ATF - Faster and Safer Execution",
  description:
    "How ATF evolves from security middleware into a latency-positive execution layer - making protected bots faster than unprotected ones.",
};

export default function DocsLatencyPositiveAtfPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Strategy</p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Latency-Positive ATF
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          A firewall that makes your bot faster, not slower. ATF is evolving from security
          middleware into shared execution intelligence that reduces effective trading latency.
        </p>
      </header>

      {/* --- The Objection --- */}
      <section className="space-y-4">
        <HeadingAnchor id="the-objection">
          &ldquo;Doesn&rsquo;t a firewall make my bot slower?&rdquo;
        </HeadingAnchor>
        <p className="text-slate-300">
          That is the natural assumption. Every middleware layer adds processing time,
          and trading bots compete on execution speed. Any overhead feels like a cost.
        </p>
        <p className="text-slate-300">
          The assumption holds if you measure only <strong>middleware overhead in isolation</strong>.
          But it breaks down when you measure <strong>total workflow latency</strong> - the time
          from intent formation to on-chain submission.
        </p>
      </section>

      {/* --- The Reframe --- */}
      <section className="space-y-4">
        <HeadingAnchor id="the-reframe">
          Not if the firewall becomes shared execution intelligence
        </HeadingAnchor>
        <p className="text-slate-300">
          A standalone bot must independently fetch account state, request DEX quotes,
          validate routes, simulate transactions, run its own safety checks, sign, and submit.
          Every bot does this work alone, even when multiple bots need the same data.
        </p>
        <p className="text-slate-300">
          ATF serves multiple agents. It maintains shared on-chain state, caches recent
          quotes, batches overlapping account reads, parallelizes external calls, and
          pre-computes policy-relevant data. When ATF eliminates more redundant work than
          its enforcement overhead costs, the protected bot finishes faster.
        </p>
        <p className="font-medium text-accent-200">
          The correct benchmark is effective time-to-execution versus a bot doing everything
          itself - not middleware overhead in isolation.
        </p>
      </section>

      {/* --- Latency Decomposition --- */}
      <section className="space-y-4">
        <HeadingAnchor id="latency-types">Understanding Latency Types</HeadingAnchor>
        <p className="text-slate-300">
          &ldquo;Latency&rdquo; in a trading bot workflow is not one number. It decomposes into
          distinct components, and ATF affects each differently:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-slate-300">
            <thead>
              <tr className="border-b border-white/10 text-left text-slate-400">
                <th className="pb-2 pr-4 font-medium">Component</th>
                <th className="pb-2 font-medium">What It Is</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr><td className="py-2 pr-4 font-medium text-slate-200">ATF decision time</td><td className="py-2">Time for ATF to evaluate policy and return a decision</td></tr>
              <tr><td className="py-2 pr-4 font-medium text-slate-200">RPC latency</td><td className="py-2">Round-trip to Solana nodes - shared by all bots</td></tr>
              <tr><td className="py-2 pr-4 font-medium text-slate-200">Quote latency</td><td className="py-2">DEX quote fetch time - shared by all bots</td></tr>
              <tr><td className="py-2 pr-4 font-medium text-slate-200">End-to-end protected</td><td className="py-2">Total wall-clock time using ATF, including all of the above</td></tr>
              <tr><td className="py-2 pr-4 font-medium text-slate-200">Effective delta</td><td className="py-2">Protected latency minus standalone bot baseline - the metric that matters</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* --- Execution Modes --- */}
      <section className="space-y-4">
        <HeadingAnchor id="execution-modes">Execution Modes - Strict / Balanced / Turbo</HeadingAnchor>
        <p className="text-slate-300">
          ATF defines three execution modes that let operators choose their position on the
          safety–speed spectrum. All three modes satisfy the same zero-trust security invariants.
          The difference is how much pre-computed work is reused, not whether safety checks run.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-slate-300">
            <thead>
              <tr className="border-b border-white/10 text-left text-slate-400">
                <th className="pb-2 pr-4 font-medium">Mode</th>
                <th className="pb-2 pr-4 font-medium">Freshness</th>
                <th className="pb-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="py-2 pr-4 font-medium text-slate-200">Strict</td>
                <td className="py-2 pr-4">Live only</td>
                <td className="py-2">All reads are fresh. No caching. Maximum safety, highest latency.</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium text-slate-200">Balanced</td>
                <td className="py-2 pr-4">≤ 2s</td>
                <td className="py-2">Default. Shared cache with conservative freshness. Fast-path for well-classified intents.</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium text-slate-200">Turbo</td>
                <td className="py-2 pr-4">≤ 5s</td>
                <td className="py-2">Maximum speed within safety bounds. Aggressive caching, broad fast-path, pre-authorized shells.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-slate-400">
          Freshness values are illustrative. These modes represent a directional design - not
          current production capabilities.
        </p>
      </section>

      {/* --- How It Works --- */}
      <section className="space-y-4">
        <HeadingAnchor id="how-it-works">How Latency-Positive Enforcement Works</HeadingAnchor>
        <p className="text-slate-300">
          The flow below shows how shared intelligence reduces total workflow time:
        </p>
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`Standalone Bot (no ATF)              Protected Bot (with ATF)
─────────────────────                ─────────────────────────
1. Fetch account state  ─── RPC     1. Submit intent to ATF
2. Fetch DEX quotes     ─── API         ↓
3. Validate route       ─── RPC     2. ATF serves from shared state
4. Simulate transaction ─── RPC        (cached accounts, quotes,
5. Run safety checks    ─── local      route validation, simulation)
6. Sign                 ─── local       ↓
7. Submit               ─── RPC     3. Policy evaluation (fast-path
                                       if intent is well-classified)
Each bot does all 7 steps               ↓
independently every time.           4. Permit issued
                                        ↓
                                    5. Bot signs + submits

                                    Shared state eliminates
                                    redundant RPC/API calls.`}
        </pre>
      </section>

      {/* --- Measurement --- */}
      <section className="space-y-4">
        <HeadingAnchor id="measurement">How We&rsquo;ll Measure This</HeadingAnchor>
        <p className="text-slate-300">
          Latency-positive claims require rigorous measurement, not marketing assertions.
          ATF will instrument and report:
        </p>
        <ul className="space-y-2 text-slate-300">
          <li><strong className="text-slate-200">cache-hit p95</strong> - fast-path decision latency</li>
          <li><strong className="text-slate-200">cache-miss p95</strong> - worst-case decision latency</li>
          <li><strong className="text-slate-200">time-to-safe-decision</strong> - intent receipt to permit issuance</li>
          <li><strong className="text-slate-200">time-to-submission</strong> - intent receipt to transaction readiness</li>
          <li><strong className="text-slate-200">effective bot-latency delta</strong> - protected workflow minus standalone baseline</li>
        </ul>
        <p className="text-slate-300">
          The standalone bot baseline is measured per-flow: the estimated time for an unprotected
          bot to independently complete the same work. All benchmark results will clearly
          distinguish measured data from illustrative estimates.
        </p>
      </section>

      {/* --- Why This Matters --- */}
      <section className="space-y-4">
        <HeadingAnchor id="why-this-matters">
          Why This Matters for Trading Bots and Agent Frameworks
        </HeadingAnchor>
        <p className="text-slate-300">
          Trading bots evaluate infrastructure by one question: does it make me better at my job?
          &ldquo;Safer but slower&rdquo; is a hard sell. &ldquo;Safer and faster&rdquo; changes the
          adoption calculus entirely.
        </p>
        <ul className="space-y-2 text-slate-300">
          <li>
            <strong className="text-slate-200">For bot developers:</strong> ATF becomes infrastructure
            you route through for speed, not infrastructure you tolerate for compliance.
          </li>
          <li>
            <strong className="text-slate-200">For agent frameworks:</strong> Enforcement stops being
            a bolt-on cost center and becomes a shared execution layer that improves framework-wide
            performance.
          </li>
          <li>
            <strong className="text-slate-200">For operators:</strong> Configurable execution modes
            let you tune the safety–speed tradeoff per strategy, not per-org.
          </li>
        </ul>
        <p className="text-slate-300">
          The long-term vision: ATF as <strong className="text-accent-200">universal capital
          enforcement for AI agents</strong> - deterministic, verifiable, and latency-positive.
        </p>
      </section>

      {/* --- Current vs. Future --- */}
      <section className="space-y-4">
        <HeadingAnchor id="current-vs-future">Current State vs. Future Direction</HeadingAnchor>
        <p className="text-slate-300">
          This page describes a strategic direction, not shipped capabilities. Here is where
          things stand:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-slate-300">
            <thead>
              <tr className="border-b border-white/10 text-left text-slate-400">
                <th className="pb-2 pr-4 font-medium">Capability</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr><td className="py-2 pr-4">Deterministic policy enforcement</td><td className="py-2 text-green-400">Shipped</td></tr>
              <tr><td className="py-2 pr-4">Verifiable execution receipts</td><td className="py-2 text-green-400">Shipped</td></tr>
              <tr><td className="py-2 pr-4">Zero-trust agent model</td><td className="py-2 text-green-400">Shipped</td></tr>
              <tr><td className="py-2 pr-4">Latency instrumentation</td><td className="py-2 text-yellow-400">In progress</td></tr>
              <tr><td className="py-2 pr-4">Shared cache / state layer</td><td className="py-2 text-slate-400">Planned</td></tr>
              <tr><td className="py-2 pr-4">Execution modes (Strict / Balanced / Turbo)</td><td className="py-2 text-slate-400">Planned</td></tr>
              <tr><td className="py-2 pr-4">Fast-path intent classification</td><td className="py-2 text-slate-400">Planned</td></tr>
              <tr><td className="py-2 pr-4">Pre-authorized transaction shells</td><td className="py-2 text-slate-400">Planned</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-slate-400">
          Security guarantees are non-regressible. No latency optimization will weaken, bypass,
          or conditionally disable existing deterministic enforcement or verifiable receipts.
        </p>
      </section>

      {/* --- Learn More --- */}
      <section className="space-y-4">
        <HeadingAnchor id="learn-more">Learn More</HeadingAnchor>
        <ul className="space-y-2 text-slate-300">
          <li>
            <Link href="/docs/atf-architecture" className="text-accent-200 underline underline-offset-2">
              ATF Architecture &amp; Enforcement Model
            </Link>{" "}
            - threat model, permit schema, deterministic checks
          </li>
          <li>
            <Link href="/docs/first-protected-trade" className="text-accent-200 underline underline-offset-2">
              First Protected Trade
            </Link>{" "}
            - try ATF in minutes
          </li>
          <li>
            <Link href="/docs/integration-pattern" className="text-accent-200 underline underline-offset-2">
              Integration Pattern
            </Link>{" "}
            - how agents call ATF before execution
          </li>
        </ul>
        <p className="mt-4 text-sm text-slate-400">
          This page is the developer-friendly explainer. For high-level public positioning, see the{" "}
          <a
            href="https://github.com/trucore-ai/atf-spec/blob/main/docs/latency-positive-positioning.md"
            className="text-accent-200 underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            ATF spec - Latency-Positive Positioning
          </a>.
        </p>
      </section>
    </article>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";

export const metadata: Metadata = {
  title: "Hello-World Bot Tutorial",
  description:
    "Understand how a minimal Python trading bot changes when you add ATF protection. Unprotected vs protected, side by side.",
};

export default function HelloWorldBotPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          Tutorial
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Hello-World Bot
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          A minimal Python bot, unprotected then ATF-protected, in under
          30 lines per script. See exactly what changes when you add a
          policy gate, receipts, and fail-closed enforcement.
        </p>
      </header>

      {/* ── Specification reference ── */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
        <p className="text-sm text-slate-300">
          <strong className="text-slate-100">See the specification:</strong>{" "}
          The canonical before-and-after integration concept is defined in{" "}
          <a
            href="https://github.com/trucore-ai/atf-spec/blob/main/docs/hello-world-bot.md"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            atf-spec &rarr; docs/hello-world-bot.md
          </a>
          . This tutorial walks through the implementation.
        </p>
      </div>

      {/* ── What This Example Is ── */}
      <section className="space-y-4">
        <HeadingAnchor id="what-this-example-is">What This Example Is</HeadingAnchor>
        <p className="text-slate-300">
          Two Python scripts that do the same thing: construct a tiny
          SOL-to-USDC swap intent, apply a trivial &quot;should I trade?&quot; rule,
          and simulate execution. One script runs raw. The other routes
          through ATF first.
        </p>
        <p className="text-slate-300">
          The bot logic is intentionally identical between the two scripts
          so the <em>only</em> difference is the ATF wrapper.
        </p>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-sm font-semibold text-amber-400">Teaching example only</p>
          <p className="mt-1 text-sm text-slate-300">
            Execution is simulated with deterministic sample data. This is
            not production trading code. The goal is to compress the learning
            curve so you can see exactly where ATF plugs in.
          </p>
        </div>
      </section>

      {/* ── What You Learn ── */}
      <section className="space-y-4">
        <HeadingAnchor id="what-you-learn">What You Learn</HeadingAnchor>
        <ul className="space-y-2 text-slate-300">
          <li>
            <strong className="text-slate-100">How little code changes</strong>{" "}
            when you add ATF to an existing bot
          </li>
          <li>
            <strong className="text-slate-100">What a policy gate does</strong>{" "}
            at the execution boundary
          </li>
          <li>
            <strong className="text-slate-100">Why fail-closed matters</strong>{" "}
            when ATF is unreachable or policy denies the intent
          </li>
          <li>
            <strong className="text-slate-100">What a receipt proves</strong>{" "}
            and why it exists
          </li>
          <li>
            <strong className="text-slate-100">Where operator control lives</strong>{" "}
            without touching bot code
          </li>
        </ul>
      </section>

      {/* ── Before and After ── */}
      <section className="space-y-6">
        <HeadingAnchor id="before-and-after">Before and After</HeadingAnchor>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Unprotected */}
          <div className="rounded-xl border border-white/10 bg-neutral-900/50 p-5 space-y-3">
            <p className="text-sm font-bold uppercase tracking-[0.1em] text-red-400">
              Unprotected Bot
            </p>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-300">
              <li>Build a swap intent (SOL to USDC, 0.001 SOL)</li>
              <li>Apply a hard-coded rule: is the amount below a cap?</li>
              <li>If yes, execute immediately (simulated)</li>
              <li>Done. No audit trail, no operator control, no proof.</li>
            </ol>
            <pre className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-3 text-xs text-slate-400">
{`Intent -> Local rule -> Execute (no gate)
                         No receipt
                         No operator control`}
            </pre>
          </div>

          {/* Protected */}
          <div className="rounded-xl border border-primary-300/20 bg-primary-500/5 p-5 space-y-3">
            <p className="text-sm font-bold uppercase tracking-[0.1em] text-green-400">
              ATF-Protected Bot
            </p>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-300">
              <li>Build the same swap intent</li>
              <li>Apply the same local rule</li>
              <li>Send the intent through ATF (policy gate)</li>
              <li>ATF checks policy, returns a typed decision + receipt</li>
              <li>If <code className="font-mono text-slate-200">allow=true</code>, execute (simulated)</li>
              <li>If <code className="font-mono text-slate-200">allow=false</code>, stop cleanly (fail-closed)</li>
              <li>Receipt and proof identifiers available for audit</li>
            </ol>
            <pre className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-3 text-xs text-slate-400">
{`Intent -> Local rule -> ATF policy gate -> Execute (if OK)
                                            Receipt / proof
                                            Operator control`}
            </pre>
          </div>
        </div>

        <p className="text-slate-300">
          The key insight: the bot code barely changes. ATF wraps the
          execution boundary, not the strategy. The protected version adds
          roughly three lines of ATF integration on top of the same logic.
        </p>
      </section>

      {/* ── What ATF Adds ── */}
      <section className="space-y-4">
        <HeadingAnchor id="what-atf-adds">What ATF Adds</HeadingAnchor>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-slate-300">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="pb-2 pr-4 font-semibold text-slate-200">#</th>
                <th className="pb-2 pr-4 font-semibold text-slate-200">Capability</th>
                <th className="pb-2 font-semibold text-slate-200">What It Means</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="py-2 pr-4">1</td>
                <td className="py-2 pr-4 font-semibold text-slate-100">Policy gate</td>
                <td>The intent is checked against operator-defined rules before any execution happens.</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">2</td>
                <td className="py-2 pr-4 font-semibold text-slate-100">Deterministic decisioning</td>
                <td>ATF returns a typed, machine-readable result (allow/deny + reason codes). No string parsing.</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">3</td>
                <td className="py-2 pr-4 font-semibold text-slate-100">Receipt and proof</td>
                <td>Every decision produces a tamper-evident receipt reference for audit and verification.</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">4</td>
                <td className="py-2 pr-4 font-semibold text-slate-100">Operator control</td>
                <td>Operators can change policy, revoke permits, or kill-switch bots without touching bot code.</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">5</td>
                <td className="py-2 pr-4 font-semibold text-slate-100">Intelligence feedback loop</td>
                <td>Execution outcomes feed back into the system so future decisions can improve over time.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Fail-Closed Behavior ── */}
      <section className="space-y-4">
        <HeadingAnchor id="fail-closed-behavior">Fail-Closed Behavior</HeadingAnchor>
        <p className="text-slate-300">
          When ATF is unreachable or not configured, the protected bot does
          not execute. This is intentional. The example demonstrates four
          outcomes:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-slate-300">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="pb-2 pr-4 font-semibold text-slate-200">Scenario</th>
                <th className="pb-2 pr-4 font-semibold text-slate-200">Decision</th>
                <th className="pb-2 font-semibold text-slate-200">Bot Executes?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="py-2 pr-4">ATF running, policy permits</td>
                <td className="py-2 pr-4 text-green-400">allow</td>
                <td>Yes</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">ATF running, policy denies</td>
                <td className="py-2 pr-4 text-red-400">deny</td>
                <td>No (fail-closed)</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">ATF unreachable or bad config</td>
                <td className="py-2 pr-4 text-red-400">config_error</td>
                <td>No (fail-closed)</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Permit expired before execution</td>
                <td className="py-2 pr-4 text-red-400">permit_expired</td>
                <td>No (fail-closed)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-slate-300">
          In every denial case, the bot prints exactly why it stopped,
          using machine-readable status codes.
        </p>
      </section>

      {/* ── Why Simulated ── */}
      <section className="space-y-4">
        <HeadingAnchor id="why-simulated">Why the Example Uses Simulated Execution</HeadingAnchor>
        <p className="text-slate-300">
          The bot is intentionally simple. The swap is simulated, not
          submitted on-chain. This keeps the example focused on the ATF
          integration boundary rather than Solana transaction mechanics.
        </p>
        <p className="text-slate-300">
          If you understand a 30-line bot, you can see exactly where ATF
          plugs in. If the bot were a full strategy engine, the integration
          would be buried in noise.
        </p>
        <p className="text-slate-300">
          To move to real execution, you would replace the simulated
          execution function with one that builds a Jupiter swap
          transaction, signs it, and submits it via RPC. The ATF
          integration stays the same.
        </p>
      </section>

      {/* ── Source Example ── */}
      <section className="rounded-lg border border-white/10 bg-neutral-900/50 p-5 space-y-3">
        <HeadingAnchor id="source-example">Source Example</HeadingAnchor>
        <p className="text-sm text-slate-300">
          The full source lives in the ATF repository at{" "}
          <code className="font-mono text-slate-200">examples/hello-world-bot/</code>.
          The directory contains four files:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-slate-300">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="pb-2 pr-4 font-semibold text-slate-200">File</th>
                <th className="pb-2 font-semibold text-slate-200">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="py-2 pr-4 font-mono text-slate-200">unprotected_bot.py</td>
                <td>Raw bot: decide locally, execute immediately</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-slate-200">protected_bot.py</td>
                <td>Same bot, routed through ATF first</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-slate-200">env.example</td>
                <td>Sample environment variables for ATF connection</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-slate-200">README.md</td>
                <td>Full walkthrough with expected output</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
          <p className="text-xs text-slate-400">
            The ATF repository is currently private.{" "}
            <a
              href="https://github.com/trucore-ai/agent-transaction-firewall/tree/main/examples/hello-world-bot"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
            >
              View on GitHub &#x2197;
            </a>
            {" "}(requires repo access). When the repository becomes public,
            this link will resolve for all users.
          </p>
        </div>
      </section>

      {/* ── Next Steps ── */}
      <section className="space-y-4">
        <HeadingAnchor id="next-steps">Next Steps</HeadingAnchor>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              title: "First Protected Trade",
              href: "/docs/first-protected-trade",
              desc: "Protect a real swap intent, receive a receipt, and verify it end to end",
            },
            {
              title: "Integration Pattern",
              href: "/docs/integration-pattern",
              desc: "How agents call ATF before execution and consume deterministic decisions",
            },
            {
              title: "MCP Integration",
              href: "/docs/mcp",
              desc: "Hosted MCP endpoint with five tools for agent runtimes",
            },
            {
              title: "Policy Model",
              href: "/docs/policy-model",
              desc: "Allowlists, limits, slippage bounds, cooldowns, and fail-closed checks",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg border border-white/10 bg-neutral-900/50 p-4 transition-colors hover:border-primary-300/30"
            >
              <p className="font-semibold text-accent-300">{item.title}</p>
              <p className="mt-1 text-sm text-slate-400">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}

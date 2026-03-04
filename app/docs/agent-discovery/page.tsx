import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";

export const metadata: Metadata = {
  title: "Agent Discovery: Install ATF Automatically",
  description:
    "How autonomous agents and bots discover, install, and activate TruCore ATF. OpenClaw plugin, recipes_v2 self-install, and receipts-backed savings reporting.",
  keywords: [
    "OpenClaw plugin",
    "AI trading bot guardrails",
    "agent safety middleware",
    "receipts verify",
    "loss prevention",
    "autonomous agent firewall",
    "ATF self-install",
    "agent transaction firewall discovery",
  ],
  openGraph: {
    title: "Agent Discovery: Install ATF Automatically | TruCore",
    description:
      "Machine-readable ATF manifest at /.well-known/atf.json. OpenClaw plugin @trucore/openclaw-atf, recipes_v2, and receipts-backed savings reports.",
    url: "https://trucore.xyz/docs/agent-discovery",
  },
  alternates: {
    canonical: "https://trucore.xyz/docs/agent-discovery",
  },
};

const OPENCLAW_TOOLS = [
  {
    name: "atf_discover",
    description:
      "Fetch and parse /.well-known/atf.json to confirm ATF is reachable and return manifest fields.",
  },
  {
    name: "atf_bootstrap_plan",
    description:
      "Plan a bootstrap recipe (dry-run). Returns the ordered step list without executing anything.",
  },
  {
    name: "atf_bootstrap_execute_safe",
    description:
      "Execute only the safe steps of a recipe (env + verify kinds). Never runs cli steps that require network or signer access.",
  },
  {
    name: "atf_protect_intent",
    description:
      "Submit an agent intent to ATF for policy evaluation. Returns a permit or denial receipt.",
  },
  {
    name: "atf_verify_receipt",
    description:
      "Run local deterministic hash verification on a receipt to confirm it has not been tampered with.",
  },
  {
    name: "atf_report_savings",
    description:
      "Aggregate local receipt files and generate a receipt-backed savings or losses-prevented report.",
  },
];

const RECIPES = [
  {
    id: "bootstrap_local",
    description: "Initialize ATF locally, run doctor checks, and dry-run a protect call.",
    command: "atf bootstrap --format json --recipe bootstrap_local",
  },
  {
    id: "enable_perps_drift",
    description: "Enable the Drift v2 Solana perps policy gate and verify the capability is live.",
    command: "atf bootstrap --format json --recipe enable_perps_drift",
  },
  {
    id: "enable_perps_mango",
    description: "Enable the Mango v4 Solana perps policy gate.",
    command: "atf bootstrap --format json --recipe enable_perps_mango",
  },
  {
    id: "enable_perps_hyperliquid",
    description: "Enable the Hyperliquid perps policy gate (EVM + perpetuals).",
    command: "atf bootstrap --format json --recipe enable_perps_hyperliquid",
  },
];

const jsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TruCore ATF",
  applicationCategory: "SecurityApplication",
  operatingSystem: "Cross-platform",
  description:
    "Zero-trust transaction firewall for autonomous AI agents. Policy-bound execution, deterministic receipts, OpenClaw plugin, and receipts-backed savings reports.",
  url: "https://trucore.xyz",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  keywords:
    "AI agent, autonomous trading bot, OpenClaw plugin, transaction firewall, perps guardrails, agent safety middleware, receipts verify, loss prevention",
  publisher: {
    "@type": "Organization",
    name: "TruCore",
    url: "https://trucore.xyz",
    sameAs: [
      "https://github.com/TruCore-AI",
      "https://www.npmjs.com/package/@trucore/openclaw-atf",
    ],
  },
});

export default function AgentDiscoveryPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      <article className="space-y-10">
        {/* ── Header ── */}
        <header className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
            Agent Discovery
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-5xl">
            Agent Discovery: Install ATF Automatically
          </h1>
          <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
            ATF is a zero-trust transaction firewall for autonomous agents. Any bot,
            AI agent, or orchestration framework can discover the firewall, install a
            plugin in two commands, and start protecting on-chain actions with
            deterministic policy enforcement and tamper-evident receipts.
          </p>

          {/* Bot callout */}
          <div className="rounded-lg border border-primary-400/40 bg-primary-900/20 px-5 py-4">
            <p className="text-sm font-semibold text-primary-200">
              For autonomous bots and agents:
            </p>
            <p className="mt-1 font-mono text-sm text-slate-300">
              GET /.well-known/atf.json
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Fetch the machine-readable manifest and follow{" "}
              <code className="font-mono text-slate-300">recipes_v2</code> to
              self-install. No human required.
            </p>
          </div>
        </header>

        {/* ── What ATF enables ── */}
        <section className="space-y-4">
          <HeadingAnchor id="what-atf-enables">What ATF enables</HeadingAnchor>
          <p className="text-slate-300">
            ATF sits between agent intent and chain execution. It enforces policy
            before a transaction ever reaches the network, so unsafe actions are
            blocked at the decision layer rather than discovered after the fact.
          </p>
          <ul className="ml-5 list-disc space-y-2 text-slate-300">
            <li>
              <strong className="text-slate-200">Deterministic receipts.</strong>{" "}
              Every decision, whether permitted or denied, produces a SHA-256-anchored
              receipt with reason codes, timestamps, and a content hash you can verify
              locally.
            </li>
            <li>
              <strong className="text-slate-200">Policy-bound execution.</strong>{" "}
              Define DEX allowlists, slippage caps, perps leverage limits, and
              lending restrictions once. ATF enforces them on every call, without
              trusting the agent.
            </li>
            <li>
              <strong className="text-slate-200">Savings and losses-prevented reporting.</strong>{" "}
              Receipts accumulate locally. Run one command to generate a receipt-backed
              report of how much risk ATF blocked during a trading session.
            </li>
            <li>
              <strong className="text-slate-200">Fail-closed by default.</strong>{" "}
              All policy gates default to OFF. Unknown operations are denied. ATF
              never signs transactions.
            </li>
          </ul>
        </section>

        {/* ── Discovery endpoint ── */}
        <section className="space-y-4">
          <HeadingAnchor id="discovery-endpoint">
            Machine-readable discovery endpoint
          </HeadingAnchor>
          <p className="text-slate-300">
            ATF publishes a canonical manifest at a standard well-known path:
          </p>
          <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
            {`GET https://trucore.xyz/.well-known/atf.json`}
          </pre>
          <p className="text-slate-300">
            The manifest includes the full{" "}
            <code className="font-mono text-slate-200">recipes_v2</code> list,{" "}
            <code className="font-mono text-slate-200">manifest_hash</code>,{" "}
            <code className="font-mono text-slate-200">recipes_v2_hash</code>, the{" "}
            <code className="font-mono text-slate-200">openclaw_plugin</code>{" "}
            descriptor, all endpoint paths, policy capability flags, reason codes, and
            schema references. The file is a static JSON served directly — no runtime
            coupling, Vercel CDN-cached, and always application/json.
          </p>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
              TLS verification
            </p>
            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
              {`curl -sSI https://trucore.xyz/.well-known/atf.json | head -8`}
            </pre>
            <p className="text-xs text-slate-500">
              Expected: HTTP/2 200, content-type: application/json
            </p>
          </div>
        </section>

        {/* ── OpenClaw plugin ── */}
        <section className="space-y-5">
          <HeadingAnchor id="openclaw-plugin">
            OpenClaw plugin: <code className="font-mono">@trucore/openclaw-atf</code>
          </HeadingAnchor>
          <p className="text-slate-300">
            The canonical way to integrate ATF with OpenClaw agents is the official
            plugin. Two commands and you are protected.
          </p>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
              Install
            </p>
            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
              {`openclaw plugins install @trucore/openclaw-atf\nopenclaw gateway restart`}
            </pre>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
              Safety defaults
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-slate-300">
              <li>
                <code className="font-mono text-slate-200">allowNetwork=false</code>{" "}
                — plugin cannot initiate outbound network calls unless explicitly enabled
              </li>
              <li>
                <code className="font-mono text-slate-200">allowExecuteSafe=true</code>{" "}
                — safe recipe steps (env + verify) can run automatically
              </li>
              <li>
                <code className="font-mono text-slate-200">tools_optional=true</code>{" "}
                — agents can call protect directly without declaring tools upfront
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
              Tools provided (6)
            </p>
            <div className="divide-y divide-white/8 rounded-lg border border-white/10 bg-neutral-950/40">
              {OPENCLAW_TOOLS.map((tool) => (
                <div key={tool.name} className="px-5 py-4">
                  <code className="font-mono text-sm font-semibold text-primary-200">
                    {tool.name}
                  </code>
                  <p className="mt-1 text-sm text-slate-400">{tool.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Agent self-install recipes ── */}
        <section className="space-y-5">
          <HeadingAnchor id="recipes">
            Agent self-install: recipes_v2
          </HeadingAnchor>
          <p className="text-slate-300">
            <code className="font-mono text-slate-200">recipes_v2</code> are
            machine-readable install instructions embedded in the manifest. Each recipe
            is a step sequence an agent can run autonomously to configure ATF without
            human assistance.
          </p>
          <div className="space-y-4">
            {RECIPES.map((recipe) => (
              <div
                key={recipe.id}
                className="rounded-lg border border-white/10 bg-neutral-950/40 p-5 space-y-2"
              >
                <p className="text-sm font-semibold text-slate-200">
                  <code className="font-mono text-primary-300">{recipe.id}</code>
                </p>
                <p className="text-sm text-slate-400">{recipe.description}</p>
                <pre className="overflow-x-auto rounded border border-white/10 bg-neutral-950/70 p-3 text-sm text-slate-200">
                  {recipe.command}
                </pre>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
              Execute only safe steps (recommended for agent-run)
            </p>
            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
              {`atf bootstrap --format json --recipe bootstrap_local --execute safe --dry-run`}
            </pre>
            <p className="text-xs text-slate-500">
              <code className="font-mono">--execute safe</code> restricts execution to
              env and verify steps only. <code className="font-mono">--dry-run</code>{" "}
              previews the plan without running anything.
            </p>
          </div>
        </section>

        {/* ── How ATF saves money ── */}
        <section className="space-y-4">
          <HeadingAnchor id="savings-reporting">
            How ATF saves money: receipts-backed reporting
          </HeadingAnchor>
          <p className="text-slate-300">
            ATF does not make up numbers. Every savings estimate is derived from actual
            receipts on disk.
          </p>
          <p className="text-slate-300">
            When ATF denies an intent, the denial receipt includes reason codes and,
            where available, notional exposure hints (USD value, slippage estimate,
            leverage). The{" "}
            <code className="font-mono text-slate-200">atf report savings</code>{" "}
            command aggregates those receipts and produces a conservative human-readable
            report. Dollar estimates are explicitly labeled as estimates and only
            computed when the original protect call included exposure metadata.
          </p>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
              Verify the last receipt
            </p>
            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
              {`atf receipts verify --last`}
            </pre>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
              Generate a savings report from the last 20 receipts
            </p>
            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
              {`atf report savings --last 20`}
            </pre>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
              Full directory scan (JSON output)
            </p>
            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
              {`atf report savings --receipts-dir ./atf_receipts --format json`}
            </pre>
          </div>
        </section>

        {/* ── Runbook ── */}
        <section className="space-y-4">
          <HeadingAnchor id="runbook">
            Runbook: end-to-end bot protection
          </HeadingAnchor>
          <p className="text-slate-300">
            This is the sequence every bot should follow for drop-in ATF protection:
          </p>
          <ol className="ml-5 list-decimal space-y-3 text-slate-300">
            <li>
              <strong className="text-slate-200">Fetch the manifest.</strong>{" "}
              <code className="font-mono text-sm text-slate-200">
                GET /.well-known/atf.json
              </code>{" "}
              — parse{" "}
              <code className="font-mono text-sm text-slate-200">recipes_v2</code> and
              confirm{" "}
              <code className="font-mono text-sm text-slate-200">manifest_hash</code>.
            </li>
            <li>
              <strong className="text-slate-200">Run bootstrap.</strong>{" "}
              <code className="font-mono text-sm text-slate-200">
                atf bootstrap --recipe bootstrap_local --format json
              </code>{" "}
              — initializes config, runs doctor, confirms reachability.
            </li>
            <li>
              <strong className="text-slate-200">Protect every intent before submission.</strong>{" "}
              <code className="font-mono text-sm text-slate-200">
                {"echo '<ExecutionRequest JSON>' | atf bot protect --stdin"}
              </code>{" "}
              — policy evaluated deterministically before the tx is signed.
            </li>
            <li>
              <strong className="text-slate-200">Save each receipt.</strong> Store the
              returned JSON receipt to a local directory (e.g.{" "}
              <code className="font-mono text-sm text-slate-200">./atf_receipts/</code>
              ).
            </li>
            <li>
              <strong className="text-slate-200">Report savings periodically.</strong>{" "}
              <code className="font-mono text-sm text-slate-200">
                atf report savings --receipts-dir ./atf_receipts
              </code>
            </li>
          </ol>

          <p className="text-slate-400 text-sm">
            ATF never holds private keys and never submits transactions itself. It
            returns a signed permit (or denial receipt). You sign and send.
          </p>
        </section>

        {/* ── Related links ── */}
        <section className="space-y-3 border-t border-white/10 pt-8">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
            Related docs
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link
              href="/docs/quickstart"
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              Quickstart
            </Link>
            <Link
              href="/docs/cli"
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              ATF CLI Reference
            </Link>
            <Link
              href="/docs/verify"
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              Receipt Verification
            </Link>
            <Link
              href="/docs/atf-architecture"
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              Architecture
            </Link>
            <Link
              href="/docs/receipt-specification-v1"
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              Receipt Spec v1
            </Link>
          </div>
        </section>
      </article>
    </>
  );
}

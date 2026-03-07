import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";

export const metadata: Metadata = {
  title: "OpenClaw Plugin: @trucore/openclaw-atf | TruCore Docs",
  description:
    "Install the @trucore/openclaw-atf OpenClaw plugin to add policy-enforced transaction protection to any autonomous agent. Thirteen tools, zero config, fail-closed by default.",
  keywords: [
    "OpenClaw plugin",
    "@trucore/openclaw-atf",
    "AI agent firewall",
    "transaction guardrails",
    "ATF plugin",
    "autonomous agent safety",
    "deterministic receipts",
  ],
  openGraph: {
    title: "OpenClaw Plugin: @trucore/openclaw-atf | TruCore Docs",
    description:
      "Add policy-enforced transaction protection to any agent with one install command. Thirteen tools, zero config, fail-closed by default.",
    url: "https://trucore.xyz/docs/openclaw-plugin",
  },
  alternates: {
    canonical: "https://trucore.xyz/docs/openclaw-plugin",
  },
};

/* ------------------------------------------------------------------ */
/*  Canonical tool surface — matches @trucore/openclaw-atf@0.2.0      */
/* ------------------------------------------------------------------ */
const TOOLS: Array<{ name: string; description: string; category: string }> = [
  {
    name: "atf_health",
    category: "Operations",
    description:
      "Check ATF CLI and API backend availability. Returns health status and dependency checks.",
  },
  {
    name: "atf_discover",
    category: "Discovery",
    description:
      "Fetch and summarize the ATF manifest and toolcard so the agent knows what ATF offers.",
  },
  {
    name: "atf_bootstrap_plan",
    category: "Bootstrap",
    description:
      "Generate ATF bootstrap steps for a given recipe. Dry-run only, nothing is executed.",
  },
  {
    name: "atf_bootstrap_execute_safe",
    category: "Bootstrap",
    description:
      "Run only the safe steps of a bootstrap recipe (env setup and verification). Never runs cli steps that need network or signer access.",
  },
  {
    name: "atf_protect_intent",
    category: "Core",
    description:
      "Submit a DeFi intent (swap, lend, perps) to ATF for policy evaluation. Returns a permit or denial receipt.",
  },
  {
    name: "atf_verify_receipt",
    category: "Core",
    description:
      "Verify an ATF receipt deterministically. Returns verified status, content_hash, and intent_hash.",
  },
  {
    name: "atf_report_savings",
    category: "Reporting",
    description:
      "Generate a receipt-backed savings or losses-prevented report from local receipt files.",
  },
  {
    name: "atf_integration_doctor",
    category: "Operations",
    description:
      "Run ATF integration readiness check. Reports plugin loading status, config validity, and backend connectivity.",
  },
  {
    name: "atf_bot_preflight",
    category: "Operations",
    description:
      "Pre-session readiness check: is ATF ready to protect intents right now? Confirms CLI, policy, and network are operational.",
  },
  {
    name: "atf_tx_explain",
    category: "Core",
    description:
      "Explain an ATF deny decision or receipt in human terms. Returns reason codes, policy triggers, and remediation suggestions.",
  },
  {
    name: "atf_billing_info",
    category: "Billing",
    description:
      "Discover ATF billing, pricing, and package metadata for the active account.",
  },
  {
    name: "atf_adoption_advisor",
    category: "Advisory",
    description:
      "Evaluate bot capability signals and return a deterministic ATF adoption recommendation with next steps.",
  },
  {
    name: "atf_billing_claim",
    category: "Billing",
    description:
      "Verify an on-chain Solana payment and process a billing claim for ATF service credits.",
  },
];

const CATEGORIES = ["Core", "Operations", "Bootstrap", "Discovery", "Reporting", "Billing", "Advisory"];

export default function OpenClawPluginPage() {
  return (
    <article className="space-y-10">
      {/* ── Header ── */}
      <header className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          OpenClaw Plugin
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-5xl">
          @trucore/openclaw-atf
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          The official OpenClaw plugin for TruCore ATF. Install it, restart the
          gateway, and every agent intent passes through policy-enforced
          transaction protection before it reaches the chain. Thirteen tools,
          zero config required, fail-closed by default.
        </p>
      </header>

      {/* ── Install ── */}
      <section className="space-y-4">
        <HeadingAnchor id="install">Install</HeadingAnchor>
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
              Via OpenClaw gateway (recommended)
            </p>
            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200 leading-relaxed">
              {`openclaw plugins install @trucore/openclaw-atf
openclaw gateway restart`}
            </pre>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
              Via npm (pinned version)
            </p>
            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
              {`npm i @trucore/openclaw-atf@0.2.0`}
            </pre>
          </div>

          <p className="text-sm text-slate-400">
            Published on{" "}
            <a
              href="https://www.npmjs.com/package/@trucore/openclaw-atf"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary-100 underline underline-offset-2 transition-colors hover:text-primary-200"
            >
              npm
            </a>
            . Current version: <strong className="text-slate-200">0.2.0</strong>.
          </p>
        </div>
      </section>

      {/* ── Safety defaults ── */}
      <section className="space-y-4">
        <HeadingAnchor id="safety-defaults">Safety defaults</HeadingAnchor>
        <p className="text-slate-300">
          The plugin ships with conservative defaults. Nothing reaches the
          network unless you opt in.
        </p>
        <ul className="ml-5 list-disc space-y-2 text-sm text-slate-300">
          <li>
            <code className="font-mono text-slate-200">allowNetwork = false</code>{" "}
            &mdash; the plugin cannot initiate outbound network calls unless
            explicitly enabled in agent config.
          </li>
          <li>
            <code className="font-mono text-slate-200">allowExecuteSafe = true</code>{" "}
            &mdash; safe recipe steps (env checks, verification) can run automatically.
            No signing, no transactions.
          </li>
          <li>
            <code className="font-mono text-slate-200">tools = optional</code>{" "}
            &mdash; agents can call <code className="font-mono text-slate-200">atf_protect_intent</code>{" "}
            directly without declaring the full tool set upfront.
          </li>
        </ul>
      </section>

      {/* ── Tool surface ── */}
      <section className="space-y-5">
        <HeadingAnchor id="tools">Tools (13)</HeadingAnchor>
        <p className="text-slate-300">
          The plugin exposes thirteen tools. All are optional: your agent can use
          as few or as many as needed.
        </p>

        {CATEGORIES.map((cat) => {
          const catTools = TOOLS.filter((t) => t.category === cat);
          if (catTools.length === 0) return null;
          return (
            <div key={cat} className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                {cat}
              </p>
              <div className="divide-y divide-white/8 rounded-lg border border-white/10 bg-neutral-950/40">
                {catTools.map((tool) => (
                  <div key={tool.name} className="px-5 py-4">
                    <code className="font-mono text-sm font-semibold text-primary-200">
                      {tool.name}
                    </code>
                    <p className="mt-1 text-sm text-slate-400">{tool.description}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* ── Quick workflow ── */}
      <section className="space-y-4">
        <HeadingAnchor id="quick-workflow">Quick workflow</HeadingAnchor>
        <p className="text-slate-300">
          A typical integration follows five steps. Copy the commands and you are
          protected.
        </p>
        <ol className="ml-5 list-decimal space-y-3 text-slate-300">
          <li>
            <strong className="text-slate-200">Install the plugin</strong>{" "}
            <code className="font-mono text-sm text-slate-200">
              openclaw plugins install @trucore/openclaw-atf
            </code>
          </li>
          <li>
            <strong className="text-slate-200">Restart the gateway</strong>{" "}
            <code className="font-mono text-sm text-slate-200">
              openclaw gateway restart
            </code>
          </li>
          <li>
            <strong className="text-slate-200">Run a preflight check</strong>{" "}
            <code className="font-mono text-sm text-slate-200">
              atf_bot_preflight
            </code>{" "}
            to confirm everything is ready.
          </li>
          <li>
            <strong className="text-slate-200">Protect every intent</strong>{" "}
            Call{" "}
            <code className="font-mono text-sm text-slate-200">
              atf_protect_intent
            </code>{" "}
            before signing any transaction. ATF returns a permit or denial receipt.
          </li>
          <li>
            <strong className="text-slate-200">Verify receipts and report savings</strong>{" "}
            Use{" "}
            <code className="font-mono text-sm text-slate-200">atf_verify_receipt</code>{" "}
            and{" "}
            <code className="font-mono text-sm text-slate-200">atf_report_savings</code>{" "}
            to build an auditable trail.
          </li>
        </ol>
      </section>

      {/* ── Configuration ── */}
      <section className="space-y-4">
        <HeadingAnchor id="configuration">Configuration</HeadingAnchor>
        <p className="text-slate-300">
          The plugin is configured through your OpenClaw agent config. All
          fields are optional. Sensible defaults apply.
        </p>
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200 leading-relaxed">
          {`{
  "atfCli": "atf",
  "prefer": "cli",
  "receiptsDir": "./atf_receipts",
  "safety": {
    "allowExecuteSafe": true,
    "allowNetwork": false
  }
}`}
        </pre>
        <ul className="ml-5 list-disc space-y-1 text-sm text-slate-300">
          <li>
            <code className="font-mono text-slate-200">atfCli</code> &mdash;
            ATF CLI command name or absolute path. Defaults to{" "}
            <code className="font-mono text-slate-200">&quot;atf&quot;</code>.
          </li>
          <li>
            <code className="font-mono text-slate-200">prefer</code> &mdash;
            <code className="font-mono text-slate-200">&quot;cli&quot;</code> (subprocess) or{" "}
            <code className="font-mono text-slate-200">&quot;api&quot;</code>{" "}
            (HTTP). CLI is default and does not require network access.
          </li>
          <li>
            <code className="font-mono text-slate-200">receiptsDir</code> &mdash;
            where receipt JSON files are stored. Used by <code className="font-mono text-slate-200">atf_report_savings</code>.
          </li>
        </ul>
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
            href="/docs/integration-pattern"
            className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
          >
            Integration Pattern
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
            href="/docs/agent-discovery"
            className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
          >
            Agent Discovery (bootstrap recipes, manifest, bot feedback)
          </Link>
        </div>
      </section>
    </article>
  );
}

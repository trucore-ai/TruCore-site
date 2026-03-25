import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { AtfCopyCommand } from "@/components/atf-copy-command";
import { getAtfCliVersion } from "@/lib/version";

export const metadata: Metadata = {
  title: "ATF Command Reference - Install, Golden Path & Advanced Commands",
  description:
    "How to install and run the ATF CLI. Golden-path commands (trade, setup, doctor, verify), advanced command groups, and dual-surface output explained.",
};

const cliVersion = getAtfCliVersion();

/* ── Golden path commands ── */
type GoldenPathEntry = {
  step: number;
  command: string;
  title: string;
  description: string;
  detail: string;
};

const GOLDEN_PATH: GoldenPathEntry[] = [
  {
    step: 1,
    command: "trade",
    title: "First Protected Trade",
    description: "Guided workflow: route → classify → policy check → decide → execute → receipt.",
    detail:
      "Runs in demo mode by default. No wallet. No on-chain execution. Add --pretty for human-readable terminal output. In real mode it executes a protected trade on Solana mainnet, enforced by ATF policy.",
  },
  {
    step: 2,
    command: "setup",
    title: "Interactive Setup",
    description: "Writes your API key to ~/.atf/config.json. Run this to move from demo to real mode.",
    detail:
      "Interactive prompts guide you through configuration. Pass --api-key and --yes for non-interactive CI usage. No manual .env editing needed.",
  },
  {
    step: 3,
    command: "doctor",
    title: "Environment Diagnostics",
    description: "Checks config, RPC, wallet, Node.js version, and CLI health in one pass.",
    detail:
      "Run doctor whenever something seems off. It validates RPC reachability, active profile, wallet detection, and network selection. Add --verbose for full diagnostic detail.",
  },
  {
    step: 4,
    command: "verify",
    title: "Receipt Verification",
    description: "Verify a receipt by ID or URL. Shareable proof of protection.",
    detail:
      "Recomputes the deterministic content hash locally and confirms integrity. Use it to share verified receipts with humans (--pretty) or feed verification results to automation.",
  },
];

/* ── Advanced command groups ── */
type AdvancedGroup = {
  title: string;
  description: string;
  commands: string[];
  page?: string;
};

const ADVANCED_GROUPS: AdvancedGroup[] = [
  {
    title: "Protected Trade & Simulation",
    description: "Lower-level swap, simulation, and approval controls.",
    commands: ["swap", "simulate", "approve"],
    page: "/docs/cli/transactions",
  },
  {
    title: "Receipts & Transactions",
    description: "Sign, send, check status, list and verify receipts.",
    commands: ["tx sign", "tx send", "tx status", "receipts list", "receipts verify"],
    page: "/docs/cli/receipts",
  },
  {
    title: "Bot & Agent Operations",
    description: "Protect, execute, and explain intents for bots and AI agents.",
    commands: ["bot protect", "bot execute", "bot explain"],
  },
  {
    title: "Config, Profiles & Secrets",
    description: "Named profiles, per-profile config, and secrets separation.",
    commands: ["profile create", "profile switch", "config set", "config get", "secret set"],
    page: "/docs/cli/profiles",
  },
  {
    title: "Network & RPC",
    description: "Endpoint configuration, latency testing, and devnet burner wallets.",
    commands: ["rpc set", "rpc ping", "burner"],
    page: "/docs/cli/rpc",
  },
  {
    title: "Policy & Validation",
    description: "Policy inspection, intent validation, and rule diagnostics.",
    commands: ["policy show", "policy validate", "policy explain"],
  },
  {
    title: "Environment & Identity",
    description: "Health checks, shell completion, identity, and listing.",
    commands: ["doctor", "whoami", "ls", "completion"],
    page: "/docs/cli/doctor",
  },
];

/* ── Dual-surface output fields ── */
type OutputField = { name: string; audience: string; description: string };

const DUAL_SURFACE_FIELDS: OutputField[] = [
  { name: "Human-readable output", audience: "Operators", description: "Clear terminal messages with color, status indicators, and actionable next steps. Use --pretty or --format pretty." },
  { name: "machine_summary", audience: "Bots / agents", description: "Concise structured summary of the decision, suitable for automated parsing." },
  { name: "suggested_action", audience: "Bots / agents", description: "Recommended next step the caller should take (e.g., EXECUTE, RETRY, ABORT)." },
  { name: "suggested_command", audience: "Bots / agents", description: "Ready-to-run CLI command for the suggested action - copy/paste or pipe directly." },
];

export default function CommandReferencePage() {
  return (
    <article className="space-y-12">
      {/* ── Header ── */}
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          CLI &rsaquo; Command Reference
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          ATF Command Reference
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          How to install the CLI, which commands to learn first, and where to find advanced
          operations. One page, no ambiguity.
        </p>
      </header>

      {/* ── Quick nav ── */}
      <nav className="flex flex-wrap gap-2" aria-label="Page sections">
        {[
          { label: "Install & Run", anchor: "#install" },
          { label: "Golden Path", anchor: "#golden-path" },
          { label: "Dual-Surface Output", anchor: "#dual-surface" },
          { label: "Advanced Commands", anchor: "#advanced" },
          { label: "Performance", anchor: "#performance" },
          { label: "Next Steps", anchor: "#next-steps" },
        ].map((item) => (
          <a
            key={item.anchor}
            href={item.anchor}
            className="rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:border-primary-300/30 hover:text-primary-100"
          >
            {item.label}
          </a>
        ))}
      </nav>

      {/* ── Install & Run ── */}
      <section className="space-y-6">
        <HeadingAnchor id="install">Install &amp; Run</HeadingAnchor>

        <div className="max-w-3xl space-y-4">
          <p className="text-slate-300">
            The ATF CLI is published as{" "}
            <code className="font-mono text-primary-200">@trucore/atf</code> on npm.
            Node.js &ge; 18 is required.
          </p>
        </div>

        {/* Recommended: global install */}
        <div className="rounded-xl border border-primary-300/20 bg-neutral-950/50 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="rounded bg-primary-300/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-primary-200">
              Recommended
            </span>
            <h3 className="text-lg font-semibold text-slate-100">Install globally</h3>
          </div>
          <p className="text-sm text-slate-300">
            Install once and use the short <code className="font-mono text-slate-200">atf</code> command everywhere.
          </p>
          <AtfCopyCommand
            label="Install globally"
            command={`npm install -g @trucore/atf@${cliVersion}`}
          />
          <p className="text-sm text-slate-300">
            Then run commands directly:
          </p>
          <AtfCopyCommand
            label="Example: first trade"
            command="atf trade"
          />
        </div>

        {/* Alternative: npx */}
        <div className="rounded-xl border border-white/10 bg-neutral-950/50 p-5 space-y-3">
          <h3 className="text-lg font-semibold text-slate-100">Alternative: Run with npx (zero install)</h3>
          <p className="text-sm text-slate-300">
            No installation required. npx downloads the pinned version on first run and caches it locally.
          </p>
          <AtfCopyCommand
            label="Run any command"
            command={`npx @trucore/atf@${cliVersion} <command>`}
          />
          <AtfCopyCommand
            label="Example: first trade"
            command={`npx @trucore/atf@${cliVersion} trade`}
          />
          <p className="text-xs text-slate-400">
            Version pinned to <code className="font-mono text-slate-300">{cliVersion}</code> for
            reproducibility. Never use <code className="font-mono text-slate-300">@latest</code>.
          </p>
          <p className="text-xs text-slate-400">
            When this documentation shows bare <code className="font-mono text-slate-300">atf</code> commands,
            it assumes either a global install or an equivalent alias.
          </p>
        </div>

        {/* Troubleshooting */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-sm font-semibold text-amber-400">Wrong package name?</p>
          <p className="mt-1 text-sm text-slate-300">
            If you see <code className="font-mono text-slate-200">npm ERR! 404</code> for{" "}
            <code className="font-mono text-slate-200">@trucore/atf-cli</code>, use the correct name:{" "}
            <code className="font-mono text-primary-200">@trucore/atf</code>
          </p>
        </div>
      </section>

      {/* ── Golden Path ── */}
      <section className="space-y-6">
        <HeadingAnchor id="golden-path">Golden Path - Start Here</HeadingAnchor>

        <p className="max-w-3xl text-slate-300">
          Four commands take you from first trade to verified receipt. This is the recommended
          order for every new user.
        </p>

        {/* Flow block */}
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4">
          <pre className="text-sm text-slate-200 whitespace-pre">
{`# Golden path - copy and run in order
npx @trucore/atf@${cliVersion} trade          # 1. Try a protected trade (demo mode)
npx @trucore/atf@${cliVersion} setup          # 2. Connect your API key
npx @trucore/atf@${cliVersion} doctor         # 3. Diagnose your environment
npx @trucore/atf@${cliVersion} verify <id>    # 4. Verify and share a receipt`}
          </pre>
        </div>

        {/* Detailed cards */}
        <div className="space-y-4">
          {GOLDEN_PATH.map((entry) => (
            <div
              key={entry.command}
              className="rounded-xl border border-white/10 bg-neutral-950/50 p-5 space-y-3"
            >
              <div className="flex items-baseline gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary-300/30 text-sm font-bold text-primary-200">
                  {entry.step}
                </span>
                <h3 className="text-lg font-semibold text-slate-100">{entry.title}</h3>
              </div>
              <AtfCopyCommand
                command={
                  entry.command === "verify"
                    ? `npx @trucore/atf@${cliVersion} verify <receipt-id>`
                    : `npx @trucore/atf@${cliVersion} ${entry.command}`
                }
              />
              <p className="text-sm text-slate-300">{entry.description}</p>
              <p className="text-xs text-slate-400">{entry.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Dual-Surface Output ── */}
      <section className="space-y-6">
        <HeadingAnchor id="dual-surface">Dual-Surface Output</HeadingAnchor>

        <div className="max-w-3xl space-y-4 text-slate-300">
          <p>
            Every ATF command produces output designed for two audiences at once:
          </p>
          <ul className="list-disc space-y-1 pl-6 text-sm">
            <li>
              <strong className="text-slate-100">Humans</strong> - clear, colored terminal
              messages with status indicators and next-step suggestions.
            </li>
            <li>
              <strong className="text-slate-100">Bots &amp; agents</strong> - structured JSON
              with machine-readable fields for automated decision-making.
            </li>
          </ul>
          <p className="text-sm">
            Use <code className="font-mono text-slate-200">--pretty</code> or{" "}
            <code className="font-mono text-slate-200">--format pretty</code> for
            human-optimized output. Default JSON output is always machine-parsable.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {DUAL_SURFACE_FIELDS.map((field) => (
            <div
              key={field.name}
              className="rounded-lg border border-white/10 bg-neutral-950/50 p-4"
            >
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm font-semibold text-primary-200">{field.name}</p>
                <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  {field.audience}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-300">{field.description}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-400">
          This dual-surface design means a single CLI call can serve an operator monitoring
          a dashboard <em>and</em> a bot consuming JSON - no format switching required.
        </p>
      </section>

      {/* ── Advanced Command Groups ── */}
      <section className="space-y-6">
        <HeadingAnchor id="advanced">Advanced Command Groups</HeadingAnchor>

        <p className="max-w-3xl text-slate-300">
          Beyond the golden path, the CLI offers specialized commands grouped by function.
          Use these when you need fine-grained control over specific operations.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ADVANCED_GROUPS.map((group) => (
            <div
              key={group.title}
              className="rounded-xl border border-white/10 bg-neutral-950/50 p-4 space-y-2"
            >
              <h3 className="text-sm font-bold text-slate-100">{group.title}</h3>
              <p className="text-xs text-slate-400">{group.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {group.commands.map((cmd) => (
                  <code
                    key={cmd}
                    className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-primary-200/80"
                  >
                    {cmd}
                  </code>
                ))}
              </div>
              {group.page && (
                <p className="pt-1">
                  <Link
                    href={group.page}
                    className="text-xs font-semibold text-primary-100 transition-colors hover:text-primary-200"
                  >
                    Deep dive &rarr;
                  </Link>
                </p>
              )}
            </div>
          ))}
        </div>

        <p className="max-w-3xl text-sm text-slate-400">
          Run <code className="font-mono text-slate-300">npx @trucore/atf@{cliVersion} --help</code> for
          the full command list, or <code className="font-mono text-slate-300">npx @trucore/atf@{cliVersion} &lt;command&gt; --help</code> for
          per-command usage and flags.
        </p>
      </section>

      {/* ── Performance & Execution Characteristics ── */}
      <section className="space-y-6">
        <HeadingAnchor id="performance">Performance &amp; Execution Characteristics</HeadingAnchor>

        <div className="max-w-3xl space-y-4 text-slate-300">
          <p>
            The CLI is a lightweight Node.js binary with no heavy runtime
            dependencies. Commands start fast and produce deterministic,
            structured output.
          </p>
          <ul className="list-disc space-y-1 pl-6 text-sm">
            <li>Demo mode executes instantly with local simulation - no network calls.</li>
            <li>Real mode performance depends on RPC latency and route complexity.</li>
            <li>Policy evaluation is deterministic and runs before any on-chain execution.</li>
            <li>All outputs are structured JSON by default, suitable for piping and automation.</li>
          </ul>
        </div>

        {/* Demo vs Real Mode */}
        <div className="rounded-xl border border-white/10 bg-neutral-950/50 p-5 space-y-3">
          <h3 className="text-lg font-semibold text-slate-100">Demo vs Real Mode</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-neutral-950/50 p-4">
              <p className="font-mono text-sm font-semibold text-primary-200">Demo Mode</p>
              <p className="mt-1 text-sm text-slate-300">
                Instant, local simulation. No API key or RPC required.
                Produces realistic receipts for integration testing.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-neutral-950/50 p-4">
              <p className="font-mono text-sm font-semibold text-primary-200">Real Mode</p>
              <p className="mt-1 text-sm text-slate-300">
                Network-dependent. Policy evaluation runs first, then RPC
                simulation, then execution. RPC latency dominates total time.
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            In real mode, classification occurs before execution to avoid
            wasted compute. Typical SAFE routes observed under ~170k compute
            units in mainnet test matrices.
          </p>
        </div>
      </section>

      {/* ── Next Steps ── */}
      <section className="space-y-4">
        <HeadingAnchor id="next-steps">Next Steps</HeadingAnchor>
        <ul className="space-y-3 text-slate-300">
          <li>
            <Link
              href="/docs/first-protected-trade"
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              First Protected Trade
            </Link>{" "}
            &ndash; end-to-end walkthrough with code samples in Python, TypeScript, CLI, and OpenClaw.
          </li>
          <li>
            <Link
              href="/docs/cli"
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              CLI Documentation
            </Link>{" "}
            &ndash; full reference with all commands, flags, and response fields.
          </li>
          <li>
            <Link
              href="/docs/cli/guides"
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              CLI Guides
            </Link>{" "}
            &ndash; step-by-step walkthroughs for common workflows.
          </li>
          <li>
            <Link
              href="/docs/verify"
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              Verification
            </Link>{" "}
            &ndash; what content_hash proves and how to use receipt verification in production.
          </li>
        </ul>
      </section>
    </article>
  );
}

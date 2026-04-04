import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { AtfCopyCommand } from "@/components/atf-copy-command";
import { TrackedLink } from "@/components/tracked-link";
import { SafeToTryBanner, WhatHappensBlock } from "@/components/safe-to-try-banner";
import { PlatformRunbook } from "@/components/platform-runbook";
import { getAtfCliVersion } from "@/lib/version";

export const metadata: Metadata = {
  title: "ATF CLI Documentation",
  description:
    "Complete reference for the ATF CLI. Environment checks, devnet burner mode, transaction signing, receipt verification, and more.",
};

/* ── Command reference table data ── */
type CommandEntry = {
  command: string;
  description: string;
  page?: string;
};

type CommandCategory = {
  category: string;
  commands: CommandEntry[];
};

const cliVersion = getAtfCliVersion();

const COMMAND_REFERENCE: CommandCategory[] = [
  {
    category: "Environment",
    commands: [
      { command: "doctor", description: "Check your environment, RPC reachability, and CLI health.", page: "/docs/cli/doctor" },
      { command: "whoami", description: "Show active profile, wallet, and connection details.", page: "/docs/cli/whoami-ls" },
      { command: "ls", description: "List all configured profiles.", page: "/docs/cli/whoami-ls" },
      { command: "completion", description: "Generate shell completion scripts for bash, zsh, or fish.", page: "/docs/cli/completion" },
    ],
  },
  {
    category: "Profiles & Config",
    commands: [
      { command: "profile create", description: "Create a named configuration profile.", page: "/docs/cli/profiles" },
      { command: "profile switch", description: "Switch between profiles.", page: "/docs/cli/profiles" },
      { command: "config set", description: "Set a configuration value for the active profile.", page: "/docs/cli/profiles" },
      { command: "config get", description: "Read a configuration value.", page: "/docs/cli/profiles" },
    ],
  },
  {
    category: "Network",
    commands: [
      { command: "rpc ping", description: "Test RPC endpoint latency and reachability.", page: "/docs/cli/rpc" },
      { command: "rpc set", description: "Configure a custom or Helius RPC endpoint.", page: "/docs/cli/rpc" },
      { command: "burner", description: "Spin up a devnet burner wallet for quick testing.", page: "/docs/cli/burner" },
    ],
  },
  {
    category: "Transactions",
    commands: [
      { command: "simulate", description: "Run a deterministic firewall simulation with policy evaluation.", page: "/docs/cli/transactions" },
      { command: "tx sign", description: "Sign a transaction with the active wallet.", page: "/docs/cli/transactions" },
      { command: "tx send", description: "Submit a signed transaction to the network.", page: "/docs/cli/transactions" },
      { command: "tx status", description: "Check confirmation status of a submitted transaction.", page: "/docs/cli/transactions" },
    ],
  },
  {
    category: "Verification",
    commands: [
      { command: "receipts verify", description: "Verify receipt integrity locally via deterministic hash recomputation.", page: "/docs/cli/receipts" },
      { command: "receipts list", description: "List locally cached receipts.", page: "/docs/cli/receipts" },
    ],
  },
];

const RESPONSE_FIELDS: { name: string; description: string }[] = [
  { name: "ok", description: "Boolean. true when the request completed without errors." },
  { name: "verified", description: "Boolean. true when the CLI confirmed receipt integrity locally." },
  { name: "decision", description: "ALLOWED or BLOCKED. The deterministic policy outcome." },
  { name: "request_id", description: "Unique identifier for this simulation request." },
  { name: "content_hash", description: "Deterministic hash of the canonical response payload." },
  { name: "timestamp", description: "ISO-8601 UTC timestamp when the decision was issued." },
];

/* ── Page sections for quick navigation ── */
type QuickNavItem = { label: string; anchor: string };
const QUICK_NAV: QuickNavItem[] = [
  { label: "Install", anchor: "#install" },
  { label: "Run This First", anchor: "#run-this-first" },
  { label: "Common Dev Flows", anchor: "#common-dev-flows" },
  { label: "Guides", anchor: "#guides" },
  { label: "Command Reference", anchor: "#command-reference" },
  { label: "Subpage Deep Dives", anchor: "#deep-dives" },
  { label: "Response Fields", anchor: "#response-fields" },
  { label: "Verification Model", anchor: "#verification-model" },
];

export default function DocsCliPage() {
  return (
    <article className="space-y-12">
      {/* ── Header ── */}
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          CLI Reference
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          ATF CLI Documentation
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Install, run your first trade, explore advanced commands.
        </p>
        <p className="text-sm text-slate-400">
          Pinned version: <code className="font-mono text-primary-200">@trucore/atf@{cliVersion}</code>
        </p>
        <SafeToTryBanner />
      </header>

      {/* ── Quick nav ── */}
      <nav className="flex flex-wrap gap-2" aria-label="Page sections">
        {QUICK_NAV.map((item) => (
          <a
            key={item.anchor}
            href={item.anchor}
            className="rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:border-primary-300/30 hover:text-primary-100"
          >
            {item.label}
          </a>
        ))}
      </nav>

      {/* ── Install the CLI ── */}
      <section className="rounded-xl border border-primary-300/20 bg-primary-500/5 p-6 space-y-4">
        <HeadingAnchor id="install">Install the CLI</HeadingAnchor>

        <div className="space-y-3">
          <PlatformRunbook
            ariaLabel="CLI install platform"
            macLinux={
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Run directly with npx. No install needed.</p>
                <AtfCopyCommand command={`npx @trucore/atf@${cliVersion} trade`} testId="cli-install-npx" />
              </div>
            }
            windows={
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-200">Install globally</p>
                <AtfCopyCommand command={`npm install -g @trucore/atf@${cliVersion}`} testId="cli-install-global" />
                <p className="mt-1 text-sm text-slate-400">Then run commands directly with <code className="font-mono text-slate-300">atf</code>.</p>
              </div>
            }
          />
        </div>
      </section>

      {/* ── Try it now ── */}
      <section className="rounded-xl border border-accent-500/30 bg-accent-500/5 p-5 space-y-3">
        <HeadingAnchor id="try-it-now">Try a protected trade</HeadingAnchor>
        <AtfCopyCommand command="atf trade" testId="cli-first-trade" />
        <WhatHappensBlock />
      </section>

      {/* ── Run This First ── */}
      <section className="space-y-4">
        <HeadingAnchor id="run-this-first">Run This First: Doctor</HeadingAnchor>
        <p className="max-w-3xl text-slate-300">
          Run <code className="font-mono text-slate-200">doctor</code> to check your environment,
          RPC connectivity, and confirm the CLI is working.
        </p>
        <AtfCopyCommand
          label="Health check"
          command={`npx @trucore/atf@${cliVersion} doctor`}
        />
        <p className="text-sm text-slate-400">
          If doctor passes, you are ready to simulate, sign, and verify.
          If something is wrong, doctor tells you exactly what to fix.
        </p>
        <p className="text-sm text-slate-400">
          <Link href="/docs/cli/doctor" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
            Full doctor reference &rarr;
          </Link>
        </p>
      </section>

      {/* ── Common Dev Flows ── */}
      <section className="space-y-6">
        <HeadingAnchor id="common-dev-flows">Common Dev Flows</HeadingAnchor>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Devnet Burner Flow */}
          <div className="rounded-xl border border-white/10 bg-neutral-950/50 p-5 space-y-3">
            <h3 className="text-lg font-semibold text-slate-100">Devnet Burner</h3>
            <p className="text-sm text-slate-300">
              Spin up a throwaway devnet wallet, airdrop SOL, and run test transactions in seconds.
            </p>
            <AtfCopyCommand
              label="Start burner"
              command={`npx @trucore/atf@${cliVersion} burner --network devnet`}
            />
            <p className="text-xs text-slate-400">
              <Link href="/docs/cli/burner" className="text-primary-100 transition-colors hover:text-primary-200">
                Full burner guide &rarr;
              </Link>
            </p>
          </div>

          {/* Helius RPC Flow */}
          <div className="rounded-xl border border-white/10 bg-neutral-950/50 p-5 space-y-3">
            <h3 className="text-lg font-semibold text-slate-100">Helius RPC Setup</h3>
            <p className="text-sm text-slate-300">
              Configure a Helius RPC endpoint for reliable mainnet and devnet access.
            </p>
            <AtfCopyCommand
              label="Set RPC"
              command={`npx @trucore/atf@${cliVersion} rpc set --provider helius --api-key YOUR_KEY`}
            />
            <p className="text-xs text-slate-400">
              <Link href="/docs/cli/rpc" className="text-primary-100 transition-colors hover:text-primary-200">
                Full RPC guide &rarr;
              </Link>
            </p>
          </div>

          {/* Simulate + Verify Flow */}
          <div className="rounded-xl border border-white/10 bg-neutral-950/50 p-5 space-y-3">
            <h3 className="text-lg font-semibold text-slate-100">Simulate, Verify, Execute</h3>
            <p className="text-sm text-slate-300">
              The core ATF workflow: simulate a transaction, verify the receipt, then execute with confidence.
            </p>
            <AtfCopyCommand
              label="Full flow"
              command={`npx @trucore/atf@${cliVersion} simulate --preset swap_small --verify`}
            />
            <p className="text-xs text-slate-400">
              <Link href="/docs/cli/transactions" className="text-primary-100 transition-colors hover:text-primary-200">
                Transaction reference &rarr;
              </Link>
            </p>
          </div>

          {/* RPC Ping */}
          <div className="rounded-xl border border-white/10 bg-neutral-950/50 p-5 space-y-3">
            <h3 className="text-lg font-semibold text-slate-100">RPC Ping</h3>
            <p className="text-sm text-slate-300">
              Quick latency check to confirm your RPC endpoint is reachable and responsive.
            </p>
            <AtfCopyCommand
              label="Ping"
              command={`npx @trucore/atf@${cliVersion} rpc ping`}
            />
            <p className="text-xs text-slate-400">
              <Link href="/docs/cli/rpc" className="text-primary-100 transition-colors hover:text-primary-200">
                RPC reference &rarr;
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ── Guides ── */}
      <section className="space-y-6">
        <HeadingAnchor id="guides">Guides</HeadingAnchor>
        <p className="max-w-3xl text-slate-300">
          Step-by-step walkthroughs for common workflows. Each guide includes prerequisites,
          copyable commands, expected outputs, and troubleshooting tips.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { href: "/docs/cli/guides/swap-permits", title: "Swap Permit Parameters", desc: "Parameter glossary, safe defaults, override precedence" },
            { href: "/docs/cli/guides/simulate-verify-execute", title: "Simulate, Verify, Execute", desc: "The canonical ATF transaction workflow" },
            { href: "/docs/cli/guides/helius-setup", title: "Helius RPC Setup", desc: "Profiles, secrets separation, connectivity" },
            { href: "/docs/cli/guides/devnet-burner", title: "Devnet Burner Quickstart", desc: "Disposable wallets for fast testing" },
            { href: "/docs/cli/guides/production-bot-basics", title: "Production Bot Basics", desc: "Profile separation, receipts retention, monitoring" },
          ].map((guide) => (
            <Link
              key={guide.href}
              href={guide.href}
              className="rounded-lg border border-white/10 bg-neutral-950/50 p-4 transition-colors hover:border-primary-300/30 hover:bg-neutral-950/70"
            >
              <p className="font-semibold text-slate-100">{guide.title}</p>
              <p className="mt-1 text-xs text-slate-400">{guide.desc}</p>
            </Link>
          ))}
        </div>
        <p className="text-sm text-slate-400">
          <Link href="/docs/cli/guides" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
            View all guides &rarr;
          </Link>
        </p>
      </section>

      {/* ── Command Reference Table ── */}
      <section className="space-y-6">
        <HeadingAnchor id="command-reference">Command Reference</HeadingAnchor>
        <p className="max-w-3xl text-slate-300">
          All ATF CLI commands grouped by category. Each command links to its detailed documentation page.
        </p>

        <div className="space-y-8">
          {COMMAND_REFERENCE.map((cat) => (
            <div key={cat.category}>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-slate-400">
                {cat.category}
              </h3>
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-neutral-950/50">
                      <th className="px-4 py-2.5 font-semibold text-slate-200">Command</th>
                      <th className="px-4 py-2.5 font-semibold text-slate-200">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.commands.map((cmd) => (
                      <tr key={cmd.command} className="border-b border-white/5 last:border-b-0">
                        <td className="px-4 py-2.5 font-mono text-primary-200">
                          {cmd.page ? (
                            <Link
                              href={cmd.page}
                              className="transition-colors hover:text-primary-100"
                            >
                              atf {cmd.command}
                            </Link>
                          ) : (
                            <>atf {cmd.command}</>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-slate-300">{cmd.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Deep Dive Subpages ── */}
      <section className="space-y-4">
        <HeadingAnchor id="deep-dives">Deep Dive Pages</HeadingAnchor>
        <p className="max-w-3xl text-slate-300">
          Each area of the CLI has a dedicated page with detailed examples, flags, and usage patterns.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/docs/cli/doctor", title: "Doctor", desc: "Environment health checks" },
            { href: "/docs/cli/profiles", title: "Profiles & Config", desc: "Named profiles, secrets, config" },
            { href: "/docs/cli/rpc", title: "RPC & Network", desc: "Helius setup, ping, endpoints" },
            { href: "/docs/cli/burner", title: "Devnet Burner", desc: "Throwaway wallets for testing" },
            { href: "/docs/cli/transactions", title: "Transactions", desc: "Simulate, sign, send, status" },
            { href: "/docs/cli/receipts", title: "Receipts", desc: "Verify, list, deterministic hashing" },
            { href: "/docs/cli/completion", title: "Shell Completion", desc: "Bash, zsh, fish scripts" },
            { href: "/docs/cli/whoami-ls", title: "Whoami & Ls", desc: "Identity and profile listing" },
          ].map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="rounded-lg border border-white/10 bg-neutral-950/50 p-4 transition-colors hover:border-primary-300/30 hover:bg-neutral-950/70"
            >
              <p className="font-semibold text-slate-100">{page.title}</p>
              <p className="mt-1 text-xs text-slate-400">{page.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Response Fields ── */}
      <section className="space-y-4">
        <HeadingAnchor id="response-fields">Response Field Reference</HeadingAnchor>
        <p className="text-slate-300">
          Every simulation response contains these fields:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {RESPONSE_FIELDS.map((f) => (
            <div
              key={f.name}
              className="rounded-lg border border-white/10 bg-neutral-950/50 p-4"
            >
              <p className="font-mono text-sm font-semibold text-primary-200">
                {f.name}
              </p>
              <p className="mt-1 text-sm text-slate-300">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Verification Model ── */}
      <section className="space-y-4">
        <HeadingAnchor id="verification-model">
          Verification Model
        </HeadingAnchor>
        <div className="max-w-3xl space-y-4 text-slate-300">
          <p>
            Every ATF decision produces a receipt. The receipt payload is
            serialized in a deterministic, canonical order so that anyone can
            recompute the same hash from the same fields.
          </p>
          <p>
            When you pass <code className="font-mono text-slate-200">--verify</code>,
            the CLI re-serializes the response payload locally and compares the
            resulting digest to the <code className="font-mono text-slate-200">content_hash</code> returned
            by the server. If they match, integrity is confirmed.
          </p>
          <p>
            No client secrets involved. The hash function and serialization
            rules are public. Any tool that follows the same canonical encoding
            can independently verify a receipt.
          </p>
          <p>
            For a deeper look at what verification proves (and what it does not), see the{" "}
            <TrackedLink
              href="/docs/verify"
              eventName="docs_cli_verify_link"
              eventProps={{ target: "verify", location: "verification-model" }}
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              Verification reference
            </TrackedLink>.
          </p>
        </div>
      </section>

      {/* ── Example Output ── */}
      <section className="space-y-4">
        <HeadingAnchor id="example-output">Example Simulation Output</HeadingAnchor>
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`{
  "ok": true,
  "verified": true,
  "decision": "ALLOWED",
  "request_id": "req_1234567890",
  "content_hash": "0xabc123...",
  "timestamp": "2026-02-27T18:42:11Z"
}`}
        </pre>
        <p className="text-sm text-primary-200/80">
          Receipt integrity verified locally via deterministic hashing.
        </p>
      </section>

      {/* ── Next Steps ── */}
      <section className="space-y-4">
        <HeadingAnchor id="next-steps">Next Steps</HeadingAnchor>
        <ul className="space-y-3 text-slate-300">
          <li>
            <TrackedLink
              href="/docs/verify"
              eventName="docs_cli_next_click"
              eventProps={{ target: "verify" }}
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              Verification
            </TrackedLink>{" "}
            &ndash; understand what content_hash proves and how to use it in production.
          </li>
          <li>
            <TrackedLink
              href="/#architecture"
              eventName="docs_cli_next_click"
              eventProps={{ target: "architecture" }}
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              Architecture
            </TrackedLink>{" "}
            &ndash; see what happens under the hood when the CLI calls ATF.
          </li>
          <li>
            <TrackedLink
              href="/security"
              eventName="docs_cli_next_click"
              eventProps={{ target: "security" }}
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              Security posture
            </TrackedLink>{" "}
            &ndash; review threat model, disclosure policy, and audit status.
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
        </ul>
      </section>

      {/* ── Troubleshooting ── */}
      <section className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
        <p className="text-sm font-semibold text-amber-400">Wrong package name?</p>
        <p className="mt-1 text-sm text-slate-300">
          If you see <code className="font-mono text-slate-200">npm ERR! 404</code> for{" "}
          <code className="font-mono text-slate-200">@trucore/atf-cli</code>, use the correct name:{" "}
          <code className="font-mono text-primary-200">@trucore/atf</code>
        </p>
        <p className="mt-1 text-xs text-slate-400">
          The published package is <code className="font-mono text-slate-300">@trucore/atf</code>. The binary is <code className="font-mono text-slate-300">atf</code>.
        </p>
      </section>
    </article>
  );
}

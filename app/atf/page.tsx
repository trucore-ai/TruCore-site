import type { Metadata } from "next";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { TrackedLink } from "@/components/tracked-link";
import { WaitlistForm } from "@/components/waitlist-form";
import { AtfCopyCommand } from "@/components/atf-copy-command";
import { SimulateVerifyExecuteFlow } from "@/components/simulate-verify-execute-flow";
import { SafeToTryBanner, DemoVsRealBlock, WhatHappensBlock } from "@/components/safe-to-try-banner";
import { getAtfCliVersion } from "@/lib/version";

export const metadata: Metadata = {
  title: "ATF Developer Platform | Policy-Enforced Execution + Intelligence",
  description:
    "ATF is a non-custodial developer platform for building and operating transactional bots and AI agents on Solana. Policy-enforced execution with built-in intelligence, verifiable receipts, and the Policy Intelligence Layer.",
  openGraph: {
    title: "ATF Developer Platform | Policy-Enforced Execution + Intelligence",
    description:
      "Policy-enforced execution with built-in intelligence for Solana bots, AI agents, and custodians. Comprehensive CLI, API, agent tooling, and verifiable receipts.",
    images: [
      {
        url: "/atf/opengraph-image",
        width: 1200,
        height: 630,
        alt: "TruCore ATF Developer Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ATF Developer Platform | Policy-Enforced Execution + Intelligence",
    description:
      "Policy-enforced execution with built-in intelligence for Solana bots, AI agents, and custodians.",
    images: ["/atf/opengraph-image"],
  },
};

const cliVersion = getAtfCliVersion();

/* ── Toolbox command groups ── */
const toolboxGroups = [
  {
    title: "Golden Path",
    commands: [
      { name: "trade", desc: "Run a protected trade (demo mode by default, no wallet needed)" },
      { name: "setup", desc: "Interactive API key and config setup" },
      { name: "doctor", desc: "Full environment health check" },
      { name: "verify", desc: "Verify and share a receipt" },
    ],
  },
  {
    title: "Environment",
    commands: [
      { name: "whoami", desc: "Show active profile and pubkey" },
      { name: "ls", desc: "List all configured profiles" },
      { name: "completion", desc: "Generate shell completions (bash/zsh/fish)" },
    ],
  },
  {
    title: "Profiles & Config",
    commands: [
      { name: "profile create", desc: "Create a named profile for an environment" },
      { name: "profile select", desc: "Switch active profile" },
      { name: "profile config", desc: "Set RPC URL, secrets, and network" },
      { name: "config init", desc: "Initialize ATF global configuration" },
    ],
  },
  {
    title: "Network",
    commands: [
      { name: "rpc ping", desc: "Verify RPC connectivity and latency" },
      { name: "burner enable", desc: "Create an ephemeral devnet wallet" },
    ],
  },
  {
    title: "Transactions",
    commands: [
      { name: "tx sign", desc: "Sign a transaction payload" },
      { name: "tx send", desc: "Submit a signed transaction to the network" },
      { name: "tx status", desc: "Check confirmation status of a transaction" },
    ],
  },
  {
    title: "Policy & Simulation",
    commands: [
      { name: "policy validate", desc: "Validate a policy YAML offline" },
      { name: "bot protect", desc: "Wrap a bot transaction with ATF enforcement" },
      { name: "bot init", desc: "Scaffold a new bot config from a template" },
    ],
  },
  {
    title: "Verification & Receipts",
    commands: [
      { name: "receipts verify", desc: "Verify deterministic receipt integrity locally" },
      { name: "report savings", desc: "Generate receipt-backed savings report" },
    ],
  },
  {
    title: "Perps (feature-gated)",
    commands: [
      { name: "perps protect", desc: "Enforce perps policy before order submission" },
      { name: "perps explain", desc: "Show human-readable perps intent analysis" },
      { name: "perps fixtures", desc: "Print canonical venue-specific test fixtures" },
    ],
  },
  {
    title: "Agent & Discovery",
    commands: [
      { name: "bootstrap", desc: "Self-integrate using a bootstrap recipe" },
      { name: "integration-doctor", desc: "Diagnose integration health and configuration" },
    ],
  },
];

export default function ATFPage() {
  return (
    <Container>
      {/* ── 1. Hero: ATF Developer Platform ── */}
      <Section id="hero" className="fade-in-up">
        <Card className="glass-panel-hero relative overflow-hidden p-6 sm:p-12">
          <div className="hero-legibility-overlay" aria-hidden="true" />
          <div className="relative z-10">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary-200">
              Developer Security Infrastructure
            </p>
            <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight text-accent-200 md:text-6xl">
              Agent Transaction Firewall
            </h1>
            <p className="mt-6 max-w-3xl text-xl leading-[1.6] text-slate-200">
              Protect every transaction, learn from execution history, and
              continuously improve how capital is deployed. Policy-enforced
              execution with built-in intelligence for bot developers and AI
              agents on Solana.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <TrackedLink
                href="#doctor"
                eventName="hero_doctor_click"
                eventProps={{ location: "atf_hero" }}
                data-testid="hero-run-this-first"
                className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-lg font-semibold text-neutral-950 transition-colors hover:bg-slate-200"
              >
                Run This First
              </TrackedLink>
              <TrackedLink
                href="#burner"
                eventName="hero_burner_click"
                eventProps={{ location: "atf_hero" }}
                data-testid="hero-devnet-quickstart"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-lg font-semibold text-slate-100 transition-colors hover:bg-white/10"
              >
                Devnet Quickstart
              </TrackedLink>
            </div>

            <div className="mt-6">
              <SafeToTryBanner />
            </div>

            {/* ── First command in hero ── */}
            <div className="mt-6 max-w-xl">
              <AtfCopyCommand command="atf trade" testId="hero-first-command" />
              <WhatHappensBlock />
            </div>

            {/* ── Micro-nav ── */}
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-400">
              <TrackedLink
                href="/docs/cli"
                eventName="hero_micronav_click"
                eventProps={{ target: "cli_docs", location: "atf_hero" }}
                className="transition-colors hover:text-primary-100"
              >
                CLI Docs
              </TrackedLink>
              <span aria-hidden="true" className="text-white/20">/</span>
              <TrackedLink
                href="/docs/verify"
                eventName="hero_micronav_click"
                eventProps={{ target: "verify_docs", location: "atf_hero" }}
                className="transition-colors hover:text-primary-100"
              >
                Verification
              </TrackedLink>
              <span aria-hidden="true" className="text-white/20">/</span>
              <TrackedLink
                href="/docs/api"
                eventName="hero_micronav_click"
                eventProps={{ target: "api_docs", location: "atf_hero" }}
                className="transition-colors hover:text-primary-100"
              >
                API
              </TrackedLink>
              <span aria-hidden="true" className="text-white/20">/</span>
              <TrackedLink
                href="/docs/changelog"
                eventName="hero_micronav_click"
                eventProps={{ target: "changelog", location: "atf_hero" }}
                className="transition-colors hover:text-primary-100"
              >
                Changelog
              </TrackedLink>
            </div>
          </div>
        </Card>
      </Section>

      {/* ── 2. Golden Path ── */}
      <Section id="golden-path" divider className="fade-in-up fade-delay-1">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            Start Here
          </h2>
          <p className="mt-4 text-xl leading-[1.5] text-slate-200">
            Four commands. From first trade to verified receipt.
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Install globally with{" "}
            <code className="font-mono text-slate-300">npm install -g @trucore/atf@{cliVersion}</code>,{" "}
            or run without installing with{" "}
            <code className="font-mono text-slate-300">npx @trucore/atf@{cliVersion}</code>.{" "}
            <TrackedLink
              href="/docs/cli/commands#install"
              eventName="golden_path_install_link"
              eventProps={{ location: "atf_golden_path" }}
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              Installation details &rarr;
            </TrackedLink>
          </p>
        </div>

        <div className="max-w-3xl space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              1. Try a protected trade
            </p>
            <AtfCopyCommand
              command="atf trade"
              testId="golden-path-trade"
            />
            <WhatHappensBlock />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              2. Connect your API key
            </p>
            <AtfCopyCommand
              command="atf setup"
              testId="golden-path-setup"
            />
            <p className="mt-1 text-sm text-slate-400">
              Interactive setup. No manual .env editing needed.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              3. Diagnose your environment
            </p>
            <AtfCopyCommand
              command="atf doctor"
              testId="golden-path-doctor"
            />
            <p className="mt-1 text-sm text-slate-400">
              Checks config, RPC, wallet, and environment in one pass.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              4. Verify and share a receipt
            </p>
            <AtfCopyCommand
              command={`atf verify <receipt-id>`}
              testId="golden-path-verify"
            />
            <p className="mt-1 text-sm text-slate-400">
              Verify integrity. Share with human-readable text or bot-friendly output.
            </p>
          </div>
        </div>

        <div className="mt-6 max-w-3xl">
          <DemoVsRealBlock />
        </div>

        <p className="mt-6 max-w-3xl text-sm text-primary-200/80">
          Each command produces dual-surface output: clear terminal messages for
          operators and structured JSON for automation.
        </p>
      </Section>

      {/* ── 3. Run This First: doctor ── */}
      <Section id="doctor" divider className="fade-in-up fade-delay-1">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            Run This First
          </h2>
          <p className="mt-4 text-xl leading-[1.5] text-slate-200">
            One command tells you everything about your environment. No
            installation required.
          </p>
        </div>

        <div className="max-w-3xl">
          <AtfCopyCommand
            label="Doctor"
            command={`npx @trucore/atf@${cliVersion} doctor --pretty`}
            testId="doctor-command-copy"
          />
        </div>

        <div className="mt-8 max-w-3xl">
          <h3 className="text-lg font-bold text-accent-300">What it checks</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary-200">&#x2713;</span>
              Active profile and configuration
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary-200">&#x2713;</span>
              RPC provider connectivity and latency
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary-200">&#x2713;</span>
              Signer/wallet presence and type
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary-200">&#x2713;</span>
              Network selection (devnet/mainnet)
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary-200">&#x2713;</span>
              Environment variables and paths
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary-200">&#x2713;</span>
              CLI and Node.js versions
            </li>
          </ul>
        </div>

        {/* ── Example doctor JSON ── */}
        <div className="mt-8 max-w-3xl">
          <h3 className="text-lg font-bold text-accent-300">Example output</h3>
          <pre className="mt-3 overflow-x-auto rounded-xl border border-white/[0.08] bg-neutral-950/70 p-4 font-mono text-xs text-slate-200 whitespace-pre-wrap break-words">
{`{
  "ok": true,
  "profile": "devnet-burner",
  "network": "devnet",
  "rpc": { "provider": "helius", "latency_ms": 87 },
  "wallet": { "present": true, "type": "burner", "pubkey": "9x…kP" },
  "receipts": { "verify_ready": true },
  "versions": { "cli": "${cliVersion}", "node": "20.x" }
}`}
          </pre>
          <p className="mt-3 text-sm text-primary-200/80">
            No secrets leaked. Private keys, API tokens, and RPC credentials are
            redacted from all output by default.
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Doctor runs locally. Secrets are never uploaded.
          </p>
        </div>
      </Section>

      {/* ── 3. Devnet Burner Quickstart ── */}
      <Section id="burner" divider className="fade-in-up fade-delay-2">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            Devnet Burner Quickstart
          </h2>
          <p className="mt-4 text-xl leading-[1.5] text-slate-200">
            Go from zero to a verified devnet transaction in six commands. Burner
            mode creates an ephemeral wallet so you never risk real keys.
          </p>
        </div>

        <div className="max-w-3xl space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              1. Create a devnet profile
            </p>
            <AtfCopyCommand
              command={`npx @trucore/atf@${cliVersion} profile create devnet-burner --network devnet`}
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              2. Select the profile
            </p>
            <AtfCopyCommand
              command={`npx @trucore/atf@${cliVersion} profile select devnet-burner`}
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              3. Enable burner mode (ephemeral devnet wallet)
            </p>
            <AtfCopyCommand
              command={`npx @trucore/atf@${cliVersion} burner enable`}
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              4. Verify RPC connectivity
            </p>
            <AtfCopyCommand
              command={`npx @trucore/atf@${cliVersion} rpc ping`}
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              5. Sign and send a small transaction
            </p>
            <AtfCopyCommand
              command={`npx @trucore/atf@${cliVersion} tx sign --preset swap_small | npx @trucore/atf@${cliVersion} tx send`}
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              6. Verify the receipt
            </p>
            <AtfCopyCommand
              command={`npx @trucore/atf@${cliVersion} receipts verify --last`}
            />
          </div>
        </div>
      </Section>

      {/* ── 4. Helius Setup ── */}
      <Section id="helius" divider className="fade-in-up fade-delay-3">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            Helius Setup: Profiles + Secrets + RPC Ping
          </h2>
          <p className="mt-4 text-xl leading-[1.5] text-slate-200">
            ATF is Helius-first. Set your RPC endpoint through a named profile and
            secrets are never echoed to stdout.
          </p>
        </div>

        <div className="max-w-3xl space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              1. Create a production profile
            </p>
            <AtfCopyCommand
              command={`npx @trucore/atf@${cliVersion} profile create prod --network mainnet-beta`}
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              2. Set your Helius RPC URL (stored securely, never printed)
            </p>
            <AtfCopyCommand
              command={`npx @trucore/atf@${cliVersion} profile config prod --rpc-url <YOUR_HELIUS_URL>`}
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              3. Sanity check: ping the RPC
            </p>
            <AtfCopyCommand
              command={`npx @trucore/atf@${cliVersion} rpc ping --profile prod`}
            />
          </div>
        </div>

        <p className="mt-6 max-w-3xl text-sm text-primary-200/80">
          Secrets set via <code className="text-primary-200/90">profile config</code> are
          stored in your local profile directory and redacted from all CLI output.
          ATF never transmits private keys or API tokens over the network.
        </p>
      </Section>

      {/* ── 5. Simulate > Verify > Execute Flow ── */}
      <Section id="flow" divider className="fade-in-up fade-delay-4">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            Simulate, Verify, Execute
          </h2>
          <p className="mt-4 text-xl leading-[1.5] text-slate-200">
            Every transaction passes through a deterministic pipeline. Nothing
            touches the chain until local verification succeeds.
          </p>
        </div>

        <SimulateVerifyExecuteFlow />

        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-slate-300">
          The simulate step evaluates your transaction against active policy
          constraints and produces a receipt with a deterministic{" "}
          <code className="text-primary-200/90">content_hash</code>. Your client
          re-hashes the payload locally. If the digests match, the transaction is
          signed and submitted. If they diverge, execution is blocked before any
          funds move. This verify-then-send model means you never rely on server
          trust alone.
        </p>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Verify receipts locally before signing.
        </p>
      </Section>

      {/* ── 5b. Performance: Optimized for Real Execution Environments ── */}
      <Section id="performance" divider className="fade-in-up fade-delay-5">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            Optimized for Real Execution Environments
          </h2>
          <p className="mt-4 text-xl leading-[1.5] text-slate-200">
            ATF enforces policy inline with execution — not in batch, not
            offline. Every claim below is based on observed behavior from
            mainnet test matrices.
          </p>
        </div>

        <div className="max-w-3xl">
          <ul className="space-y-2 text-sm text-slate-200">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary-200">&#x2713;</span>
              Measured across mainnet routing scenarios with real RPC simulation
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary-200">&#x2713;</span>
              Classification occurs before execution to avoid wasted compute
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary-200">&#x2713;</span>
              Designed to operate within typical Solana RPC latency constraints
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary-200">&#x2713;</span>
              Deterministic policy evaluation avoids unnecessary RPC calls
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary-200">&#x2713;</span>
              Graceful fallback to demo mode when API is unavailable
            </li>
          </ul>

          <p className="mt-6 text-sm text-slate-400">
            Typical SAFE routes observed under ~170k compute units across
            mainnet test matrices. Multi-hop routes increase compute and
            latency. RPC response time dominates total execution time.
          </p>
        </div>

        {/* ── Measured on Mainnet ── */}
        <div className="mt-10 max-w-3xl">
          <h3 className="text-lg font-bold text-accent-300">
            Measured on Mainnet
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Routes were evaluated across real conditions using RPC simulation
            on Solana mainnet-beta. The following characteristics were observed
            across 6 matrix runs and 55+ scout samples.
          </p>

          <div className="mt-4 rounded-xl border border-white/[0.08] bg-neutral-950/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Observed Characteristics
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-200">
              <li>
                <span className="text-primary-200/90">SAFE</span>{" "}
                — under 170,000 compute units (most single-hop routes)
              </li>
              <li>
                <span className="text-primary-200/90">BORDERLINE</span>{" "}
                — 170,000–200,000 CU (observed in multi-hop route variance)
              </li>
              <li>
                <span className="text-primary-200/90">Multi-hop routes</span>{" "}
                — increase compute and latency; CU driven by route composition,
                not trade amount
              </li>
              <li>
                <span className="text-primary-200/90">RPC latency</span>{" "}
                — dominates total execution time in typical conditions
              </li>
            </ul>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            Based on internal test matrices. Route composition is
            non-deterministic — actual CU may vary between calls.
          </p>
        </div>
      </Section>

      {/* ── 6. Toolbox ── */}
      <Section id="toolbox" divider className="fade-in-up fade-delay-5">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            Toolbox
          </h2>
          <p className="mt-4 text-xl leading-[1.5] text-slate-200">
            Start with trade, setup, doctor, and verify. Advanced bot and operator
            commands are available when you need them.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {toolboxGroups.map((group) => (
            <Card key={group.title}>
              <h3 className="text-lg font-bold text-accent-300">
                {group.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {group.commands.map((cmd) => (
                  <li key={cmd.name} className="text-sm text-slate-200">
                    <code className="mr-2 text-primary-200/90">{cmd.name}</code>
                    <span className="text-slate-400">{cmd.desc}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </Section>

      {/* ── 8. Designed for Bots, Agents, Custodians ── */}
      <Section id="designed-for" divider className="fade-in-up fade-delay-6">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            Great UX for Humans, Stable Contracts for Bots
          </h2>
          <p className="mt-4 text-xl leading-[1.5] text-slate-200">
            Dual-surface outputs: readable in terminal, reliable in automation.
            Built for production bots, AI agents, and custodians.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <h3 className="text-lg font-bold text-accent-300">Human-Facing</h3>
            <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-300">
              <li>Guided protected trade UX with clear mode/status messaging</li>
              <li>Actionable next steps after every command</li>
              <li>Share snippets and replay commands for receipts</li>
            </ul>
          </Card>

          <Card>
            <h3 className="text-lg font-bold text-accent-300">Bot-Facing</h3>
            <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-300">
              <li>Machine-readable JSON with <code className="text-primary-200/90">machine_summary</code></li>
              <li><code className="text-primary-200/90">suggested_action</code> and <code className="text-primary-200/90">suggested_command</code> fields</li>
              <li>Replay, share, and bot-friendly output hooks</li>
            </ul>
          </Card>

          <Card>
            <h3 className="text-lg font-bold text-accent-300">Non-Custodial</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              ATF never holds your private keys. Signing happens on your machine,
              in your environment. The platform enforces policy, not custody.
            </p>
          </Card>

          <Card>
            <h3 className="text-lg font-bold text-accent-300">Deterministic Receipts</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Every decision produces a{" "}
              <code className="text-primary-200/90">content_hash</code> computed
              from stable JSON serialization. Shareable, verifiable, and
              reproducible. Full auditability, zero ambiguity.
            </p>
          </Card>
        </div>
      </Section>

      {/* ── 8. Roadmap Note (v2) ── */}
      <Section id="roadmap" divider className="fade-in-up">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            What Comes Next
          </h2>
          <p className="mt-4 text-xl leading-[1.5] text-slate-200">
            A hosted API key model is planned for v2 to support managed workflows
            and team-level access control. No dates. We ship only when security
            and verification guarantees are preserved.
          </p>
        </div>
      </Section>

      {/* ── 9. Footer CTA ── */}
      <Section id="get-started" divider className="fade-in-up">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            Get Started
          </h2>
          <p className="mt-4 text-lg leading-[1.5] text-slate-200">
            Run a protected trade, connect your key, and verify your first
            receipt. Everything you need ships in the CLI.
          </p>
        </div>

        <div className="mx-auto mt-6 max-w-xl">
          <AtfCopyCommand
            label="Try a protected trade"
            command={`npx @trucore/atf@${cliVersion} trade`}
            testId="footer-cta-trade"
          />
        </div>

        <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-300">
          <TrackedLink
            href="/docs/cli"
            eventName="footer_cta_click"
            eventProps={{ target: "cli_docs", location: "atf_footer" }}
            className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
          >
            CLI Docs
          </TrackedLink>
          <TrackedLink
            href="/docs/verify"
            eventName="footer_cta_click"
            eventProps={{ target: "verify_docs", location: "atf_footer" }}
            className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
          >
            Verification
          </TrackedLink>
          <TrackedLink
            href="/docs/api"
            eventName="footer_cta_click"
            eventProps={{ target: "api_docs", location: "atf_footer" }}
            className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
          >
            API Reference
          </TrackedLink>
          <TrackedLink
            href="/docs/changelog"
            eventName="footer_cta_click"
            eventProps={{ target: "changelog", location: "atf_footer" }}
            className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
          >
            Changelog
          </TrackedLink>
        </div>
      </Section>

      {/* ── Developer Quickstart CTA ── */}
      <Section id="dev-quickstart" divider className="fade-in-up">
        <section className="border border-white/10 rounded-xl p-6 bg-white/5">
          <h2 className="text-lg font-semibold">
            Run a protected trade in one command
          </h2>

          <p className="text-sm text-white/70 mt-2 max-w-lg">
            Try <code className="text-white/90">npx @trucore/atf@{cliVersion} trade</code> to see the full
            product loop: protect, receipt, verify. Demo mode works instantly.
          </p>

          <div className="mt-4 flex gap-4">
            <TrackedLink
              href="/quickstart"
              eventName="dev_quickstart_click"
              eventProps={{ target: "golden_path_quickstart", location: "atf_dev_quickstart" }}
              className="text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              Golden path quickstart &rarr;
            </TrackedLink>

            <TrackedLink
              href="/verify"
              eventName="dev_quickstart_click"
              eventProps={{ target: "verify", location: "atf_dev_quickstart" }}
              className="text-sm font-medium text-white/70 hover:text-white"
            >
              Verify execution receipts &rarr;
            </TrackedLink>
          </div>
        </section>
      </Section>

      {/* ── Get Updates ── */}
      <Section id="updates" divider className="fade-in-up">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            Get Updates
          </h2>
          <p className="mt-4 text-lg leading-[1.5] text-slate-200">
            Get release notes and security updates. CLI versions are pinned and
            the changelog announces every upgrade.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-xl">
          <Suspense
            fallback={
              <div className="h-40 rounded-xl bg-white/5" />
            }
          >
            <WaitlistForm />
          </Suspense>
        </div>
      </Section>
    </Container>
  );
}

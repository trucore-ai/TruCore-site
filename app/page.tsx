import type { Metadata } from "next";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { TrackedLink } from "@/components/tracked-link";
import { WaitlistForm } from "@/components/waitlist-form";
import { AtfCopyCommand } from "@/components/atf-copy-command";
import { getAtfCliVersion } from "@/lib/version";

export const metadata: Metadata = {
  title: "TruCore | Developer Security Infrastructure for Solana",
  description:
    "Non-custodial developer platform for Solana bots and AI agents. Deterministic enforcement, verifiable receipts, profiles, and Helius-first RPC.",
  openGraph: {
    title: "TruCore | Developer Security Infrastructure for Solana",
    description:
      "Non-custodial developer platform for Solana bots and AI agents. Deterministic enforcement, verifiable receipts, profiles, and Helius-first RPC.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "TruCore home social preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TruCore | Developer Security Infrastructure for Solana",
    description:
      "Non-custodial developer platform for Solana bots and AI agents. Deterministic enforcement, verifiable receipts, profiles, and Helius-first RPC.",
    images: ["/opengraph-image"],
  },
};

const cliVersion = getAtfCliVersion();

/* ── Toolbox command groups ── */
const toolboxGroups = [
  {
    title: "Environment",
    commands: [
      { name: "doctor", desc: "Full environment health check" },
      { name: "whoami", desc: "Show active profile and pubkey" },
      { name: "ls", desc: "List all configured profiles" },
      { name: "completion", desc: "Generate shell completions (bash/zsh/fish)" },
    ],
  },
  {
    title: "Network",
    commands: [
      { name: "rpc ping", desc: "Verify RPC connectivity and latency" },
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
    title: "Verification",
    commands: [
      { name: "receipts verify", desc: "Verify deterministic receipt integrity locally" },
    ],
  },
];

export default function Home() {
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
            <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight text-[#ffe0b2] md:text-6xl">
              Agent Transaction Firewall
            </h1>
            <p className="mt-6 max-w-3xl text-xl leading-[1.6] text-slate-200">
              ATF is a non-custodial developer platform for building and operating
              transactional bots and AI agents on Solana. Profiles, Helius-first
              RPC, devnet burner mode, transaction tooling, and cryptographically
              verifiable receipts.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <TrackedLink
                href="#doctor"
                eventName="hero_doctor_click"
                eventProps={{ location: "atf_hero" }}
                className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-lg font-semibold text-neutral-950 transition-colors hover:bg-slate-200"
              >
                Run This First
              </TrackedLink>
              <TrackedLink
                href="#burner"
                eventName="hero_burner_click"
                eventProps={{ location: "atf_hero" }}
                className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-lg font-semibold text-slate-100 transition-colors hover:bg-white/10"
              >
                Devnet Quickstart
              </TrackedLink>
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

      {/* ── 2. Run This First: doctor ── */}
      <Section id="doctor" className="border-t border-white/10 fade-in-up fade-delay-1">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-tight text-[#f0a050]">
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
          />
        </div>

        <div className="mt-8 max-w-3xl">
          <h3 className="text-lg font-semibold text-[#ffe0b2]">What it checks</h3>
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
          <h3 className="text-lg font-semibold text-[#ffe0b2]">Example output</h3>
          <pre className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-neutral-950/60 p-4 font-mono text-xs text-slate-200 whitespace-pre-wrap break-words">
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
      <Section id="burner" className="border-t border-white/10 fade-in-up fade-delay-2">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-tight text-[#f0a050]">
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
      <Section id="helius" className="border-t border-white/10 fade-in-up fade-delay-3">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-tight text-[#f0a050]">
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
      <Section id="flow" className="border-t border-white/10 fade-in-up fade-delay-4">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-tight text-[#f0a050]">
            Simulate, Verify, Execute
          </h2>
          <p className="mt-4 text-xl leading-[1.5] text-slate-200">
            Every transaction passes through a deterministic pipeline. Nothing
            touches the chain until local verification succeeds.
          </p>
        </div>

        <div className="max-w-3xl">
          <pre className="overflow-x-auto rounded-xl border border-white/10 bg-neutral-950/60 p-5 font-mono text-sm text-slate-200">
{`Simulate (policy)
    │
    ▼
Receipt (content_hash)
    │
    ▼
Verify (local)
    │
    ▼
Sign
    │
    ▼
Send
    │
    ▼
Status
    │
    ▼
Archive`}
          </pre>
        </div>

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

      {/* ── 6. Toolbox ── */}
      <Section id="toolbox" className="border-t border-white/10 fade-in-up fade-delay-5">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-tight text-[#f0a050]">
            Toolbox
          </h2>
          <p className="mt-4 text-xl leading-[1.5] text-slate-200">
            Everything the CLI ships today, grouped by workflow.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {toolboxGroups.map((group) => (
            <Card key={group.title}>
              <h3 className="text-lg font-semibold text-[#ffe0b2]">
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

      {/* ── 7. Designed for Bots, Agents, Custodians ── */}
      <Section id="designed-for" className="border-t border-white/10 fade-in-up fade-delay-6">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-tight text-[#f0a050]">
            Designed for Production Bots, AI Agents, and Custodians
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <h3 className="text-lg font-semibold text-[#ffe0b2]">Non-Custodial</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              ATF never holds your private keys. Signing happens on your machine,
              in your environment. The platform enforces policy, not custody.
            </p>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-[#ffe0b2]">Profile Separation</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Named profiles isolate dev, test, and production environments.
              Different RPC endpoints, wallets, and policies per profile keep
              concerns separated cleanly.
            </p>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-[#ffe0b2]">Deterministic Receipts</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Every decision produces a{" "}
              <code className="text-primary-200/90">content_hash</code> computed
              from stable JSON serialization. Re-hash the payload locally and the
              digest matches. Full auditability, zero ambiguity.
            </p>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-[#ffe0b2]">Safe Defaults</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Fail-closed enforcement, automatic secret redaction, and explicit
              network selection mean accidents cost nothing while you iterate. The
              guardrails are always on.
            </p>
          </Card>
        </div>
      </Section>

      {/* ── 8. Roadmap Note (v2) ── */}
      <Section id="roadmap" className="border-t border-white/10 fade-in-up">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-tight text-[#f0a050]">
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
      <Section id="get-started" className="border-t border-white/10 fade-in-up">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-[#f0a050]">
            Get Started
          </h2>
          <p className="mt-4 text-lg leading-[1.5] text-slate-200">
            Run the health check, spin up a devnet burner, and verify your first
            receipt. Everything you need ships in the CLI.
          </p>
        </div>

        <div className="mx-auto mt-6 max-w-xl">
          <AtfCopyCommand
            label="Install and run"
            command={`npx @trucore/atf@${cliVersion} doctor --pretty`}
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

      {/* ── Get Updates ── */}
      <Section id="updates" className="border-t border-white/10 fade-in-up">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-[#f0a050]">
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

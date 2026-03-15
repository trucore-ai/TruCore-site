import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { TrackedLink } from "@/components/tracked-link";

export const metadata: Metadata = {
  title: "For Bot Builders — Get Started with ATF",
  description:
    "Protect your trading bot or AI agent in minutes. Spend caps, slippage bounds, protocol allowlists, and cryptographic receipts for every transaction.",
  openGraph: {
    title: "For Bot Builders — Get Started with ATF",
    description:
      "Protect your trading bot or AI agent in minutes. Policy-enforced guardrails and verifiable receipts for autonomous finance on Solana.",
  },
};

const audiences = [
  {
    title: "Trading Bot Developers",
    desc: "You run Jupiter, Raydium, or Orca swaps on Solana. You want spend caps, slippage bounds, and protocol allowlists enforced before every transaction — without changing your signing flow.",
    icon: "🤖",
  },
  {
    title: "AI Agent Builders",
    desc: "Your agent makes autonomous on-chain decisions. You need a fail-closed policy layer that evaluates every intent and produces a tamper-evident receipt proving what was decided.",
    icon: "🧠",
  },
  {
    title: "DeFi Protocol Integrators",
    desc: "You embed lending, perps, or swap flows in your product. You want deterministic guardrails and verifiable proof of enforcement without building custom risk controls.",
    icon: "🔗",
  },
];

const paths = [
  {
    step: "1",
    title: "Try the sandbox",
    desc: "Submit a simulated intent and see ATF evaluate it against policy. No API key required.",
    href: "/atf/simulator",
    cta: "Open sandbox",
    event: "builders_sandbox_click",
  },
  {
    step: "2",
    title: "Protect your first trade",
    desc: "Submit a real swap intent via HTTP, Python, TypeScript, CLI, or OpenClaw. Get a receipt, verify it.",
    href: "/docs/first-protected-trade",
    cta: "Start golden path",
    event: "builders_golden_path_click",
  },
  {
    step: "3",
    title: "Request integration help",
    desc: "Tell us what you're building. Get a partner API key, integration guidance, and policy design review.",
    href: "/atf/apply?intent=design_partner",
    cta: "Apply for early access",
    event: "builders_apply_click",
  },
];

const quickLinks = [
  { title: "API Reference", href: "/docs/api", event: "builders_api_click" },
  { title: "CLI Reference", href: "/docs/cli", event: "builders_cli_click" },
  { title: "Policy Model", href: "/docs/policy-model", event: "builders_policy_click" },
  { title: "Receipt Specification", href: "/docs/receipt-specification-v1", event: "builders_receipt_spec_click" },
  { title: "Integration Pattern", href: "/docs/integration-pattern", event: "builders_integration_pattern_click" },
  { title: "OpenClaw Plugin", href: "/docs/openclaw-plugin", event: "builders_openclaw_click" },
  { title: "Verify a Receipt", href: "/verify", event: "builders_verify_click" },
  { title: "5-Minute Quickstart", href: "/docs/5-minute-quickstart", event: "builders_quickstart_click" },
];

export default function BuildersPage() {
  return (
    <Container>
      {/* ── Hero ── */}
      <Section className="fade-in-up">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary-200">
            For Bot Builders
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-accent-200 sm:text-6xl">
            Protect your bot before it hits the chain.
          </h1>
          <p className="mt-2 text-sm text-white/70 max-w-xl">
            Policy-enforced transaction protection for AI trading agents.
          </p>
          <p className="mt-6 text-2xl leading-[1.5] text-slate-200">
            ATF enforces spend limits, protocol allowlists, and slippage caps on
            every transaction your bot or agent submits. Every decision produces a
            cryptographic receipt you can verify independently.
          </p>
          <p className="mt-4 text-lg text-slate-300">
            Non-custodial. Zero new dependencies. Works with your existing signing flow.
          </p>
        </div>
      </Section>

      {/* ── Who this is for ── */}
      <Section divider className="fade-in-up fade-delay-1">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            Who this is for
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {audiences.map((a) => (
            <Card key={a.title} className="border-primary-300/25 bg-primary-500/10">
              <div className="mb-3 text-3xl">{a.icon}</div>
              <h3 className="text-xl font-bold text-accent-300">{a.title}</h3>
              <p className="mt-2 text-lg leading-[1.5] text-slate-200">{a.desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ── Your path ── */}
      <Section divider className="fade-in-up fade-delay-2">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            Your path to protected transactions
          </h2>
          <p className="mt-3 text-xl text-slate-300">
            From sandbox to production in three steps.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {paths.map((p) => (
            <Card key={p.step} className="flex flex-col justify-between">
              <div>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-accent-400/40 text-sm font-bold text-accent-300">
                  {p.step}
                </span>
                <h3 className="mt-3 text-xl font-bold text-accent-300">{p.title}</h3>
                <p className="mt-2 text-lg leading-[1.5] text-slate-200">{p.desc}</p>
              </div>
              <TrackedLink
                href={p.href}
                eventName={p.event}
                eventProps={{ location: "builders_path" }}
                className="mt-5 inline-flex items-center justify-center rounded-xl border border-primary-300/40 bg-primary-500/15 px-6 py-3 text-lg font-semibold text-primary-100 transition-colors hover:bg-primary-500/25"
              >
                {p.cta} &rarr;
              </TrackedLink>
            </Card>
          ))}
        </div>
      </Section>

      {/* ── Already have access? ── */}
      <Section divider className="fade-in-up">
        <Card className="border-accent-500/20 bg-accent-500/[0.04] p-6">
          <h2 className="text-2xl font-bold text-accent-300">
            Already have access?
          </h2>
          <p className="mt-2 text-lg text-slate-200">
            If you&apos;ve been approved as a design partner and have your API key,
            jump straight into activation:
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <TrackedLink
              href="/portal"
              eventName="builders_already_portal_click"
              eventProps={{ location: "builders_already_approved" }}
              className="block rounded-lg border border-white/10 bg-neutral-900/50 p-4 transition-colors hover:border-primary-300/30"
            >
              <span className="font-semibold text-accent-300">Open your portal</span>
              <span className="mt-1 block text-sm text-slate-400">View keys, usage, and simulator examples.</span>
            </TrackedLink>
            <TrackedLink
              href="/docs/first-protected-trade"
              eventName="builders_already_golden_path_click"
              eventProps={{ location: "builders_already_approved" }}
              className="block rounded-lg border border-white/10 bg-neutral-900/50 p-4 transition-colors hover:border-primary-300/30"
            >
              <span className="font-semibold text-accent-300">First protected trade</span>
              <span className="mt-1 block text-sm text-slate-400">Protect an intent, get a receipt, verify it.</span>
            </TrackedLink>
            <TrackedLink
              href="/verify"
              eventName="builders_already_verify_click"
              eventProps={{ location: "builders_already_approved" }}
              className="block rounded-lg border border-white/10 bg-neutral-900/50 p-4 transition-colors hover:border-primary-300/30"
            >
              <span className="font-semibold text-accent-300">Verify a receipt</span>
              <span className="mt-1 block text-sm text-slate-400">Paste a content_hash and confirm integrity.</span>
            </TrackedLink>
          </div>
        </Card>
      </Section>

      {/* ── What ATF enforces ── */}
      <Section divider className="fade-in-up">
        <div className="mb-6 max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            What ATF enforces
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Spend Caps", desc: "Max SOL or token spend per transaction and per rolling window." },
            { title: "Protocol Allowlist", desc: "Jupiter, Orca, Raydium (swaps). Solend, Marginfi, Kamino (lending). Perps venues feature-gated." },
            { title: "Slippage Bounds", desc: "Hard max slippage and minimum-out checks before execution." },
            { title: "Receipts", desc: "Tamper-evident SHA-256 receipt for every decision. Verify independently." },
          ].map((item) => (
            <Card key={item.title}>
              <h3 className="text-lg font-bold text-accent-300">{item.title}</h3>
              <p className="mt-2 text-base leading-[1.5] text-slate-200">{item.desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ── Quick links ── */}
      <Section divider className="fade-in-up">
        <div className="mb-6 max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            Developer resources
          </h2>
        </div>
        <Link
          href="/openclaw"
          className="mb-4 block rounded-lg border border-primary-300/25 bg-primary-500/10 p-5 transition-colors hover:border-primary-300/40"
        >
          <h3 className="text-lg font-bold text-accent-300">OpenClaw Integration</h3>
          <p className="mt-1 text-base leading-[1.5] text-slate-200">
            Route OpenClaw agent transactions through the Agent Transaction Firewall
            to enforce policies and generate deterministic execution receipts.
          </p>
          <span className="mt-2 inline-block text-sm font-semibold text-primary-200">
            Learn more &rarr;
          </span>
        </Link>
        <Link
          href="/quickstart"
          className="mb-4 block rounded-lg border border-primary-300/25 bg-primary-500/10 p-5 transition-colors hover:border-primary-300/40"
        >
          <h3 className="text-lg font-bold text-accent-300">Quickstart</h3>
          <p className="mt-1 text-base leading-[1.5] text-slate-200">
            Copy-paste your first protected transaction in under 60 seconds.
          </p>
          <span className="mt-2 inline-block text-sm font-semibold text-primary-200">
            Start now &rarr;
          </span>
        </Link>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <TrackedLink
              key={link.href}
              href={link.href}
              eventName={link.event}
              eventProps={{ location: "builders_resources" }}
              className="block rounded-lg border border-white/10 bg-neutral-900/50 p-4 transition-colors hover:border-primary-300/30"
            >
              <span className="font-semibold text-accent-300">{link.title}</span>
              <span className="mt-1 block text-sm text-primary-200">View &rarr;</span>
            </TrackedLink>
          ))}
        </div>
      </Section>

      {/* ── CTA ── */}
      <Section className="fade-in-up">
        <Card className="bg-accent-500/10 border-accent-500/30 p-8 text-center sm:p-10">
          <h2 className="text-3xl font-bold text-accent-300">
            Ready to protect your bot?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-xl leading-[1.5] text-slate-100">
            Apply for early access and get a partner API key, integration guidance,
            and policy design review from the TruCore team.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
            <TrackedLink
              href="/atf/apply?intent=design_partner"
              eventName="builders_bottom_apply_click"
              eventProps={{ location: "builders_bottom_cta" }}
              className="inline-flex items-center justify-center rounded-xl px-8 py-4 text-xl font-semibold shadow-glow-accent transition-all bg-accent-500 text-neutral-950 hover:bg-accent-400 hover:shadow-lg"
            >
              Apply for early access
            </TrackedLink>
            <TrackedLink
              href="/docs/first-protected-trade"
              eventName="builders_bottom_golden_path_click"
              eventProps={{ location: "builders_bottom_cta" }}
              className="inline-flex items-center justify-center rounded-xl border border-primary-300/40 bg-primary-500/15 px-7 py-4 text-xl font-semibold text-primary-100 transition-colors hover:bg-primary-500/25"
            >
              First protected trade
            </TrackedLink>
          </div>
          <p className="mt-6 text-base text-slate-400">
            Prefer email?{" "}
            <a
              href="mailto:info@trucore.xyz?subject=Integration%20Help%20%E2%80%94%20Bot%20Builder&body=Hi%20TruCore%20team%2C%0A%0AI%27m%20building%20a%20bot%20%2F%20agent%20and%20want%20help%20integrating%20ATF.%0A%0AProject%3A%20%0AStack%20(Python%2FTS%2FOpenClaw%2FHTTP)%3A%20%0AWhat%20I%20need%20help%20with%3A%20%0A%0AThanks!"
              className="font-semibold text-primary-200 underline underline-offset-2 transition-colors hover:text-primary-100"
            >
              Send us a note
            </a>
          </p>
        </Card>
      </Section>
    </Container>
  );
}

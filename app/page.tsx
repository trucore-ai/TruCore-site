import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { AtfV1Scope } from "@/components/atf-v1-scope";
import { EcosystemIntegrations } from "@/components/ecosystem-integrations";
import { AtfRoadmap } from "@/components/atf-roadmap";
import { AtfDesignPartnerCta } from "@/components/atf-design-partner-cta";
import { WaitlistForm } from "@/components/waitlist-form";
import { WhyNowSection } from "@/components/why-now-section";
import { EnforcementProofSection } from "@/components/enforcement-proof-section";
import { SecurityIntegrityStrip } from "@/components/security-integrity-strip";
import { MoatSignalStrip } from "@/components/moat-signal-strip";
import { ProductionReadinessStrip } from "@/components/production-readiness-strip";
import { LiveStatusStrip } from "@/components/home/live-status-strip";
import { TrackedLink } from "@/components/tracked-link";
import { PageViewTracker } from "@/components/page-view-tracker";
import { Tilt } from "@/components/ui/tilt";
import { getAtfCliVersion } from "@/lib/version";
import truCoreBanner from "@/images/TruCore-banner-new.png";

export const metadata: Metadata = {
  title: "TruCore | Policy-Enforced Protection for AI Agents",
  description:
    "Protect every AI agent transaction with policy enforcement before execution. Every decision produces a cryptographic receipt. Built for Solana trading bots and AI agents.",
  openGraph: {
    title: "TruCore | Policy-Enforced Protection for AI Agents",
    description:
      "Protect every AI agent transaction with policy enforcement before execution. Every decision produces a cryptographic receipt. Built for Solana trading bots and AI agents.",
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
    title: "TruCore | Policy-Enforced Protection for AI Agents",
    description:
      "Protect every AI agent transaction with policy enforcement before execution. Every decision produces a cryptographic receipt. Built for Solana trading bots and AI agents.",
    images: ["/opengraph-image"],
  },
};

const lastUpdated = process.env.NEXT_PUBLIC_BUILD_DATE ?? "unknown";

export default function Home() {
  return (
    <Container>
      <PageViewTracker page="home" />
      {/* ── Hero ── */}
      <Section id="hero" className="fade-in-up pb-8 sm:pb-10">
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-neutral-950/40 p-8 shadow-elevated sm:p-12 lg:p-14">
          <div className="hero-legibility-overlay" aria-hidden="true" />
          <Image
            src={truCoreBanner}
            alt="TruCore banner"
            width={420}
            height={280}
            className="pointer-events-none absolute right-4 top-4 z-10 hidden w-48 sm:block sm:w-[336px] lg:w-[420px]"
            style={{
              maskImage: "radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 100%)",
            }}
            priority
          />
          <div className="relative z-10 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary-200">
              For Solana AI agents and trading bots
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-accent-200 sm:text-6xl sm:pr-[352px] lg:text-7xl lg:pr-[436px]">
              Agent Transaction Control
            </h1>
            <p className="mt-6 text-2xl font-semibold text-amber-200/90">
              Policy enforced before execution. Verified receipt after every decision. Learn from outcomes to improve capital deployment over time.
            </p>
            <p className="mt-4 max-w-2xl text-xl leading-[1.5] text-slate-200/90 sm:text-2xl">
              TruCore gives AI agent transactions a deterministic control layer. Define policy rules before execution, verify every decision with cryptographic receipts, and feed execution outcomes back into the intelligence loop so agents improve capital deployment under operator-gated control.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-300/80">
              No signup required. No wallet access. Built for traders, protocol teams, and agent builders.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <TrackedLink
                href="/try"
                eventName="hero_try_atf_click"
                trackName="cta_home_primary"
                eventProps={{ location: "atf_hero" }}
                className="inline-flex items-center justify-center rounded-xl px-8 py-4 text-xl font-semibold shadow-glow-accent transition-all bg-accent-500 text-neutral-950 hover:bg-accent-400 hover:shadow-lg"
              >
                Start Your First Protected Trade
              </TrackedLink>
              <TrackedLink
                href="/verify-demo"
                eventName="hero_receipts_click"
                trackName="cta_home_secondary"
                eventProps={{ location: "atf_hero" }}
                className="inline-flex items-center justify-center rounded-xl border border-primary-300/40 bg-primary-500/15 px-7 py-4 text-xl font-semibold text-primary-100 transition-colors hover:bg-primary-500/25"
              >
                Verify a Receipt
              </TrackedLink>
            </div>

            <p className="mt-6 text-base text-slate-300/80">
              No signup or wallet required. See a real protected trade and cryptographic receipt.
            </p>
            <div className="mt-4 max-w-2xl rounded-lg border border-primary-300/20 bg-primary-500/[0.06] p-4">
              <p className="text-sm font-semibold text-primary-100">What happens next:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                <li>You submit a transaction</li>
                <li>ATF evaluates policy</li>
                <li>You receive a decision and receipt</li>
              </ul>
              <p className="mt-3 text-sm text-slate-300">
                You stay in control. You can start in safe mode with no real execution.
              </p>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
              <TrackedLink
                href="/docs/5-minute-quickstart"
                eventName="hero_quickstart_click"
                eventProps={{ location: "atf_hero", target: "5_min_quickstart" }}
                className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
              >
                5-min quickstart
              </TrackedLink>
              <span aria-hidden="true" className="text-white/20">/</span>
              <TrackedLink
                href="/pricing"
                eventName="hero_pricing_click"
                eventProps={{ location: "atf_hero" }}
                className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
              >
                Pricing
              </TrackedLink>
              <span aria-hidden="true" className="text-white/20">/</span>
              <TrackedLink
                href="/receipts"
                eventName="hero_receipts_click"
                eventProps={{ location: "atf_hero" }}
                className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
              >
                Receipts
              </TrackedLink>
              <span aria-hidden="true" className="text-white/20">/</span>
              <TrackedLink
                href="/r/example"
                eventName="hero_example_receipt_click"
                eventProps={{ location: "atf_hero" }}
                className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
              >
                Example Verified Receipt
              </TrackedLink>
              <span aria-hidden="true" className="text-white/20">/</span>
              <TrackedLink
                href="/agent-transaction-firewall"
                eventName="category_definition_click"
                eventProps={{ location: "atf_hero" }}
                className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
              >
                What is ATF?
              </TrackedLink>
            </div>

          </div>
        </div>
      </Section>


      {/* ?? Proof Anchor: Why This Works ?? */}
      <div className="my-8 rounded-xl border border-primary-300/30 bg-primary-500/[0.06] px-6 py-8">
        <p className="text-center text-lg text-slate-200">
          <span className="font-semibold text-primary-100">Every decision is enforced before execution.</span>
          {" "}Every result produces a cryptographic receipt.{" "}
          <span className="font-semibold  text-primary-100">You can verify it independently.</span>
        </p>
      </div>
      {/* ── Trust Signals & Live Status ── */}
      <div className="space-y-3 pb-8 sm:pb-10">
        <SecurityIntegrityStrip />
        <LiveStatusStrip />
        <p className="mt-2 text-center text-[13px] leading-relaxed text-slate-400/70">
          Live API enforcement on Solana. Every policy decision creates a verifiable receipt. Status reflects real system state.
        </p>
        <p className="pt-1 text-right text-xs text-slate-500/60">
          Last updated: {lastUpdated}
        </p>
      </div>

      {/* ── Golden Path: Try ATF in Four Commands ── */}
      <Section divider className="fade-in-up fade-delay-1">
        <div className="mb-8 max-w-2xl">
          <p className="section-label mb-3">Golden Path</p>
          <h2 className="text-4xl font-bold tracking-tight text-accent-300">
            Try ATF in Four Commands
          </h2>
          <p className="mt-4 text-xl leading-[1.5] text-slate-200">
            From first trade to verified receipt. No manual config needed.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { step: "1", cmd: "atf trade", desc: "Run a protected trade. Demo mode works out of the box - no API key required." },
            { step: "2", cmd: "atf setup", desc: "Connect your API key interactively. No .env editing needed." },
            { step: "3", cmd: "atf doctor", desc: "Diagnose your environment. One command checks config, connectivity, and wallet." },
            { step: "4", cmd: "atf verify", desc: "Verify and share a receipt. Human-readable share text and bot-friendly output." },
          ].map((item) => (
            <Tilt key={item.step} maxTilt={6}>
              <Card className="h-full">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-200">Step {item.step}</p>
                <p className="mt-2 font-mono text-lg font-bold text-accent-300">{item.cmd}</p>
                <p className="mt-2 text-base leading-[1.5] text-slate-200">{item.desc}</p>
              </Card>
            </Tilt>
          ))}
        </div>
        <div className="mt-6 max-w-3xl space-y-3 text-sm text-slate-400">
          <p>
            Open your terminal and install the CLI globally:
          </p>
          <pre className="inline-block rounded-md bg-neutral-800/70 px-4 py-2 font-mono text-sm text-slate-200">
            npm install -g @trucore/atf@{getAtfCliVersion()}
          </pre>
          <p>
            Then run each <code className="text-slate-300">atf</code> command above directly in your terminal.
            No project setup required.
          </p>
          <p>
            Each command produces operator-friendly terminal output and bot-ready JSON with{" "}
            <code className="text-slate-300">machine_summary</code>,{" "}
            <code className="text-slate-300">suggested_action</code>, and{" "}
            <code className="text-slate-300">suggested_command</code> fields.
          </p>
        </div>
      </Section>

      {/* ── What ATF Enforces ── */}
      <Section divider className="fade-in-up fade-delay-1">
        <div className="mb-8 max-w-2xl">
          <p className="section-label mb-3">Enforcement Model</p>
          <h2 className="text-4xl font-bold tracking-tight text-accent-300">
            What ATF Enforces
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Spend Caps", desc: "Max SOL or token spend per tx and per window." },
            { title: "Protocol Allowlist", desc: "Jupiter, Orca, and Raydium (swaps). Solend, Marginfi, and Kamino (lending). Perps venues feature-gated, off by default." },
            { title: "Slippage Bounds", desc: "Hard max slippage and minimum-out checks." },
            { title: "TTL + Nonce", desc: "Permits expire fast and cannot be replayed." },
          ].map((item) => (
            <Tilt key={item.title} maxTilt={6}>
              <Card className="h-full">
                <h3 className="text-xl font-bold text-accent-300">{item.title}</h3>
                <p className="mt-2 text-lg leading-[1.5] text-slate-200">{item.desc}</p>
              </Card>
            </Tilt>
          ))}
        </div>
      </Section>

      {/* ── First Trade Activation ── */}
      <Section divider className="fade-in-up fade-delay-1">
        <div className="mb-8 max-w-3xl">
          <p className="section-label mb-3">Activation</p>
          <h2 className="text-4xl font-bold tracking-tight text-accent-300">
            Make Your First Protected Trade
          </h2>
          <p className="mt-4 text-lg leading-[1.5] text-slate-200">
            You can test ATF safely before using real funds.
          </p>
          <p className="mt-2 text-sm text-slate-300">
            No setup required for demo. No risk to try.
          </p>
        </div>
        <div className="space-y-3 rounded-xl border border-white/[0.08] bg-neutral-900/40 p-6">
          <p className="text-sm text-slate-200"><span className="font-semibold text-primary-100">Step 1:</span> Run a sample transaction using demo or dry-run.</p>
          <p className="text-sm text-slate-200"><span className="font-semibold text-primary-100">Step 2:</span> Review the decision and receipt to understand policy and output.</p>
          <p className="text-sm text-slate-200"><span className="font-semibold text-primary-100">Step 3:</span> Run your own protected trade with real or controlled input.</p>
          <p className="pt-2 text-sm text-slate-300">
            You stay in control. You can start in safe mode with no real execution.
          </p>
        </div>
        <div className="mt-6">
          <TrackedLink
            href="/try"
            eventName="home_first_trade_activation_click"
            eventProps={{ location: "home_activation_section" }}
            className="inline-flex items-center justify-center rounded-xl bg-accent-500 px-6 py-3 text-base font-semibold text-neutral-950 transition-colors hover:bg-accent-400"
          >
            Start Your First Protected Trade
          </TrackedLink>
        </div>
      </Section>


      {/* ?? First Protected Trade: Step by Step ?? */}
      <Section divider className="fade-in-up fade-delay-1">
        <div className="mb-8 max-w-2xl">
          <p className="section-label mb-3">How It Works</p>
          <h2 className="text-4xl font-bold tracking-tight text-accent-300">
            First Protected Trade, Step by Step
          </h2>
          <p className="mt-4 text-xl leading-[1.5] text-slate-200">
            Every trade follows the same enforced path: policy evaluated, decision made, receipt generated, result verified.
          </p>
        </div>
        <div className="space-y-3">
          {[
            { num: "1", title: "Submit", desc: "You submit a transaction. ATF receives it with your policy rules." },
            { num: "2", title: "Evaluate", desc: "Every policy rule is checked: spend caps, protocols, slippage, TTL." },
            { num: "3", title: "Decide", desc: "Policy decision is made deterministically. ALLOW or DENY." },
            { num: "4", title: "Enforce", desc: "If ALLOW: transaction is executed. If DENY: blocked automatically." },
            { num: "5", title: "Verify", desc: "Cryptographic receipt proves what happened. Anyone can verify it." },
          ].map((item) => (
            <div key={item.num} className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-accent-400 bg-accent-500/20">
                  <span className="font-bold text-accent-300">{item.num}</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-primary-100">{item.title}</h3>
                <p className="mt-1 text-slate-300">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>
      {/* ── Policy Intelligence Layer ── */}
      <Section divider className="fade-in-up fade-delay-1">
        <div className="mb-8 max-w-3xl">
          <p className="section-label mb-3">Intelligence</p>
          <h2 className="text-4xl font-bold tracking-tight text-accent-300">
            Policy Intelligence Layer
          </h2>
          <p className="mt-4 text-2xl leading-[1.4] text-slate-200">
            The Policy Intelligence Layer (PIL) transforms ATF from a transaction
            firewall into an intelligence system, turning every execution into
            signal, and every signal into better decisions.
          </p>
          <p className="mt-4 text-xl leading-[1.5] text-slate-300">
            A new primitive: systems that learn from execution without sacrificing
            determinism or control.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Execution History",
              desc: "Every policy decision is recorded with full context. Receipts become queryable signal for operators.",
            },
            {
              title: "Actionable Intelligence",
              desc: "Aggregated execution data surfaces patterns, enabling operator-gated policy refinements grounded in real behavior.",
            },
            {
              title: "Controlled Improvement",
              desc: "Operators review and approve every policy change. The system suggests, humans decide. Deterministic and auditable at every step.",
            },
          ].map((item) => (
            <Tilt key={item.title} maxTilt={6}>
              <Card className="h-full">
                <h3 className="text-xl font-bold text-accent-300">{item.title}</h3>
                <p className="mt-2 text-lg leading-[1.5] text-slate-200">{item.desc}</p>
              </Card>
            </Tilt>
          ))}
        </div>
      </Section>

      {/* ── Category Positioning ── */}
      <Section className="fade-in-up fade-delay-1">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-3xl font-bold tracking-tight text-accent-300 sm:text-4xl">
            Most systems execute transactions. TruCore systems learn from them.
          </p>
        </div>
      </Section>

      {/* ── V1 Scope ── */}
      <EcosystemIntegrations />

      {/* ── Production Readiness ── */}
      <ProductionReadinessStrip />

      {/* ── V1 Scope (Chains, Controls, Platform Surface) ── */}
      <AtfV1Scope />

      {/* ── Explore ── */}
      <Section id="integrations" divider className="fade-in-up fade-delay-2">
        <div className="mb-8 max-w-2xl">
          <p className="section-label mb-3">Resources & Documentation</p>
          <h2 className="text-4xl font-bold tracking-tight text-accent-300">Explore</h2>
          <p className="mt-3 text-xl leading-[1.5] text-slate-200">
            Everything you need to evaluate and integrate ATF.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "First Protected Trade",
              desc: "Run atf trade, get a receipt, verify it. One command to try - no config required. HTTP, Python, TypeScript, CLI, and OpenClaw paths also available.",
              href: "/docs/first-protected-trade",
              event: "explore_first_protected_trade_click",
            },
            {
              title: "Architecture & Threat Model",
              desc: "Four-layer enforcement pipeline, threat vectors, and hard invariants.",
              href: "/details#architecture",
              event: "explore_architecture_click",
            },
            {
              title: "Capabilities",
              desc: "Swap, lending, and perps guardrails across 10 venue integrations. Deterministic receipts for every decision.",
              href: "/details#capabilities",
              event: "explore_capabilities_click",
            },
            {
              title: "Trading Bot Guardrails",
              desc: "Leverage caps, market allowlists, notional limits, and fail-closed defaults.",
              href: "/details#trading-bots",
              event: "explore_trading_bots_click",
            },
            {
              title: "Receipts",
              desc: "Shareable, verifiable receipts for every policy decision. Human share text and bot-friendly structured output.",
              href: "/receipts",
              event: "explore_receipts_click",
            },
            {
              title: "CLI Reference",
              desc: "Start with trade, setup, doctor, and verify. Advanced bot and operator commands available when you need them.",
              href: "/docs/cli",
              event: "explore_cli_click",
            },
            {
              title: "Agent Tooling",
              desc: "Great UX for humans, stable contracts for bots. Dual-surface outputs: readable in terminal, reliable in automation. Native agent tools and OpenClaw plugin included.",
              href: "/docs/agent-discovery",
              event: "explore_agent_tooling_click",
            },
            {
              title: "Build With ATF",
              desc: "Integration patterns, policy examples, production-ready example projects, and deployable services.",
              href: "/build-with-atf",
              event: "explore_build_click",
            },
            {
              title: "Enterprise",
              desc: "Compliance alignment, procurement readiness, and security posture.",
              href: "/enterprise",
              event: "explore_enterprise_click",
            },
            {
              title: "Security",
              desc: "Fail-closed defaults, scoped permits, immutable audit trail.",
              href: "/security/overview",
              event: "explore_security_click",
            },
            {
              title: "Docs",
              desc: "Quickstart, policy model, API reference, CLI guides, and changelog.",
              href: "/docs",
              event: "explore_docs_click",
            },
            {
              title: "For Bot Builders",
              desc: "Integration paths, early access, and hands-on support for trading bots and AI agents.",
              href: "/builders",
              event: "explore_builders_click",
            },
          ].map((card) => (
            <Tilt key={card.title} maxTilt={5}>
              <TrackedLink
                href={card.href}
                eventName={card.event}
                eventProps={{ location: "home_explore" }}
                className="block h-full"
              >
                <Card className="h-full transition-colors hover:border-primary-300/30">
                  <h3 className="text-lg font-bold text-accent-300">{card.title}</h3>
                  <p className="mt-2 text-base leading-[1.5] text-slate-300">{card.desc}</p>
                  <span className="mt-3 inline-flex text-sm font-semibold text-primary-200">
                    Explore &rarr;
                  </span>
                </Card>
              </TrackedLink>
            </Tilt>
          ))}
        </div>
      </Section>

      {/* ── Start Here - Conversion Path ── */}
      <Section divider className="fade-in-up fade-delay-2">
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-label mb-3">Get Started</p>
          <h2 className="text-3xl font-bold tracking-tight text-accent-300 sm:text-4xl">
            Try &rarr; Protect &rarr; Verify &rarr; Upgrade
          </h2>
          <p className="mt-4 text-lg leading-[1.5] text-slate-200">
            Start free. Get receipts for every decision.
            Upgrade when your bot needs higher caps or real execution.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <TrackedLink
              href="/try"
              eventName="home_start_try_click"
              eventProps={{ location: "home_start_strip" }}
              className="inline-flex items-center rounded-xl bg-accent-500/15 px-6 py-3 text-base font-semibold text-accent-300 transition-colors hover:bg-accent-500/25"
            >
              Start Your First Protected Trade
            </TrackedLink>
            <TrackedLink
              href="/docs/getting-started"
              eventName="home_start_docs_click"
              eventProps={{ location: "home_start_strip" }}
              className="inline-flex items-center rounded-xl border border-primary-300/30 px-6 py-3 text-base font-semibold text-primary-200 transition-colors hover:bg-primary-500/10"
            >
              Getting Started
            </TrackedLink>
            <TrackedLink
              href="/pricing"
              eventName="home_start_pricing_click"
              eventProps={{ location: "home_start_strip" }}
              className="inline-flex items-center rounded-xl border border-white/10 px-6 py-3 text-base font-semibold text-slate-300 transition-colors hover:bg-white/[0.05]"
            >
              Pricing
            </TrackedLink>
          </div>
        </div>
      </Section>

      {/* ── Why TruCore ── */}
      <div id="why-trucore">
        <WhyNowSection />
      </div>

      {/* ── Deterministic Enforcement Proof ── */}
      <div id="verify">
        <EnforcementProofSection />
      </div>

      {/* ── Roadmap ── */}
      <AtfRoadmap />

      {/* ── Waitlist / Design Partner CTA ── */}
      <div id="waitlist">
        <Section className="fade-in-up">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-accent-300">
              Join the Waitlist
            </h2>
            <p className="mt-4 text-lg leading-[1.5] text-slate-200">
              Get early-access updates, release notes, and security advisories.
            </p>
          </div>
          <div className="mx-auto mt-8 max-w-xl">
            <Suspense fallback={<div className="h-40 rounded-xl bg-white/5" />}>
              <WaitlistForm />
            </Suspense>
          </div>
        </Section>
        <AtfDesignPartnerCta />
      </div>

      {/* ── Moat Signals ── */}
      <MoatSignalStrip />
    </Container>
  );
}

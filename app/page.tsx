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
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/ui/reveal";
import { TerminalDemo } from "@/components/terminal-demo";
import { EnforcementPipeline } from "@/components/enforcement-pipeline";
import { PageViewTracker } from "@/components/page-view-tracker";
import { Tilt } from "@/components/ui/tilt";
import { getAtfCliVersion } from "@/lib/version";
import truCoreBanner from "@/images/TruCore-banner-new.png";

const HOME_SOCIAL_IMAGE_URL = "https://www.trucore.xyz/social-preview.png";

export const metadata: Metadata = {
  title: "TruCore — AI Infrastructure for Autonomous Agents",
  description:
    "Open-source infrastructure for AI agents: transaction enforcement and trust-graph service discovery. MIT-licensed. Built for production.",
  openGraph: {
    url: "https://trucore.xyz",
    siteName: "TruCore",
    type: "website",
    title: "TruCore — AI Infrastructure for Autonomous Agents",
    description:
      "Open-source infrastructure for AI agents: transaction enforcement and trust-graph service discovery. MIT-licensed. Built for production.",
    images: [
      {
        url: HOME_SOCIAL_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "TruCore — AI infrastructure for autonomous agents",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TruCore — AI Infrastructure for Autonomous Agents",
    description:
      "Open-source infrastructure for AI agents: transaction enforcement and trust-graph service discovery. MIT-licensed. Built for production.",
    images: [HOME_SOCIAL_IMAGE_URL],
  },
};

const lastUpdated = process.env.NEXT_PUBLIC_BUILD_DATE ?? "unknown";

export default function Home() {
  return (
    <Container>
      <PageViewTracker page="home" />
      {/* ── TruCore Brand Hero ── */}
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
              Infrastructure for the Agent Economy
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl sm:pr-[352px] lg:pr-[436px]">
              TruCore builds the backbone for autonomous AI agents
            </h1>
            <p className="mt-6 text-2xl font-semibold text-amber-200/90">
              From transaction firewalls to trust-graph service discovery — the tools AI agents need to operate independently in production.
            </p>
            <p className="mt-4 max-w-2xl text-xl leading-[1.5] text-slate-200/90 sm:text-2xl">
              Every TruCore product is open source, MIT-licensed, and built for developers who want their agents to transact and discover without human intervention.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-300/80">
              Built for agent developers, protocol teams, and AI infrastructure builders.
            </p>
          </div>
        </div>
      </Section>

      {/* ── Products ─ */}
      <Reveal>
      <Section className="pb-6 sm:pb-8">
        <div className="mb-8 max-w-2xl">
          <p className="section-label mb-3">Products</p>
          <h2 className="text-4xl font-bold tracking-tight text-accent-300">
            Open-source infrastructure for AI agents
          </h2>
          <p className="mt-4 text-xl leading-[1.5] text-slate-200">
            Every product is MIT-licensed. Self-host for free, or use our managed cloud when you need scale.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          <Reveal delay={0} className="h-full">
          <ProductCard
            name="ATF"
            tagline="Agent Transaction Firewall"
            description="Policy-enforced guardrails for AI agent transactions. Deterministic receipts, permit-based authorization, and cryptographic verification. Built for Solana — swaps, lending, and perps."
            href="/atf"
            status="live"
            cta="Explore ATF"
          />
          </Reveal>
          <Reveal delay={80} className="h-full">
          <ProductCard
            name="ProvenGraph"
            tagline="The Provenance Graph for the Agent Economy"
            description="Three product lines sharing one graph core: Trust (server verification with outcome-weighted reputation), Knowledge (grounded, verifiable claims), and Memory (compliant episodic recall for agents). MIT-licensed, self-hosted, single binary."
            href="https://provengraph.trucore.xyz"
            status="live"
            cta="Try ProvenGraph"
          />
          </Reveal>
        </div>
      </Section>
      </Reveal>

      {/* ── Featured Product: ATF ── */}
      <div id="atf-content" className="pt-4 sm:pt-8">
        <Reveal>
        <Section className="pb-4 sm:pb-6">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-primary-300/40 to-transparent" />
            <p className="shrink-0 text-sm font-semibold uppercase tracking-[0.14em] text-primary-300">
              Featured Product
            </p>
            <div className="h-px flex-1 bg-gradient-to-l from-primary-300/40 to-transparent" />
          </div>
          <div className="mt-6 text-center">
            <TrackedLink
              href="/atf"
              eventName="home_atf_feature_click"
              eventProps={{ location: "home_atf_section_header" }}
              className="inline-flex items-center gap-2 text-3xl font-bold tracking-tight text-accent-300 transition-colors hover:text-accent-200 sm:text-4xl"
            >
              Agent Transaction Firewall
              <span aria-hidden="true" className="text-xl">→</span>
            </TrackedLink>
            <p className="mt-3 max-w-2xl mx-auto text-lg leading-relaxed text-slate-300">
              Deterministic policy enforcement for AI agent transactions. Every decision produces a cryptographic receipt. Built for Solana trading bots and autonomous agents.
            </p>
          </div>
        </Section>
        </Reveal>
      </div>

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
      <Reveal>
      <Section divider>
        <div className="mb-8 max-w-2xl">
          <p className="section-label mb-3">Golden Path</p>
          <h2 className="text-4xl font-bold tracking-tight text-accent-300">
            Try ATF in Four Commands
          </h2>
          <p className="mt-4 text-xl leading-[1.5] text-slate-200">
            From first trade to verified receipt. No manual config needed.
          </p>
        </div>
        <TerminalDemo />
        <div className="mt-6 max-w-3xl space-y-3 text-sm text-slate-400">
          <p>
            Open your terminal and install the CLI globally:
          </p>
          <pre className="inline-block rounded-md bg-neutral-800/70 px-4 py-2 font-mono text-sm text-slate-200">
            npm install -g @trucore/atf@{getAtfCliVersion()}
          </pre>
          <p>
            The demo runs each <code className="text-slate-300">atf</code> command live. Run them yourself in your
            terminal. No project setup required.
          </p>
          <p>
            Each command produces operator-friendly terminal output and bot-ready JSON with{" "}
            <code className="text-slate-300">machine_summary</code>,{" "}
            <code className="text-slate-300">suggested_action</code>, and{" "}
            <code className="text-slate-300">suggested_command</code> fields.
          </p>
        </div>
      </Section>
      </Reveal>

      {/* ── What ATF Enforces ── */}
      <Reveal>
      <Section divider>
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
      </Reveal>

      {/* ── First Trade Activation ── */}
      <Reveal>
      <Section divider>
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
      </Reveal>


      {/* ?? First Protected Trade: Step by Step ?? */}
      <Reveal>
      <Section divider>
        <div className="mb-8 max-w-2xl">
          <p className="section-label mb-3">How It Works</p>
          <h2 className="text-4xl font-bold tracking-tight text-accent-300">
            First Protected Trade, Step by Step
          </h2>
          <p className="mt-4 text-xl leading-[1.5] text-slate-200">
            Every trade follows the same enforced path: policy evaluated, decision made, receipt generated, result verified.
          </p>
        </div>
        <EnforcementPipeline />
      </Section>
      </Reveal>
      {/* ── Policy Intelligence Layer ── */}
      <Reveal>
      <Section divider>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            {
              title: "Move transaction control out of the model loop.",
              desc: "ATF enforces policy, applies execution guardrails, and verifies outcomes outside the bot's token budget. That means less wasted compute on repetitive control logic, fewer invalid transaction loops, and more model capacity for higher-value intelligence.",
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
      </Reveal>

      {/* ── Category Positioning ── */}
      <Reveal>
      <Section>
        <div className="mx-auto max-w-3xl text-center">
          <p className="shimmer-text text-3xl font-bold tracking-tight sm:text-4xl">
            Most systems execute transactions. TruCore systems learn from them.
          </p>
        </div>
      </Section>
      </Reveal>

      {/* ── V1 Scope ── */}
      <EcosystemIntegrations />

      {/* ── Production Readiness ── */}
      <ProductionReadinessStrip />

      {/* ── V1 Scope (Chains, Controls, Platform Surface) ── */}
      <AtfV1Scope />

      {/* ── Explore ── */}
      <Reveal>
      <Section id="integrations" divider>
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
      </Reveal>

      {/* ── Start Here - Conversion Path ── */}
      <Reveal>
      <Section divider>
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
      </Reveal>

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
        <Reveal>
        <Section>
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
        </Reveal>
        <AtfDesignPartnerCta />
      </div>

      {/* ── Moat Signals ── */}
      <MoatSignalStrip />
    </Container>
  );
}

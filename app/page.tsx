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
import { Tilt } from "@/components/ui/tilt";
import truCoreBanner from "@/images/TruCore-banner-new.png";

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

const lastUpdated = process.env.NEXT_PUBLIC_BUILD_DATE ?? "unknown";

export default function Home() {
  return (
    <Container>
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
              Solana-native enforcement, multi-chain expanding
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-accent-200 sm:text-6xl sm:pr-[352px] lg:text-7xl lg:pr-[436px]">
              Guardrails for automated finance.
            </h1>
            <p className="mt-6 text-2xl font-semibold text-amber-200/90">
              Don&apos;t let your bot blow up your wallet.
            </p>
            <p className="mt-4 max-w-2xl text-xl leading-[1.5] text-slate-200/90 sm:text-2xl">
              Protect any bot trade with one API call. Get a cryptographic receipt.
              No wallet access. No custody. Free to start.
            </p>
            <p className="mt-3 text-base text-slate-400">
              Built for trading bot developers, AI agent builders, and DeFi protocol integrators on Solana.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <TrackedLink
                href="/try"
                eventName="hero_try_atf_click"
                eventProps={{ location: "atf_hero" }}
                className="inline-flex items-center justify-center rounded-xl px-8 py-4 text-xl font-semibold shadow-glow-accent transition-all bg-accent-500 text-neutral-950 hover:bg-accent-400 hover:shadow-lg"
              >
                Protect Your First Trade
              </TrackedLink>
              <TrackedLink
                href="/docs/getting-started"
                eventName="hero_docs_click"
                eventProps={{ location: "atf_hero" }}
                className="inline-flex items-center justify-center rounded-xl border border-primary-300/40 bg-primary-500/15 px-7 py-4 text-xl font-semibold text-primary-100 transition-colors hover:bg-primary-500/25"
              >
                How It Works
              </TrackedLink>
            </div>

            <p className="mt-6 text-base text-slate-300/80">
              No signup required. No wallet access. Every decision produces a tamper-evident receipt.
            </p>

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

      {/* ── Trust Signals & Live Status ── */}
      <div className="space-y-3 pb-8 sm:pb-10">
        <SecurityIntegrityStrip />
        <LiveStatusStrip />
        <p className="mt-2 text-center text-[13px] leading-relaxed text-slate-400/70">
          Solana-native enforcement infrastructure with live API, tamper-evident receipts, and deployable control-plane services.
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
            { step: "1", cmd: "atf trade", desc: "Run a protected trade. Demo mode works out of the box — no API key required." },
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
        <p className="mt-6 max-w-3xl text-sm text-slate-400">
          The same run produces operator-friendly terminal output and bot-ready JSON with{" "}
          <code className="text-slate-300">machine_summary</code>,{" "}
          <code className="text-slate-300">suggested_action</code>, and{" "}
          <code className="text-slate-300">suggested_command</code> fields.
        </p>
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
              desc: "Run atf trade, get a receipt, verify it. One command to try — no config required. HTTP, Python, TypeScript, CLI, and OpenClaw paths also available.",
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

      {/* ── Start Here — Conversion Path ── */}
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
              Try ATF
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

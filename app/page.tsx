import type { Metadata } from "next";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { AtfV1Scope } from "@/components/atf-v1-scope";
import { AtfRoadmap } from "@/components/atf-roadmap";
import { AtfDesignPartnerCta } from "@/components/atf-design-partner-cta";
import { WhyNowSection } from "@/components/why-now-section";
import { EnforcementProofSection } from "@/components/enforcement-proof-section";
import { SecurityIntegrityStrip } from "@/components/security-integrity-strip";
import { MoatSignalStrip } from "@/components/moat-signal-strip";
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
        <div className="relative max-w-4xl overflow-hidden rounded-2xl border border-white/[0.07] bg-neutral-950/40 p-8 shadow-elevated sm:p-12 lg:p-14">
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
              Solana-first agent controls, multi-chain next
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-accent-200 sm:text-6xl sm:pr-[352px] lg:text-7xl lg:pr-[436px]">
              Guardrails for automated finance.
            </h1>
            <p className="mt-6 text-2xl font-semibold text-amber-200/90">
              Don&apos;t let your bot blow up your wallet.
            </p>
            <p className="mt-4 max-w-2xl text-xl leading-[1.5] text-slate-200/90 sm:text-2xl">
              ATF enforces spend limits, protocol allowlists, and slippage caps on every transaction.
              Your agents move fast without going off the rails.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <TrackedLink
                href="/atf/simulator"
                eventName="hero_simulator_click"
                eventProps={{ location: "atf_hero" }}
                className="inline-flex items-center justify-center rounded-xl px-8 py-4 text-xl font-semibold shadow-glow-accent transition-all bg-accent-500 text-neutral-950 hover:bg-accent-400 hover:shadow-lg"
              >
                Try sandbox
              </TrackedLink>
              <TrackedLink
                href="/atf/apply"
                eventName="hero_pilot_click"
                eventProps={{ location: "atf_hero" }}
                className="inline-flex items-center justify-center rounded-xl border border-primary-300/40 bg-primary-500/15 px-7 py-4 text-xl font-semibold text-primary-100 transition-colors hover:bg-primary-500/25"
              >
                Apply for pilot
              </TrackedLink>
            </div>

            <p className="mt-6 text-base text-slate-300/80">
              Non-custodial. Helius-first RPC. Cryptographic receipts prove every enforcement decision.
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
                href="/receipts"
                eventName="hero_receipts_click"
                eventProps={{ location: "atf_hero" }}
                className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
              >
                View receipts
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
              <span aria-hidden="true" className="text-white/20">/</span>
              <TrackedLink
                href="/process"
                eventName="process_page_link_click"
                eventProps={{ location: "atf_hero" }}
                className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
              >
                How ATF is built
              </TrackedLink>
              <span aria-hidden="true" className="text-white/20">/</span>
              <TrackedLink
                href="/enterprise"
                eventName="enterprise_page_link_click"
                eventProps={{ location: "atf_hero" }}
                className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
              >
                Enterprise
              </TrackedLink>
            </div>

          </div>
        </div>
      </Section>

      {/* ── Trust Signals & Live Status ── */}
      <div className="space-y-3 pb-8 sm:pb-10">
        <SecurityIntegrityStrip />
        <LiveStatusStrip />
        <p className="pt-1 text-right text-xs text-slate-500/60">
          Last updated: {lastUpdated}
        </p>
      </div>

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
            { title: "Protocol Allowlist", desc: "V1: Jupiter (swaps) and Solend (lending). Perps venues feature-gated, off by default." },
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
              title: "Architecture & Threat Model",
              desc: "Four-layer enforcement pipeline, threat vectors, and hard invariants.",
              href: "/details#architecture",
              event: "explore_architecture_click",
            },
            {
              title: "Capabilities",
              desc: "Swap, lending, perps, and DEX guardrails with deterministic receipts.",
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
              desc: "Cryptographic, tamper-evident receipts for every policy decision.",
              href: "/receipts",
              event: "explore_receipts_click",
            },
            {
              title: "CLI Reference",
              desc: "Install, configure, and run ATF from the command line.",
              href: "/docs/cli",
              event: "explore_cli_click",
            },
            {
              title: "Build With ATF",
              desc: "Integration patterns, policy examples, and the e-commerce pilot.",
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
              desc: "Quickstart, policy model, API reference, and changelog.",
              href: "/docs",
              event: "explore_docs_click",
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

      {/* ── V1 Scope ── */}
      <AtfV1Scope />

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
        <AtfDesignPartnerCta />
      </div>

      {/* ── Moat Signals ── */}
      <MoatSignalStrip />
    </Container>
  );
}

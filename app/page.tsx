import type { Metadata } from "next";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { AtfDesignedFor } from "@/components/atf-designed-for";
import { AtfV1Scope } from "@/components/atf-v1-scope";
import { AtfRoadmap } from "@/components/atf-roadmap";
import { AtfReadiness } from "@/components/atf-readiness";
import { AtfDesignPartnerCta } from "@/components/atf-design-partner-cta";
import { TransparencyMetrics } from "@/components/transparency-metrics";
import { WhyNowSection } from "@/components/why-now-section";
import { EnforcementProofSection } from "@/components/enforcement-proof-section";
import { SecurityCommitments } from "@/components/security-commitments";
import { SecurityIntegrityStrip } from "@/components/security-integrity-strip";
import { EvidenceMetricsSection } from "@/components/evidence-metrics-section";
import { PublicUsageSnapshot } from "@/components/public-usage-snapshot";
import { AtfComparison } from "@/components/atf-comparison";
import { MoatSignalStrip } from "@/components/moat-signal-strip";
import { TrackedLink } from "@/components/tracked-link";
import { RiskBoundaryBlock } from "@/components/risk-boundary-block";
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

const threatVectors = [
  {
    threat: "Unbounded execution",
    impact: "Agent submits transactions outside approved parameters, draining capital.",
  },
  {
    threat: "Protocol drift",
    impact: "Agent interacts with unapproved or compromised contracts without restriction.",
  },
  {
    threat: "Slippage exploitation",
    impact: "Adverse fills and MEV extraction erode portfolio value during autonomous trades.",
  },
  {
    threat: "Authorization creep",
    impact: "Over-permissioned agents accumulate access rights beyond original scope.",
  },
  {
    threat: "Audit opacity",
    impact: "No verifiable trail of what was checked, approved, or rejected at execution time.",
  },
  {
    threat: "Adversary and MEV exploitation",
    impact: "MEV bots, sandwich attacks, and adversarial actors extract value from agent transactions that lack pre-flight protection and slippage enforcement.",
  },
];

const architectureLayers = [
  {
    label: "Policy Engine",
    description:
      "Declarative rule definitions evaluated against every transaction before submission. Supports allowlists, rate limits, slippage bounds, and multi-sig requirements.",
  },
  {
    label: "Permit Gateway",
    description:
      "Scoped, time-bound authorization tokens grant agents minimal execution rights. Permits expire automatically and cannot be escalated.",
  },
  {
    label: "Execution Validator",
    description:
      "Pre-flight simulation and constraint verification ensure transactions conform to policy before touching the chain. Fail-closed by default.",
  },
  {
    label: "Receipt Ledger",
    description:
      "Cryptographic receipts capture every policy evaluation, approval, rejection, and settlement event for tamper-evident post-trade audit.",
  },
];

const lastUpdated = process.env.NEXT_PUBLIC_BUILD_DATE ?? "unknown";
const atfVersion = process.env.NEXT_PUBLIC_ATF_VERSION;

export default function Home() {
  return (
    <Container>
      {/* ── Hero ── */}
      <Section id="hero" className="fade-in-up">
        <div className="relative max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/35 p-6 sm:p-8">
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
              Solana-First Agent Controls — Multi-Chain Next
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-6xl sm:pr-[352px] lg:text-7xl lg:pr-[436px]">
              Guardrails for automated finance.
            </h1>
            <p className="mt-5 text-2xl leading-[1.4] text-slate-200 sm:text-3xl">
              Don&apos;t let your AI or autonomous bot blow up your wallet. ATF enforces spend limits, protocol allowlists, and slippage caps on every transaction, so your agents can move fast without going off the rails.
            </p>
            <p className="mt-3 text-lg leading-[1.5] text-slate-300 sm:text-xl">
              Non-custodial. Helius-first RPC. Cryptographic receipts prove every enforcement decision. ATF enforces policy across swaps, lending, and perpetual futures.
            </p>

          {/* CTAs */}
            <div className="mt-8 flex flex-wrap gap-4">
              <TrackedLink
                href="/atf/simulator"
                eventName="hero_simulator_click"
                eventProps={{ location: "atf_hero" }}
                className="inline-flex items-center justify-center rounded-xl px-7 py-4 text-xl font-semibold transition-colors bg-accent-500 text-neutral-950 hover:bg-accent-400"
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
              <TrackedLink
                href="/docs/5-minute-quickstart"
                eventName="hero_quickstart_click"
                eventProps={{ location: "atf_hero", target: "5_min_quickstart" }}
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-7 py-4 text-xl font-semibold text-slate-100 transition-colors hover:bg-white/10"
              >
                Get started in 5 min
              </TrackedLink>
            </div>

            <p className="mt-5 text-lg text-slate-300">
              Need proof first?{" "}
              <TrackedLink
                href="/receipts"
                eventName="hero_receipts_click"
                eventProps={{ location: "atf_hero" }}
                className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
              >
                View example receipts
              </TrackedLink>
              .
            </p>

            <p className="mt-2 text-lg text-slate-300">
              New here? Read the{" "}
              <TrackedLink
                href="/agent-transaction-firewall"
                eventName="category_definition_click"
                eventProps={{ location: "atf_hero" }}
                className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
              >
                Agent Transaction Firewall definition
              </TrackedLink>
              .
            </p>

            <p className="mt-2 text-lg text-slate-300">
              For operational detail, see{" "}
              <TrackedLink
                href="/process"
                eventName="process_page_link_click"
                eventProps={{ location: "atf_hero" }}
                className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
              >
                how ATF is built
              </TrackedLink>
              {" "}and{" "}
              <TrackedLink
                href="/enterprise"
                eventName="enterprise_page_link_click"
                eventProps={{ location: "atf_hero" }}
                className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
              >
                enterprise readiness
              </TrackedLink>
              .
            </p>

            <p className="mt-4 text-sm font-medium text-slate-400">
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>
      </Section>

      <Section className="pt-0">
        <SecurityIntegrityStrip />
      </Section>

      {/* ── What ATF Enforces ── */}
      <Section className="border-t border-white/10 fade-in-up fade-delay-1">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-4xl font-bold tracking-tight text-[#f0a050]">
            What ATF Enforces
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Spend Caps",
              desc: "Max SOL or token spend per tx and per window.",
            },
            {
              title: "Protocol Allowlist",
              desc: "Only Jupiter and Solend actions allowed in V1.",
            },
            {
              title: "Slippage Bounds",
              desc: "Hard max slippage and minimum-out checks.",
            },
            {
              title: "TTL + Nonce",
              desc: "Permits expire fast and cannot be replayed.",
            },
          ].map((item) => (
            <Tilt key={item.title} maxTilt={6}>
              <Card className="h-full">
                <h3 className="text-xl font-bold text-[#e8944a]">{item.title}</h3>
                <p className="mt-2 text-lg leading-[1.5] text-slate-200">
                  {item.desc}
                </p>
              </Card>
            </Tilt>
          ))}
        </div>
      </Section>

      {/* ── Problem Statement ── */}
      <Section className="border-t border-white/10 fade-in-up fade-delay-2">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-4xl font-bold tracking-tight text-[#f0a050]">The Problem</h2>
          <p className="mt-4 text-2xl leading-[1.4] text-slate-200">
            Autonomous AI agents are executing financial transactions with
            increasing frequency and complexity. Current infrastructure assumes
            human oversight at critical decision points, an assumption that
            breaks down when agents operate independently at machine speed.
          </p>
          <p className="mt-4 text-2xl leading-[1.4] text-slate-200">
            Without an enforcement boundary, agents can exceed authorized
            parameters, interact with unapproved protocols, and produce no
            auditable record of their behavior. The result is uncontrolled
            capital exposure and zero accountability.
          </p>
          <p className="mt-4 text-2xl leading-[1.4] text-slate-200">
            The core issue is that AI cannot be fully trusted. Models
            hallucinate, drift, and behave unpredictably under novel conditions.
            Capital preservation is uncertain when the system making decisions
            has no hard-coded boundaries. Risk reduction requires an external
            enforcement layer that constrains what agents can do before
            transactions ever reach the chain.
          </p>
          <p className="mt-4 text-2xl leading-[1.4] text-slate-200">
            On-chain environments are adversarial by nature. MEV bots,
            sandwich attacks, and front-runners actively exploit unprotected
            transactions. Agents operating without pre-flight simulation,
            slippage caps, and protocol allowlists are easy targets. ATF
            provides the enforcement boundary that stands between autonomous
            agents and these external threats.
          </p>
        </div>
      </Section>

      {/* ── Threat Model ── */}
      <Section className="border-t border-white/10 fade-in-up fade-delay-2">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-4xl font-bold tracking-tight text-[#f0a050]">Threat Model</h2>
          <p className="mt-4 text-2xl leading-[1.4] text-slate-200">
            ATF is designed to mitigate the following categories of risk in
            agent-driven financial systems.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {threatVectors.map((tv) => (
            <Card key={tv.threat}>
              <h3 className="text-xl font-bold text-[#e8944a]">{tv.threat}</h3>
              <p className="mt-2 text-lg leading-[1.5] text-slate-200">{tv.impact}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section className="border-t border-white/10 fade-in-up">
        <div className="mx-auto max-w-4xl rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-3xl font-bold tracking-tight text-[#f0a050] sm:text-4xl">ATF vs LLM Firewalls</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Card className="h-full">
              <h3 className="text-2xl font-bold text-[#e8944a]">LLM firewalls</h3>
              <ul className="mt-3 space-y-2 text-lg leading-[1.5] text-slate-200">
                <li>Prompt boundary protection</li>
                <li>Input and output filtering</li>
                <li>Data leakage prevention controls</li>
              </ul>
            </Card>
            <Card className="h-full">
              <h3 className="text-2xl font-bold text-[#e8944a]">ATF</h3>
              <ul className="mt-3 space-y-2 text-lg leading-[1.5] text-slate-200">
                <li>Pre-execution economic invariants</li>
                <li>Deterministic decisioning</li>
                <li>Receipts for verification</li>
              </ul>
            </Card>
          </div>
        </div>
      </Section>

      {/* ── Architecture Overview ── */}
      <Section className="border-t border-white/10 fade-in-up fade-delay-3">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-4xl font-bold tracking-tight text-[#f0a050]">Architecture Overview</h2>
          <p className="mt-4 text-2xl leading-[1.4] text-slate-200">
            ATF is composed of four coordinated layers that enforce policy from
            intent through settlement.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {architectureLayers.map((layer, i) => (
            <Tilt key={layer.label} maxTilt={5}>
              <Card className="h-full">
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-primary-300/40 text-sm font-bold text-primary-100">
                  {i + 1}
                </div>
                <h3 className="text-2xl font-bold text-[#e8944a]">{layer.label}</h3>
                <p className="mt-2 text-xl leading-[1.5] text-slate-200">{layer.description}</p>
              </Card>
            </Tilt>
          ))}
        </div>
      </Section>

      {/* ── Built for trading bots ── */}
      <Section className="border-t border-white/10 fade-in-up fade-delay-4">
        <div className="mx-auto max-w-4xl rounded-xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
          <h2 className="text-3xl font-bold tracking-tight text-[#f0a050] sm:text-4xl">
            Built for trading bots
          </h2>
          <p className="mt-3 text-xl leading-[1.5] text-slate-200">
            ATF evaluates and enforces your risk limits before any transaction is signed or broadcast, so your bot stays inside its authorized parameters at every tick.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              {
                label: "Perps leverage caps",
                detail: "Hard ceiling on position size relative to collateral, enforced pre-execution.",
              },
              {
                label: "Market allowlists",
                detail: "Only approved perps venues and markets can be traded against.",
              },
              {
                label: "Slippage ceilings",
                detail: "Max slippage and minimum-out checks on every swap, not just at config time.",
              },
              {
                label: "Notional limits",
                detail: "Per-transaction and rolling-window USD notional caps keep exposure bounded.",
              },
              {
                label: "Fail-closed on unknowns",
                detail: "Any operation not covered by an explicit policy rule is rejected by default.",
              },
              {
                label: "Deterministic receipts",
                detail: "Every decision produces a cryptographic receipt, giving you an auditable trail of what was enforced and when.",
              },
            ].map((item) => (
              <li key={item.label} className="flex gap-3 rounded-lg border border-white/8 bg-white/[0.03] p-4">
                <span className="mt-0.5 text-primary-300">✓</span>
                <div>
                  <p className="font-semibold text-slate-100">{item.label}</p>
                  <p className="mt-0.5 text-base leading-[1.5] text-slate-400">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Example policy YAML */}
          <div className="mt-6 rounded-lg border border-white/10 bg-neutral-950/60 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Example policy (framework-agnostic)
            </p>
            <pre className="overflow-x-auto text-sm leading-relaxed text-slate-300">
              <code>{`policy:
  perps_leverage_max: "3x"
  markets_allowlist:
    - SOL-PERP
    - BTC-PERP
  slippage_max_bps: 50
  notional_limit_usd: 10000
  fail_closed: true
  receipts: deterministic`}</code>
            </pre>
          </div>

          <div className="mt-5">
            <TrackedLink
              href="/docs/perps"
              eventName="trading_bots_guardrails_click"
              eventProps={{ location: "trading_bots_section" }}
              className="inline-flex items-center gap-1.5 text-base font-semibold text-primary-200 transition-colors hover:text-primary-100"
            >
              See recommended guardrails
              <span aria-hidden="true">→</span>
            </TrackedLink>
          </div>
        </div>
      </Section>

      {/* ── Architecture Diagram (SVG) ── */}
      <Section className="border-t border-white/10 fade-in-up fade-delay-4">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-4xl font-bold tracking-tight text-[#f0a050]">
            Architecture Diagram
          </h2>
          <p className="mt-4 text-2xl leading-[1.4] text-slate-200">
            Four coordinated layers enforce policy from intent through
            settlement. Each layer is fail-closed by default.
          </p>
        </div>

        {/* Inline SVG diagram */}
        <div className="glass-panel mx-auto max-w-5xl overflow-x-auto rounded-xl p-6 sm:p-10">
          <svg
            viewBox="0 0 820 700"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
            role="img"
            aria-label="ATF architecture diagram showing four layers: Policy Engine, Permit Gateway, Execution Validator, and Receipt Ledger"
          >
            <defs>
              <linearGradient id="blueGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#349de8" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#1e69a5" stopOpacity="0.04" />
              </linearGradient>
              <linearGradient id="orangeGlow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f08a1f" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#d86c08" stopOpacity="0.05" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Agent (top) */}
            <rect x="280" y="16" width="260" height="64" rx="10" fill="#162236" stroke="#8ed3ff" strokeWidth="1.5" />
            <text x="410" y="56" textAnchor="middle" fill="#8ed3ff" fontSize="22" fontWeight="600" fontFamily="system-ui, sans-serif">
              AI Agent
            </text>

            {/* Arrow down */}
            <line x1="410" y1="80" x2="410" y2="126" stroke="#5cbcfb" strokeWidth="2" strokeDasharray="5 4" />
            <polygon points="403,121 410,134 417,121" fill="#5cbcfb" />

            {/* Layer 1: Policy Engine */}
            <rect x="60" y="140" width="700" height="90" rx="12" fill="url(#blueGlow)" stroke="#349de8" strokeWidth="1.5" />
            <text x="410" y="178" textAnchor="middle" fill="#8ed3ff" fontSize="24" fontWeight="700" fontFamily="system-ui, sans-serif">
              Policy Engine
            </text>
            <text x="410" y="210" textAnchor="middle" fill="#b0bec5" fontSize="17" fontFamily="system-ui, sans-serif">
              Evaluates intent against policy + threat model
            </text>

            {/* Arrow */}
            <line x1="410" y1="230" x2="410" y2="272" stroke="#5cbcfb" strokeWidth="2" strokeDasharray="5 4" />
            <polygon points="403,267 410,280 417,267" fill="#5cbcfb" />

            {/* Layer 2: Permit Gateway */}
            <rect x="60" y="286" width="700" height="90" rx="12" fill="url(#blueGlow)" stroke="#349de8" strokeWidth="1.5" />
            <text x="410" y="324" textAnchor="middle" fill="#8ed3ff" fontSize="24" fontWeight="700" fontFamily="system-ui, sans-serif">
              Permit Gateway
            </text>
            <text x="410" y="356" textAnchor="middle" fill="#b0bec5" fontSize="17" fontFamily="system-ui, sans-serif">
              Scoped authorization: TTL, nonce, domain separation
            </text>

            {/* Arrow */}
            <line x1="410" y1="376" x2="410" y2="418" stroke="#5cbcfb" strokeWidth="2" strokeDasharray="5 4" />
            <polygon points="403,413 410,426 417,413" fill="#5cbcfb" />

            {/* Layer 3: Execution Validator */}
            <rect x="60" y="432" width="700" height="90" rx="12" fill="url(#orangeGlow)" stroke="#f08a1f" strokeWidth="1.2" />
            <text x="410" y="470" textAnchor="middle" fill="#f0a050" fontSize="24" fontWeight="700" fontFamily="system-ui, sans-serif">
              Execution Validator
            </text>
            <text x="410" y="502" textAnchor="middle" fill="#b0bec5" fontSize="17" fontFamily="system-ui, sans-serif">
              Allowlists, slippage bounds, spend caps, simulation
            </text>

            {/* Arrow */}
            <line x1="410" y1="522" x2="410" y2="564" stroke="#5cbcfb" strokeWidth="2" strokeDasharray="5 4" />
            <polygon points="403,559 410,572 417,559" fill="#5cbcfb" />

            {/* Layer 4: Receipt Ledger */}
            <rect x="60" y="578" width="700" height="90" rx="12" fill="url(#blueGlow)" stroke="#349de8" strokeWidth="1.5" />
            <text x="410" y="616" textAnchor="middle" fill="#8ed3ff" fontSize="24" fontWeight="700" fontFamily="system-ui, sans-serif">
              Receipt Ledger
            </text>
            <text x="410" y="648" textAnchor="middle" fill="#b0bec5" fontSize="17" fontFamily="system-ui, sans-serif">
              Tamper-evident receipts for audit + incident response
            </text>
          </svg>
        </div>
      </Section>

      {/* ── Execution Flow ── */}
      <Section className="border-t border-white/10 fade-in-up fade-delay-5">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-4xl font-bold tracking-tight text-[#f0a050]">
            Execution Flow
          </h2>
          <p className="mt-4 text-2xl leading-[1.4] text-slate-200">
            Every agent transaction follows a deterministic five-step path from
            intent to verifiable receipt.
          </p>
        </div>
        <ol className="grid gap-4 md:grid-cols-5">
          {[
            {
              step: 1,
              title: "Agent proposes intent",
              desc: "The AI agent submits its intended action (e.g., swap, lend) to the ATF pipeline.",
            },
            {
              step: 2,
              title: "Policy evaluation",
              desc: "The Policy Engine evaluates intent against configured rules and constructs constraints.",
            },
            {
              step: 3,
              title: "Permit issued",
              desc: "The Permit Gateway issues a signed, time-bound permit with TTL + nonce.",
            },
            {
              step: 4,
              title: "Bounded execution",
              desc: "The Executor performs the transaction within permit bounds (e.g., Jupiter swap, Solend action).",
            },
            {
              step: 5,
              title: "Receipt emitted",
              desc: "A cryptographic receipt is generated (hashes, policy ID, outcome) and stored.",
            },
          ].map((item) => (
            <li key={item.step}>
              <Tilt maxTilt={6}>
                <Card className="h-full">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary-300/40 text-sm font-bold text-primary-100">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-[#e8944a]">{item.title}</h3>
                  <p className="mt-2 text-base leading-[1.5] text-slate-200">{item.desc}</p>
                </Card>
              </Tilt>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── Hard Invariants ── */}
      <Section className="border-t border-white/10 fade-in-up">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-4xl font-bold tracking-tight text-[#f0a050]">
            Hard Invariants
          </h2>
          <p className="mt-4 text-2xl leading-[1.4] text-slate-200">
            Non-negotiable constraints enforced on every transaction. These
            cannot be bypassed, overridden, or weakened at runtime.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              label: "Spend cap",
              desc: "Maximum value per transaction and per rolling time window. Exceeding either limit blocks execution.",
            },
            {
              label: "Protocol allowlist",
              desc: "Only pre-approved programs (Jupiter, Solend for v1) may be invoked. All other program IDs are rejected.",
            },
            {
              label: "Slippage max",
              desc: "Price deviation hard-capped (e.g., ≤ 30 bps) with enforced minimum output amount.",
            },
            {
              label: "Cooldown period",
              desc: "Minimum interval between high-risk actions prevents rapid-fire exploitation.",
            },
            {
              label: "Permit TTL + nonce",
              desc: "Permits expire (e.g., 60 s) and carry single-use nonces to prevent replay.",
            },
            {
              label: "Domain separation",
              desc: "Each permit is scoped to TruCore ATF + a specific environment. Cross-domain reuse is invalid.",
            },
          ].map((inv) => (
            <Card key={inv.label}>
              <h3 className="text-xl font-bold text-[#e8944a]">{inv.label}</h3>
              <p className="mt-2 text-lg leading-[1.5] text-slate-200">{inv.desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ── Permit Example ── */}
      <Section className="border-t border-white/10 fade-in-up">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-4xl font-bold tracking-tight text-[#f0a050]">
            Permit Example
          </h2>
          <p className="mt-4 text-2xl leading-[1.4] text-slate-200">
            A minimal, illustrative permit payload. Real permits are signed and
            carry additional metadata. No secrets are shown here.
          </p>
        </div>
        <div className="glass-panel mx-auto max-w-2xl overflow-x-auto rounded-xl p-6">
          <pre className="text-sm leading-relaxed text-primary-200 sm:text-base">
            <code>{`{
  "subject": "agent:0xA1B2...C3D4",
  "scope": "swap",
  "constraints": {
    "maxSpend": "500 USDC",
    "slippageBps": 30,
    "minOut": "0.95 SOL"
  },
  "programAllowlist": [
    "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
    "So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo"
  ],
  "chain": "solana:mainnet-beta",
  "expiresAt": "2026-02-19T12:01:00Z",
  "nonce": "a7f3e1c9-...-4b2d",
  "signature": "<Ed25519 signature placeholder>"
}`}</code>
          </pre>
        </div>
      </Section>

      {/* ── Designed For ── */}
      <AtfDesignedFor />

      {/* ── Capabilities ── */}
      <Section id="integrations" className="border-t border-white/10 fade-in-up">
        <div className="mx-auto max-w-5xl space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary-300">Capabilities</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#f0a050] sm:text-4xl">
              Guardrails across every execution path
            </h2>
            <p className="mt-3 text-lg text-slate-300">
              Deterministic enforcement, fail-closed by default. Every decision produces a verifiable receipt.
            </p>
          </div>

          {/* Capability cards */}
          <div className="grid gap-5 sm:grid-cols-2">

            <Tilt maxTilt={5}>
              <Card className="h-full">
                <h3 className="text-xl font-bold text-[#e8944a]">Swap Guardrails</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Pre-flight slippage caps, protocol allowlists, and minimum-out checks on every swap.
                  Jupiter enforced in V1.
                </p>
                <TrackedLink
                  href="/docs/policy-model"
                  eventName="capabilities_swap_click"
                  eventProps={{ location: "capabilities_section" }}
                  className="mt-4 inline-flex text-sm font-semibold text-primary-200 transition-colors hover:text-primary-100"
                >
                  Policy docs &rarr;
                </TrackedLink>
              </Card>
            </Tilt>

            <Tilt maxTilt={5}>
              <Card className="h-full">
                <h3 className="text-xl font-bold text-[#e8944a]">Lending Guardrails</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Collateral limits and risk parameter enforcement for Solend and supported lending
                  protocols. Unauthorized programs are blocked.
                </p>
                <TrackedLink
                  href="/docs/policy-model"
                  eventName="capabilities_lending_click"
                  eventProps={{ location: "capabilities_section" }}
                  className="mt-4 inline-flex text-sm font-semibold text-primary-200 transition-colors hover:text-primary-100"
                >
                  Policy docs &rarr;
                </TrackedLink>
              </Card>
            </Tilt>

            <Tilt maxTilt={5}>
              <Card className="h-full">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-bold text-[#e8944a]">Perps Enforcement: Hyperliquid + Solana Venues</h3>
                  <span className="inline-flex items-center rounded-full border border-amber-400/40 bg-amber-900/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                    Feature-gated
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Adapters implemented. OFF by default. Fail-closed on unknown operations.
                </p>
                <ul className="mt-2 ml-5 list-disc space-y-1 text-sm text-slate-300">
                  <li><strong className="text-slate-200">Hyperliquid</strong> (Perps)</li>
                  <li><strong className="text-slate-200">Drift v2</strong> (Solana Perps)</li>
                  <li><strong className="text-slate-200">Mango v4</strong> (Solana Perps)</li>
                </ul>
                <pre className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 px-3 py-2 text-xs text-slate-300 leading-relaxed">{`ATF_ENABLE_HYPERLIQUID_POLICY=1
ATF_ENABLE_DRIFT_POLICY=1
ATF_ENABLE_MANGO_POLICY=1`}</pre>
                <TrackedLink
                  href="/docs/perps"
                  eventName="capabilities_perps_click"
                  eventProps={{ location: "capabilities_section" }}
                  className="mt-4 inline-flex text-sm font-semibold text-amber-300 transition-colors hover:text-amber-200"
                >
                  Perps enforcement docs &rarr;
                </TrackedLink>
              </Card>
            </Tilt>

            <Tilt maxTilt={5}>
              <Card className="h-full">
                <h3 className="text-xl font-bold text-[#e8944a]">Solana DEX Guardrails</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Slippage caps, allowlists, unverified route deny. Deterministic receipts for every swap decision.
                </p>
                <ul className="mt-2 ml-5 list-disc space-y-1 text-sm text-slate-300">
                  <li><strong className="text-slate-200">Jupiter</strong> (initial DEX path)</li>
                  <li>DEX allowlists and slippage caps</li>
                  <li>Mint allow/deny lists</li>
                </ul>
                <TrackedLink
                  href="/docs/dex-guardrails"
                  eventName="capabilities_dex_click"
                  eventProps={{ location: "capabilities_section" }}
                  className="mt-4 inline-flex text-sm font-semibold text-primary-200 transition-colors hover:text-primary-100"
                >
                  DEX guardrails docs &rarr;
                </TrackedLink>
              </Card>
            </Tilt>

            <Tilt maxTilt={5}>
              <Card className="h-full">
                <h3 className="text-xl font-bold text-[#e8944a]">Deterministic Receipts</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Cryptographic receipts for every policy evaluation, approval, rejection, and
                  settlement event. Tamper-evident and auditable post-trade.
                </p>
                <TrackedLink
                  href="/receipts"
                  eventName="capabilities_receipts_click"
                  eventProps={{ location: "capabilities_section" }}
                  className="mt-4 inline-flex text-sm font-semibold text-primary-200 transition-colors hover:text-primary-100"
                >
                  View example receipts &rarr;
                </TrackedLink>
              </Card>
            </Tilt>

          </div>{/* /capability grid */}

          {/* Perps CLI Quickstart */}
          <div className="rounded-xl border border-amber-400/20 bg-amber-900/10 p-5 space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-amber-300">Perps CLI Quickstart</p>
              <p className="mt-1 text-sm text-slate-400">
                Supported venues: Drift v2 (Solana), Mango v4 (Solana), Hyperliquid
              </p>
            </div>
            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200 leading-relaxed">{`atf perps fixtures
echo '<ExecutionRequest JSON>' | atf perps protect --stdin
echo '<ExecutionRequest JSON>' | atf perps explain --stdin`}</pre>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Enable venue gates</p>
              <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200 leading-relaxed">{`ATF_ENABLE_DRIFT_POLICY=1
ATF_ENABLE_MANGO_POLICY=1
ATF_ENABLE_HYPERLIQUID_POLICY=1`}</pre>
            </div>
            <ul className="ml-5 list-disc space-y-1 text-sm text-slate-300">
              <li>All perps gates are <strong className="text-slate-200">OFF by default</strong>. Must be explicitly enabled per venue.</li>
              <li><strong className="text-slate-200">Fail-closed on unknown operations</strong>. Any perps intent that does not match a known operation type is denied.</li>
            </ul>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <TrackedLink
                href="/docs/live-demo"
                eventName="integrations_perps_demo_click"
                eventProps={{ location: "integrations_section" }}
                className="text-sm font-semibold text-amber-300 transition-colors hover:text-amber-200"
              >
                Live demo &rarr;
              </TrackedLink>
              <TrackedLink
                href="/docs/perps"
                eventName="integrations_perps_docs_click"
                eventProps={{ location: "integrations_section" }}
                className="text-sm font-semibold text-amber-300 transition-colors hover:text-amber-200"
              >
                Perps enforcement docs &rarr;
              </TrackedLink>
            </div>
          </div>

          {/* DEX Guardrails Quickstart */}
          <div className="rounded-xl border border-primary-400/20 bg-primary-900/10 p-5 space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary-300">DEX Guardrails</p>
              <p className="mt-1 text-sm text-slate-400">
                Slippage caps, allowlists, unverified route deny. Deterministic receipts for every swap.
              </p>
            </div>
            <ul className="ml-5 list-disc space-y-1 text-sm text-slate-300">
              <li><strong className="text-slate-200">Jupiter</strong> enforced as the initial DEX path.</li>
              <li>DEX allowlists limit which venues can execute swaps.</li>
              <li>Slippage caps are checked pre-flight and enforced at settlement.</li>
              <li>Mint allow/deny lists prevent interaction with unverified tokens.</li>
            </ul>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <TrackedLink
                href="/docs/dex-guardrails"
                eventName="integrations_dex_docs_click"
                eventProps={{ location: "integrations_section" }}
                className="text-sm font-semibold text-primary-200 transition-colors hover:text-primary-100"
              >
                DEX guardrails docs &rarr;
              </TrackedLink>
            </div>
          </div>

          {/* Getting started */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary-300">Getting Started</p>
            <p className="mt-2 text-sm text-slate-400">
              Pick a quickstart, explore the CLI, or jump into the policy model.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              <TrackedLink
                href="/docs/5-minute-quickstart"
                eventName="integrations_quickstart_click"
                eventProps={{ location: "integrations_section" }}
                className="text-sm font-semibold text-primary-200 transition-colors hover:text-primary-100"
              >
                Quickstart &rarr;
              </TrackedLink>
              <TrackedLink
                href="/docs/cli"
                eventName="integrations_cli_click"
                eventProps={{ location: "integrations_section" }}
                className="text-sm font-semibold text-primary-200 transition-colors hover:text-primary-100"
              >
                CLI reference &rarr;
              </TrackedLink>
              <TrackedLink
                href="/docs/perps"
                eventName="integrations_perps_docs_click"
                eventProps={{ location: "integrations_section" }}
                className="text-sm font-semibold text-primary-200 transition-colors hover:text-primary-100"
              >
                Perps enforcement &rarr;
              </TrackedLink>
              <TrackedLink
                href="/docs/dex-guardrails"
                eventName="integrations_dex_docs_click"
                eventProps={{ location: "integrations_section" }}
                className="text-sm font-semibold text-primary-200 transition-colors hover:text-primary-100"
              >
                DEX guardrails &rarr;
              </TrackedLink>
            </div>
          </div>

        </div>
      </Section>

      {/* ── V1 Scope ── */}
      <AtfV1Scope />

      {/* ── Production Readiness ── */}
      <AtfReadiness />

      {/* ── Why Now ── */}
      <div id="why-trucore">
        <WhyNowSection />
      </div>

      {/* ── Deterministic Enforcement Proof ── */}
      <div id="verify">
        <EnforcementProofSection />
      </div>

      <Section className="pt-0 fade-in-up">
        <div className="mx-auto max-w-3xl">
          <RiskBoundaryBlock />
        </div>
      </Section>

      <Section className="pt-0 fade-in-up">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
          <TrackedLink
            href="/receipts"
            eventName="enforcement_proof_receipts_click"
            eventProps={{ location: "atf_page" }}
            className="inline-flex items-center justify-center rounded-xl border border-primary-300/40 bg-primary-500/15 px-7 py-4 text-lg font-semibold text-primary-100 transition-colors hover:bg-primary-500/25"
          >
            View Example Receipts
          </TrackedLink>
          <TrackedLink
            href="/demo-policy"
            eventName="demo_policy_link_click"
            eventProps={{ location: "atf_page", section: "enforcement_proof" }}
            className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-7 py-4 text-lg font-semibold text-slate-100 transition-colors hover:bg-white/10"
          >
            View Demo Policy
          </TrackedLink>
          </div>
          <TrackedLink
            href="/docs/anchoring-roadmap"
            eventName="anchoring_roadmap_click"
            eventProps={{ location: "atf_page", section: "enforcement_proof" }}
            className="inline-flex text-sm font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            Read Anchoring &amp; Execution Roadmap
          </TrackedLink>
        </div>
      </Section>

      {/* ── Evidence & Operational Signals ── */}
      <EvidenceMetricsSection />

      {/* ── ATF Comparison ── */}
      <AtfComparison />

      {/* ── Positioning ── */}
      <Section className="border-t border-white/10 fade-in-up">
        <div className="mx-auto max-w-4xl rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-3xl font-bold tracking-tight text-[#f0a050] sm:text-4xl">
            Why Not Just an API Gateway?
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Card className="h-full">
              <h3 className="text-2xl font-bold text-[#e8944a]">API Gateway</h3>
              <ul className="mt-3 space-y-2 text-lg leading-[1.5] text-slate-200">
                <li>Routes requests</li>
                <li>Authenticates identity</li>
                <li>Does not enforce economic invariants</li>
              </ul>
            </Card>
            <Card className="h-full">
              <h3 className="text-2xl font-bold text-[#e8944a]">ATF</h3>
              <ul className="mt-3 space-y-2 text-lg leading-[1.5] text-slate-200">
                <li>Evaluates capital constraints</li>
                <li>Enforces deterministic policy</li>
                <li>Produces verifiable receipts</li>
              </ul>
            </Card>
          </div>
          <TrackedLink
            href="/docs/atf-architecture"
            eventName="atf_positioning_docs_click"
            eventProps={{ location: "atf_positioning_section" }}
            className="mt-5 inline-flex text-base font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            Read the ATF architecture rationale
          </TrackedLink>
        </div>
      </Section>

      {/* ── Public Usage Snapshot ── */}
      <PublicUsageSnapshot />

      {/* ── Security Commitments ── */}
      <SecurityCommitments />

      {/* ── Builder Path ── */}
      <Section className="border-t border-white/10 fade-in-up">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-xl border border-white/10 bg-neutral-900/40 p-6">
          <p className="text-lg font-medium text-slate-200">Building an agent? Start with the docs.</p>
          <TrackedLink
            href="/docs"
            eventName="builder_docs_click"
            eventProps={{ location: "atf_page", target: "docs" }}
            className="text-lg font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            Start with docs &rarr;
          </TrackedLink>
        </div>
      </Section>

      {/* ── Build With ATF ── */}
      <Section className="border-t border-white/10 fade-in-up">
        <div className="mx-auto max-w-3xl rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-3xl font-bold tracking-tight text-[#f0a050] sm:text-4xl">Build With ATF</h2>
          <p className="mt-4 text-xl leading-[1.5] text-slate-200">
            ATF is designed as an enforcement layer for AI agents and DeFi systems. Explore
            integration patterns and policy examples.
          </p>
          <TrackedLink
            href="/build-with-atf"
            eventName="build_with_atf_click"
            eventProps={{ location: "atf_page" }}
            className="mt-5 inline-flex items-center justify-center rounded-xl border border-primary-300/40 bg-primary-500/15 px-6 py-3 text-lg font-semibold text-primary-100 transition-colors hover:bg-primary-500/25"
          >
            Build With ATF &rarr;
          </TrackedLink>
          <TrackedLink
            href="/pilot/ecommerce"
            eventName="ecommerce_pilot_link_click"
            eventProps={{ location: "atf_page", target: "pilot_ecommerce" }}
            className="ml-0 mt-4 inline-flex items-center justify-center text-lg font-semibold text-primary-200 transition-colors hover:text-primary-100 sm:ml-4 sm:mt-5"
          >
            See E-Commerce Pilot &rarr;
          </TrackedLink>
        </div>
      </Section>

      {/* ── Roadmap ── */}
      <AtfRoadmap />

      {/* Roadmap deep-link */}
      <Section className="fade-in-up">
        <TrackedLink
          href="/atf/roadmap"
          eventName="roadmap_view_click"
          eventProps={{ location: "atf_page" }}
          className="inline-flex items-center justify-center rounded-xl border border-primary-300/40 bg-primary-500/15 px-7 py-4 text-xl font-semibold text-primary-100 transition-colors hover:bg-primary-500/25"
        >
          View Full Roadmap &rarr;
        </TrackedLink>
      </Section>

      {/* ── Transparency Metrics ── */}
      <TransparencyMetrics />

      {/* ── Enterprise Procurement Ready ── */}
      <Section className="border-t border-white/10 fade-in-up">
        <div className="mx-auto max-w-3xl rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-3xl font-bold tracking-tight text-[#f0a050] sm:text-4xl">
            Enterprise Procurement Ready
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-lg leading-[1.5] text-slate-200">
            <li>Deterministic enforcement logs</li>
            <li>Explicit policy documentation</li>
            <li>Public security posture</li>
            <li>Versioned release discipline</li>
          </ul>
          <TrackedLink
            href="/security/compliance"
            eventName="enterprise_procurement_click"
            eventProps={{ location: "atf_page" }}
            className="mt-5 inline-flex items-center justify-center rounded-xl border border-primary-300/40 bg-primary-500/15 px-6 py-3 text-lg font-semibold text-primary-100 transition-colors hover:bg-primary-500/25"
          >
            View Compliance Alignment &rarr;
          </TrackedLink>
        </div>
      </Section>

      {/* ── Built for the Long Term ── */}
      <Section className="border-t border-white/10 fade-in-up">
        <div className="mx-auto max-w-3xl rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-3xl font-bold tracking-tight text-[#f0a050] sm:text-4xl">
            Built for the Long Term
          </h2>
          <p className="mt-4 text-xl leading-[1.5] text-slate-200">
            ATF is designed as durable enforcement infrastructure, not a short-term product
            experiment.
          </p>
          <TrackedLink
            href="/direction"
            eventName="long_term_signal_click"
            eventProps={{ location: "atf_page", target: "direction" }}
            className="mt-5 inline-flex items-center justify-center rounded-xl border border-primary-300/40 bg-primary-500/15 px-6 py-3 text-lg font-semibold text-primary-100 transition-colors hover:bg-primary-500/25"
          >
            View Long-Term Direction &rarr;
          </TrackedLink>
        </div>
      </Section>

      {/* ── Design Partner CTA ── */}
      <Section className="border-t border-white/10 fade-in-up">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">ATF Release Discipline</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-mono text-slate-300">
            <span>{atfVersion ? `Current version ${atfVersion}` : "See release notes"}</span>
            <span className="text-slate-500">•</span>
            <a
              href="https://github.com/trucore-ai/TruCore-site/blob/main/RELEASE.md"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-primary-100"
            >
              RELEASE.md
            </a>
            <span className="text-slate-500">•</span>
            <a href="/status" className="transition-colors hover:text-primary-100">
              /status
            </a>
            <span className="text-slate-500">•</span>
            <a href="/security/overview" className="transition-colors hover:text-primary-100">
              /security/overview
            </a>
          </div>
          <p className="mt-3 text-sm text-slate-400">
            Built with explicit versioning, CI enforcement, and production smoke checks.
          </p>
        </div>
      </Section>

      {/* ── Waitlist / Design Partner CTA ── */}
      <div id="waitlist">
        <AtfDesignPartnerCta />
      </div>

      {/* ── Moat Signals ── */}
      <MoatSignalStrip />
    </Container>
  );
}

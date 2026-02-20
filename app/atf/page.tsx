import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { AtfDesignedFor } from "@/components/atf-designed-for";
import { AtfV1Scope } from "@/components/atf-v1-scope";
import { AtfRoadmap } from "@/components/atf-roadmap";
import { AtfReadiness } from "@/components/atf-readiness";
import { AtfDesignPartnerCta } from "@/components/atf-design-partner-cta";
import { TransparencyMetrics } from "@/components/transparency-metrics";
import { TrackedLink } from "@/components/tracked-link";
import { Tilt } from "@/components/ui/tilt";

export const metadata: Metadata = {
  title: "Agent Transaction Firewall (ATF)",
  description:
    "ATF is TruCore\u2019s flagship enforcement layer: deterministic policy checks, slippage constraints, protocol allowlists, and cryptographic receipts for every AI-agent transaction.",
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

export default function ATFPage() {
  return (
    <Container>
      {/* ── Hero ── */}
      <Section className="fade-in-up">
        <div className="max-w-3xl">
          <Badge className="mb-4">Flagship Product</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-6xl lg:text-7xl">
            Agent Transaction Firewall
          </h1>
          <p className="mt-5 text-2xl leading-[1.4] text-slate-200 sm:text-3xl">
            A policy + permit layer that constrains what AI agents can do on
            Solana before any transaction executes.
          </p>

          {/* Instant comprehension strip */}
          <ul className="mt-6 space-y-2 text-lg text-slate-300 sm:text-xl">
            <li className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-400" />
              Prevents unbounded execution
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-400" />
              Enforces spend limits, allowlists, and slippage bounds
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-400" />
              Emits verifiable receipts for every action
            </li>
          </ul>

          {/* V1 scope pills */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Badge>V1: Solana</Badge>
            <Badge>Jupiter (swaps)</Badge>
            <Badge>Solend (lending)</Badge>
          </div>

          {/* Visual proof badges */}
          <div className="mt-5 flex flex-wrap gap-2">
            {["V1: Solana", "Jupiter-ready", "Permit model", "Audit logging"].map((label) => (
              <span
                key={label}
                className="inline-flex items-center rounded-full border border-white/10 bg-neutral-800/60 px-3 py-1 text-xs font-medium text-slate-400"
              >
                {label}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap gap-4">
            <TrackedLink
              href="/atf/apply"
              eventName="design_partner_apply_click"
              eventProps={{ location: "atf_hero" }}
              className="inline-flex items-center justify-center rounded-xl px-7 py-4 text-xl font-semibold transition-colors bg-accent-500 text-neutral-950 hover:bg-accent-400"
            >
              Apply as Design Partner
            </TrackedLink>
            <TrackedLink
              href="/atf/how-it-works"
              eventName="cta_click"
              eventProps={{ target: "how_it_works", location: "atf_hero" }}
              className="inline-flex items-center justify-center rounded-xl border border-primary-300/40 bg-primary-500/15 px-7 py-4 text-xl font-semibold text-primary-100 transition-colors hover:bg-primary-500/25"
            >
              How It Works &rarr;
            </TrackedLink>
            <TrackedLink
              href="/atf/primer"
              eventName="primer_view_click"
              eventProps={{ location: "atf_page" }}
              className="inline-flex items-center justify-center rounded-xl border border-primary-300/40 bg-primary-500/15 px-7 py-4 text-xl font-semibold text-primary-100 transition-colors hover:bg-primary-500/25"
            >
              Read the Primer
            </TrackedLink>
            <TrackedLink
              href="/docs"
              eventName="docs_view_click"
              eventProps={{ location: "atf_page", target: "docs" }}
              className="inline-flex items-center justify-center rounded-xl border border-primary-300/40 bg-primary-500/15 px-7 py-4 text-xl font-semibold text-primary-100 transition-colors hover:bg-primary-500/25"
            >
              Docs
            </TrackedLink>
            <TrackedLink
              href="/atf/whitepaper"
              eventName="whitepaper_view_click"
              eventProps={{ location: "atf_page" }}
              className="inline-flex items-center justify-center rounded-xl border border-primary-300/40 bg-primary-500/15 px-7 py-4 text-xl font-semibold text-primary-100 transition-colors hover:bg-primary-500/25"
            >
              Whitepaper (Preview)
            </TrackedLink>
          </div>
        </div>
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
        <div className="mx-auto max-w-5xl overflow-x-auto rounded-xl border border-white/10 bg-neutral-900/60 p-6 sm:p-10">
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
        <div className="mx-auto max-w-2xl overflow-x-auto rounded-xl border border-white/10 bg-neutral-900/80 p-6">
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

      {/* ── V1 Scope ── */}
      <AtfV1Scope />

      {/* ── Production Readiness ── */}
      <AtfReadiness />

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

      {/* ── Design Partner CTA ── */}
      <AtfDesignPartnerCta />
    </Container>
  );
}

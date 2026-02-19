import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Agent Transaction Firewall (ATF)",
  description:
    "ATF is TruCore\u2019s flagship enforcement layer \u2014 deterministic policy checks, slippage constraints, protocol allowlists, and cryptographic receipts for every AI-agent transaction.",
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
      {/* ── Header ── */}
      <Section className="fade-in-up">
        <div className="max-w-3xl">
          <Badge className="mb-4">Flagship Product</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-6xl lg:text-7xl">
            Agent Transaction Firewall
          </h1>
          <p className="mt-5 text-2xl leading-[1.4] text-slate-200 sm:text-3xl">
            The enforcement layer between AI agents and on-chain execution.
            ATF applies deterministic policy checks to every transaction before
            submission — protecting capital, constraining behavior, and producing
            verifiable evidence of compliance.
          </p>
        </div>
      </Section>

      {/* ── Problem Statement ── */}
      <Section className="border-t border-white/10 fade-in-up fade-delay-1">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-4xl font-bold tracking-tight text-[#f0a050]">The Problem</h2>
          <p className="mt-4 text-2xl leading-[1.4] text-slate-200">
            Autonomous AI agents are executing financial transactions with
            increasing frequency and complexity. Current infrastructure assumes
            human oversight at critical decision points — an assumption that
            breaks down when agents operate independently at machine speed.
          </p>
          <p className="mt-4 text-2xl leading-[1.4] text-slate-200">
            Without an enforcement boundary, agents can exceed authorized
            parameters, interact with unapproved protocols, and produce no
            auditable record of their behavior. The result is uncontrolled
            capital exposure and zero accountability.
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
            <Card key={layer.label} className="border-primary-300/25 bg-primary-500/10">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-primary-300/40 text-sm font-bold text-primary-100">
                {i + 1}
              </div>
              <h3 className="text-2xl font-bold text-[#e8944a]">{layer.label}</h3>
              <p className="mt-2 text-xl leading-[1.5] text-slate-200">{layer.description}</p>
            </Card>
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
        <div className="mx-auto max-w-3xl overflow-x-auto rounded-xl border border-white/10 bg-neutral-900/60 p-6 sm:p-8">
          <svg
            viewBox="0 0 680 520"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
            role="img"
            aria-label="ATF architecture diagram showing four layers: Policy Engine, Permit Gateway, Execution Validator, and Receipt Ledger"
          >
            {/* Background subtle grid */}
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
            <rect x="250" y="12" width="180" height="48" rx="8" fill="#162236" stroke="#8ed3ff" strokeWidth="1.5" />
            <text x="340" y="42" textAnchor="middle" fill="#8ed3ff" fontSize="16" fontWeight="600" fontFamily="system-ui, sans-serif">
              AI Agent
            </text>

            {/* Arrow down */}
            <line x1="340" y1="60" x2="340" y2="98" stroke="#5cbcfb" strokeWidth="1.5" strokeDasharray="4 3" />
            <polygon points="334,94 340,104 346,94" fill="#5cbcfb" />

            {/* Layer 1: Policy Engine */}
            <rect x="90" y="106" width="500" height="68" rx="10" fill="url(#blueGlow)" stroke="#349de8" strokeWidth="1.5" />
            <text x="340" y="134" textAnchor="middle" fill="#8ed3ff" fontSize="17" fontWeight="700" fontFamily="system-ui, sans-serif">
              Policy Engine
            </text>
            <text x="340" y="158" textAnchor="middle" fill="#94a3b8" fontSize="13" fontFamily="system-ui, sans-serif">
              Evaluates intent against policy + threat model
            </text>

            {/* Arrow */}
            <line x1="340" y1="174" x2="340" y2="204" stroke="#5cbcfb" strokeWidth="1.5" strokeDasharray="4 3" />
            <polygon points="334,200 340,210 346,200" fill="#5cbcfb" />

            {/* Layer 2: Permit Gateway */}
            <rect x="90" y="212" width="500" height="68" rx="10" fill="url(#blueGlow)" stroke="#349de8" strokeWidth="1.5" />
            <text x="340" y="240" textAnchor="middle" fill="#8ed3ff" fontSize="17" fontWeight="700" fontFamily="system-ui, sans-serif">
              Permit Gateway
            </text>
            <text x="340" y="264" textAnchor="middle" fill="#94a3b8" fontSize="13" fontFamily="system-ui, sans-serif">
              Scoped authorization — TTL, nonce, domain separation
            </text>

            {/* Arrow */}
            <line x1="340" y1="280" x2="340" y2="310" stroke="#5cbcfb" strokeWidth="1.5" strokeDasharray="4 3" />
            <polygon points="334,306 340,316 346,306" fill="#5cbcfb" />

            {/* Layer 3: Execution Validator */}
            <rect x="90" y="318" width="500" height="68" rx="10" fill="url(#orangeGlow)" stroke="#f08a1f" strokeWidth="1.2" />
            <text x="340" y="346" textAnchor="middle" fill="#f0a050" fontSize="17" fontWeight="700" fontFamily="system-ui, sans-serif">
              Execution Validator
            </text>
            <text x="340" y="370" textAnchor="middle" fill="#94a3b8" fontSize="13" fontFamily="system-ui, sans-serif">
              Allowlists, slippage bounds, spend caps, simulation
            </text>

            {/* Arrow */}
            <line x1="340" y1="386" x2="340" y2="416" stroke="#5cbcfb" strokeWidth="1.5" strokeDasharray="4 3" />
            <polygon points="334,412 340,422 346,412" fill="#5cbcfb" />

            {/* Layer 4: Receipt Ledger */}
            <rect x="90" y="424" width="500" height="68" rx="10" fill="url(#blueGlow)" stroke="#349de8" strokeWidth="1.5" />
            <text x="340" y="452" textAnchor="middle" fill="#8ed3ff" fontSize="17" fontWeight="700" fontFamily="system-ui, sans-serif">
              Receipt Ledger
            </text>
            <text x="340" y="476" textAnchor="middle" fill="#94a3b8" fontSize="13" fontFamily="system-ui, sans-serif">
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
              desc: "A cryptographic receipt is generated — hashes, policy ID, outcome — and stored.",
            },
          ].map((item) => (
            <li key={item.step}>
              <Card className="h-full border-primary-300/25 bg-primary-500/10">
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary-300/40 text-sm font-bold text-primary-100">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-[#e8944a]">{item.title}</h3>
                <p className="mt-2 text-base leading-[1.5] text-slate-200">{item.desc}</p>
              </Card>
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
            <Card key={inv.label} className="border-primary-300/25 bg-primary-500/10">
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
            carry additional metadata — no secrets are shown here.
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

      {/* ── CTA ── */}
      <Section className="border-t border-white/10 fade-in-up">
        <Card className="bg-accent-500/10 border-accent-500/30 p-8 sm:p-10">
          <h2 className="text-4xl font-bold text-accent-300">Join Early Builders</h2>
          <p className="mt-4 max-w-2xl text-2xl leading-[1.4] text-slate-100">
            Request early access to ATF and help shape the enforcement layer for
            autonomous finance.
          </p>
          <div className="mt-6">
            <Button href="/#waitlist" variant="primary">
              Request Early Access
            </Button>
          </div>
        </Card>
      </Section>
    </Container>
  );
}

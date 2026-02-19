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

      {/* ── CTA ── */}
      <Section className="border-t border-white/10 fade-in-up fade-delay-4">
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

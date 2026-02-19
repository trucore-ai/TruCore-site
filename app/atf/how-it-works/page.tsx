import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { AtfLifecycleDiagram } from "@/components/atf-lifecycle-diagram";
import { AtfDesignPartnerCta } from "@/components/atf-design-partner-cta";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How ATF Works",
  description:
    "Deep technical breakdown of the Agent Transaction Firewall: execution lifecycle, policy engine internals, enforcement model, and threat mitigation.",
};

const policyInternals = [
  {
    label: "Deterministic rule evaluation",
    desc: "Every policy rule produces the same output for the same input. No probabilistic logic, no model inference in the critical path.",
  },
  {
    label: "Capability-scoped permits",
    desc: "Permits grant the minimum set of capabilities required for a single operation. Scope cannot be widened after issuance.",
  },
  {
    label: "TTL and nonce enforcement",
    desc: "Every permit carries a time-to-live and a single-use nonce. Expired or replayed permits are rejected automatically.",
  },
  {
    label: "Domain separation",
    desc: "Permits are scoped to a specific domain (TruCore ATF + environment). Cross-domain reuse is structurally invalid.",
  },
  {
    label: "Replay protection",
    desc: "Nonce tracking combined with domain separation ensures no permit can be submitted more than once, across any context.",
  },
];

const enforcementModel = [
  {
    label: "Fail-closed default",
    desc: "If a policy rule cannot be evaluated, or if any check is ambiguous, the transaction is blocked. Silence is a denial.",
  },
  {
    label: "Explicit allowlists",
    desc: "Only pre-approved program IDs, token mints, and protocol endpoints are reachable. Everything else is rejected by default.",
  },
  {
    label: "Hard invariants vs soft guidance",
    desc: "Hard invariants (spend caps, TTLs, protocol allowlists) cannot be overridden. Soft guidance (warnings, telemetry) is informational only.",
  },
  {
    label: "No agent-side self-approval",
    desc: "Agents cannot issue, extend, or modify their own permits. Approval authority is external to the agent runtime.",
  },
];

const threatMatrix = [
  {
    threat: "Unbounded execution",
    mitigation: "Permit TTL + scoped capabilities",
  },
  {
    threat: "Slippage exploitation",
    mitigation: "Execution validator with hard slippage bounds",
  },
  {
    threat: "Protocol drift",
    mitigation: "Allowlist registry restricting reachable programs",
  },
  {
    threat: "Replay attack",
    mitigation: "Nonce + domain separation on every permit",
  },
  {
    threat: "Audit opacity",
    mitigation: "Tamper-evident cryptographic receipts",
  },
];

export default function HowItWorksPage() {
  return (
    <Container>
      {/* ── Header ── */}
      <Section className="fade-in-up">
        <div className="max-w-3xl">
          <Link
            href="/atf"
            className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-primary-300 hover:text-primary-200 transition-colors"
          >
            &larr; Back to ATF
          </Link>
          <Badge className="mb-4 block w-fit">Technical Deep Dive</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-6xl">
            How ATF Works
          </h1>
          <p className="mt-5 text-2xl leading-[1.4] text-slate-200 sm:text-3xl">
            A step-by-step breakdown of the execution lifecycle, policy engine
            internals, enforcement model, and threat mitigations that make ATF
            a deterministic trust boundary for autonomous agents.
          </p>
        </div>
      </Section>

      {/* ── A) Execution Lifecycle ── */}
      <Section className="border-t border-white/10 fade-in-up fade-delay-1">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-4xl font-bold tracking-tight text-[#f0a050]">
            Execution Lifecycle
          </h2>
          <p className="mt-4 text-2xl leading-[1.4] text-slate-200">
            Every agent transaction follows six deterministic steps from intent
            to verifiable receipt. No step can be skipped or reordered.
          </p>
        </div>

        <AtfLifecycleDiagram />

        {/* Step details */}
        <ol className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              step: 1,
              title: "Intent Creation",
              desc: "The agent declares what it wants to do (swap, lend, withdraw). This is a structured intent object, not a raw transaction.",
            },
            {
              step: 2,
              title: "Policy Evaluation",
              desc: "The Policy Engine evaluates the intent against all active rules: allowlists, rate limits, spend caps, and time-of-day constraints.",
            },
            {
              step: 3,
              title: "Permit Issuance",
              desc: "If the policy evaluation passes, a scoped, TTL-bound permit is issued with a single-use nonce and minimum required capabilities.",
            },
            {
              step: 4,
              title: "Transaction Construction",
              desc: "The transaction is built within the boundaries of the permit. Parameters that violate permit constraints are rejected before signing.",
            },
            {
              step: 5,
              title: "Execution Validation",
              desc: "Pre-flight simulation verifies slippage bounds, protocol allowlists, and output constraints. The transaction is fail-closed if any check fails.",
            },
            {
              step: 6,
              title: "Receipt Anchoring",
              desc: "A cryptographic receipt captures the policy evaluation, permit details, execution outcome, and settlement data for tamper-evident audit.",
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

      {/* ── B) Policy Engine Internals ── */}
      <Section className="border-t border-white/10 fade-in-up fade-delay-2">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-4xl font-bold tracking-tight text-[#f0a050]">
            Policy Engine Internals
          </h2>
          <p className="mt-4 text-2xl leading-[1.4] text-slate-200">
            The policy engine is the first enforcement boundary. It evaluates
            every intent against a deterministic rule set with zero
            probabilistic logic.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {policyInternals.map((p) => (
            <Card key={p.label} className="border-primary-300/25 bg-primary-500/10">
              <h3 className="text-xl font-bold text-[#e8944a]">{p.label}</h3>
              <p className="mt-2 text-lg leading-[1.5] text-slate-200">{p.desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ── C) Enforcement Model ── */}
      <Section className="border-t border-white/10 fade-in-up fade-delay-3">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-4xl font-bold tracking-tight text-[#f0a050]">
            Enforcement Model
          </h2>
          <p className="mt-4 text-2xl leading-[1.4] text-slate-200">
            ATF enforces a strict security posture. Every default is deny. Every
            exception is explicit. Every override is impossible at the agent
            layer.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {enforcementModel.map((e) => (
            <Card key={e.label} className="border-primary-300/25 bg-primary-500/10">
              <h3 className="text-xl font-bold text-[#e8944a]">{e.label}</h3>
              <p className="mt-2 text-lg leading-[1.5] text-slate-200">{e.desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ── D) Threat Mitigation Matrix ── */}
      <Section className="border-t border-white/10 fade-in-up fade-delay-4">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-4xl font-bold tracking-tight text-[#f0a050]">
            Threat Mitigation Matrix
          </h2>
          <p className="mt-4 text-2xl leading-[1.4] text-slate-200">
            Each threat vector maps to a specific enforcement layer within the
            ATF pipeline.
          </p>
        </div>
        <div className="mx-auto max-w-3xl overflow-x-auto rounded-xl border border-white/10 bg-neutral-900/60">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-primary-300">
                  Threat
                </th>
                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-primary-300">
                  Mitigation Layer
                </th>
              </tr>
            </thead>
            <tbody>
              {threatMatrix.map((row) => (
                <tr key={row.threat} className="border-b border-white/5">
                  <td className="px-6 py-4 text-lg font-semibold text-[#e8944a]">
                    {row.threat}
                  </td>
                  <td className="px-6 py-4 text-lg text-slate-200">
                    {row.mitigation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── CTA ── */}
      <AtfDesignPartnerCta location="atf_how_it_works" />
    </Container>
  );
}

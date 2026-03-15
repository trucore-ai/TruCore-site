import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "How ATF Works",
  description:
    "Architecture overview of the Agent Transaction Firewall — how ATF evaluates transaction intents, enforces policies, and produces verifiable execution receipts.",
};

const FLOW_STEPS = [
  { label: "Agent / Bot", note: "Initiates a transaction intent" },
  { label: "Build transaction intent", note: "Constructs the unsigned payload" },
  { label: "ATF protect endpoint", note: "Submits intent for policy evaluation" },
  { label: "Policy evaluation", note: "Rules engine checks against active policies" },
  { label: "Approved transaction", note: "Transaction proceeds only if all policies pass" },
  { label: "Execution receipt", note: "Deterministic receipt is generated and stored" },
  { label: "Verification", note: "Receipt can be independently verified" },
] as const;

export default function HowItWorksPage() {
  return (
    <Container>
      {/* ── Hero ── */}
      <Section id="hero" className="fade-in-up">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary-200">
            Architecture
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
            How ATF Works
          </h1>
          <p className="mt-6 text-xl leading-[1.6] text-slate-200">
            The Agent Transaction Firewall sits between an autonomous agent and
            the network. Every transaction intent is evaluated against
            configurable policies before execution, and every outcome produces a
            verifiable receipt.
          </p>
        </div>
      </Section>

      {/* ── Architecture Diagram ── */}
      <Section id="architecture" divider className="fade-in-up fade-delay-1">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            Execution Flow
          </h2>
          <p className="mt-4 text-lg leading-[1.5] text-slate-200">
            A transaction moves through the following stages before it reaches
            the network.
          </p>

          <ol className="relative mt-8 space-y-0 border-l-2 border-primary-200/30 pl-8">
            {FLOW_STEPS.map((step, i) => (
              <li key={step.label} className="relative pb-8 last:pb-0">
                {/* connector dot */}
                <span
                  className="absolute -left-[calc(2rem+5px)] top-1 h-3 w-3 rounded-full bg-primary-200"
                  aria-hidden="true"
                />
                <p className="text-lg font-semibold text-slate-100">
                  <span className="mr-2 font-mono text-sm text-primary-200">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {step.label}
                </p>
                <p className="mt-1 text-base text-slate-400">{step.note}</p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* ── Intent Protection ── */}
      <Section id="intent-protection" divider className="fade-in-up fade-delay-2">
        <div className="mx-auto max-w-3xl">
          <Card>
            <h2 className="text-3xl font-bold text-accent-300">
              Intent Protection
            </h2>
            <p className="mt-4 text-lg leading-[1.5] text-slate-300">
              Agents submit a structured transaction intent — not a raw signed
              transaction. ATF validates the intent before any signing occurs,
              meaning malformed or policy-violating transactions never reach the
              network. The protect endpoint accepts the intent, evaluates it, and
              returns an approval or rejection with a deterministic reason code.
            </p>
          </Card>
        </div>
      </Section>

      {/* ── Policy Evaluation ── */}
      <Section id="policy-evaluation" divider className="fade-in-up fade-delay-3">
        <div className="mx-auto max-w-3xl">
          <Card>
            <h2 className="text-3xl font-bold text-accent-300">
              Policy Evaluation
            </h2>
            <p className="mt-4 text-lg leading-[1.5] text-slate-300">
              Policies are declarative YAML rules that define what an agent is
              allowed to do. The evaluation engine checks every intent against
              active policies in sequence. Policies can enforce constraints on
              token allowlists, slippage bounds, maximum notional value, target
              programs, and more. Evaluation is deterministic — the same intent
              and policy set always produce the same result.
            </p>
          </Card>
        </div>
      </Section>

      {/* ── Execution Receipts ── */}
      <Section id="execution-receipts" divider className="fade-in-up fade-delay-4">
        <div className="mx-auto max-w-3xl">
          <Card>
            <h2 className="text-3xl font-bold text-accent-300">
              Execution Receipts
            </h2>
            <p className="mt-4 text-lg leading-[1.5] text-slate-300">
              Every evaluated transaction — approved or rejected — produces an
              execution receipt. Receipts include the original intent, the policy
              version that was applied, the evaluation result, and a SHA-256
              content hash. Receipts are immutable once generated and can be
              stored, exported, or anchored on-chain for long-term auditability.
            </p>
          </Card>
        </div>
      </Section>

      {/* ── Verification ── */}
      <Section id="verification" divider className="fade-in-up fade-delay-5">
        <div className="mx-auto max-w-3xl">
          <Card>
            <h2 className="text-3xl font-bold text-accent-300">
              Verification
            </h2>
            <p className="mt-4 text-lg leading-[1.5] text-slate-300">
              Any party with access to a receipt can independently verify it.
              Verification recomputes the content hash from the receipt payload
              and compares it against the stored hash. If the hashes match, the
              receipt has not been tampered with. This provides a zero-trust
              verification model that does not depend on the ATF service being
              online at verification time.
            </p>
          </Card>
        </div>
      </Section>

      {/* ── Related Resources ── */}
      <Section id="resources" divider className="fade-in-up fade-delay-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-100">
            Related Resources
          </h2>
          <ul className="mt-6 space-y-3 text-lg">
            <li>
              <Link
                href="/docs/first-protected-trade"
                className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
              >
                First Protected Trade Guide &rarr;
              </Link>
            </li>
            <li>
              <Link
                href="/examples/protected-swap"
                className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
              >
                Protected Swap Example &rarr;
              </Link>
            </li>
            <li>
              <Link
                href="/integrations/bot"
                className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
              >
                Bot Integration Guide &rarr;
              </Link>
            </li>
            <li>
              <Link
                href="/quickstart"
                className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
              >
                Quickstart &rarr;
              </Link>
              <span className="text-base text-slate-400">
                {" "}— copy-paste a protected transaction in under 60 seconds
              </span>
            </li>
          </ul>
        </div>
      </Section>
    </Container>
  );
}

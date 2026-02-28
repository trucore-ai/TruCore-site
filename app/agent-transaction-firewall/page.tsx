import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "What Is an Agent Transaction Firewall?",
  description:
    "Canonical definition of agent transaction firewall, including core components, architecture, and differences from API gateways and WAFs.",
};

export default function AgentTransactionFirewallPage() {
  return (
    <Container>
      <Section className="fade-in-up">
        <div className="max-w-4xl space-y-5">
          <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-6xl">
            What Is an Agent Transaction Firewall?
          </h1>
          <p className="text-xl leading-[1.55] text-slate-200 sm:text-2xl">
            An Agent Transaction Firewall (ATF) is a permit-based enforcement layer that evaluates
            AI-initiated financial actions against deterministic policy before execution and
            generates tamper-evident receipts.
          </p>
        </div>
      </Section>

      <Section className="border-t border-white/10 fade-in-up">
        <div className="max-w-4xl space-y-4">
          <h2 className="text-3xl font-bold tracking-tight text-[#f0a050]">Definition</h2>
          <p className="text-lg leading-relaxed text-slate-200">
            The term <strong>Agent Transaction Firewall</strong> describes a deterministic control
            boundary that sits between an autonomous agent and protocol execution. The system does
            not trust model intent by default, it validates intent against explicit policy and
            permit constraints before any capital movement is allowed.
          </p>
        </div>
      </Section>

      <Section className="border-t border-white/10 fade-in-up">
        <div className="max-w-4xl space-y-4">
          <h2 className="text-3xl font-bold tracking-tight text-[#f0a050]">Why It Exists</h2>
          <ul className="space-y-3 text-lg leading-relaxed text-slate-200">
            <li>AI agents can initiate capital movement without human approval at execution time.</li>
            <li>Traditional authentication proves identity, but it does not enforce transaction safety.</li>
            <li>Policy decisions must be evaluated pre-execution, not after settlement.</li>
          </ul>
          <p className="text-lg leading-relaxed text-slate-200">
            An <strong>agent transaction firewall</strong> exists because autonomous systems need a
            deterministic gate that can fail closed when checks do not pass.
          </p>
        </div>
      </Section>

      <Section className="border-t border-white/10 fade-in-up">
        <div className="max-w-4xl space-y-4">
          <h2 className="text-3xl font-bold tracking-tight text-[#f0a050]">Core Components</h2>
          <ol className="space-y-3 text-lg leading-relaxed text-slate-200">
            <li>
              <span className="font-semibold text-slate-100">Permit model:</span> signed,
              scoped, time-bound authorization for a specific intent.
            </li>
            <li>
              <span className="font-semibold text-slate-100">Invariant evaluation:</span>
              deterministic policy checks such as spend caps, protocol allowlists, and slippage
              bounds.
            </li>
            <li>
              <span className="font-semibold text-slate-100">Deterministic decision:</span>
              approved or rejected outcomes based only on policy state and request input.
            </li>
            <li>
              <span className="font-semibold text-slate-100">Receipt generation:</span>
              tamper-evident records for post-trade audit and incident response.
            </li>
          </ol>
        </div>
      </Section>

      <Section className="border-t border-white/10 fade-in-up">
        <div className="max-w-4xl space-y-4">
          <h2 className="text-3xl font-bold tracking-tight text-[#f0a050]">How It Differs From</h2>
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-neutral-900/40">
            <table className="w-full min-w-[680px] text-left text-sm text-slate-200 sm:text-base">
              <thead className="border-b border-white/10 bg-white/[0.02] text-slate-100">
                <tr>
                  <th className="px-4 py-3 font-semibold">System</th>
                  <th className="px-4 py-3 font-semibold">Primary role</th>
                  <th className="px-4 py-3 font-semibold">ATF difference</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/10">
                  <td className="px-4 py-3">API gateway</td>
                  <td className="px-4 py-3">Route/authenticate network requests</td>
                  <td className="px-4 py-3">ATF enforces permit scope and transaction invariants</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="px-4 py-3">Web application firewall</td>
                  <td className="px-4 py-3">Detect and block web payload attacks</td>
                  <td className="px-4 py-3">ATF evaluates financial intent before execution</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">OAuth scopes</td>
                  <td className="px-4 py-3">Grant app-level API permissions</td>
                  <td className="px-4 py-3">ATF binds runtime actions to deterministic policy checks</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-lg leading-relaxed text-slate-200">
            An <strong>Agent Transaction Firewall</strong> is not generic middleware, it is a
            transaction enforcement boundary for autonomous financial actions.
          </p>
        </div>
      </Section>

      <Section className="border-t border-white/10 fade-in-up">
        <div className="max-w-4xl space-y-4">
          <h2 className="text-3xl font-bold tracking-tight text-[#f0a050]">Minimal Architecture</h2>
          <p className="text-lg leading-relaxed text-slate-200">
            In a minimal deployment, the <strong>agent transaction firewall</strong> sits between
            the agent and protocol, then emits a deterministic receipt.
          </p>
          <div className="rounded-xl border border-white/10 bg-neutral-900/40 p-4 sm:p-6">
            <svg
              viewBox="0 0 920 140"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="Agent to ATF to Protocol to Receipt architecture flow"
              className="w-full"
            >
              <defs>
                <marker
                  id="arrow"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#7dd3fc" />
                </marker>
              </defs>

              <rect x="10" y="34" width="190" height="72" rx="10" fill="#0f1c2d" stroke="#7dd3fc" />
              <text x="105" y="77" textAnchor="middle" fill="#dbeafe" fontSize="22" fontWeight="600">
                Agent
              </text>

              <rect x="250" y="34" width="190" height="72" rx="10" fill="#162236" stroke="#f59e0b" />
              <text x="345" y="77" textAnchor="middle" fill="#fde68a" fontSize="22" fontWeight="600">
                ATF
              </text>

              <rect x="490" y="34" width="190" height="72" rx="10" fill="#0f1c2d" stroke="#7dd3fc" />
              <text x="585" y="77" textAnchor="middle" fill="#dbeafe" fontSize="22" fontWeight="600">
                Protocol
              </text>

              <rect x="730" y="34" width="180" height="72" rx="10" fill="#0f1c2d" stroke="#7dd3fc" />
              <text x="820" y="77" textAnchor="middle" fill="#dbeafe" fontSize="22" fontWeight="600">
                Receipt
              </text>

              <line x1="200" y1="70" x2="245" y2="70" stroke="#7dd3fc" strokeWidth="2.5" markerEnd="url(#arrow)" />
              <line x1="440" y1="70" x2="485" y2="70" stroke="#7dd3fc" strokeWidth="2.5" markerEnd="url(#arrow)" />
              <line x1="680" y1="70" x2="725" y2="70" stroke="#7dd3fc" strokeWidth="2.5" markerEnd="url(#arrow)" />
            </svg>
          </div>
        </div>
      </Section>

      <Section className="border-t border-white/10 fade-in-up">
        <div className="max-w-4xl space-y-4">
          <h2 className="text-3xl font-bold tracking-tight text-[#f0a050]">Related Links</h2>
          <ul className="space-y-2 text-lg text-slate-200">
            <li>
              <Link href="/atf" className="font-semibold text-primary-200 transition-colors hover:text-primary-100">
                /atf
              </Link>
            </li>
            <li>
              <Link
                href="/docs/5-minute-quickstart"
                className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
              >
                /docs/5-minute-quickstart
              </Link>
            </li>
            <li>
              <Link
                href="/atf/simulator"
                className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
              >
                /atf/simulator
              </Link>
            </li>
            <li>
              <Link
                href="/security/overview"
                className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
              >
                /security/overview
              </Link>
            </li>
          </ul>
          <p className="text-lg leading-relaxed text-slate-200">
            This page is the canonical definition of the <strong>Agent Transaction Firewall</strong>
            category on TruCore.
          </p>
        </div>
      </Section>
    </Container>
  );
}
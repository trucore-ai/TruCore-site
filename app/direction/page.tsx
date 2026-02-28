import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { TrackedLink } from "@/components/tracked-link";

const lastUpdated = process.env.NEXT_PUBLIC_BUILD_DATE ?? "unknown";

export const metadata: Metadata = {
  title: "Long-Term Direction",
  description:
    "Infrastructure-focused long-term direction for TruCore ATF, covering capital discipline, governance philosophy, and institutional readiness.",
  alternates: {
    canonical: "https://trucore.xyz/direction",
  },
};

export default function DirectionPage() {
  return (
    <Container>
      <Section className="fade-in-up">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-5xl">
            Long-Term Direction
          </h1>
          <p className="mt-4 text-2xl leading-[1.5] text-slate-200">
            TruCore is building durable enforcement infrastructure for autonomous finance,
            with disciplined execution, explicit controls, and transparent operational posture.
          </p>
          <p className="mt-4 text-sm font-medium text-slate-400">Last updated: {lastUpdated}</p>
        </div>
      </Section>

      <Section className="border-t border-white/10 fade-in-up fade-delay-1">
        <div className="mx-auto max-w-3xl space-y-6">
          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">Infrastructure First</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>ATF is positioned as enforcement infrastructure, not an add-on control layer.</li>
              <li>Non-custodial, policy-first design keeps control boundaries explicit.</li>
              <li>Deterministic guarantees at policy-evaluation time are captured in receipts.</li>
            </ul>
          </Card>

          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">Capital Discipline</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>Growth priorities remain anchored in sustainability and execution quality.</li>
              <li>Versioned releases maintain predictable delivery and verification cadence.</li>
              <li>Expansion is measured by vertical, with control depth before surface breadth.</li>
            </ul>
          </Card>

          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">Governance Philosophy</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>Security before scale.</li>
              <li>Transparency before marketing.</li>
              <li>Determinism before automation.</li>
            </ul>
          </Card>

          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">Multi-Phase Evolution</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>Permit enforcement as the baseline trust boundary.</li>
              <li>Receipt anchoring for stronger verification and audit continuity.</li>
              <li>On-chain guardrails introduced through a design-first process.</li>
            </ul>
          </Card>

          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">Institutional Readiness</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>Enterprise posture built around operational clarity and repeatable controls.</li>
              <li>Public process visibility supports due-diligence review.</li>
              <li>Compliance alignment informs roadmap sequencing and release standards.</li>
            </ul>
          </Card>

          <div className="glass-panel rounded-xl p-6">
            <h2 className="text-2xl font-bold text-slate-100">Related Surfaces</h2>
            <div className="mt-4 flex flex-wrap gap-4 text-lg font-semibold">
              <TrackedLink
                href="/manifesto"
                eventName="long_term_signal_click"
                eventProps={{ location: "direction_page", target: "manifesto" }}
                className="text-primary-200 transition-colors hover:text-primary-100"
              >
                /manifesto
              </TrackedLink>
              <TrackedLink
                href="/process"
                eventName="long_term_signal_click"
                eventProps={{ location: "direction_page", target: "process" }}
                className="text-primary-200 transition-colors hover:text-primary-100"
              >
                /process
              </TrackedLink>
              <TrackedLink
                href="/security/compliance"
                eventName="long_term_signal_click"
                eventProps={{ location: "direction_page", target: "security_compliance" }}
                className="text-primary-200 transition-colors hover:text-primary-100"
              >
                /security/compliance
              </TrackedLink>
            </div>
          </div>
        </div>
      </Section>
    </Container>
  );
}

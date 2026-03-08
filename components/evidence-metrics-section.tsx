import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { TrackedLink } from "@/components/tracked-link";

const evidenceSignals = [
  {
    title: "Deterministic Enforcement Model",
    detail: "Invariant-based evaluation before execution",
    href: "/atf/simulator",
    linkLabel: "Simulator",
  },
  {
    title: "Public Simulator Availability",
    detail: "Open demo endpoint with documented rate limits",
    href: "/status",
    linkLabel: "/status",
  },
  {
    title: "Transparent Versioning",
    detail: "Explicit versioning + CI enforcement",
    href: "/security/overview",
    linkLabel: "/security/overview",
  },
  {
    title: "Integrity Commitment",
    detail: "Signed whitepaper hash + public security disclosure",
    href: "/atf/whitepaper",
    linkLabel: "/atf/whitepaper",
  },
];

export function EvidenceMetricsSection() {
  return (
    <Section divider className="fade-in-up">
      <div className="mb-8 max-w-2xl">
        <h2 className="text-4xl font-bold tracking-tight text-accent-300">
          Evidence &amp; Operational Signals
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {evidenceSignals.map((signal) => (
          <Card key={signal.title} className="h-full">
            <h3 className="text-xl font-bold text-accent-300">{signal.title}</h3>
            <p className="mt-2 text-lg leading-[1.5] text-slate-200">{signal.detail}</p>
            <TrackedLink
              href={signal.href}
              eventName="evidence_signal_click"
              eventProps={{ target: signal.linkLabel, location: "atf_evidence" }}
              className="mt-4 inline-flex text-base font-semibold text-primary-200 transition-colors hover:text-primary-100"
            >
              {signal.linkLabel} &rarr;
            </TrackedLink>
          </Card>
        ))}
      </div>
    </Section>
  );
}

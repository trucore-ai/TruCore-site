import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { PilotKpiStrip } from "@/components/pilot-kpi-strip";
import { TrackedLink } from "@/components/tracked-link";

export const metadata: Metadata = {
  title: "ATF Pilot for E-Commerce & AI-Driven Checkout",
  description:
    "Run a 30 to 60 day ATF pilot for AI-driven checkout flows with measurable KPI framing for loss prevention, conversion, latency, and policy adherence.",
};

const problemPoints = [
  "AI agents optimizing checkout can trigger unintended edge-case behavior.",
  "Mispriced discounts can escalate quickly when promotional logic is over-applied.",
  "Automated refunds and credits can exceed approved exposure limits.",
  "Abuse vectors can compound when policy checks are absent at execution time.",
];

const enforcementPoints = [
  "Discount cap invariants",
  "Refund exposure caps",
  "Time-bound promotion TTL",
  "SKU allowlists",
];

const pilotKpis = [
  "Prevented loss events",
  "Conversion lift (if policy relaxed safely)",
  "Average decision latency",
  "Policy violation rate",
];

const pilotStructure = [
  "Sandbox integration",
  "Custom policy template",
  "Weekly receipt report",
  "End-of-pilot summary",
];

export default function EcommercePilotPage() {
  return (
    <Container>
      <Section className="fade-in-up">
        <div className="max-w-4xl">
          <Badge className="mb-4">Vertical Pilot</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-6xl">
            ATF Pilot for E-Commerce &amp; AI-Driven Checkout
          </h1>
          <p className="mt-5 max-w-3xl text-2xl leading-[1.4] text-slate-200">
            A concrete pilot format for teams deploying AI-driven checkout decisions, with measurable
            KPI framing and deterministic policy enforcement.
          </p>
        </div>
      </Section>

      <Section divider className="fade-in-up fade-delay-1">
        <PilotKpiStrip />
      </Section>

      <Section divider className="fade-in-up fade-delay-2">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300 sm:text-4xl">Problem</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {problemPoints.map((point) => (
            <Card key={point}>
              <p className="text-lg leading-[1.5] text-slate-200">{point}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section divider className="fade-in-up fade-delay-2">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300 sm:text-4xl">What ATF Enforces</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {enforcementPoints.map((point) => (
            <Card key={point}>
              <p className="text-xl font-semibold text-primary-100">{point}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section divider className="fade-in-up fade-delay-3">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300 sm:text-4xl">Measurable KPIs</h2>
          <p className="mt-3 text-lg text-slate-300">
            KPI outputs are pilot-measured. No performance claims are implied before live pilot data.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {pilotKpis.map((kpi) => (
            <Card key={kpi}>
              <p className="text-lg leading-[1.5] text-slate-200">{kpi}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section divider className="fade-in-up fade-delay-3">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300 sm:text-4xl">
            Pilot Structure (30-60 days)
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {pilotStructure.map((item) => (
            <Card key={item}>
              <p className="text-lg leading-[1.5] text-slate-200">{item}</p>
            </Card>
          ))}
        </div>
        <div className="mt-8">
          <TrackedLink
            href="/atf/apply?vertical=ecommerce"
            eventName="ecommerce_pilot_apply_click"
            eventProps={{ location: "pilot_ecommerce_page", vertical: "ecommerce" }}
            className="inline-flex items-center justify-center rounded-xl px-7 py-4 text-xl font-semibold transition-colors bg-accent-500 text-neutral-950 hover:bg-accent-400"
          >
            Apply for E-Commerce Pilot
          </TrackedLink>
        </div>
      </Section>
    </Container>
  );
}

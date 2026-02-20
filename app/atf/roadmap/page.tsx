import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { RoadmapStatusBadge } from "@/components/roadmap-status-badge";
import { roadmapItems, groupByScope } from "@/lib/roadmap";

export const metadata: Metadata = {
  title: "ATF Roadmap",
  description:
    "Public roadmap for the Agent Transaction Firewall. Focused, incremental hardening with no speculative timelines.",
};

const groups = groupByScope(roadmapItems);

export default function RoadmapPage() {
  return (
    <Container>
      {/* ── Hero ── */}
      <Section className="fade-in-up">
        <div className="max-w-3xl">
          <Badge className="mb-4">Public Roadmap</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-6xl">
            ATF Roadmap
          </h1>
          <p className="mt-5 text-2xl leading-[1.4] text-slate-200 sm:text-3xl">
            Focused, incremental hardening. Each milestone ships when it meets
            our security and reliability bar. No speculative timelines.
          </p>
        </div>
      </Section>

      {/* ── Milestone Groups ── */}
      {groups.map((group) => (
        <Section
          key={group.scope}
          className="border-t border-white/10 fade-in-up"
        >
          <div className="mb-6 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-[#f0a050]">
              {group.label}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((item) => (
              <Card
                key={item.id}
                className="border-primary-300/25 bg-primary-500/10"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-xl font-bold text-[#e8944a]">
                    {item.title}
                  </h3>
                  <RoadmapStatusBadge status={item.status} />
                </div>
                <p className="text-lg leading-[1.5] text-slate-200">
                  {item.description}
                </p>
              </Card>
            ))}
          </div>
        </Section>
      ))}
    </Container>
  );
}

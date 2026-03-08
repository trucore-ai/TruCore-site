import type { ReactNode } from "react";
import { RoadmapStatusBadge, type RoadmapBadgeStatus } from "@/components/roadmap-status-badge";
import { Card } from "@/components/ui/card";

type RoadmapPhaseProps = {
  title: string;
  status: RoadmapBadgeStatus;
  children: ReactNode;
};

export function RoadmapPhase({ title, status, children }: RoadmapPhaseProps) {
  return (
    <Card className="border-white/15 bg-white/[0.02] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-2xl font-bold text-accent-300">{title}</h3>
        <RoadmapStatusBadge status={status} />
      </div>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-relaxed text-slate-300">{children}</ul>
    </Card>
  );
}
import type { RoadmapStatus } from "@/lib/roadmap";

const config: Record<RoadmapStatus, { dot: string; label: string }> = {
  completed: { dot: "bg-green-400", label: "Completed" },
  in_progress: { dot: "bg-orange-400", label: "In Progress" },
  planned: { dot: "bg-slate-400", label: "Planned" },
};

export function RoadmapStatusBadge({ status }: { status: RoadmapStatus }) {
  const { dot, label } = config[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-neutral-800/60 px-3 py-1 text-xs font-medium text-slate-300">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

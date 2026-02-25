import type { RoadmapStatus } from "@/lib/roadmap";

export type RoadmapBadgeStatus = RoadmapStatus | "live" | "preview" | "future";

const config: Record<RoadmapBadgeStatus, { dot: string; label: string; tone: string }> = {
  completed: {
    dot: "bg-green-400",
    label: "Completed",
    tone: "border-white/20 bg-neutral-800/60 text-slate-200",
  },
  in_progress: {
    dot: "bg-orange-400",
    label: "In Progress",
    tone: "border-white/20 bg-neutral-800/60 text-slate-200",
  },
  planned: {
    dot: "bg-slate-400",
    label: "Planned",
    tone: "border-white/20 bg-neutral-800/60 text-slate-200",
  },
  live: {
    dot: "bg-emerald-400",
    label: "LIVE",
    tone: "border-emerald-300/40 bg-emerald-500/10 text-emerald-100",
  },
  preview: {
    dot: "bg-slate-300",
    label: "PREVIEW",
    tone: "border-white/20 bg-white/5 text-slate-200",
  },
  future: {
    dot: "bg-slate-500",
    label: "FUTURE",
    tone: "border-white/15 bg-white/[0.03] text-slate-300",
  },
};

export function RoadmapStatusBadge({ status }: { status: RoadmapBadgeStatus }) {
  const { dot, label, tone } = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${tone}`}>
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

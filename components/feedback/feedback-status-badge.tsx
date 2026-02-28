import type { FeedbackStatus } from "@/lib/validation/feedback";

const statusConfig: Record<
  FeedbackStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  Considering: {
    label: "Considering",
    bg: "bg-slate-500/20",
    text: "text-slate-200",
    border: "border-slate-400/40",
  },
  Planned: {
    label: "Planned",
    bg: "bg-blue-500/20",
    text: "text-blue-200",
    border: "border-blue-400/40",
  },
  "In Progress": {
    label: "In Progress",
    bg: "bg-amber-500/20",
    text: "text-amber-200",
    border: "border-amber-400/40",
  },
  Shipped: {
    label: "Shipped",
    bg: "bg-emerald-500/20",
    text: "text-emerald-200",
    border: "border-emerald-400/40",
  },
  "Wont Implement": {
    label: "Won't Implement",
    bg: "bg-red-500/15",
    text: "text-red-300",
    border: "border-red-400/30",
  },
};

export function FeedbackStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as FeedbackStatus] ?? statusConfig.Considering;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.text} ${config.border}`}
    >
      {config.label}
    </span>
  );
}

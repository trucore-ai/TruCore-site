import type { FeedbackCategory } from "@/lib/validation/feedback";

const categoryConfig: Record<
  FeedbackCategory,
  { label: string; bg: string; text: string; border: string }
> = {
  "Feature Request": {
    label: "Feature Request",
    bg: "bg-primary-500/20",
    text: "text-primary-100",
    border: "border-primary-300/40",
  },
  Bug: {
    label: "Bug",
    bg: "bg-red-500/20",
    text: "text-red-200",
    border: "border-red-400/40",
  },
  Docs: {
    label: "Docs",
    bg: "bg-cyan-500/20",
    text: "text-cyan-200",
    border: "border-cyan-400/40",
  },
  Integration: {
    label: "Integration",
    bg: "bg-violet-500/20",
    text: "text-violet-200",
    border: "border-violet-400/40",
  },
  Question: {
    label: "Question",
    bg: "bg-yellow-500/20",
    text: "text-yellow-200",
    border: "border-yellow-400/40",
  },
};

export function FeedbackCategoryBadge({ category }: { category: string }) {
  const config =
    categoryConfig[category as FeedbackCategory] ??
    categoryConfig["Feature Request"];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.text} ${config.border}`}
    >
      {config.label}
    </span>
  );
}

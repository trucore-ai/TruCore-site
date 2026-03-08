/* ────────────────────────────────────────────────────────────────
 *  StatusChip - premium inline status indicator
 *
 *  Renders a small pill with a dot indicator, colored by status.
 *  Reusable across all dashboard surfaces.
 * ──────────────────────────────────────────────────────────── */

type StatusVariant =
  | "healthy"
  | "degraded"
  | "down"
  | "pass"
  | "warn"
  | "fail"
  | "active"
  | "inactive"
  | "suspended"
  | "block"
  | "flag"
  | "allow";

const palette: Record<
  StatusVariant,
  { dot: string; bg: string; text: string; border: string }
> = {
  healthy: {
    dot: "bg-emerald-400",
    bg: "bg-emerald-500/10",
    text: "text-emerald-300",
    border: "border-emerald-500/25",
  },
  pass: {
    dot: "bg-emerald-400",
    bg: "bg-emerald-500/10",
    text: "text-emerald-300",
    border: "border-emerald-500/25",
  },
  active: {
    dot: "bg-emerald-400",
    bg: "bg-emerald-500/10",
    text: "text-emerald-300",
    border: "border-emerald-500/25",
  },
  allow: {
    dot: "bg-emerald-400",
    bg: "bg-emerald-500/10",
    text: "text-emerald-300",
    border: "border-emerald-500/25",
  },
  degraded: {
    dot: "bg-amber-400",
    bg: "bg-amber-500/10",
    text: "text-amber-300",
    border: "border-amber-500/25",
  },
  warn: {
    dot: "bg-amber-400",
    bg: "bg-amber-500/10",
    text: "text-amber-300",
    border: "border-amber-500/25",
  },
  flag: {
    dot: "bg-amber-400",
    bg: "bg-amber-500/10",
    text: "text-amber-300",
    border: "border-amber-500/25",
  },
  inactive: {
    dot: "bg-slate-500",
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    border: "border-slate-500/25",
  },
  down: {
    dot: "bg-red-400",
    bg: "bg-red-500/10",
    text: "text-red-300",
    border: "border-red-500/25",
  },
  fail: {
    dot: "bg-red-400",
    bg: "bg-red-500/10",
    text: "text-red-300",
    border: "border-red-500/25",
  },
  block: {
    dot: "bg-red-400",
    bg: "bg-red-500/10",
    text: "text-red-300",
    border: "border-red-500/25",
  },
  suspended: {
    dot: "bg-red-400",
    bg: "bg-red-500/10",
    text: "text-red-300",
    border: "border-red-500/25",
  },
};

type StatusChipProps = {
  status: StatusVariant;
  label?: string;
  className?: string;
  pulse?: boolean;
};

export function StatusChip({
  status,
  label,
  className = "",
  pulse = false,
}: StatusChipProps) {
  const p = palette[status] ?? palette.inactive;
  const displayLabel = label ?? status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${p.bg} ${p.text} ${p.border} ${className}`.trim()}
    >
      <span className="relative flex h-1.5 w-1.5">
        {pulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${p.dot}`}
          />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${p.dot}`} />
      </span>
      {displayLabel}
    </span>
  );
}

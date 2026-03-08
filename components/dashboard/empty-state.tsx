/* ────────────────────────────────────────────────────────────────
 *  EmptyState - elegant zero-data placeholder
 *
 *  Displays when an endpoint returns valid data but the set is
 *  empty. Visually intentional, not broken. Calm, premium feel
 *  with subtle gradient border and thoughtful spacing.
 * ──────────────────────────────────────────────────────────── */

type EmptyStateProps = {
  icon?: string;
  title: string;
  description: string;
  className?: string;
};

export function EmptyState({
  icon = "○",
  title,
  description,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-gradient-to-b from-white/[0.02] to-transparent px-8 py-16 text-center ${className}`.trim()}
    >
      <span
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04] text-lg text-slate-600"
        aria-hidden="true"
      >
        {icon}
      </span>
      <p className="mt-4 text-sm font-medium text-slate-300">{title}</p>
      <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-500">
        {description}
      </p>
    </div>
  );
}

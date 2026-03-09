/* ────────────────────────────────────────────────────────────────
 *  EmptyState - intentional zero-data placeholder
 *
 *  Displays when an endpoint returns valid data but the set is
 *  empty. Communicates that the absence of data is expected and
 *  intentional, not broken. Calm, infrastructure-grade language.
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
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-gradient-to-b from-white/[0.02] to-transparent px-8 py-10 text-center ${className}`.trim()}
    >
      <span
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.04] text-base text-slate-600"
        aria-hidden="true"
      >
        {icon}
      </span>
      <p className="mt-3 text-sm font-medium text-slate-300">{title}</p>
      <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-slate-500">
        {description}
      </p>
    </div>
  );
}

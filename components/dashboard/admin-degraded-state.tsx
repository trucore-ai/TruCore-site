/* ────────────────────────────────────────────────────────────────
 *  AdminDegradedState — safe fallback panel for admin pages
 *
 *  Renders when a DB-backed admin page cannot load its data.
 *  Shows operator-useful messaging without leaking backend details.
 *  Server component — no "use client" directive needed.
 * ──────────────────────────────────────────────────────────── */

type AdminDegradedStateProps = {
  /** Page or section title, e.g. "Usage" or "Audit Log". */
  title: string;
  /** Short safe description for the operator. */
  description?: string;
  /** Optional retry guidance. */
  retryHint?: string;
  className?: string;
};

export function AdminDegradedState({
  title,
  description = "Data could not be loaded right now.",
  retryHint = "Try again shortly or verify backend connectivity.",
  className = "",
}: AdminDegradedStateProps) {
  return (
    <div
      role="alert"
      className={`rounded-xl border border-amber-500/15 bg-amber-500/[0.04] px-6 py-8 ${className}`.trim()}
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-xs text-amber-400"
          aria-hidden="true"
        >
          !
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-300">
            {title} temporarily unavailable
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-amber-400/80">
            {description}
          </p>
          <p className="mt-2 text-[10px] text-amber-400/50">{retryHint}</p>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
 *  UnavailablePanel - neutral "not available yet" placeholder
 *
 *  Renders in place of a dashboard section that is not supported
 *  by the current ATF deployment. Calm, premium feel rather than
 *  alarming red error styling. Keeps the dashboard layout stable
 *  while communicating that the feature is simply pending.
 * ──────────────────────────────────────────────────────────── */

type UnavailablePanelProps = {
  title?: string;
  message?: string;
  className?: string;
};

export function UnavailablePanel({
  title = "Not available yet",
  message = "This section is not available in the current deployment. It will appear automatically once enabled.",
  className = "",
}: UnavailablePanelProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.06] bg-gradient-to-b from-white/[0.015] to-transparent px-8 py-12 text-center ${className}`.trim()}
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.04] text-base text-slate-600"
        aria-hidden="true"
      >
        ◇
      </span>
      <p className="mt-3.5 text-sm font-medium text-slate-400">{title}</p>
      <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-slate-500/80">
        {message}
      </p>
    </div>
  );
}

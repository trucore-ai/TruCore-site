/* ────────────────────────────────────────────────────────────────
 *  ErrorPanel - refined error display
 *
 *  Shows when an ATF dashboard endpoint fails. Keeps the layout
 *  stable and communicates the issue calmly.
 * ──────────────────────────────────────────────────────────── */

type ErrorPanelProps = {
  title?: string;
  message: string;
  className?: string;
};

export function ErrorPanel({
  title = "Unable to load data",
  message,
  className = "",
}: ErrorPanelProps) {
  return (
    <div
      role="alert"
      className={`rounded-xl border border-red-500/15 bg-red-500/[0.04] px-6 py-5 ${className}`.trim()}
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-500/10 text-[10px] text-red-400"
          aria-hidden="true"
        >
          !
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-red-300">{title}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-red-400/80">
            {message}
          </p>
          <p className="mt-2 text-[10px] text-red-400/50">
            Data will refresh automatically when connectivity is restored.
          </p>
        </div>
      </div>
    </div>
  );
}

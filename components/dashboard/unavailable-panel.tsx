/* ────────────────────────────────────────────────────────────────
 *  UnavailablePanel - context-aware deployment status fallback
 *
 *  Renders in place of a dashboard section that is not emitting
 *  data in the current ATF deployment. Provides operator-useful
 *  context about what the section covers and why it is inactive,
 *  rather than a generic "not available" message.
 *
 *  Differentiates between "not configured" (feature gated) and
 *  "not emitting" (endpoint exists but returned no data) so
 *  operators understand whether the absence is expected.
 * ──────────────────────────────────────────────────────────── */

type UnavailablePanelProps = {
  /** Short heading for the inactive section. */
  title?: string;
  /** Primary explanation of the current state. */
  message?: string;
  /** Optional list of prerequisites or capabilities relevant to this section. */
  capabilities?: string[];
  /** Whether this is a feature-gated absence vs a runtime absence. */
  variant?: "not-configured" | "not-emitting";
  className?: string;
};

export function UnavailablePanel({
  title = "Signal not emitted by current deployment",
  message = "This capability is not present in the current deployment configuration. Signals will appear automatically when the backing service and endpoint are enabled.",
  capabilities,
  variant = "not-configured",
  className = "",
}: UnavailablePanelProps) {
  const icon = variant === "not-emitting" ? "○" : "◇";
  const stateLabel = variant === "not-emitting" ? "Not emitting in current interval" : "Not configured in current environment";

  return (
    <div
      className={`dashboard-panel p-5 sm:p-6 ${className}`.trim()}
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-[11px] text-slate-600"
          aria-hidden="true"
        >
          {icon}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <p className="text-sm font-medium text-slate-400">{title}</p>
            <span className="inline-flex items-center rounded-md border border-slate-500/15 bg-slate-500/8 px-2 py-0.5 text-[10px] font-medium text-slate-500">
              {stateLabel}
            </span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            {message}
          </p>

          {capabilities && capabilities.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-600 mb-1.5">
                Required capabilities
              </p>
              <div className="flex flex-wrap gap-1.5">
                {capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="inline-flex items-center rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 text-[10px] font-medium text-slate-500"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          )}
          <p className="mt-3 text-[10px] text-slate-600">
            {variant === "not-emitting"
              ? "Signal endpoint exists but returned no data in current deployment interval."
              : "Capability boundary. Requires deployment configuration not yet present in this environment."}
          </p>
        </div>
      </div>
    </div>
  );
}

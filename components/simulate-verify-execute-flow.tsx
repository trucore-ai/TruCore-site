/**
 * Simulate, Verify, Execute Flow Diagram
 *
 * Vertical stepper showing the seven-step ATF execution pipeline.
 * Responsive, mobile-friendly, dark-mode with blue + orange accents.
 */

const steps = [
  { label: "Simulate", detail: "policy", phase: "evaluate" },
  { label: "Receipt", detail: "content_hash", phase: "evaluate" },
  { label: "Verify", detail: "local", phase: "verify" },
  { label: "Sign", detail: null, phase: "execute" },
  { label: "Send", detail: null, phase: "execute" },
  { label: "Status", detail: null, phase: "confirm" },
  { label: "Archive", detail: null, phase: "confirm" },
] as const;

type Phase = (typeof steps)[number]["phase"];

function phaseColor(phase: Phase) {
  switch (phase) {
    case "evaluate":
      return {
        ring: "border-primary-400/40",
        bg: "bg-primary-400/10",
        dot: "bg-primary-400",
        text: "text-primary-300",
        detail: "text-primary-200/70",
        line: "bg-primary-400/30",
      };
    case "verify":
      return {
        ring: "border-accent-400/50",
        bg: "bg-accent-400/10",
        dot: "bg-accent-400",
        text: "text-accent-300",
        detail: "text-accent-400/70",
        line: "bg-accent-400/30",
      };
    case "execute":
      return {
        ring: "border-accent-400/40",
        bg: "bg-accent-400/10",
        dot: "bg-accent-400",
        text: "text-accent-300",
        detail: "text-accent-400/70",
        line: "bg-accent-400/30",
      };
    case "confirm":
      return {
        ring: "border-primary-400/40",
        bg: "bg-primary-400/10",
        dot: "bg-primary-400",
        text: "text-primary-300",
        detail: "text-primary-200/70",
        line: "bg-primary-400/30",
      };
  }
}

export function SimulateVerifyExecuteFlow() {
  return (
    <div
      className="glass-panel mx-auto max-w-md rounded-xl px-6 py-6 sm:px-8 sm:py-8"
      role="img"
      aria-label="ATF execution pipeline: Simulate, Receipt, Verify, Sign, Send, Status, Archive"
    >
      <ol className="relative space-y-0">
        {steps.map((step, i) => {
          const c = phaseColor(step.phase);
          const isLast = i === steps.length - 1;

          return (
            <li key={step.label} className="relative flex items-start gap-4">
              {/* Vertical connector line */}
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`absolute left-[15px] top-[34px] h-[calc(100%-2px)] w-px ${c.line}`}
                />
              )}

              {/* Step dot */}
              <span
                aria-hidden="true"
                className={`relative z-10 mt-1 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border ${c.ring} ${c.bg}`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
              </span>

              {/* Label + detail */}
              <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
                <span className={`text-base font-semibold leading-snug ${c.text}`}>
                  {step.label}
                </span>
                {step.detail && (
                  <span className={`ml-2 font-mono text-sm ${c.detail}`}>
                    ({step.detail})
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Arrow indicator at bottom */}
      <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-4 text-xs text-slate-500">
        <span className="inline-block h-2 w-2 rounded-full bg-primary-400" />
        <span>Evaluate / Confirm</span>
        <span className="ml-3 inline-block h-2 w-2 rounded-full bg-accent-400" />
        <span>Verify / Execute</span>
      </div>
    </div>
  );
}

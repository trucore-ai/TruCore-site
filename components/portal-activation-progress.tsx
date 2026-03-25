/* ────────────────────────────────────────────────────────────────
 *  PortalActivationProgress — compact 3-step progress indicator
 *
 *  Renders inside the portal header to give new partners instant
 *  clarity on where they are in the activation flow:
 *
 *    Step 1  Get your API key
 *    Step 2  Run a test request
 *    Step 3  Protect your first trade
 *
 *  State is derived entirely from PortalActivationSummary (server-
 *  side, no client JS). Step completion uses the same proxy-based
 *  activation logic defined in lib/portal-activation.ts:
 *
 *    Step 1 complete → hasKeys is true
 *    Step 2 complete → totalRequests > 0
 *    Step 3 complete → state === "active_usage" (10+ requests)
 *
 *  Server component — zero client JS.
 * ──────────────────────────────────────────────────────────── */

import type { PortalActivationSummary } from "@/lib/portal-activation";

type StepStatus = "completed" | "current" | "upcoming";

interface Step {
  label: string;
  status: StepStatus;
}

function deriveSteps(activation: PortalActivationSummary): Step[] {
  const step1Done = activation.hasKeys;
  const step2Done = activation.totalRequests > 0;
  const step3Done = activation.state === "active_usage";

  function status(done: boolean, previousDone: boolean): StepStatus {
    if (done) return "completed";
    if (previousDone) return "current";
    return "upcoming";
  }

  return [
    { label: "Get your API key", status: status(step1Done, true) },
    { label: "Run a test request", status: status(step2Done, step1Done) },
    { label: "Protect your first trade", status: status(step3Done, step2Done) },
  ];
}

function StepIndicator({ index, step }: { index: number; step: Step }) {
  const num = index + 1;

  if (step.status === "completed") {
    return (
      <li className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300">
          ✓
        </span>
        <span className="text-sm text-slate-400 line-through decoration-slate-600">
          {step.label}
        </span>
      </li>
    );
  }

  if (step.status === "current") {
    return (
      <li className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent-400/60 bg-accent-500/20 text-xs font-bold text-accent-300">
          {num}
        </span>
        <span className="text-sm font-medium text-accent-200">
          {step.label}
        </span>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 text-xs font-bold text-slate-500">
        {num}
      </span>
      <span className="text-sm text-slate-500">{step.label}</span>
    </li>
  );
}

export function PortalActivationProgress({
  activation,
}: {
  activation: PortalActivationSummary;
}) {
  const steps = deriveSteps(activation);
  const allDone = steps.every((s) => s.status === "completed");

  if (allDone) return null;

  return (
    <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
      <ol className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {steps.map((step, i) => (
          <StepIndicator key={step.label} index={i} step={step} />
        ))}
      </ol>
      <p className="mt-2 text-xs text-slate-500">
        Complete these steps to move from account setup to your first protected trade.
      </p>
    </div>
  );
}

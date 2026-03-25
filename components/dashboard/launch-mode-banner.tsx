"use client";

/**
 * Compact banner showing the active ATF launch mode.
 *
 * Renders inside admin pages so operators always know which
 * launch posture is active.  Shows "-" if no mode is set.
 */

const MODE_LABELS: Record<string, { label: string; color: string }> = {
  local_dev: { label: "Local Dev", color: "bg-gray-700 text-gray-200" },
  staging: { label: "Staging", color: "bg-yellow-900/60 text-yellow-300" },
  private_alpha: {
    label: "Private Alpha",
    color: "bg-orange-900/60 text-orange-300",
  },
  public_beta: {
    label: "Public Beta",
    color: "bg-blue-900/60 text-blue-300",
  },
  controlled_real_execution: {
    label: "Controlled Real Execution",
    color: "bg-purple-900/60 text-purple-300",
  },
  broader_launch: {
    label: "Broader Launch",
    color: "bg-green-900/60 text-green-300",
  },
};

export function LaunchModeBanner({
  launchMode,
}: {
  launchMode: string | null;
}) {
  const entry = launchMode ? MODE_LABELS[launchMode] : null;
  const label = entry?.label ?? launchMode ?? "-";
  const color = entry?.color ?? "bg-white/10 text-slate-400";

  return (
    <div className="flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs">
      <span className="text-slate-400">Launch Mode:</span>
      <span className={`rounded px-2 py-0.5 font-medium ${color}`}>
        {label}
      </span>
    </div>
  );
}

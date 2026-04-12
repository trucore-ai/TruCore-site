import type { SimResult } from "@/lib/simulator";
import { TrackedLink } from "@/components/tracked-link";
import { normalizeDecision } from "@/lib/normalize-decision";

type RateLimitMetadata = {
  limit: string;
  remaining: string;
  reset: string;
};

type SimulatorResultProps = {
  result: SimResult | null;
  error: string | null;
  isLoading: boolean;
  rateLimit: RateLimitMetadata | null;
  simulationAttempted: boolean;
  isAdminView?: boolean;
};

function RateLimitMetadataBlock({
  rateLimit,
  simulationAttempted,
}: {
  rateLimit: RateLimitMetadata | null;
  simulationAttempted: boolean;
}) {
  if (!simulationAttempted) {
    return null;
  }

  if (!rateLimit) {
    return (
      <div className="rounded-lg border border-white/10 bg-neutral-950/60 p-3 font-mono text-xs text-slate-300">
        <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Rate Limit Metadata</p>
        <p className="mt-2">Public tier: 30 requests/minute</p>
        <p className="mt-2 text-slate-400">
          These headers are returned with every request to support programmatic enforcement monitoring.
        </p>
      </div>
    );
  }

  const resetEpochSeconds = Number(rateLimit.reset);
  const resetIso = Number.isFinite(resetEpochSeconds)
    ? new Date(resetEpochSeconds * 1000).toISOString()
    : null;

  return (
    <div className="rounded-lg border border-white/10 bg-neutral-950/60 p-3 font-mono text-xs text-slate-300">
      <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Rate Limit Metadata</p>
      <dl className="mt-2 space-y-1">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate-400">Limit</dt>
          <dd>{rateLimit.limit}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate-400">Remaining</dt>
          <dd>{rateLimit.remaining}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate-400">Reset</dt>
          <dd>{resetIso ? `${rateLimit.reset}s (${resetIso})` : rateLimit.reset}</dd>
        </div>
      </dl>
      <p className="mt-2 text-slate-400">
        These headers are returned with every request to support programmatic enforcement monitoring.
      </p>
    </div>
  );
}

export function SimulatorResult({
  result,
  error,
  isLoading,
  rateLimit,
  simulationAttempted,
  isAdminView = false,
}: SimulatorResultProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm text-slate-300">Running deterministic policy checks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3 rounded-xl border border-red-400/30 bg-red-500/10 p-5">
        <p className="text-sm font-medium text-red-200">{error}</p>
        <RateLimitMetadataBlock rateLimit={rateLimit} simulationAttempted={simulationAttempted} />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm text-slate-300">
          Submit a simulation request to preview deterministic allowed or denied behavior.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div>
        <p className="text-xs uppercase tracking-[0.12em] text-slate-400">status</p>
        <p
          className={
            result.status === "allowed"
              ? "mt-1 text-lg font-semibold text-emerald-300"
              : "mt-1 text-lg font-semibold text-red-300"
          }
        >
          {normalizeDecision(result.status)}
        </p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.12em] text-slate-400">reason</p>
        <p className="mt-1 text-slate-200">{result.reason}</p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.12em] text-slate-400">invariant_checks</p>
        <ul className="mt-2 space-y-1 text-sm text-slate-200">
          {result.invariant_checks.map((item) => (
            <li key={item} className="rounded border border-white/10 bg-neutral-950/50 px-2 py-1">
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.12em] text-slate-400">receipt_hash</p>
        <p className="mt-1 break-all font-mono text-xs text-slate-200">{result.receipt_hash}</p>
      </div>

      {result.status === "allowed" ? (
        <div className="space-y-3 rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-4">
          <p className="text-sm font-semibold text-emerald-200">
            Trade allowed — receipt issued
          </p>
          <p className="text-sm text-emerald-100">
            The policy engine evaluated this trade against spend caps, protocol allowlists,
            and slippage bounds. It passed all checks and produced a tamper-evident receipt
            you can verify independently.
          </p>
          {isAdminView ? (
            <div className="flex flex-wrap gap-3">
              <TrackedLink
                href="/admin/keys"
                eventName="simulator_upgrade_click"
                eventProps={{ location: "simulator_result", target: "sandbox_key" }}
                className="inline-flex items-center justify-center rounded-lg border border-primary-300/40 bg-primary-500/15 px-4 py-2 text-sm font-semibold text-primary-100 transition-colors hover:bg-primary-500/25"
              >
                Manage API Keys
              </TrackedLink>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-emerald-100">Create a free account to protect real trades and store receipts.</p>
              <TrackedLink
                href="/signup"
                eventName="simulator_signup_click"
                eventProps={{ location: "simulator_result", target: "signup" }}
                className="inline-flex items-center justify-center rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-neutral-950 transition-colors hover:bg-accent-400"
              >
                Create Free Account
              </TrackedLink>
            </div>
          )}
          <TrackedLink
            href={`/verify?hash=${encodeURIComponent(result.receipt_hash)}`}
            eventName="simulator_verify_receipt_click"
            eventProps={{ location: "simulator_result" }}
            className="inline-flex items-center text-sm font-semibold text-emerald-200 transition-colors hover:text-emerald-100"
          >
            Verify this receipt &rarr;
          </TrackedLink>
        </div>
      ) : null}

      <RateLimitMetadataBlock rateLimit={rateLimit} simulationAttempted={simulationAttempted} />
    </div>
  );
}
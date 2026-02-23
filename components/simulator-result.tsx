import type { SimResult } from "@/lib/simulator";

type SimulatorResultProps = {
  result: SimResult | null;
  error: string | null;
  isLoading: boolean;
};

export function SimulatorResult({ result, error, isLoading }: SimulatorResultProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm text-slate-300">Running deterministic policy checks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-5">
        <p className="text-sm font-medium text-red-200">{error}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm text-slate-300">
          Submit a simulation request to preview deterministic allow or deny behavior.
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
          {result.status}
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
    </div>
  );
}
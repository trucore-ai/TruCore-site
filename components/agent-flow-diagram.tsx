export function AgentFlowDiagram() {
  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-center sm:text-left">
        <div className="rounded-lg border border-primary-300/40 bg-primary-500/15 px-4 py-3 text-sm font-semibold text-primary-100">
          [ AI Agent ]
        </div>
        <span className="text-slate-400">→</span>
        <div className="rounded-lg border border-primary-300/40 bg-primary-500/15 px-4 py-3 text-sm font-semibold text-primary-100">
          [ ATF Policy Engine ]
        </div>
        <span className="text-slate-400">→</span>
        <div className="rounded-lg border border-primary-300/40 bg-primary-500/15 px-4 py-3 text-sm font-semibold text-primary-100">
          [ Execution Layer ]
        </div>
      </div>
      <p className="text-sm text-slate-300">ATF sits between decision and capital movement.</p>
    </div>
  );
}
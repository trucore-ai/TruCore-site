/**
 * Compact "Safe to try" banner for onboarding pages. Removes fear before
 * command execution by making demo mode immediately visible.
 */
export function SafeToTryBanner() {
  return (
    <aside
      role="note"
      className="flex items-start gap-3 rounded-xl border border-emerald-400/25 bg-emerald-500/[0.06] px-5 py-4"
    >
      <span className="mt-0.5 text-lg text-emerald-400" aria-hidden="true">
        &#x2713;
      </span>
      <div>
        <p className="text-sm font-semibold text-emerald-300">Safe to try</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-300">
          Runs in demo mode by default. No wallet. No on-chain execution.
          Takes ~5&nbsp;seconds.
        </p>
      </div>
    </aside>
  );
}

/**
 * Standardized "Demo mode vs Real mode" comparison block.
 * Use on pages that explain the transition from demo to real trades.
 */
export function DemoVsRealBlock() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/[0.04] p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.1em] text-emerald-400">
          Demo mode
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-slate-300">
          <li>No wallet required</li>
          <li>No on-chain execution</li>
          <li>Simulated protected trade</li>
        </ul>
      </div>
      <div className="rounded-xl border border-primary-400/20 bg-primary-500/[0.04] p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.1em] text-primary-200">
          Real mode
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-slate-300">
          <li>Requires setup (<code className="font-mono text-slate-200">atf setup</code>)</li>
          <li>Executes on Solana mainnet</li>
          <li>Enforced by ATF policy</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Short "what happens when you run this" explanation block.
 * Place immediately before or after a first-run command.
 */
export function WhatHappensBlock() {
  return (
    <p className="text-sm text-slate-400">
      When you run this: ATF evaluates a trade, shows the decision, and
      generates a receipt. No real transaction is submitted.
    </p>
  );
}

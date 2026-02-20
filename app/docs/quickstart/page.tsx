import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quickstart",
  description: "A concise ATF quickstart from policy definition to receipt recording.",
};

export default function DocsQuickstartPage() {
  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Quickstart</p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-100 sm:text-5xl">Quickstart</h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          ATF sits between agent intent and chain execution. You define guardrails once, issue scoped permits,
          validate every transaction against policy, and record receipts for auditability.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-100">What you&apos;re building</h2>
        <p className="text-slate-300">
          A fail-closed execution boundary where autonomous actions proceed only when policy checks and permit
          constraints pass.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-slate-100">Flow</h2>

        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-slate-100">1. Define policy</h3>
          <p className="text-slate-300">Declare protocol scope and hard limits before the agent acts.</p>
          <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`policy = createPolicy({
  protocols: ["jupiter", "solend"],
  maxSpendUsd: 5000,
  maxSlippageBps: 50
})`}
          </pre>
        </div>

        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-slate-100">2. Issue permit</h3>
          <p className="text-slate-300">Mint a scoped, time-bound permit tied to one intent domain.</p>
          <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`permit = issuePermit({
  policyId: policy.id,
  scope: "swap.execute",
  ttlSeconds: 60
})`}
          </pre>
        </div>

        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-slate-100">3. Validate transaction</h3>
          <p className="text-slate-300">Simulate and enforce constraints before any on-chain submission.</p>
          <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`validation = validateTransaction({
  tx,
  permit,
  policy
})

if (!validation.ok) reject(validation.reason)`}
          </pre>
        </div>

        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-slate-100">4. Record receipt</h3>
          <p className="text-slate-300">Persist a tamper-evident result for compliance and incident response.</p>
          <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`recordReceipt({
  txHash,
  policyDigest: policy.hash,
  decision: validation.ok ? "approved" : "rejected"
})`}
          </pre>
        </div>
      </section>
    </article>
  );
}
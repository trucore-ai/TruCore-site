import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Permits",
  description:
    "ATF permit schema and operational guidance for scope, TTL, nonce, domain separation, and replay resistance.",
};

export default function DocsPermitsPage() {
  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Concepts</p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-100 sm:text-5xl">Permits</h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Permits are scoped authorizations that grant the minimum rights needed for one class of actions within a
          short validity window.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-100">Core permit fields</h2>
        <ul className="space-y-3 text-slate-300">
          <li>
            <span className="font-semibold text-slate-100">scope</span>, constrains what operation can run, such as
            `swap.execute`.
          </li>
          <li>
            <span className="font-semibold text-slate-100">ttl</span>, limits validity to a short time window.
          </li>
          <li>
            <span className="font-semibold text-slate-100">nonce</span>, uniquely identifies one authorization event.
          </li>
          <li>
            <span className="font-semibold text-slate-100">domain separation</span>, binds the permit to one
            environment and signer context.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-100">Example permit JSON</h2>
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`{
  "permitId": "prm_01JXATF0ABC",
  "policyId": "pol_live_treasury_v1",
  "scope": "swap.execute",
  "subject": "agent:rebalance-bot",
  "ttl": {
    "issuedAt": 1766202000,
    "expiresAt": 1766202060
  },
  "nonce": "f31f2f8d-bd7b-4c56-bf0b-9912e7b7d302",
  "domain": {
    "chainId": "solana-mainnet",
    "environment": "prod",
    "verifier": "atf-gateway-v1"
  },
  "signature": "0xabc123..."
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-100">Replay protection</h2>
        <p className="text-slate-300">
          Replay protection combines short TTL, single-use nonce tracking, and domain separation checks. If a permit
          is reused, expired, or presented in the wrong environment, validation fails and execution is denied.
        </p>
      </section>
    </article>
  );
}
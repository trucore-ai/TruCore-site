import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";

export const metadata: Metadata = {
  title: "Quickstart",
  description: "A concise ATF quickstart from policy definition to receipt recording.",
};

export default function DocsQuickstartPage() {
  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Quickstart</p>
        <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-5xl">Quickstart</h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          ATF sits between agent intent and chain execution. You define guardrails once, issue scoped permits,
          validate every transaction against policy, and record receipts for auditability.
        </p>
      </header>

      <section className="space-y-4">
        <HeadingAnchor id="what-youre-building">What you&apos;re building</HeadingAnchor>
        <p className="text-slate-300">
          A fail-closed execution boundary where autonomous actions proceed only when policy checks and permit
          constraints pass.
        </p>
        <p className="text-slate-300">
          For a full enforcement breakdown, read{" "}
          <Link
            href="/docs/atf-architecture"
            className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
          >
            ATF Architecture &amp; Enforcement Model
          </Link>
          .
        </p>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="api-authentication">API authentication</HeadingAnchor>
        <p className="text-slate-300">
          Send your partner key using the <code className="font-mono text-slate-200">x-api-key</code> header when
          calling <code className="font-mono text-slate-200">/api/simulate</code>. Keys are issued and managed by
          TruCore, and revoked keys return <code className="font-mono text-slate-200">401 invalid_api_key</code>.
        </p>
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`curl -sS https://trucore.xyz/api/simulate \\
  -H "content-type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "action": "swap",
    "token_in": "SOL",
    "token_out": "USDC",
    "amount": 10,
    "max_slippage_bps": 100,
    "ttl_seconds": 60
  }'`}
        </pre>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="rate-limits">Rate limits</HeadingAnchor>
        <p className="text-slate-300">
          Public simulator calls use a lower quota. Partner-key traffic uses the Partner Sandbox quota and exposes live
          quota headers for debugging.
        </p>
        <ul className="space-y-2 text-slate-300">
          <li>Without key, 30 requests per minute per IP.</li>
          <li>With valid key, 120 requests per minute per key.</li>
          <li>
            Response headers: <code className="font-mono text-slate-200">X-RateLimit-Limit</code>,
            <code className="ml-1 font-mono text-slate-200">X-RateLimit-Remaining</code>,
            <code className="ml-1 font-mono text-slate-200">X-RateLimit-Reset</code>.
          </li>
        </ul>
      </section>

      <section className="space-y-6">
        <HeadingAnchor id="flow">Flow</HeadingAnchor>

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

      <section className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-5">
        <HeadingAnchor id="category-reference">Category reference</HeadingAnchor>
        <p className="text-slate-300">
          Need the canonical definition? Read{" "}
          <Link
            href="/agent-transaction-firewall"
            className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
          >
            Agent Transaction Firewall
          </Link>
          .
        </p>
      </section>
    </article>
  );
}
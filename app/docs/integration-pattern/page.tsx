import type { Metadata } from "next";
import Link from "next/link";
import { AgentFlowDiagram } from "@/components/agent-flow-diagram";
import { HeadingAnchor } from "@/components/heading-anchor";

export const metadata: Metadata = {
  title: "ATF Integration Pattern",
  description:
    "Integrate an AI agent with ATF before execution, evaluate deterministic policy outcomes, and consume receipt hashes for runtime audit logs.",
};

export default function DocsIntegrationPatternPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">ATF Integration</p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-100 sm:text-5xl">ATF Integration Pattern</h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Use ATF as an enforcement checkpoint between agent intent and execution. The integration is
          agent-native, deterministic, and chain-agnostic.
        </p>
      </header>

      <section className="space-y-4">
        <HeadingAnchor id="agent-atf-execution-flow">Agent → ATF → Execution Flow</HeadingAnchor>
        <AgentFlowDiagram />
        <ol className="space-y-2 text-slate-300">
          <li>1. Agent constructs a normalized execution request.</li>
          <li>2. ATF evaluates permit constraints and policy invariants.</li>
          <li>3. ATF returns a deterministic decision and receipt hash.</li>
          <li>4. Agent proceeds when allowed, or aborts when denied.</li>
        </ol>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="minimal-example-curl">Minimal Example (curl)</HeadingAnchor>
        <p className="text-slate-300">
          The sample below mirrors a Jupiter-style swap intent without executing on-chain logic.
        </p>
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`curl -s https://trucore.xyz/api/simulate \\
  -H "content-type: application/json" \\
  -H "x-api-key: tk_live_..." \\
  -d '{
    "action": "swap",
    "token_in": "SOL",
    "token_out": "USDC",
    "amount": 25,
    "max_slippage_bps": 100,
    "ttl_seconds": 60
  }'`}
        </pre>
        <p className="text-slate-300">Interpret the response using these fields:</p>
        <ul className="space-y-2 text-slate-300">
          <li>
            <span className="font-semibold text-slate-100">status:</span> <span>Use </span>
            <span className="font-mono text-slate-200">allowed</span>
            <span> to continue orchestration, and </span>
            <span className="font-mono text-slate-200">denied</span>
            <span> to stop execution.</span>
          </li>
          <li>
            <span className="font-semibold text-slate-100">reason:</span> Human-readable denial or
            approval rationale for observability and incident triage.
          </li>
          <li>
            <span className="font-semibold text-slate-100">receipt_hash:</span> Deterministic hash
            for audit logs, replay checks, and post-trade review.
          </li>
        </ul>
        <p className="text-slate-300">Generic agent hook example:</p>
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`async function evaluateWithAtf(intent: Record<string, unknown>) {
  const response = await fetch("/api/simulate", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ATF_API_KEY ?? "",
    },
    body: JSON.stringify(intent),
  });

  const decision = await response.json();
  if (decision.status !== "allowed") {
    return { proceed: false, reason: decision.reason, receiptHash: decision.receipt_hash };
  }

  return { proceed: true, receiptHash: decision.receipt_hash };
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="deterministic-guarantee">Deterministic Guarantee</HeadingAnchor>
        <ul className="space-y-2 text-slate-300">
          <li>Same input produces the same output decision.</li>
          <li>Receipt hash is reproducible from canonicalized decision data.</li>
        </ul>
      </section>

      <section className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-5">
        <HeadingAnchor id="enforcement-boundary">Enforcement Boundary</HeadingAnchor>
        <ul className="space-y-2 text-slate-300">
          <li>ATF does not custody funds.</li>
          <li>ATF does not sign transactions.</li>
          <li>ATF evaluates policy.</li>
        </ul>
        <div className="space-y-2 text-slate-300">
          <p className="text-sm uppercase tracking-[0.12em] text-slate-400">Related links</p>
          <ul className="space-y-1">
            <li>
              <Link href="/demo-policy" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
                /demo-policy
              </Link>
            </li>
            <li>
              <Link
                href="/docs/atf-architecture"
                className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
              >
                /docs/atf-architecture
              </Link>
            </li>
            <li>
              <Link
                href="/atf/simulator"
                className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
              >
                /atf/simulator
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </article>
  );
}
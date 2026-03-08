import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { TrackedLink } from "@/components/tracked-link";

const REQUEST_JSON = `{
  "action": "swap",
  "token_in": "SOL",
  "token_out": "USDC",
  "amount": 10,
  "max_slippage_bps": 100,
  "ttl_seconds": 60
}`;

const RESULT_JSON = `{
  "status": "allowed",
  "reason": "Request satisfies demo policy limits.",
  "invariant_checks": [
    "amount <= 1000: pass",
    "max_slippage_bps <= 300: pass",
    "ttl_seconds <= 300: pass"
  ],
  "receipt_hash": "9d9e34f2df6dd5ecf0988cb3af0ea4ab60431b64d7d5e3b35d0972ce4e4c986f"
}`;

export function EnforcementProofSection() {
  return (
    <Section divider className="fade-in-up">
      <div className="mb-8 max-w-3xl">
        <h2 className="text-4xl font-bold tracking-tight text-accent-300">
          Deterministic Enforcement Proof
        </h2>
        <p className="mt-4 text-xl leading-[1.5] text-slate-200">
          The same input consistently produces the same policy decision and receipt hash.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-400">Request JSON</p>
          <pre className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
            <code>{REQUEST_JSON}</code>
          </pre>
        </Card>

        <Card>
          <p className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-400">Result JSON</p>
          <pre className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
            <code>{RESULT_JSON}</code>
          </pre>
        </Card>
      </div>

      <ul className="mt-6 space-y-2 text-lg text-slate-200">
        <li className="flex items-start gap-3">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-400" />
          Policy evaluated before execution.
        </li>
        <li className="flex items-start gap-3">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-400" />
          Invariants checked deterministically.
        </li>
        <li className="flex items-start gap-3">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-400" />
          Receipt hash generated for tamper evidence.
        </li>
      </ul>

      <div className="mt-8">
        <TrackedLink
          href="/atf/simulator?scenario=valid-swap"
          eventName="enforcement_proof_simulator_click"
          eventProps={{ location: "atf_enforcement_proof" }}
          className="inline-flex items-center justify-center rounded-xl border border-primary-300/40 bg-primary-500/15 px-7 py-4 text-lg font-semibold text-primary-100 transition-colors hover:bg-primary-500/25"
        >
          Run this example in the Simulator
        </TrackedLink>
      </div>
    </Section>
  );
}

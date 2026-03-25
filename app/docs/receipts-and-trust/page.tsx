import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { CopyBlock } from "@/components/copy-block";

export const metadata: Metadata = {
  title: "Receipts & Trust",
  description:
    "How ATF receipts work: what they prove, how to verify them, and why they matter for agent transactions.",
};

const RECEIPT_EXAMPLE = `{
  "decision": "approved",
  "reasons": [],
  "content_hash": "a1b2c3d4e5f6...64-char-hex-string",
  "hash_version": "1",
  "timestamp_utc": "2026-03-21T00:00:00+00:00",
  "chain_id": "solana",
  "intent_type": "swap"
}`;

const EXECUTION_RECEIPT = `{
  "receipt_id": "rcpt_a1b2c3d4e5f6",
  "intent_id": "aud_x9y8z7w6",
  "tx_signature": "5KtV2f3...on-chain-sig",
  "classification": "swap",
  "decision": "approved",
  "output_amount": 142.37,
  "execution_status": "confirmed",
  "timestamp": 1742544000.0,
  "receipt_hash": "e4f5a6b7c8d9...deterministic-hash"
}`;

const VERIFY_API = `curl -sS https://api.trucore.xyz/v1/receipts/verify \\
  -H "Content-Type: application/json" \\
  -d '{"content_hash": "a1b2c3d4e5f6...64-char-hex"}'`;

const VERIFY_RESPONSE = `{
  "valid": true,
  "reason": "receipt_valid",
  "intent_hash_version": "1"
}`;

export default function ReceiptsAndTrustPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          Trust &amp; Verification
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Receipts &amp; Trust
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Every ATF decision - allow or deny - produces a tamper-evident receipt.
          Receipts are the proof layer that makes autonomous agent trading auditable.
        </p>
      </header>

      {/* ── What is a Receipt ── */}
      <section className="space-y-4">
        <HeadingAnchor id="what-is-a-receipt">What is a Receipt?</HeadingAnchor>
        <p className="text-slate-300">
          A receipt is a deterministic, content-hashed record of an ATF policy decision.
          When your bot submits a swap intent, ATF evaluates it against configured policies
          and returns a receipt capturing exactly what was decided and why.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-2">
            <h3 className="text-lg font-bold text-emerald-300">Decision Receipt</h3>
            <p className="text-sm text-slate-300">
              Issued on every protect call. Contains the decision (approved/denied),
              reason codes, a <code className="font-mono text-slate-200">content_hash</code>,
              and metadata about the intent.
            </p>
            <CopyBlock label="json" value={RECEIPT_EXAMPLE} />
          </div>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-2">
            <h3 className="text-lg font-bold text-emerald-300">Execution Receipt</h3>
            <p className="text-sm text-slate-300">
              Issued when an approved trade is finalized on-chain. Links the ATF decision
              to the on-chain transaction signature and records the execution outcome.
            </p>
            <CopyBlock label="json" value={EXECUTION_RECEIPT} />
          </div>
        </div>
      </section>

      {/* ── Receipt Fields ── */}
      <section className="space-y-4">
        <HeadingAnchor id="receipt-fields">Key Receipt Fields</HeadingAnchor>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="pb-2 pr-4 font-semibold text-slate-300">Field</th>
                <th className="pb-2 font-semibold text-slate-300">Description</th>
              </tr>
            </thead>
            <tbody className="text-slate-400">
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono text-xs text-slate-200">content_hash</td>
                <td className="py-2">Deterministic SHA-256 hash of the canonical receipt payload. This is the primary verification value.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono text-xs text-slate-200">hash_version</td>
                <td className="py-2">Schema version for the hash algorithm. Currently &quot;1&quot;.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono text-xs text-slate-200">decision</td>
                <td className="py-2">&quot;approved&quot; or &quot;denied&quot; - the policy evaluation result.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono text-xs text-slate-200">reasons</td>
                <td className="py-2">Machine-readable reason codes explaining why the intent was denied (empty if approved).</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono text-xs text-slate-200">receipt_hash</td>
                <td className="py-2">Deterministic hash of the full execution receipt (only on finalized executions).</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 font-mono text-xs text-slate-200">tx_signature</td>
                <td className="py-2">On-chain transaction signature (only on finalized executions).</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── What Verification Proves ── */}
      <section className="space-y-4">
        <HeadingAnchor id="what-verification-proves">What Verification Proves</HeadingAnchor>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-5">
            <h3 className="font-bold text-emerald-300">Verification proves:</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-300">
              <li>The receipt was generated by ATF</li>
              <li>The receipt content has not been modified since issuance</li>
              <li>The decision matches the original policy evaluation</li>
              <li>The hash is consistent with the canonical payload</li>
            </ul>
          </div>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-5">
            <h3 className="font-bold text-amber-300">Verification does not prove:</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-300">
              <li>That the original policy was correct for your use case</li>
              <li>That the on-chain transaction executed successfully (use tx_signature for that)</li>
              <li>That the bot acted on the decision (the bot could ignore ATF)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── How to Verify ── */}
      <section className="space-y-4">
        <HeadingAnchor id="how-to-verify">How to Verify a Receipt</HeadingAnchor>

        <h3 className="text-xl font-bold text-accent-300">Via API</h3>
        <CopyBlock label="bash" value={VERIFY_API} />
        <CopyBlock label="json" value={VERIFY_RESPONSE} />

        <h3 className="text-xl font-bold text-accent-300">Via CLI</h3>
        <div className="rounded-lg border border-white/5 bg-neutral-950/50 p-4 font-mono text-sm text-slate-200">
          atf verify &lt;receipt-id&gt;
        </div>
        <p className="text-sm text-slate-400">
          Exit code <code className="font-mono text-slate-300">0</code> = valid,{" "}
          <code className="font-mono text-slate-300">1</code> = invalid or error.
          The CLI recomputes the hash locally for additional assurance.
        </p>

        <h3 className="text-xl font-bold text-accent-300">Via Web</h3>
        <p className="text-slate-300">
          Visit{" "}
          <Link href="/verify" className="font-semibold text-primary-200 hover:text-primary-100">
            trucore.xyz/verify
          </Link>{" "}
          or the receipt URL (e.g., <code className="font-mono text-slate-200">https://verify.trucore.xyz/tx/rcpt_...</code>).
        </p>
      </section>

      {/* ── Mock vs Real ── */}
      <section className="space-y-4">
        <HeadingAnchor id="mock-vs-real">Mock vs Real Execution</HeadingAnchor>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-white/10 p-5 space-y-2">
            <h3 className="font-bold text-accent-300">Mock Execution</h3>
            <p className="text-sm text-slate-300">
              The onboarding flow runs in mock mode by default. Policies are evaluated,
              receipts are generated, but no on-chain transaction is sent.
              Mock receipts are fully verifiable - they use the same hashing algorithm
              as production receipts.
            </p>
            <p className="text-sm text-slate-400">
              Mock receipts <strong className="text-slate-300">do not</strong> have
              a <code className="font-mono text-slate-300">tx_signature</code> field
              since no on-chain transaction occurred.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 p-5 space-y-2">
            <h3 className="font-bold text-accent-300">Real Execution</h3>
            <p className="text-sm text-slate-300">
              Connect a wallet via <code className="font-mono text-slate-200">atf setup</code>,
              and ATF evaluates real intents against live market data. Approved trades
              execute on-chain, and the finalization step links the ATF receipt to the
              on-chain transaction.
            </p>
            <p className="text-sm text-slate-400">
              Real execution receipts include <code className="font-mono text-slate-300">tx_signature</code>,{" "}
              <code className="font-mono text-slate-300">output_amount</code>, and{" "}
              <code className="font-mono text-slate-300">execution_status</code>.
            </p>
          </div>
        </div>
      </section>

      {/* ── Why Receipts Matter ── */}
      <section className="space-y-4">
        <HeadingAnchor id="why-receipts-matter">Why Receipts Matter for Agent Transactions</HeadingAnchor>
        <p className="text-slate-300">
          When AI agents or bots execute financial transactions autonomously,
          there is no human in the loop to verify each decision. Receipts provide:
        </p>
        <ul className="space-y-2 text-slate-300">
          <li>
            <strong className="text-slate-100">Accountability</strong> - every decision has a verifiable record,
            even if the agent ran unsupervised for hours
          </li>
          <li>
            <strong className="text-slate-100">Audit trails</strong> - link on-chain transactions back to
            the policy evaluation that approved them
          </li>
          <li>
            <strong className="text-slate-100">Dispute resolution</strong> - if something goes wrong,
            receipts prove what ATF decided and why
          </li>
          <li>
            <strong className="text-slate-100">Compliance</strong> - institutions can demonstrate that
            every agent trade passed policy controls
          </li>
        </ul>
      </section>

      {/* ── Request Flow Diagram ── */}
      <section className="space-y-4">
        <HeadingAnchor id="flow">Request → Protect → Receipt Flow</HeadingAnchor>
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/50 p-6">
          <pre className="text-sm text-slate-300 leading-relaxed whitespace-pre">{`┌─────────────┐     ┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Bot /     │     │   ATF       │     │   Policy     │     │   Receipt   │
│   Agent     │────▶│   API       │────▶│   Evaluator  │────▶│   Store     │
└─────────────┘     └──────┬──────┘     └──────────────┘     └──────┬──────┘
      │                    │                                        │
      │  1. Submit intent  │                                        │
      │                    │  2. Evaluate policies                  │
      │                    │  3. Generate receipt                   │
      │◀───────────────────┤  4. Return decision + receipt          │
      │                    │                                        │
      │  5. If approved:   │                                        │
      │     sign & send tx │                                        │
      │                    │                                        │
      │  6. Finalize       │                                        │
      │───────────────────▶│  7. Link tx → receipt                  │
      │                    │──────────────────────────────────────▶  │
      │◀───────────────────┤  8. Return execution receipt           │
      │                    │                                        │
      │  9. Verify receipt │                                        │
      │───────────────────▶│  10. Validate content_hash             │
      │◀───────────────────┤  11. Return {valid: true}              │
`}</pre>
        </div>
      </section>

      {/* ── Next Steps ── */}
      <section className="space-y-4">
        <HeadingAnchor id="next-steps">Next Steps</HeadingAnchor>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/docs/receipt-specification-v1"
            className="group rounded-lg border border-white/10 p-5 transition-colors hover:border-white/20"
          >
            <h3 className="font-bold text-accent-300 group-hover:text-accent-200">Receipt Specification v1 &rarr;</h3>
            <p className="mt-1 text-sm text-slate-400">Formal RFC-style receipt contract and hash rules.</p>
          </Link>
          <Link
            href="/docs/verify"
            className="group rounded-lg border border-white/10 p-5 transition-colors hover:border-white/20"
          >
            <h3 className="font-bold text-accent-300 group-hover:text-accent-200">Verification Guide &rarr;</h3>
            <p className="mt-1 text-sm text-slate-400">Deep dive into content_hash, --verify, and production patterns.</p>
          </Link>
          <Link
            href="/docs/first-protected-trade"
            className="group rounded-lg border border-white/10 p-5 transition-colors hover:border-white/20"
          >
            <h3 className="font-bold text-accent-300 group-hover:text-accent-200">First Protected Trade &rarr;</h3>
            <p className="mt-1 text-sm text-slate-400">Hands-on guide to protecting and verifying your first swap.</p>
          </Link>
          <Link
            href="/receipts"
            className="group rounded-lg border border-white/10 p-5 transition-colors hover:border-white/20"
          >
            <h3 className="font-bold text-accent-300 group-hover:text-accent-200">Receipts Explorer &rarr;</h3>
            <p className="mt-1 text-sm text-slate-400">Browse public receipt examples and verification artifacts.</p>
          </Link>
        </div>
      </section>
    </article>
  );
}

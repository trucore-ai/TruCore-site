import type { Metadata } from "next";
import { HeadingAnchor } from "@/components/heading-anchor";
import { TrackedLink } from "@/components/tracked-link";

export const metadata: Metadata = {
  title: "ATF Execution Example",
  description:
    "Walk through a complete ATF request cycle: protect an intent, inspect the receipt fields, and verify the outcome deterministically.",
};

export default function DocsLiveDemoPage() {
  return (
    <article className="space-y-10">
      {/* ── Header ── */}
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          Developer Reference
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-5xl">
          ATF Execution Example
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          A complete request cycle: protect an intent, inspect the
          deterministic receipt, and verify the outcome. Framework-agnostic.
          No external plugins required.
        </p>
      </header>

      {/* ── 1) Protect an intent ── */}
      <section className="space-y-4">
        <HeadingAnchor id="protect-intent">Protect an intent</HeadingAnchor>
        <p className="max-w-3xl text-slate-300">
          Submit the proposed transaction to the firewall before signing or
          broadcasting. The firewall evaluates it against your active policy
          and returns a decision synchronously.
        </p>

        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
            HTTP
          </p>
          <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm leading-relaxed text-slate-300">
            <code>{`POST /v1/bot/protect
Content-Type: application/json
Authorization: Bearer <api_key>

{
  "action": "swap",
  "amount_usd": 500,
  "slippage_bps": 40,
  "market": "SOL-USDC",
  "venue": "jupiter"
}`}</code>
          </pre>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
            CLI (stdin)
          </p>
          <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm leading-relaxed text-slate-300">
            <code>{`echo '{"action":"swap","amount_usd":500,"slippage_bps":40,"market":"SOL-USDC","venue":"jupiter"}' \\
  | atf bot protect --stdin`}</code>
          </pre>
        </div>

        <div className="rounded-lg border border-white/8 bg-white/[0.03] p-4 text-sm text-slate-400">
          <span className="font-semibold text-slate-300">Tip:</span> The
          firewall is fail-closed. Any request that does not match a policy
          rule is rejected before it reaches a signer.
        </div>
      </section>

      {/* ── 2) Receipt fields ── */}
      <section className="space-y-4">
        <HeadingAnchor id="receipt-fields">
          Deterministic receipt fields
        </HeadingAnchor>
        <p className="max-w-3xl text-slate-300">
          Every decision produces a receipt. The fields below are present in
          all outcomes, approved or rejected. They are deterministically
          reproducible: the same input and policy always produce the same{" "}
          <code className="font-mono text-slate-200">content_hash</code>.
        </p>

        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm leading-relaxed text-slate-300">
          <code>{`{
  "decision":      "approved",          // "approved" | "rejected"
  "receipt_token": "rcpt_01J...",       // stable receipt ID
  "content_hash":  "sha256:e3b0c4...", // deterministic fingerprint
  "policy_id":     "pol_01J...",        // policy evaluated
  "reason_codes":  [],                  // array of rejection reason strings
  "evaluated_at":  "2026-03-04T21:00:00Z",
  "ttl_seconds":   30
}`}</code>
        </pre>

        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm text-slate-300">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                <th className="px-4 py-3">Field</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                [
                  "content_hash",
                  "string",
                  "SHA-256 fingerprint of the canonical receipt payload. Identical for the same input and policy.",
                ],
                [
                  "receipt_token",
                  "string",
                  "Unique ID for this receipt. Use this to retrieve or verify it later.",
                ],
                [
                  "reason_codes",
                  "string[]",
                  "Empty on approval. On rejection, lists the rule(s) that blocked the transaction.",
                ],
                [
                  "ttl_seconds",
                  "number",
                  "How long the decision remains valid. After expiry, re-submit the intent.",
                ],
              ].map(([field, type, desc]) => (
                <tr key={field}>
                  <td className="px-4 py-3 font-mono text-slate-200">
                    {field}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{type}</td>
                  <td className="px-4 py-3 text-slate-400">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 3) Verify a receipt ── */}
      <section className="space-y-4">
        <HeadingAnchor id="verify-receipt">Verify a receipt</HeadingAnchor>
        <p className="max-w-3xl text-slate-300">
          Verification re-derives the{" "}
          <code className="font-mono text-slate-200">content_hash</code> from
          the receipt payload and confirms it matches the value returned at
          issuance. Any third party with the receipt data can run this check
          independently.
        </p>

        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
            HTTP
          </p>
          <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm leading-relaxed text-slate-300">
            <code>{`POST /v1/receipts/verify
Content-Type: application/json
Authorization: Bearer <api_key>

{
  "receipt_token": "rcpt_01J..."
}`}</code>
          </pre>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
            CLI
          </p>
          <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm leading-relaxed text-slate-300">
            <code>{`atf receipts verify rcpt_01J...`}</code>
          </pre>
        </div>

        <div className="rounded-lg border border-white/8 bg-white/[0.03] p-4 text-sm text-slate-400">
          <span className="font-semibold text-slate-300">Deterministic:</span>{" "}
          Verification does not require server state. The hash algorithm and
          canonical field ordering are public. Any SDK or script that follows
          the same encoding spec can verify offline.
        </div>
      </section>

      {/* ── Next step ── */}
      <section className="space-y-3 border-t border-white/10 pt-8">
        <p className="text-slate-300">
          Ready to configure limits for your bot?
        </p>
        <TrackedLink
          href="/docs/agent-discovery"
          eventName="live_demo_guardrails_click"
          eventProps={{ location: "docs_live_demo" }}
          className="inline-flex items-center gap-1.5 font-semibold text-primary-200 transition-colors hover:text-primary-100"
        >
          See guardrails checklist
          <span aria-hidden="true">→</span>
        </TrackedLink>
      </section>
    </article>
  );
}

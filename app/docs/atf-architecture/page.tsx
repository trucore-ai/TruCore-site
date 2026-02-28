import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";

export const metadata: Metadata = {
  title: "ATF Architecture & Enforcement Model",
  description:
    "Technical deep dive on ATF threat model, permit schema, deterministic invariants, replay protection, and receipt hashing.",
};

export default function DocsAtfArchitecturePage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">ATF Architecture</p>
        <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-5xl">
          ATF Architecture &amp; Enforcement Model
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          This document defines the execution path from agent intent to deterministic approval or
          denial, then receipt generation.
        </p>
      </header>

      <section className="space-y-4">
        <HeadingAnchor id="threat-model-zero-trust-agents">Threat Model (zero-trust agents)</HeadingAnchor>
        <p className="text-slate-300">
          ATF assumes that model-generated intent can be malformed, policy-violating, stale, or
          adversarially influenced. Enforcement does not rely on model confidence.
        </p>
        <ul className="space-y-2 text-slate-300">
          <li>Agent may request unsupported protocol calls.</li>
          <li>Agent may exceed notional limits or slippage bounds.</li>
          <li>Request may be replayed if permit freshness is not enforced.</li>
          <li>Post-facto logs are insufficient for real-time loss prevention.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="permit-schema-overview">Permit Schema Overview</HeadingAnchor>
        <p className="text-slate-300">
          Permit payloads encode the minimum execution authority required for one intent domain.
        </p>
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`{
  "permit_id": "permit_01J9QJ...",
  "subject": "agent:desk-7",
  "scope": "swap.execute",
  "policy_id": "policy_mainnet_v1",
  "constraints": {
    "max_notional_usd": 10000,
    "max_slippage_bps": 40,
    "protocol_allowlist": ["jupiter", "solend"]
  },
  "issued_at": "2026-02-23T18:40:00Z",
  "expires_at": "2026-02-23T18:41:00Z",
  "nonce": "8f16e8f4-5a0d-4a72-ae0c-3dc67f8ed8f1",
  "signature": "ed25519:..."
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="deterministic-invariant-evaluation">
          Deterministic Invariant Evaluation
        </HeadingAnchor>
        <p className="text-slate-300">
          Invariants are evaluated with deterministic inputs and fail-closed semantics. Any failed
          check returns a denied decision.
        </p>
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`const decision = evaluateInvariants({
  policy,
  permit,
  intent,
  marketSnapshot,
});

if (!decision.allowed) {
  return { status: "denied", reason: decision.reason };
}`}
        </pre>
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`{
  "status": "allowed",
  "invariant_checks": [
    { "name": "protocol_allowlist", "ok": true },
    { "name": "max_notional", "ok": true },
    { "name": "max_slippage", "ok": true }
  ]
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="replay-protection-and-ttl">Replay Protection + TTL</HeadingAnchor>
        <p className="text-slate-300">
          Replay protection combines single-use nonce tracking with strict permit expiration. A
          reused nonce or expired permit is denied before protocol submission.
        </p>
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`if (now > permit.expires_at) deny("permit_expired");
if (nonceStore.has(permit.nonce)) deny("nonce_replay_detected");
nonceStore.markUsed(permit.nonce);`}
        </pre>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="receipt-hash-generation">Receipt Hash Generation</HeadingAnchor>
        <p className="text-slate-300">
          Receipts are normalized, hashed, and persisted with decision metadata so audit systems can
          verify integrity.
        </p>
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`const canonicalReceipt = canonicalize({
  policy_id,
  permit_id,
  intent_hash,
  decision,
  invariant_checks,
  timestamp,
});

const receipt_hash = sha256(canonicalReceipt);`}
        </pre>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="optional-on-chain-anchoring-future-path">
          Optional On-chain Anchoring (future path)
        </HeadingAnchor>
        <p className="text-slate-300">
          Future versions may anchor batched receipt hashes on-chain for external timestamping and
          third-party verification. This path is optional and not required for current deterministic
          enforcement.
        </p>
      </section>

      <section className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-5">
        <HeadingAnchor id="related-pages">Related pages</HeadingAnchor>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-100">Demo Policy</h3>
          <p className="text-slate-300">Public simulator constraints are documented at:</p>
          <Link href="/demo-policy" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
            /demo-policy
          </Link>
        </div>
        <ul className="space-y-2 text-slate-300">
          <li>
            <Link href="/atf" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
              /atf
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
          <li>
            <Link
              href="/agent-transaction-firewall"
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              Agent Transaction Firewall category definition
            </Link>
          </li>
        </ul>
      </section>
    </article>
  );
}
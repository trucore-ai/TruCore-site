import type { Metadata } from "next";
import Link from "next/link";
import { CopyBlock } from "@/components/copy-block";
import { HeadingAnchor } from "@/components/heading-anchor";

export const metadata: Metadata = {
  title: "ATF Permit Schema v1",
  description: "Versioned permit fields and deterministic evaluation contract for ATF.",
  robots: {
    index: true,
    follow: true,
  },
};

const permitExample = `{
  "version": "v1",
  "issuer": "demo",
  "subject": { "type": "agent", "id": "agent_demo" },
  "action": "swap",
  "constraints": {
    "amount_max": 1000,
    "max_slippage_bps": 300,
    "ttl_seconds_max": 300,
    "protocol_allowlist": ["jupiter"]
  },
  "nonce": "demo-nonce-0001",
  "issued_at": "2026-02-24T00:00:00Z",
  "expires_at": "2026-02-24T00:05:00Z"
}`;

export default function DocsPermitSchemaV1Page() {
  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Schema</p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-100 sm:text-5xl">ATF Permit Schema v1</h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          This page documents a versioned demo permit shape for ATF integrations. It is designed to be clear,
          copyable, and deterministic for evaluation and receipts.
        </p>
      </header>

      <section className="space-y-4">
        <HeadingAnchor id="overview">Overview</HeadingAnchor>
        <p className="text-slate-300">
          A permit in ATF is a compact authorization envelope for one financial action under explicit constraints.
          Integrations send policy-relevant fields in a stable shape so ATF can evaluate requests consistently.
        </p>
        <p className="text-slate-300">
          This is a documentation artifact for developer onboarding. It does not claim that every field shown below is
          enforced in every production environment.
        </p>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="schema">Schema</HeadingAnchor>
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
          <code>{permitExample}</code>
        </pre>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="permit-example">Permit example</HeadingAnchor>
        <CopyBlock
          label="Copyable permit JSON"
          value={permitExample}
          copyButtonLabel="Copy JSON"
          helperText="Demo schema example for local integration and simulator requests."
        />
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="field-explanations">Field explanations</HeadingAnchor>
        <ul className="space-y-2 text-slate-300">
          <li>
            <span className="font-semibold text-slate-100">version</span>, schema contract identifier. This page
            documents <span className="font-mono text-slate-200">v1</span>.
          </li>
          <li>
            <span className="font-semibold text-slate-100">issuer</span>, source namespace for the permit payload,
            such as <span className="font-mono text-slate-200">demo</span>.
          </li>
          <li>
            <span className="font-semibold text-slate-100">subject</span>, principal authorized to act, including
            typed identity.
          </li>
          <li>
            <span className="font-semibold text-slate-100">action</span>, operation category being requested, such as
            swap.
          </li>
          <li>
            <span className="font-semibold text-slate-100">constraints</span>, execution bounds including amount,
            slippage, TTL cap, and protocol allowlist.
          </li>
          <li>
            <span className="font-semibold text-slate-100">nonce</span>, uniqueness token for replay resistance.
          </li>
          <li>
            <span className="font-semibold text-slate-100">issued_at</span> and <span className="font-semibold text-slate-100">expires_at</span>,
            explicit validity window for time-bound execution.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="deterministic-evaluation-contract">Deterministic evaluation contract</HeadingAnchor>
        <p className="text-slate-300">
          ATF evaluates this contract deterministically. The same effective input and policy context returns the same
          decision and the same <span className="font-mono text-slate-200">receipt_hash</span>.
        </p>
        <p className="text-slate-300">
          Deterministic checks and receipt hashes make financial decisions inspectable and reproducible for audit,
          incident review, and integration testing.
        </p>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="versioning">Versioning</HeadingAnchor>
        <p className="text-slate-300">
          Compatibility promise for v1, changes within v1 remain backward compatible for documented fields and
          semantics.
        </p>
        <p className="text-slate-300">
          Future versions are introduced with explicit version identifiers, migration notes, and side-by-side
          documentation before v1 deprecation timelines are announced.
        </p>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="links">Links</HeadingAnchor>
        <ul className="space-y-2 text-slate-300">
          <li>
            <Link href="/docs/integration-pattern" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
              Integration Pattern
            </Link>
          </li>
          <li>
            <Link href="/demo-policy" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
              Demo Policy
            </Link>
          </li>
          <li>
            <Link href="/docs/policy-examples" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
              Policy Examples
            </Link>
          </li>
          <li>
            <Link href="/atf/simulator" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
              Simulator
            </Link>
          </li>
          <li>
            <Link href="/docs/atf-architecture" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
              ATF Architecture
            </Link>
          </li>
          <li>
            <Link href="/atf/whitepaper" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
              ATF Whitepaper
            </Link>
          </li>
        </ul>
      </section>
    </article>
  );
}
import type { Metadata } from "next";
import { HeadingAnchor } from "@/components/heading-anchor";
import { TrackedLink } from "@/components/tracked-link";

export const metadata: Metadata = {
  title: "ATF CLI",
  description:
    "Run deterministic firewall simulations and verify receipts locally with a single command.",
};

const FIELDS: { name: string; description: string }[] = [
  { name: "ok", description: "Boolean. true when the request completed without errors." },
  { name: "verified", description: "Boolean. true when the CLI confirmed receipt integrity locally." },
  { name: "decision", description: "ALLOWED or BLOCKED. The deterministic policy outcome." },
  { name: "request_id", description: "Unique identifier for this simulation request." },
  { name: "content_hash", description: "Deterministic hash of the canonical response payload." },
  { name: "timestamp", description: "ISO-8601 UTC timestamp when the decision was issued." },
];

export default function DocsCliPage() {
  return (
    <article className="space-y-10">
      {/* ── Header ── */}
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          CLI Reference
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-5xl">
          ATF CLI
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Run deterministic firewall simulations and verify receipts locally.
        </p>
      </header>

      {/* ── A) Quickstart ── */}
      <section className="space-y-4">
        <HeadingAnchor id="quickstart">Quickstart (Paste This)</HeadingAnchor>
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
npx @trucore/atf@1.0.2 simulate --preset swap_small --verify
        </pre>
        <ul className="space-y-2 text-slate-300">
          <li>Calls the production ATF API with a preset swap payload.</li>
          <li>Receives a deterministic ALLOWED or BLOCKED decision.</li>
          <li>Verifies receipt integrity locally via content hash recomputation.</li>
          <li>Zero runtime dependencies. Runs in CI, containers, or air-gapped hosts.</li>
        </ul>
      </section>

      {/* ── B) Example Output ── */}
      <section className="space-y-4">
        <HeadingAnchor id="example-output">Example Output</HeadingAnchor>
        <p className="text-slate-300">
          What the CLI returns after a successful simulation:
        </p>
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`{
  "ok": true,
  "verified": true,
  "decision": "ALLOWED",
  "request_id": "req_1234567890",
  "content_hash": "0xabc123...",
  "timestamp": "2026-02-27T18:42:11Z"
}`}
        </pre>
        <p className="text-sm text-primary-200/80">
          Receipt integrity verified locally via deterministic hashing.
        </p>
      </section>

      {/* ── C) Field Reference ── */}
      <section className="space-y-4">
        <HeadingAnchor id="field-reference">Field Reference</HeadingAnchor>
        <div className="grid gap-3 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div
              key={f.name}
              className="rounded-lg border border-white/10 bg-neutral-950/50 p-4"
            >
              <p className="font-mono text-sm font-semibold text-primary-200">
                {f.name}
              </p>
              <p className="mt-1 text-sm text-slate-300">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── D) Verification Model ── */}
      <section className="space-y-4">
        <HeadingAnchor id="verification-model">
          Verification Model (High-Level)
        </HeadingAnchor>
        <div className="max-w-3xl space-y-4 text-slate-300">
          <p>
            Every ATF decision produces a receipt. The receipt payload is
            serialized in a deterministic, canonical order so that anyone can
            recompute the same hash from the same fields.
          </p>
          <p>
            When you pass <code className="font-mono text-slate-200">--verify</code>,
            the CLI re-serializes the response payload locally and compares the
            resulting digest to the <code className="font-mono text-slate-200">content_hash</code> returned
            by the server. If they match, integrity is confirmed.
          </p>
          <p>
            There are no client secrets involved. The hash function and
            serialization rules are public. Any tool that follows the same
            canonical encoding can independently verify a receipt.
          </p>
          <p>
            No hidden state. No session tokens. No server-side nonce that you
            cannot observe. The receipt is self-contained and fully auditable.
          </p>
          <p>
            For a deeper look at what verification proves (and what it does not), see the{" "}
            <TrackedLink
              href="/docs/verify"
              eventName="docs_cli_verify_link"
              eventProps={{ target: "verify", location: "verification-model" }}
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              Verification reference
            </TrackedLink>.
          </p>
          <p className="font-mono text-sm text-primary-200/80">
            Don&apos;t trust, verify.
          </p>
        </div>
      </section>

      {/* ── E) Next Steps ── */}
      <section className="space-y-4">
        <HeadingAnchor id="next-steps">Next Steps</HeadingAnchor>
        <ul className="space-y-3 text-slate-300">
          <li>
            <TrackedLink
              href="/docs/verify"
              eventName="docs_cli_next_click"
              eventProps={{ target: "verify" }}
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              Verification
            </TrackedLink>{" "}
            &mdash; understand what content_hash proves and how to use it in production.
          </li>
          <li>
            <TrackedLink
              href="/#architecture"
              eventName="docs_cli_next_click"
              eventProps={{ target: "architecture" }}
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              Architecture
            </TrackedLink>{" "}
            &mdash; see what happens under the hood when the CLI calls ATF.
          </li>
          <li>
            <TrackedLink
              href="/security"
              eventName="docs_cli_next_click"
              eventProps={{ target: "security" }}
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              Security posture
            </TrackedLink>{" "}
            &mdash; review threat model, disclosure policy, and audit status.
          </li>
          <li>
            <TrackedLink
              href="/#updates"
              eventName="docs_cli_next_click"
              eventProps={{ target: "updates" }}
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              Get Updates
            </TrackedLink>{" "}
            &mdash; receive release notes and pinned version announcements.
          </li>
        </ul>
      </section>
    </article>
  );
}

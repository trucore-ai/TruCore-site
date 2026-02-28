import type { Metadata } from "next";
import { HeadingAnchor } from "@/components/heading-anchor";
import { TrackedLink } from "@/components/tracked-link";

export const metadata: Metadata = {
  title: "Verification",
  description:
    "Understand what content_hash means, what --verify guarantees, and how to use receipt verification in production.",
};

export default function DocsVerifyPage() {
  return (
    <article className="space-y-10">
      {/* ── Header ── */}
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          Verification Reference
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-5xl">
          Verification
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Understand what{" "}
          <code className="font-mono text-slate-200">content_hash</code> means
          and what{" "}
          <code className="font-mono text-slate-200">--verify</code>{" "}
          guarantees.
        </p>
      </header>

      {/* ── A) What --verify Does ── */}
      <section className="space-y-4">
        <HeadingAnchor id="what-verify-does">
          What <code className="font-mono">--verify</code> Does
        </HeadingAnchor>
        <ul className="space-y-2 text-slate-300">
          <li>
            The CLI sends a simulation request and receives a decision plus a
            receipt from the ATF API.
          </li>
          <li>
            It re-serializes the response payload locally using deterministic,
            canonical ordering.
          </li>
          <li>
            The resulting digest is compared to the{" "}
            <code className="font-mono text-slate-200">content_hash</code>{" "}
            returned by the server. A match confirms integrity.
          </li>
          <li>
            Verification is deterministic and reproducible. The same input and
            policy result always produce the same hash.
          </li>
          <li>
            No client secrets are required. Any tool that follows the same
            canonical encoding can independently verify a receipt.
          </li>
        </ul>
      </section>

      {/* ── B) What content_hash Represents ── */}
      <section className="space-y-4">
        <HeadingAnchor id="content-hash">
          What <code className="font-mono">content_hash</code> Represents
        </HeadingAnchor>
        <div className="max-w-3xl space-y-4 text-slate-300">
          <p>
            <code className="font-mono text-slate-200">content_hash</code> is a
            deterministic fingerprint of the receipt-relevant content. It
            captures the fields that define the decision, serialized in a stable,
            canonical order.
          </p>
          <p>
            For the same input and policy result, the hash is identical across
            runs, environments, and machines. This stability is what makes
            independent verification possible.
          </p>
          <p>
            The primary purpose is tamper detection. If any field in the receipt
            is modified after issuance, the recomputed hash will not match the
            original{" "}
            <code className="font-mono text-slate-200">content_hash</code>,
            and verification fails.
          </p>
        </div>
      </section>

      {/* ── Flow diagram ── */}
      <section className="space-y-4">
        <HeadingAnchor id="verification-flow">Verification Flow</HeadingAnchor>
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4">
          <p className="text-center font-mono text-sm text-slate-200">
            Input &rarr; Decision &rarr; Receipt &rarr; content_hash &rarr;
            verify
          </p>
        </div>
        <p className="text-sm text-slate-400">
          Each step is deterministic. The final verify step recomputes the hash
          locally and compares it to the server-provided value.
        </p>
      </section>

      {/* ── C) What Is Proven vs Not Proven ── */}
      <section className="space-y-4">
        <HeadingAnchor id="proven-vs-not-proven">
          What Is Proven vs. Not Proven
        </HeadingAnchor>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-950/20 p-5">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-emerald-300">
              Proven
            </p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                Receipt integrity matches the deterministic content hash.
              </li>
              <li>Decision payload is internally consistent.</li>
              <li>
                Verification can be reproduced by anyone running the CLI.
              </li>
            </ul>
          </div>
          <div className="rounded-lg border border-amber-400/20 bg-amber-950/20 p-5">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-amber-300">
              Not Proven
            </p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                Underlying policy is &ldquo;correct&rdquo; for your business
                needs.
              </li>
              <li>Upstream RPC or provider behavior.</li>
              <li>External market conditions.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── D) Request Tracing (request_id) ── */}
      <section className="space-y-4">
        <HeadingAnchor id="request-tracing">
          Request Tracing (<code className="font-mono">request_id</code>)
        </HeadingAnchor>
        <div className="max-w-3xl space-y-4 text-slate-300">
          <p>
            Every simulation returns a{" "}
            <code className="font-mono text-slate-200">request_id</code>, a
            unique correlation handle for that request.
          </p>
          <p>
            Use it to tie together logs, receipts, and API calls across your
            pipeline. When debugging or auditing, the{" "}
            <code className="font-mono text-slate-200">request_id</code> is the
            fastest way to locate the exact decision and its associated receipt.
          </p>
          <p>
            In production, storing{" "}
            <code className="font-mono text-slate-200">request_id</code>{" "}
            alongside your internal transaction records creates a clear audit
            trail from intent to enforcement.
          </p>
        </div>
      </section>

      {/* ── E) How to Use This in Production ── */}
      <section className="space-y-4">
        <HeadingAnchor id="production-usage">
          How to Use This in Production
        </HeadingAnchor>
        <div className="max-w-3xl space-y-4 text-slate-300">
          <p>Three practical patterns for integrating verification into your workflow:</p>
          <ul className="space-y-3">
            <li>
              <span className="font-semibold text-slate-100">
                CI checks for deterministic outputs.
              </span>{" "}
              Run the CLI in your CI pipeline and assert that{" "}
              <code className="font-mono text-slate-200">verified</code> is{" "}
              <code className="font-mono text-slate-200">true</code> before
              merging or deploying. Any mismatch fails the build.
            </li>
            <li>
              <span className="font-semibold text-slate-100">
                Agent pipeline gate.
              </span>{" "}
              Before your agent executes a transaction, require{" "}
              <code className="font-mono text-slate-200">
                verified: true
              </code>{" "}
              in the ATF response. If verification fails, halt execution and
              alert your operations team.
            </li>
            <li>
              <span className="font-semibold text-slate-100">
                Receipt archival for audit.
              </span>{" "}
              Store the full receipt JSON alongside the{" "}
              <code className="font-mono text-slate-200">request_id</code> and{" "}
              <code className="font-mono text-slate-200">content_hash</code> in
              your own database. Re-verify at any time to confirm nothing has
              changed.
            </li>
          </ul>
        </div>
      </section>

      {/* ── Callout ── */}
      <div className="rounded-lg border border-primary-300/20 bg-primary-950/20 p-5 text-center">
        <p className="font-mono text-sm text-primary-200/80">
          Don&apos;t trust, verify.
        </p>
      </div>

      {/* ── Next Steps ── */}
      <section className="space-y-4">
        <HeadingAnchor id="next-steps">Next Steps</HeadingAnchor>
        <ul className="space-y-3 text-slate-300">
          <li>
            <TrackedLink
              href="/docs/cli"
              eventName="docs_verify_next_click"
              eventProps={{ target: "cli" }}
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              ATF CLI
            </TrackedLink>{" "}
            , run your first simulation and verify a receipt locally.
          </li>
          <li>
            <TrackedLink
              href="/docs/receipt-specification-v1"
              eventName="docs_verify_next_click"
              eventProps={{ target: "receipt-spec" }}
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              Receipt Specification v1
            </TrackedLink>{" "}
            , the formal RFC-style contract for receipt structure and hash rules.
          </li>
          <li>
            <TrackedLink
              href="/docs/anchoring-roadmap"
              eventName="docs_verify_next_click"
              eventProps={{ target: "anchoring-roadmap" }}
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              Anchoring Roadmap
            </TrackedLink>{" "}
            , see how verification evolves across planned phases.
          </li>
          <li>
            <TrackedLink
              href="/security"
              eventName="docs_verify_next_click"
              eventProps={{ target: "security" }}
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              Security
            </TrackedLink>{" "}
            , review threat model, disclosure policy, and audit status.
          </li>
        </ul>
      </section>
    </article>
  );
}

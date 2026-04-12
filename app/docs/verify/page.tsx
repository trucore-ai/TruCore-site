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
    <article className="space-y-12">
      {/* ── Header ── */}
      <header className="space-y-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Verification Reference
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Verification
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Understand what{" "}
          <code className="rounded-md border border-white/[0.04] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.8125rem] text-slate-200">content_hash</code> means
          and what{" "}
          <code className="rounded-md border border-white/[0.04] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.8125rem] text-slate-200">--verify</code>{" "}
          guarantees.
        </p>
      </header>

      {/* ── Specification reference ── */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
        <p className="text-sm text-slate-300">
          <strong className="text-slate-100">See the specification:</strong>{" "}
          The normative 5-step verification procedure is defined in{" "}
          <a
            href="https://github.com/trucore-ai/atf-spec/blob/main/spec/verification.md"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            atf-spec &rarr; spec/verification.md
          </a>
          . This page explains how to use verification in practice.
        </p>
      </div>

      {/* ── A) What --verify Does ── */}
      <section className="space-y-5">
        <HeadingAnchor id="what-verify-does">
          What <code className="font-mono">--verify</code> Does
        </HeadingAnchor>
        <ul className="space-y-3 text-slate-300">
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
            <code className="rounded-md border border-white/[0.04] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.8125rem] text-slate-200">content_hash</code>{" "}
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
      <section className="space-y-5">
        <HeadingAnchor id="content-hash">
          What <code className="font-mono">content_hash</code> Represents
        </HeadingAnchor>
        <div className="max-w-3xl space-y-4 text-slate-300">
          <p>
            <code className="rounded-md border border-white/[0.04] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.8125rem] text-slate-200">content_hash</code> is a
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
            <code className="rounded-md border border-white/[0.04] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.8125rem] text-slate-200">content_hash</code>,
            and verification fails.
          </p>
        </div>
      </section>

      {/* ── Flow diagram ── */}
      <section className="space-y-5">
        <HeadingAnchor id="verification-flow">Verification Flow</HeadingAnchor>
        <div className="overflow-hidden rounded-xl border border-white/[0.08]" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02), 0 1px 3px rgba(0,0,0,0.3)' }}>
          <div className="flex items-center justify-center gap-3 px-6 py-6 sm:gap-5">
            {["Input", "Decision", "Receipt", "content_hash", "verify"].map((step, i) => (
              <span key={step} className="flex items-center gap-3 sm:gap-5">
                <span className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 font-mono text-sm text-slate-300">{step}</span>
                {i < 4 && (
                  <svg className="h-4 w-4 shrink-0 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </span>
            ))}
          </div>
        </div>
        <p className="text-sm text-slate-500">
          Each step is deterministic. The final verify step recomputes the hash
          locally and compares it to the server-provided value.
        </p>
      </section>

      {/* ── C) What Is Proven vs Not Proven ── */}
      <section className="space-y-5">
        <HeadingAnchor id="proven-vs-not-proven">
          What Is Proven vs. Not Proven
        </HeadingAnchor>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-950/20 p-6">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-400">
              Proven
            </p>
            <ul className="space-y-2.5 text-sm leading-relaxed text-slate-300">
              <li>
                Receipt integrity matches the deterministic content hash.
              </li>
              <li>Decision payload is internally consistent.</li>
              <li>
                Verification can be reproduced by anyone running the CLI.
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-amber-400/20 bg-amber-950/20 p-6">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-400">
              Not Proven
            </p>
            <ul className="space-y-2.5 text-sm leading-relaxed text-slate-300">
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
      <section className="space-y-5">
        <HeadingAnchor id="request-tracing">
          Request Tracing (<code className="font-mono">request_id</code>)
        </HeadingAnchor>
        <div className="max-w-3xl space-y-4 text-slate-300">
          <p>
            Every simulation returns a{" "}
            <code className="rounded-md border border-white/[0.04] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.8125rem] text-slate-200">request_id</code>, a
            unique correlation handle for that request.
          </p>
          <p>
            Use it to tie together logs, receipts, and API calls across your
            pipeline. When debugging or auditing, the{" "}
            <code className="rounded-md border border-white/[0.04] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.8125rem] text-slate-200">request_id</code> is the
            fastest way to locate the exact decision and its associated receipt.
          </p>
          <p>
            In production, storing{" "}
            <code className="rounded-md border border-white/[0.04] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.8125rem] text-slate-200">request_id</code>{" "}
            alongside your internal transaction records creates a clear audit
            trail from intent to enforcement.
          </p>
        </div>
      </section>

      {/* ── E) How to Use This in Production ── */}
      <section className="space-y-5">
        <HeadingAnchor id="production-usage">
          How to Use This in Production
        </HeadingAnchor>
        <div className="max-w-3xl space-y-4 text-slate-300">
          <p>Three practical patterns for integrating verification into your workflow:</p>
          <div className="space-y-4">
            <div className="docs-info-card">
              <p className="text-sm font-semibold text-slate-100">
                CI checks for deterministic outputs
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                Run the CLI in your CI pipeline and assert that{" "}
                <code className="rounded-md border border-white/[0.04] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.8125rem] text-slate-200">verified</code> is{" "}
                <code className="rounded-md border border-white/[0.04] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.8125rem] text-slate-200">true</code> before
                merging or deploying. Any mismatch fails the build.
              </p>
            </div>
            <div className="docs-info-card">
              <p className="text-sm font-semibold text-slate-100">
                Agent pipeline gate
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                Before your agent executes a transaction, require{" "}
                <code className="rounded-md border border-white/[0.04] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.8125rem] text-slate-200">
                  verified: true
                </code>{" "}
                in the ATF response. If verification fails, halt execution and
                alert your operations team.
              </p>
            </div>
            <div className="docs-info-card">
              <p className="text-sm font-semibold text-slate-100">
                Receipt archival for audit
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                Store the full receipt JSON alongside the{" "}
                <code className="rounded-md border border-white/[0.04] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.8125rem] text-slate-200">request_id</code> and{" "}
                <code className="rounded-md border border-white/[0.04] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.8125rem] text-slate-200">content_hash</code> in
                your own database. Re-verify at any time to confirm nothing has
                changed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Callout ── */}
      <div className="rounded-xl border border-primary-300/15 bg-primary-950/20 py-6 text-center">
        <p className="font-mono text-sm tracking-wide text-primary-300/80">
          Don&apos;t trust, verify.
        </p>
      </div>

      {/* ── Next Steps ── */}
      <section className="space-y-5">
        <HeadingAnchor id="next-steps">Next Steps</HeadingAnchor>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="docs-info-card">
            <TrackedLink
              href="/docs/first-protected-trade"
              eventName="docs_verify_next_click"
              eventProps={{ target: "first-protected-trade" }}
              className="text-base font-semibold text-primary-200 transition-colors hover:text-primary-100"
            >
              First Protected Trade
            </TrackedLink>
            <p className="mt-1.5 text-sm text-slate-400">Protect an intent, receive a receipt, and verify it end-to-end.</p>
          </div>
          <div className="docs-info-card">
            <TrackedLink
              href="/docs/cli"
              eventName="docs_verify_next_click"
              eventProps={{ target: "cli" }}
              className="text-base font-semibold text-primary-200 transition-colors hover:text-primary-100"
            >
              ATF CLI
            </TrackedLink>
            <p className="mt-1.5 text-sm text-slate-400">Run your first simulation and verify a receipt locally.</p>
          </div>
          <div className="docs-info-card">
            <TrackedLink
              href="/docs/receipt-specification-v1"
              eventName="docs_verify_next_click"
              eventProps={{ target: "receipt-spec" }}
              className="text-base font-semibold text-primary-200 transition-colors hover:text-primary-100"
            >
              Receipt Specification v1
            </TrackedLink>
            <p className="mt-1.5 text-sm text-slate-400">The formal RFC-style contract for receipt structure and hash rules.</p>
          </div>
          <div className="docs-info-card">
            <TrackedLink
              href="/docs/anchoring-roadmap"
              eventName="docs_verify_next_click"
              eventProps={{ target: "anchoring-roadmap" }}
              className="text-base font-semibold text-primary-200 transition-colors hover:text-primary-100"
            >
              Anchoring Roadmap
            </TrackedLink>
            <p className="mt-1.5 text-sm text-slate-400">See how verification evolves across planned phases.</p>
          </div>
          <div className="docs-info-card">
            <TrackedLink
              href="/security"
              eventName="docs_verify_next_click"
              eventProps={{ target: "security" }}
              className="text-base font-semibold text-primary-200 transition-colors hover:text-primary-100"
            >
              Security
            </TrackedLink>
            <p className="mt-1.5 text-sm text-slate-400">Review threat model, disclosure policy, and audit status.</p>
          </div>
          <div className="docs-info-card">
            <TrackedLink
              href="/r/example"
              eventName="docs_verify_next_click"
              eventProps={{ target: "example-receipt" }}
              className="text-base font-semibold text-primary-200 transition-colors hover:text-primary-100"
            >
              Example Verified Receipt
            </TrackedLink>
            <p className="mt-1.5 text-sm text-slate-400">A stable, canonical receipt you can inspect and share.</p>
          </div>
        </div>
      </section>
    </article>
  );
}

import type { Metadata } from "next";
import { HeadingAnchor } from "@/components/heading-anchor";
import { TrackedLink } from "@/components/tracked-link";

export const metadata: Metadata = {
  title: "ATF API",
  description:
    "Public endpoints for deterministic simulation and receipt generation.",
};

const RESPONSE_FIELDS: { name: string; description: string }[] = [
  { name: "ok", description: "API success indicator. true when the request completed without errors." },
  { name: "verified", description: "CLI verification result. true when using --verify and receipt integrity is confirmed." },
  { name: "decision", description: "ALLOWED or BLOCKED. The deterministic policy outcome." },
  { name: "request_id", description: "Correlation handle for this simulation request." },
  { name: "content_hash", description: "Deterministic receipt fingerprint computed from the canonical response payload." },
  { name: "timestamp", description: "ISO-8601 UTC timestamp when the decision was issued." },
];

export default function DocsApiPage() {
  return (
    <article className="space-y-12">
      {/* ── Header ── */}
      <header className="space-y-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
          API Reference
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          ATF API
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Public endpoints for deterministic simulation and receipt generation.
          Every response is reproducible and independently verifiable.
        </p>
      </header>

      {/* ── A) Base Endpoint ── */}
      <section className="space-y-5">
        <HeadingAnchor id="base-endpoint">Base Endpoint</HeadingAnchor>
        <div className="max-w-3xl space-y-4 text-slate-300">
          <p>
            Production base URL:
          </p>
          <div className="rounded-xl border border-white/[0.08] bg-neutral-950/70 p-5" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02), 0 1px 3px rgba(0,0,0,0.3)' }}>
            <pre className="font-mono text-[0.8125rem] text-primary-200">https://api.trucore.xyz</pre>
          </div>
          <ul className="space-y-2">
            <li>The API is served behind a Caddy reverse proxy.</li>
            <li>HTTPS is required for all requests.</li>
          </ul>
        </div>
      </section>

      {/* ── B) Endpoint: POST /v1/simulate ── */}
      <section className="space-y-5">
        <HeadingAnchor id="post-v1-simulate">POST /v1/simulate</HeadingAnchor>
        <div className="max-w-3xl space-y-4 text-slate-300">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="docs-info-card">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Method</p>
              <p className="mt-1.5 font-mono text-sm font-semibold text-primary-200">POST</p>
            </div>
            <div className="docs-info-card">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Path</p>
              <p className="mt-1.5 font-mono text-sm font-semibold text-primary-200">/v1/simulate</p>
            </div>
            <div className="docs-info-card">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Alias</p>
              <p className="mt-1.5 font-mono text-sm font-semibold text-primary-200">/api/simulate</p>
            </div>
          </div>
          <p>
            Primary deterministic simulation endpoint. Accepts a preset or payload,
            evaluates it against the active policy, and returns a decision with a
            tamper-evident receipt.
          </p>
        </div>
      </section>

      {/* ── C) Headers ── */}
      <section className="space-y-5">
        <HeadingAnchor id="headers">Headers</HeadingAnchor>
        <div className="max-w-3xl space-y-4 text-slate-300">
          <div className="docs-info-card">
            <p className="font-mono text-sm font-semibold text-primary-200">
              Content-Type: application/json
            </p>
            <p className="mt-1.5 text-sm text-slate-500">Required.</p>
          </div>
          <div className="docs-info-card">
            <p className="font-mono text-sm font-semibold text-primary-200">
              X-Request-ID
            </p>
            <p className="mt-1.5 text-sm text-slate-300">
              Optional string. Used for correlation and passed through into the receipt.
              If omitted, the server generates one automatically.
            </p>
          </div>
        </div>
      </section>

      {/* ── D) Request Body ── */}
      <section className="space-y-5">
        <HeadingAnchor id="request-body">Request Body</HeadingAnchor>
        <div className="max-w-3xl space-y-4 text-slate-300">
          <div className="overflow-hidden rounded-xl border border-white/[0.08]" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02), 0 1px 3px rgba(0,0,0,0.3)' }}>
            <div className="flex items-center border-b border-white/[0.06] px-4 py-2.5" style={{ background: 'rgba(255,255,255,0.015)' }}>
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">JSON Body</span>
            </div>
            <pre className="p-5 font-mono text-[0.8125rem] leading-relaxed text-slate-200">
{`{
  "preset": "swap_small"
}`}
            </pre>
          </div>
          <ul className="space-y-2">
            <li>
              <code className="rounded-md border border-white/[0.04] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.8125rem] text-slate-200">preset</code> selects a deterministic test scenario.
            </li>
            <li>Future versions may support explicit payloads alongside presets.</li>
          </ul>
        </div>
      </section>

      {/* ── E) Example Response ── */}
      <section className="space-y-5">
        <HeadingAnchor id="response">Example Response</HeadingAnchor>
        <div className="max-w-3xl">
          <div className="overflow-hidden rounded-xl border border-white/[0.08]" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02), 0 1px 3px rgba(0,0,0,0.3)' }}>
            <div className="flex items-center border-b border-white/[0.06] px-4 py-2.5" style={{ background: 'rgba(255,255,255,0.015)' }}>
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">200 OK</span>
            </div>
            <pre className="p-5 font-mono text-[0.8125rem] leading-relaxed text-slate-200">
{`{
  "ok": true,
  "verified": true,
  "decision": "ALLOWED",
  "request_id": "req_1234567890",
  "content_hash": "0xabc123...",
  "timestamp": "2026-02-27T18:42:11Z"
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* ── Response Field Reference ── */}
      <section className="space-y-5">
        <HeadingAnchor id="field-reference">Response Field Reference</HeadingAnchor>
        <div className="grid gap-3 sm:grid-cols-2">
          {RESPONSE_FIELDS.map((f) => (
            <div
              key={f.name}
              className="docs-info-card"
            >
              <p className="font-mono text-sm font-semibold text-primary-200">
                {f.name}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── F) Determinism Guarantee ── */}
      <section className="space-y-5">
        <HeadingAnchor id="determinism">Determinism Guarantee</HeadingAnchor>
        <div className="max-w-3xl space-y-4 text-slate-300">
          <p>
            The same input combined with the same policy state always produces the
            same <code className="rounded-md border border-white/[0.04] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.8125rem] text-slate-200">content_hash</code>.
            This is by design. ATF responses are deterministic and reproducible,
            which enables independent verification workflows across environments
            and toolchains.
          </p>
        </div>
      </section>

      {/* ── G) Error Handling ── */}
      <section className="space-y-5">
        <HeadingAnchor id="errors">Error Handling</HeadingAnchor>
        <div className="max-w-3xl space-y-4">
          <div className="overflow-hidden rounded-xl border border-white/[0.08]" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02), 0 1px 3px rgba(0,0,0,0.3)' }}>
            <div className="flex items-center border-b border-white/[0.06] px-4 py-2.5" style={{ background: 'rgba(255,255,255,0.015)' }}>
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Error Response</span>
            </div>
            <pre className="p-5 font-mono text-[0.8125rem] leading-relaxed text-slate-200">
{`{
  "ok": false,
  "error": "invalid_preset"
}`}
            </pre>
          </div>
          <ul className="space-y-2 text-slate-300">
            <li>
              <code className="rounded-md border border-white/[0.04] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.8125rem] text-slate-200">ok: false</code> indicates the request failed.
            </li>
            <li>
              <code className="rounded-md border border-white/[0.04] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.8125rem] text-slate-200">error</code> provides a machine-readable reason string.
            </li>
            <li>
              <code className="rounded-md border border-white/[0.04] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.8125rem] text-slate-200">request_id</code> may still be included for correlation.
            </li>
          </ul>
        </div>
      </section>

      {/* ── H) Next Steps ── */}
      <section className="space-y-5">
        <HeadingAnchor id="next-steps">Next Steps</HeadingAnchor>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="docs-info-card">
            <TrackedLink
              href="/docs/cli"
              eventName="docs_api_next_click"
              eventProps={{ target: "cli" }}
              className="text-base font-semibold text-primary-200 transition-colors hover:text-primary-100"
            >
              CLI Reference
            </TrackedLink>
            <p className="mt-1.5 text-sm text-slate-400">Run simulations and verify receipts from the command line.</p>
          </div>
          <div className="docs-info-card">
            <TrackedLink
              href="/docs/verify"
              eventName="docs_api_next_click"
              eventProps={{ target: "verify" }}
              className="text-base font-semibold text-primary-200 transition-colors hover:text-primary-100"
            >
              Verification
            </TrackedLink>
            <p className="mt-1.5 text-sm text-slate-400">Learn what content_hash proves and how to use receipt verification in production.</p>
          </div>
          <div className="docs-info-card">
            <TrackedLink
              href="/security"
              eventName="docs_api_next_click"
              eventProps={{ target: "security" }}
              className="text-base font-semibold text-primary-200 transition-colors hover:text-primary-100"
            >
              Security
            </TrackedLink>
            <p className="mt-1.5 text-sm text-slate-400">Review threat model, disclosure policy, and audit status.</p>
          </div>
          <div className="docs-info-card">
            <TrackedLink
              href="/#updates"
              eventName="docs_api_next_click"
              eventProps={{ target: "roadmap" }}
              className="text-base font-semibold text-primary-200 transition-colors hover:text-primary-100"
            >
              Roadmap
            </TrackedLink>
            <p className="mt-1.5 text-sm text-slate-400">See planned phases and upcoming capabilities.</p>
          </div>
        </div>
      </section>
    </article>
  );
}

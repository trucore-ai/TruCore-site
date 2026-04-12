import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";

export const metadata: Metadata = {
  title: "Terminology & Endpoint Glossary",
  description:
    "Reference mapping of ATF terms across spec, API, CLI, and UI surfaces. Endpoint comparison for protect vs simulate flows.",
};

export default function TerminologyAndEndpointsPage() {
  return (
    <article className="space-y-12">
      {/* ── Header ── */}
      <header className="space-y-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Reference
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Terminology &amp; Endpoint Glossary
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          ATF uses different terms at different layers — spec, API, CLI, and UI.
          The differences are intentional: each surface optimizes for its audience.
          This page maps every public term to its canonical meaning.
        </p>
      </header>

      {/* ── Specification reference ── */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
        <p className="text-sm text-slate-300">
          <strong className="text-slate-100">See the specification:</strong>{" "}
          The normative receipt format is defined in{" "}
          <a
            href="https://github.com/trucore-ai/atf-spec/blob/main/spec/receipt.md"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            atf-spec &rarr; spec/receipt.md
          </a>
          . The normative verification procedure is in{" "}
          <a
            href="https://github.com/trucore-ai/atf-spec/blob/main/spec/verification.md"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            spec/verification.md
          </a>
          .
        </p>
      </div>

      {/* ── 1. Why Different Terms? ── */}
      <section className="space-y-4">
        <HeadingAnchor id="why-different-terms">
          Why ATF Uses Different Terms at Different Layers
        </HeadingAnchor>
        <p className="text-slate-300">
          ATF documentation spans four surfaces, each with its own audience:
        </p>
        <ul className="ml-6 list-disc space-y-2 text-slate-300">
          <li>
            <strong className="text-slate-100">Specification</strong> (atf-spec)
            &mdash; normative, machine-precise, for implementors and auditors
          </li>
          <li>
            <strong className="text-slate-100">API / product docs</strong> (this
            site) &mdash; human-friendly, for developers integrating the API
          </li>
          <li>
            <strong className="text-slate-100">CLI</strong> &mdash; terse,
            for terminal output and scripting
          </li>
          <li>
            <strong className="text-slate-100">UI / dashboard</strong> &mdash;
            uppercase status labels, for at-a-glance readability
          </li>
        </ul>
        <p className="text-slate-300">
          When you see <code className="rounded-md border border-white/[0.04] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.8125rem] text-slate-200">&quot;approved&quot;</code>{" "}
          in an API response and <code className="rounded-md border border-white/[0.04] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.8125rem] text-slate-200">&quot;allow&quot;</code>{" "}
          in the spec, they represent the same decision viewed through different
          lenses. Neither is wrong &mdash; they are different layers of the same system.
        </p>
      </section>

      {/* ── 2. Decision Terminology ── */}
      <section className="space-y-5">
        <HeadingAnchor id="decision-terms">Decision Terminology</HeadingAnchor>
        <p className="text-slate-300">
          The most visible terminology difference is how a policy decision is expressed.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="py-3 pr-4 font-semibold text-slate-200">Surface</th>
                <th className="py-3 pr-4 font-semibold text-slate-200">Allow value</th>
                <th className="py-3 pr-4 font-semibold text-slate-200">Deny value</th>
                <th className="py-3 pr-4 font-semibold text-slate-200">Error value</th>
                <th className="py-3 font-semibold text-slate-200">Field / context</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/5">
                <td className="py-3 pr-4 font-medium text-slate-100">Spec (normative)</td>
                <td className="py-3 pr-4"><code className="font-mono text-emerald-400">&quot;allow&quot;</code></td>
                <td className="py-3 pr-4"><code className="font-mono text-red-400">&quot;deny&quot;</code></td>
                <td className="py-3 pr-4"><code className="font-mono text-amber-400">&quot;error&quot;</code></td>
                <td className="py-3"><code className="font-mono text-slate-400">decision.status</code></td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 pr-4 font-medium text-slate-100">API response</td>
                <td className="py-3 pr-4"><code className="font-mono text-emerald-400">&quot;approved&quot;</code></td>
                <td className="py-3 pr-4"><code className="font-mono text-red-400">&quot;denied&quot;</code></td>
                <td className="py-3 pr-4 text-slate-500">&mdash;</td>
                <td className="py-3"><code className="font-mono text-slate-400">receipt.decision</code></td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 pr-4 font-medium text-slate-100">API boolean</td>
                <td className="py-3 pr-4"><code className="font-mono text-emerald-400">true</code></td>
                <td className="py-3 pr-4"><code className="font-mono text-red-400">false</code></td>
                <td className="py-3 pr-4"><code className="font-mono text-red-400">false</code></td>
                <td className="py-3"><code className="font-mono text-slate-400">allow</code> (top-level)</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 pr-4 font-medium text-slate-100">CLI exit code</td>
                <td className="py-3 pr-4"><code className="font-mono text-emerald-400">0</code></td>
                <td className="py-3 pr-4"><code className="font-mono text-red-400">20</code></td>
                <td className="py-3 pr-4"><code className="font-mono text-amber-400">31</code></td>
                <td className="py-3 text-slate-400">process exit code</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 pr-4 font-medium text-slate-100">UI / dashboard</td>
                <td className="py-3 pr-4"><code className="font-mono text-emerald-400">ALLOWED</code></td>
                <td className="py-3 pr-4"><code className="font-mono text-red-400">DENIED</code></td>
                <td className="py-3 pr-4"><code className="font-mono text-amber-400">UNKNOWN</code></td>
                <td className="py-3 text-slate-400">status badge</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium text-slate-100">Product spec (v1)</td>
                <td className="py-3 pr-4"><code className="font-mono text-emerald-400">&quot;allowed&quot;</code></td>
                <td className="py-3 pr-4"><code className="font-mono text-red-400">&quot;denied&quot;</code></td>
                <td className="py-3 pr-4 text-slate-500">&mdash;</td>
                <td className="py-3"><code className="font-mono text-slate-400">result.status</code></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-slate-400">
          Canonical source:{" "}
          <a
            href="https://github.com/trucore-ai/atf-spec/blob/main/spec/receipt.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-200 transition-colors hover:text-primary-100"
          >
            spec/receipt.md
          </a>{" "}
          defines <code className="font-mono text-slate-300">decision.status</code> as the
          normative enum: <code className="font-mono text-slate-300">&quot;allow&quot;</code> |{" "}
          <code className="font-mono text-slate-300">&quot;deny&quot;</code> |{" "}
          <code className="font-mono text-slate-300">&quot;error&quot;</code>.
          All other surfaces are presentation-layer mappings of this value.
        </p>
      </section>

      {/* ── 3. Hash Terminology ── */}
      <section className="space-y-5">
        <HeadingAnchor id="hash-terms">Hash Terminology</HeadingAnchor>
        <p className="text-slate-300">
          Two hash field names appear across ATF documentation. They describe the
          same cryptographic operation but appear at different layers.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="py-3 pr-4 font-semibold text-slate-200">Term</th>
                <th className="py-3 pr-4 font-semibold text-slate-200">Surface</th>
                <th className="py-3 pr-4 font-semibold text-slate-200">Definition</th>
                <th className="py-3 font-semibold text-slate-200">Appears in</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/5">
                <td className="py-3 pr-4 font-medium text-slate-100">
                  <code className="font-mono">content_hash</code>
                </td>
                <td className="py-3 pr-4">Spec &amp; API</td>
                <td className="py-3 pr-4">
                  SHA-256 hex digest of the JCS-canonicalized receipt, excluding the
                  hash field itself. 64 lowercase hex characters.
                </td>
                <td className="py-3 text-slate-400">
                  spec/receipt.md, API responses, verification procedure
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium text-slate-100">
                  <code className="font-mono">receipt_hash</code>
                </td>
                <td className="py-3 pr-4">Product docs &amp; signing layer</td>
                <td className="py-3 pr-4">
                  Same SHA-256 computation. Used in the product-level receipt spec (v1),
                  the signing endpoint, and execution receipts for on-chain anchoring.
                </td>
                <td className="py-3 text-slate-400">
                  receipt-specification-v1, anchoring-roadmap, signing API
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-slate-400">
          In practice, <code className="font-mono text-slate-300">content_hash</code> and{" "}
          <code className="font-mono text-slate-300">receipt_hash</code> refer to the same
          value &mdash; a deterministic SHA-256 over the canonical receipt data.
          The spec uses <code className="font-mono text-slate-300">content_hash</code>;
          the product layer uses <code className="font-mono text-slate-300">receipt_hash</code>{" "}
          when the hash is an input to signing or on-chain anchoring.
        </p>
      </section>

      {/* ── 4. Concept Terminology ── */}
      <section className="space-y-5">
        <HeadingAnchor id="concept-terms">Concept Terminology</HeadingAnchor>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="py-3 pr-4 font-semibold text-slate-200">Term pair</th>
                <th className="py-3 pr-4 font-semibold text-slate-200">Distinction</th>
                <th className="py-3 font-semibold text-slate-200">When you will see each</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/5">
                <td className="py-3 pr-4 font-medium text-slate-100">receipt vs. proof</td>
                <td className="py-3 pr-4">
                  <strong className="text-slate-100">Receipt</strong> is the JSON artifact.{" "}
                  <strong className="text-slate-100">Proof</strong> is the concept of evidence.
                </td>
                <td className="py-3">
                  Spec and API always say &ldquo;receipt.&rdquo;
                  Tutorials use &ldquo;proof&rdquo; when explaining why receipts matter.
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 pr-4 font-medium text-slate-100">verification vs. trust</td>
                <td className="py-3 pr-4">
                  <strong className="text-slate-100">Verification</strong> is the deterministic
                  5-step process for confirming receipt integrity.{" "}
                  <strong className="text-slate-100">Trust</strong> is the design philosophy
                  (zero-trust by default).
                </td>
                <td className="py-3">
                  &ldquo;Verification&rdquo; in technical docs and CLI.
                  &ldquo;Trust&rdquo; in architecture and threat-model discussions.
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium text-slate-100">simulate vs. protect</td>
                <td className="py-3 pr-4">
                  <strong className="text-slate-100">Simulate</strong> evaluates
                  policy without enforcement (advisory).{" "}
                  <strong className="text-slate-100">Protect</strong> enforces the decision and
                  stores a receipt (authoritative).
                </td>
                <td className="py-3">
                  Quickstart uses simulate. Production flows use protect.
                  See the endpoint table below.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 5. Endpoint Comparison ── */}
      <section className="space-y-5">
        <HeadingAnchor id="endpoint-comparison">Endpoint Comparison</HeadingAnchor>
        <p className="text-slate-300">
          Two primary intent-evaluation endpoints appear in public tutorials.
          They serve different roles.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="py-3 pr-4 font-semibold text-slate-200">Endpoint</th>
                <th className="py-3 pr-4 font-semibold text-slate-200">Mode</th>
                <th className="py-3 pr-4 font-semibold text-slate-200">Purpose</th>
                <th className="py-3 pr-4 font-semibold text-slate-200">Audience</th>
                <th className="py-3 font-semibold text-slate-200">Where documented</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/5">
                <td className="py-3 pr-4 font-medium text-slate-100">
                  <code className="font-mono">POST /v1/bot/protect</code>
                </td>
                <td className="py-3 pr-4">
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                    Authoritative
                  </span>
                </td>
                <td className="py-3 pr-4">
                  Enforces policy. Returns{" "}
                  <code className="font-mono text-slate-400">allow</code> boolean + receipt
                  with <code className="font-mono text-slate-400">content_hash</code>.
                  The receipt is stored and verifiable.
                </td>
                <td className="py-3 pr-4">Production bots</td>
                <td className="py-3">
                  <Link href="/docs/first-protected-trade" className="text-primary-200 transition-colors hover:text-primary-100">
                    First Protected Trade
                  </Link>
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 pr-4 font-medium text-slate-100">
                  <code className="font-mono">POST /api/simulate</code>
                </td>
                <td className="py-3 pr-4">
                  <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-inset ring-amber-500/20">
                    Advisory
                  </span>
                </td>
                <td className="py-3 pr-4">
                  Evaluates policy without enforcement. No receipt is stored.
                  Rate limited (30 req/min public, 120 keyed).
                </td>
                <td className="py-3 pr-4">Quickstart &amp; sandbox</td>
                <td className="py-3">
                  <Link href="/docs/5-minute-quickstart" className="text-primary-200 transition-colors hover:text-primary-100">
                    5-Minute Quickstart
                  </Link>
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium text-slate-100">
                  <code className="font-mono">POST /v1/receipts/verify</code>
                </td>
                <td className="py-3 pr-4">
                  <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20">
                    Verification
                  </span>
                </td>
                <td className="py-3 pr-4">
                  Verifies receipt integrity by recomputing and comparing{" "}
                  <code className="font-mono text-slate-400">content_hash</code>.
                  Returns <code className="font-mono text-slate-400">valid: true/false</code>.
                </td>
                <td className="py-3 pr-4">Any verifier</td>
                <td className="py-3">
                  <Link href="/docs/verify" className="text-primary-200 transition-colors hover:text-primary-100">
                    Verification
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-slate-400">
          MCP equivalents:{" "}
          <code className="font-mono text-slate-300">protect_transaction</code> (authoritative),{" "}
          <code className="font-mono text-slate-300">simulate_transaction</code> (advisory),{" "}
          <code className="font-mono text-slate-300">verify_receipt</code> (verification).
          See{" "}
          <Link href="/docs/mcp" className="text-primary-200 transition-colors hover:text-primary-100">
            MCP Integration
          </Link>{" "}
          for tool details.
        </p>
      </section>

      {/* ── 6. Which Term Should I Use? ── */}
      <section className="space-y-5">
        <HeadingAnchor id="which-term">Which Term Should I Use?</HeadingAnchor>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="py-3 pr-4 font-semibold text-slate-200">If you are&hellip;</th>
                <th className="py-3 font-semibold text-slate-200">Use these terms</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/5">
                <td className="py-3 pr-4">Writing a spec-compliant verifier</td>
                <td className="py-3">
                  <code className="font-mono">decision.status</code>,{" "}
                  <code className="font-mono">content_hash</code>,{" "}
                  <code className="font-mono">&quot;allow&quot;</code> /{" "}
                  <code className="font-mono">&quot;deny&quot;</code> /{" "}
                  <code className="font-mono">&quot;error&quot;</code>
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 pr-4">Integrating the REST API</td>
                <td className="py-3">
                  <code className="font-mono">allow</code> (boolean),{" "}
                  <code className="font-mono">receipt.decision</code>,{" "}
                  <code className="font-mono">receipt.content_hash</code>
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 pr-4">Scripting with the CLI</td>
                <td className="py-3">
                  Exit code <code className="font-mono">0</code> (allow) or{" "}
                  <code className="font-mono">20</code> (deny).
                  Use <code className="font-mono">atf bot protect --stdin</code>
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 pr-4">Building UI that displays decisions</td>
                <td className="py-3">
                  <code className="font-mono">ALLOWED</code> /{" "}
                  <code className="font-mono">DENIED</code> /{" "}
                  <code className="font-mono">UNKNOWN</code> (uppercase badges)
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4">Calling the signing or anchoring API</td>
                <td className="py-3">
                  <code className="font-mono">receipt_hash</code> (same value as{" "}
                  <code className="font-mono">content_hash</code>)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Related Pages ── */}
      <section className="space-y-4">
        <HeadingAnchor id="related">Related Pages</HeadingAnchor>
        <ul className="space-y-2 text-sm">
          <li>
            <Link
              href="/docs/receipts-and-trust"
              className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
            >
              Receipts &amp; Trust &rarr;
            </Link>{" "}
            <span className="text-slate-400">What receipts prove and how to verify them</span>
          </li>
          <li>
            <Link
              href="/docs/receipt-specification-v1"
              className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
            >
              Receipt Specification v1 &rarr;
            </Link>{" "}
            <span className="text-slate-400">Product-level receipt format and fields</span>
          </li>
          <li>
            <Link
              href="/docs/verify"
              className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
            >
              Verification &rarr;
            </Link>{" "}
            <span className="text-slate-400">content_hash in depth and --verify usage</span>
          </li>
          <li>
            <Link
              href="/docs/first-protected-trade"
              className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
            >
              First Protected Trade &rarr;
            </Link>{" "}
            <span className="text-slate-400">Golden path walkthrough using /v1/bot/protect</span>
          </li>
          <li>
            <Link
              href="/docs/mcp"
              className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
            >
              MCP Integration &rarr;
            </Link>{" "}
            <span className="text-slate-400">MCP tool names and advisory vs authoritative</span>
          </li>
          <li>
            <a
              href="https://github.com/trucore-ai/atf-spec/blob/main/spec/receipt.md"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
            >
              atf-spec &rarr; spec/receipt.md
            </a>{" "}
            <span className="text-slate-400">Normative receipt format (decision.status, content_hash)</span>
          </li>
          <li>
            <a
              href="https://github.com/trucore-ai/atf-spec/blob/main/spec/verification.md"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
            >
              atf-spec &rarr; spec/verification.md
            </a>{" "}
            <span className="text-slate-400">Normative 5-step verification procedure</span>
          </li>
        </ul>
      </section>
    </article>
  );
}

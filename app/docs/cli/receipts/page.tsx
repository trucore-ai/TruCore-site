import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { AtfCopyCommand } from "@/components/atf-copy-command";
import { TrackedLink } from "@/components/tracked-link";
import { getAtfCliVersion } from "@/lib/version";

export const metadata: Metadata = {
  title: "ATF CLI: Receipts & Verification",
  description:
    "Verify receipt integrity locally via deterministic hash recomputation with the ATF CLI receipts commands.",
};

const cliVersion = getAtfCliVersion();

export default function ReceiptsPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          CLI &rsaquo; Receipts
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-5xl">
          Receipts &amp; Verification
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Every ATF decision produces a receipt with a deterministic content hash.
          Verify receipt integrity locally without trusting the server.
        </p>
      </header>

      <section className="space-y-4">
        <HeadingAnchor id="verify">Verify a Receipt</HeadingAnchor>
        <p className="text-sm text-slate-300">
          The CLI recomputes the content hash from the receipt fields using the same
          canonical serialization the server used. If the hashes match, integrity is confirmed.
        </p>
        <AtfCopyCommand
          label="Verify last receipt"
          command={`npx @trucore/atf@${cliVersion} receipts verify --receipt last`}
        />
        <AtfCopyCommand
          label="Verify specific receipt"
          command={`npx @trucore/atf@${cliVersion} receipts verify --id req_1234567890`}
        />
        <AtfCopyCommand
          label="Verify from JSON file"
          command={`npx @trucore/atf@${cliVersion} receipts verify --file ./receipt.json`}
        />
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="verify-output">Verification Output</HeadingAnchor>
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`Receipt: req_1234567890
Decision: ALLOWED
Content hash (server):  0xabc123...
Content hash (local):   0xabc123...
Status: ✔ Integrity verified

The local hash matches the server hash.
No client secrets involved. Anyone can reproduce this check.`}
        </pre>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="how-it-works">How Deterministic Verification Works</HeadingAnchor>
        <div className="max-w-3xl space-y-3 text-slate-300">
          <p>
            The receipt payload is serialized in a deterministic, canonical order.
            Given the same fields, any tool that follows the same encoding will produce the same hash.
          </p>
          <p>
            When you run <code className="font-mono text-slate-200">receipts verify</code>,
            the CLI takes the response fields, sorts them canonically, serializes them, and hashes the result.
            It then compares that hash to the <code className="font-mono text-slate-200">content_hash</code> the server returned.
          </p>
          <p>
            No secrets, no tokens, no server-side nonces you cannot observe.
            The receipt is self-contained and fully auditable.
          </p>
          <p>
            For the full specification of the hash rules, see the{" "}
            <TrackedLink
              href="/docs/verify"
              eventName="docs_cli_verify_link"
              eventProps={{ target: "verify", location: "receipts" }}
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              Verification reference
            </TrackedLink>.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="list">List Receipts</HeadingAnchor>
        <p className="text-sm text-slate-300">
          View locally cached receipts from previous simulations.
        </p>
        <AtfCopyCommand
          label="List receipts"
          command={`npx @trucore/atf@${cliVersion} receipts list`}
        />
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`ID                 Decision   Verified   Timestamp
req_1234567890     ALLOWED    ✔          2026-02-27T18:42:11Z
req_0987654321     BLOCKED    ✔          2026-02-27T18:40:05Z
req_5555555555     ALLOWED    ✔          2026-02-27T18:38:22Z`}
        </pre>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="local-verify-gate">Local Verify Gate</HeadingAnchor>
        <div className="max-w-3xl space-y-3 text-slate-300">
          <p>
            In production, you can use receipt verification as a gate before execution.
            Only execute transactions where the local hash matches and the decision is ALLOWED.
          </p>
          <p>
            This gives you a trustless check that the policy engine behaved correctly,
            without relying on server-side assertions alone.
          </p>
        </div>
        <div className="rounded-lg border border-primary-300/20 bg-primary-950/10 p-4 space-y-3">
          <p className="text-sm font-semibold text-primary-100">How the verify gate works in practice:</p>
          <ol className="list-decimal space-y-1 pl-6 text-sm text-slate-300">
            <li>Your agent or script calls <code className="font-mono text-slate-200">simulate --verify</code>.</li>
            <li>The CLI receives the policy decision and receipt from the ATF API.</li>
            <li>The CLI recomputes the content hash locally from the receipt fields.</li>
            <li>If the local hash matches the server hash and the decision is ALLOWED, the gate passes.</li>
            <li>Only then does your script proceed to sign and send.</li>
          </ol>
          <p className="text-sm text-slate-400">
            If verification fails or the decision is BLOCKED, your script should halt. No transaction is sent.
          </p>
        </div>
        <AtfCopyCommand
          label="Simulate with verify gate"
          command={`npx @trucore/atf@${cliVersion} simulate --preset swap_small --verify && npx @trucore/atf@${cliVersion} tx send --receipt last`}
        />
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="receipt-fields">Receipt Fields Reference</HeadingAnchor>
        <p className="text-sm text-slate-300">
          Every receipt contains these fields. The content hash is computed from the canonical
          serialization of all non-metadata fields.
        </p>
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-neutral-950/50">
                <th className="px-4 py-2.5 font-semibold text-slate-200">Field</th>
                <th className="px-4 py-2.5 font-semibold text-slate-200">Description</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-primary-200">request_id</td>
                <td className="px-4 py-2.5">Unique identifier for this simulation request.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-primary-200">decision</td>
                <td className="px-4 py-2.5">ALLOWED or BLOCKED. The deterministic policy outcome.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-primary-200">content_hash</td>
                <td className="px-4 py-2.5">Deterministic hash of the canonical response payload.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-primary-200">timestamp</td>
                <td className="px-4 py-2.5">ISO-8601 UTC timestamp when the decision was issued.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-primary-200">ok</td>
                <td className="px-4 py-2.5">Boolean. True when the request completed without errors.</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-primary-200">verified</td>
                <td className="px-4 py-2.5">Boolean. True when the CLI confirmed receipt integrity locally.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-slate-400">
          For a walkthrough of the full simulate, verify, and execute workflow, see the{" "}
          <Link
            href="/docs/cli/guides/simulate-verify-execute"
            className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
          >
            Simulate, Verify, Execute guide &rarr;
          </Link>
        </p>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="flags">Flags</HeadingAnchor>
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-neutral-950/50">
                <th className="px-4 py-2.5 font-semibold text-slate-200">Flag</th>
                <th className="px-4 py-2.5 font-semibold text-slate-200">Description</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-primary-200">--receipt last</td>
                <td className="px-4 py-2.5">Verify the most recent receipt.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-primary-200">--id &lt;request_id&gt;</td>
                <td className="px-4 py-2.5">Verify a specific receipt by request ID.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-primary-200">--file &lt;path&gt;</td>
                <td className="px-4 py-2.5">Verify a receipt from a JSON file.</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-primary-200">--json</td>
                <td className="px-4 py-2.5">Output results as JSON.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <nav className="pt-4 text-sm text-slate-400">
        <Link href="/docs/cli" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
          &larr; Back to CLI Documentation
        </Link>
      </nav>
    </article>
  );
}

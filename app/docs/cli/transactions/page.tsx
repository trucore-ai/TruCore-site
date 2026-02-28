import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { AtfCopyCommand } from "@/components/atf-copy-command";
import { getAtfCliVersion } from "@/lib/version";

export const metadata: Metadata = {
  title: "ATF CLI: Transactions",
  description:
    "Simulate, sign, send, and check status of transactions with the ATF CLI. Includes the simulate-verify-execute workflow.",
};

const cliVersion = getAtfCliVersion();

export default function TransactionsPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          CLI &rsaquo; Transactions
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-5xl">
          Transactions
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          The core ATF workflow: simulate a transaction against the policy engine, verify the receipt,
          then execute with confidence.
        </p>
      </header>

      <section className="space-y-4">
        <HeadingAnchor id="simulate">Simulate</HeadingAnchor>
        <p className="text-sm text-slate-300">
          Run a deterministic firewall simulation with policy evaluation.
          The CLI calls the ATF API with your transaction payload, receives a policy decision,
          and optionally verifies receipt integrity.
        </p>
        <AtfCopyCommand
          label="Simulate with preset"
          command={`npx @trucore/atf@${cliVersion} simulate --preset swap_small --verify`}
        />
        <AtfCopyCommand
          label="Simulate with custom payload"
          command={`npx @trucore/atf@${cliVersion} simulate --payload ./my-tx.json --verify`}
        />
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="simulate-verify-execute">Simulate, Verify, Execute</HeadingAnchor>
        <p className="text-sm text-slate-300">
          The recommended workflow for production-grade safety:
        </p>
        <ol className="list-decimal space-y-2 pl-6 text-sm text-slate-300">
          <li>
            <strong className="text-slate-100">Simulate</strong> the transaction against the ATF policy engine.
          </li>
          <li>
            <strong className="text-slate-100">Verify</strong> the receipt locally using <code className="font-mono text-slate-200">--verify</code>.
            The CLI recomputes the content hash and confirms it matches the server response.
          </li>
          <li>
            <strong className="text-slate-100">Execute</strong> only if the decision is ALLOWED and verification passes.
          </li>
        </ol>
        <AtfCopyCommand
          label="Full flow"
          command={`npx @trucore/atf@${cliVersion} simulate --preset swap_small --verify && npx @trucore/atf@${cliVersion} tx send --receipt last`}
        />
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="tx-sign">Sign</HeadingAnchor>
        <p className="text-sm text-slate-300">
          Sign a transaction with the wallet from your active profile.
        </p>
        <AtfCopyCommand
          label="Sign transaction"
          command={`npx @trucore/atf@${cliVersion} tx sign --payload ./my-tx.json`}
        />
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="tx-send">Send</HeadingAnchor>
        <p className="text-sm text-slate-300">
          Submit a signed transaction to the network.
        </p>
        <AtfCopyCommand
          label="Send transaction"
          command={`npx @trucore/atf@${cliVersion} tx send --signed ./signed-tx.json`}
        />
        <AtfCopyCommand
          label="Send using last receipt"
          command={`npx @trucore/atf@${cliVersion} tx send --receipt last`}
        />
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="tx-status">Check Status</HeadingAnchor>
        <p className="text-sm text-slate-300">
          Check confirmation status of a submitted transaction by signature.
        </p>
        <AtfCopyCommand
          label="Check status"
          command={`npx @trucore/atf@${cliVersion} tx status --sig 5UBb...xYz3`}
        />
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`Transaction: 5UBb...xYz3
Status: confirmed
Confirmations: 31
Slot: 284,291,088
Block time: 2026-02-27T19:01:22Z`}
        </pre>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="presets">Available Presets</HeadingAnchor>
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-neutral-950/50">
                <th className="px-4 py-2.5 font-semibold text-slate-200">Preset</th>
                <th className="px-4 py-2.5 font-semibold text-slate-200">Description</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-primary-200">swap_small</td>
                <td className="px-4 py-2.5">Small token swap under policy limits.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-primary-200">swap_large</td>
                <td className="px-4 py-2.5">Larger swap that may trigger policy limits.</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-primary-200">transfer</td>
                <td className="px-4 py-2.5">Simple SOL transfer with basic policy checks.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="flags">Common Flags</HeadingAnchor>
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
                <td className="px-4 py-2.5 font-mono text-primary-200">--preset &lt;name&gt;</td>
                <td className="px-4 py-2.5">Use a built-in test payload.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-primary-200">--payload &lt;path&gt;</td>
                <td className="px-4 py-2.5">Path to a custom JSON transaction payload.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-primary-200">--verify</td>
                <td className="px-4 py-2.5">Locally verify receipt integrity after simulation.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-primary-200">--json</td>
                <td className="px-4 py-2.5">Output results as JSON for scripting.</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-primary-200">--receipt last</td>
                <td className="px-4 py-2.5">Reference the most recent simulation receipt.</td>
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

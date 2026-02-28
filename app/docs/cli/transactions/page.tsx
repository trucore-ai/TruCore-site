import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { AtfCopyCommand } from "@/components/atf-copy-command";
import { getAtfCliVersion } from "@/lib/version";

export const metadata: Metadata = {
  title: "ATF CLI: Transactions",
  description:
    "Simulate, sign, send, and check status of transactions with the ATF CLI. Includes the simulate-verify-execute workflow, permit parameters reference, and enforcement model.",
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

      {/* ── Permit Parameters and Enforcement Model ── */}
      <section className="space-y-6">
        <HeadingAnchor id="permit-parameters">Permit Parameters and Enforcement Model</HeadingAnchor>
        <p className="max-w-3xl text-slate-300">
          Every ATF transaction begins with a <strong className="text-slate-100">permit</strong>:
          a structured declaration of intent that describes what the transaction is allowed to do.
          Today, swap permits are the primary type. The model is extensible to other permit types in the future.
        </p>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-100">Where parameters are defined</h3>
          <p className="text-sm text-slate-300">
            Permit parameters can be supplied from several sources. When multiple sources are present,
            ATF uses the most explicit input as the source of truth:
          </p>
          <ol className="list-decimal space-y-1 pl-6 text-sm text-slate-300">
            <li><strong className="text-slate-100">CLI flags</strong> (highest priority, e.g. <code className="font-mono text-slate-200">--slippage-bps 50</code>)</li>
            <li><strong className="text-slate-100">Policy JSON file</strong> (referenced via <code className="font-mono text-slate-200">--policy</code>)</li>
            <li><strong className="text-slate-100">Preset selection</strong> (e.g. <code className="font-mono text-slate-200">--preset swap_small</code>)</li>
            <li><strong className="text-slate-100">Profile config</strong> (defaults set in the active profile)</li>
          </ol>
          <p className="text-sm text-slate-400">
            Explicit CLI flags override policy file values, which override preset defaults,
            which override profile-level configuration.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-100">What ATF enforces</h3>
          <ul className="list-disc space-y-1 pl-6 text-sm text-slate-300">
            <li>Allowed mint pairs (input and output tokens)</li>
            <li>Maximum amount and size bounds</li>
            <li>Slippage bounds (basis points)</li>
            <li>Protocol allowlist (e.g. Jupiter)</li>
            <li>TTL and expiry on permits</li>
            <li>Nonce and replay protection</li>
            <li>Network constraints (devnet vs mainnet)</li>
            <li>Deterministic receipt hashing and verification</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-100">What ATF does not do</h3>
          <ul className="list-disc space-y-1 pl-6 text-sm text-slate-300">
            <li>Choose slippage for you</li>
            <li>Choose token pairs on your behalf</li>
            <li>Decide trade sizes</li>
            <li>Custody your private keys</li>
            <li>Auto-route trades or execute without developer intent</li>
          </ul>
        </div>

        <div className="rounded-lg border border-primary-300/20 bg-primary-950/10 p-4">
          <p className="text-sm text-slate-200">
            <strong className="text-primary-100">The developer defines intent. ATF enforces and proves it.</strong>{" "}
            You declare what your transaction should do, within what bounds, and for which tokens.
            ATF evaluates that intent against the active policy, produces a deterministic receipt, and
            gives you a verifiable proof that the rules were applied correctly. ATF never invents
            trade parameters or makes decisions on your behalf.
          </p>
        </div>

        <p className="text-sm text-slate-400">
          For a full glossary of swap permit parameters, see the{" "}
          <Link
            href="/docs/cli/guides/swap-permits"
            className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
          >
            Swap Permits guide &rarr;
          </Link>
        </p>
      </section>

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

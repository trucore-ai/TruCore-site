import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { AtfCopyCommand } from "@/components/atf-copy-command";
import { WindowsCliNote } from "@/components/windows-cli-note";
import { getAtfCliVersion } from "@/lib/version";

export const metadata: Metadata = {
  title: "ATF CLI Guide: Devnet Burner Quickstart",
  description:
    "Spin up a throwaway devnet wallet, simulate a swap, verify the receipt, and send the transaction in minutes.",
};

const cliVersion = getAtfCliVersion();

export default function DevnetBurnerGuidePage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          CLI &rsaquo; Guides &rsaquo; Devnet Burner
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Devnet Burner Quickstart
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          The fastest way to try the ATF CLI. Spin up a disposable devnet wallet,
          run a simulation, verify the receipt, and send a transaction. All on devnet, fully safe.
        </p>
      </header>

      {/* ── Prerequisites ── */}
      <section className="space-y-4">
        <HeadingAnchor id="prerequisites">Prerequisites</HeadingAnchor>
        <ul className="list-disc space-y-1 pl-6 text-sm text-slate-300">
          <li><code className="font-mono text-slate-200">doctor</code> passes with no errors.</li>
          <li>An active profile (the default profile works fine for this guide).</li>
          <li>Internet access for devnet RPC calls.</li>
        </ul>
      </section>

      {/* ── Steps ── */}
      <section className="space-y-6">
        <HeadingAnchor id="steps">Step-by-Step</HeadingAnchor>
        <WindowsCliNote />

        <div className="space-y-6">
          {/* Step 1 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100">1. Create or select a burner profile</h3>
            <p className="text-sm text-slate-300">
              It is good practice to use a separate profile for burner testing so your
              production config stays clean.
            </p>
            <AtfCopyCommand
              label="Create burner profile"
              command={`npx @trucore/atf@${cliVersion} profile create --name burner-test`}
            />
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100">2. Enable burner mode on devnet</h3>
            <p className="text-sm text-slate-300">
              The burner command generates a throwaway keypair and configures the profile for devnet.
              This wallet is disposable. Do not send real funds to it.
            </p>
            <AtfCopyCommand
              label="Start burner"
              command={`npx @trucore/atf@${cliVersion} burner --network devnet`}
            />
            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`Burner wallet created.
Address: 7nQp...kR4w
Network: devnet
Balance: 0.00 SOL (airdrop available)`}
            </pre>
          </div>

          {/* Step 3 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100">3. Ping the RPC to confirm connectivity</h3>
            <AtfCopyCommand
              label="Ping RPC"
              command={`npx @trucore/atf@${cliVersion} rpc ping`}
            />
            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`Endpoint: https://api.devnet.solana.com
Latency: 68ms
Status: reachable
Network: devnet`}
            </pre>
          </div>

          {/* Step 4 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100">4. Simulate a small swap</h3>
            <p className="text-sm text-slate-300">
              Use the <code className="font-mono text-slate-200">swap_small</code> preset to run
              a quick simulation. Include <code className="font-mono text-slate-200">--verify</code> to
              enable local receipt verification.
            </p>
            <AtfCopyCommand
              label="Simulate"
              command={`npx @trucore/atf@${cliVersion} simulate --preset swap_small --verify`}
            />
            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`Decision: ALLOWED
Request ID: req_burner_001
Content hash (server):  0x9e2f...d4a7
Content hash (local):   0x9e2f...d4a7
Status: Integrity verified`}
            </pre>
          </div>

          {/* Step 5 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100">5. Verify the receipt separately (optional)</h3>
            <p className="text-sm text-slate-300">
              If you want to double-check, verify the receipt as a standalone step.
            </p>
            <AtfCopyCommand
              label="Verify receipt"
              command={`npx @trucore/atf@${cliVersion} receipts verify --receipt last`}
            />
          </div>

          {/* Step 6 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100">6. Sign and send the transaction</h3>
            <p className="text-sm text-slate-300">
              On devnet, you can safely sign and send. The burner wallet is disposable, so there is
              no risk.
            </p>
            <AtfCopyCommand
              label="Send transaction"
              command={`npx @trucore/atf@${cliVersion} tx send --receipt last`}
            />
            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`Transaction submitted.
Signature: 3mVx...pQ8r
Network: devnet`}
            </pre>
          </div>

          {/* Step 7 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100">7. Check the transaction status</h3>
            <AtfCopyCommand
              label="Check status"
              command={`npx @trucore/atf@${cliVersion} tx status --sig 3mVx...pQ8r`}
            />
            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`Transaction: 3mVx...pQ8r
Status: confirmed
Confirmations: 31
Slot: 284,291,088
Block time: 2026-02-27T19:15:33Z`}
            </pre>
          </div>
        </div>
      </section>

      {/* ── What Happens to the Burner Wallet ── */}
      <section className="space-y-4">
        <HeadingAnchor id="burner-lifecycle">Burner Wallet Lifecycle</HeadingAnchor>
        <div className="max-w-3xl space-y-3 text-slate-300">
          <p>
            The burner wallet exists only in the profile config on your machine.
            It is not stored server-side. When you delete the profile or generate a new burner,
            the old wallet is gone. Treat it as fully disposable.
          </p>
          <p>
            Receipts from burner sessions are still valid and verifiable. You can re-verify them
            at any time using <code className="font-mono text-slate-200">receipts verify</code>,
            even after the burner wallet has been discarded.
          </p>
        </div>
      </section>

      {/* ── Troubleshooting ── */}
      <section className="space-y-4">
        <HeadingAnchor id="troubleshooting">Troubleshooting</HeadingAnchor>
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-neutral-950/50">
                <th className="px-4 py-2.5 font-semibold text-slate-200">Symptom</th>
                <th className="px-4 py-2.5 font-semibold text-slate-200">Likely cause</th>
                <th className="px-4 py-2.5 font-semibold text-slate-200">Fix</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5">Burner command fails</td>
                <td className="px-4 py-2.5">Profile issues or network flag missing.</td>
                <td className="px-4 py-2.5">Pass <code className="font-mono text-slate-200">--network devnet</code> explicitly.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5">Simulation blocked</td>
                <td className="px-4 py-2.5">Policy limits exceeded for the preset.</td>
                <td className="px-4 py-2.5">Try a smaller preset or adjust parameters.</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5">Send fails with insufficient balance</td>
                <td className="px-4 py-2.5">Burner wallet has no SOL.</td>
                <td className="px-4 py-2.5">Request a devnet airdrop or fund the wallet manually.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <nav className="pt-4 text-sm text-slate-400">
        <Link href="/docs/cli/guides" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
          &larr; Back to Guides
        </Link>
      </nav>
    </article>
  );
}

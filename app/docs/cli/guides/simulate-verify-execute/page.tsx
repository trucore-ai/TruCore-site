import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { AtfCopyCommand } from "@/components/atf-copy-command";
import { WindowsCliNote } from "@/components/windows-cli-note";
import { getAtfCliVersion } from "@/lib/version";

export const metadata: Metadata = {
  title: "ATF CLI Guide: Simulate, Verify, Execute",
  description:
    "Step-by-step guide for the canonical ATF workflow: simulate a transaction, verify the receipt locally, then execute with confidence.",
};

const cliVersion = getAtfCliVersion();

export default function SimulateVerifyExecuteGuidePage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          CLI &rsaquo; Guides &rsaquo; Simulate, Verify, Execute
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Simulate, Verify, Execute
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          The canonical ATF workflow. Every production transaction should follow this path:
          simulate against the policy engine, verify the receipt locally, then execute only when
          integrity is confirmed.
        </p>
      </header>

      {/* ── Prerequisites ── */}
      <section className="space-y-4">
        <HeadingAnchor id="prerequisites">Prerequisites</HeadingAnchor>

        <div className="rounded-xl border border-primary-300/20 bg-primary-500/5 p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-200">Recommended: install globally</p>
          <AtfCopyCommand command={`npm install -g @trucore/atf@${cliVersion}`} testId="sve-install-global" />
          <p className="mt-1 text-sm text-slate-400">Or run without installing (macOS/Linux only): <code className="font-mono text-slate-300">npx @trucore/atf@{cliVersion} &lt;command&gt;</code></p>
          <WindowsCliNote />
        </div>

        <ul className="list-disc space-y-1 pl-6 text-sm text-slate-300">
          <li><code className="font-mono text-slate-200">doctor</code> passes with no errors.</li>
          <li>An active profile with a configured wallet and RPC endpoint.</li>
          <li>Network set to <code className="font-mono text-slate-200">devnet</code> (for testing) or <code className="font-mono text-slate-200">mainnet-beta</code> (for production).</li>
          <li>A valid transaction payload or preset name.</li>
        </ul>
        <AtfCopyCommand
          label="Confirm environment"
          command={`npx @trucore/atf@${cliVersion} doctor`}
        />
      </section>

      {/* ── Flow Diagram ── */}
      <section className="space-y-4">
        <HeadingAnchor id="flow-diagram">Workflow Flow</HeadingAnchor>
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4">
          <p className="font-mono text-sm text-slate-200">
            Simulate &rarr; Receipt &rarr; Verify (local) &rarr; Sign &rarr; Send &rarr; Status &rarr; Archive
          </p>
        </div>
        <p className="text-sm text-slate-400">
          Each step produces output that feeds into the next. If any step fails, the workflow halts.
          No transaction is sent unless the verify gate passes.
        </p>
      </section>

      {/* ── Step-by-Step ── */}
      <section className="space-y-6">
        <HeadingAnchor id="steps">Step-by-Step</HeadingAnchor>

        <div className="space-y-6">
          {/* Step 1 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100">1. Run doctor to confirm readiness</h3>
            <p className="text-sm text-slate-300">
              Verify that your environment, RPC connection, and wallet are configured correctly.
            </p>
            <AtfCopyCommand
              label="Step 1: Doctor"
              command={`npx @trucore/atf@${cliVersion} doctor`}
            />
            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`Profile: default
Network: devnet
RPC: https://devnet.helius-rpc.com/?api-key=****
Wallet: 5UBb...xYz3
Status: All checks passed`}
            </pre>
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100">2. Simulate the transaction</h3>
            <p className="text-sm text-slate-300">
              Run a deterministic simulation against the ATF policy engine.
              Use <code className="font-mono text-slate-200">--verify</code> to enable local receipt verification.
            </p>
            <AtfCopyCommand
              label="Step 2: Simulate"
              command={`npx @trucore/atf@${cliVersion} simulate --preset swap_small --verify`}
            />
            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`Decision: ALLOWED
Request ID: req_abc123def456
Content hash (server):  0x7f3a...b2c1
Content hash (local):   0x7f3a...b2c1
Status: Integrity verified`}
            </pre>
          </div>

          {/* Step 3 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100">3. Verify the receipt</h3>
            <p className="text-sm text-slate-300">
              If you did not pass <code className="font-mono text-slate-200">--verify</code> during simulation,
              you can verify the receipt separately. This recomputes the content hash locally and
              confirms it matches the server response.
            </p>
            <AtfCopyCommand
              label="Step 3: Verify"
              command={`npx @trucore/atf@${cliVersion} receipts verify --receipt last`}
            />
            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`Receipt: req_abc123def456
Decision: ALLOWED
Content hash (server):  0x7f3a...b2c1
Content hash (local):   0x7f3a...b2c1
Status: Integrity verified`}
            </pre>
          </div>

          {/* Step 4 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100">4. Sign the transaction</h3>
            <p className="text-sm text-slate-300">
              Sign the transaction payload using the wallet from your active profile.
              Signing happens locally. Your private key never leaves your machine.
            </p>
            <AtfCopyCommand
              label="Step 4: Sign"
              command={`npx @trucore/atf@${cliVersion} tx sign --receipt last`}
            />
          </div>

          {/* Step 5 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100">5. Send the transaction</h3>
            <p className="text-sm text-slate-300">
              Submit the signed transaction to the network via your configured RPC endpoint.
            </p>
            <AtfCopyCommand
              label="Step 5: Send"
              command={`npx @trucore/atf@${cliVersion} tx send --receipt last`}
            />
            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`Transaction submitted.
Signature: 4kR9...mN7p
Network: devnet`}
            </pre>
          </div>

          {/* Step 6 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100">6. Check transaction status</h3>
            <p className="text-sm text-slate-300">
              Confirm the transaction landed on-chain and reached the expected confirmation level.
            </p>
            <AtfCopyCommand
              label="Step 6: Status"
              command={`npx @trucore/atf@${cliVersion} tx status --sig 4kR9...mN7p`}
            />
            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`Transaction: 4kR9...mN7p
Status: confirmed
Confirmations: 31
Slot: 284,291,088
Block time: 2026-02-27T19:01:22Z`}
            </pre>
          </div>

          {/* Step 7 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100">7. Archive the receipt</h3>
            <p className="text-sm text-slate-300">
              Store the receipt for audit purposes. Receipts are fully self-contained, contain no
              secrets, and can be re-verified at any time using the same deterministic hashing.
            </p>
            <AtfCopyCommand
              label="Step 7: List and confirm"
              command={`npx @trucore/atf@${cliVersion} receipts list`}
            />
          </div>
        </div>
      </section>

      {/* ── Verify Gate Concept ── */}
      <section className="space-y-4">
        <HeadingAnchor id="verify-gate">The Local Verification Gate</HeadingAnchor>
        <div className="max-w-3xl space-y-3 text-slate-300">
          <p>
            The verification gate is the core safety mechanism.
            Before sending any transaction, the CLI (or your script) recomputes the content hash
            from the receipt fields using the same canonical serialization the server used.
          </p>
          <p>
            If the local hash matches the server hash and the decision is ALLOWED, the gate
            passes and execution proceeds. If either condition fails, execution halts.
          </p>
          <p>
            This means you never have to trust the server alone. Verification is deterministic,
            reproducible, and uses no secrets.
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
                <td className="px-4 py-2.5">Verification hash mismatch</td>
                <td className="px-4 py-2.5">Receipt was modified or corrupted in transit.</td>
                <td className="px-4 py-2.5">Re-run simulation. If persistent, check network stability.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5">Decision: BLOCKED</td>
                <td className="px-4 py-2.5">Transaction violates active policy constraints.</td>
                <td className="px-4 py-2.5">Review policy limits. Check slippage, amount, and allowed programs.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5">RPC timeout on send</td>
                <td className="px-4 py-2.5">RPC endpoint is slow or unreachable.</td>
                <td className="px-4 py-2.5">Run <code className="font-mono text-slate-200">rpc ping</code> to diagnose. Try a different endpoint.</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5">Transaction not confirmed</td>
                <td className="px-4 py-2.5">Network congestion or insufficient fees.</td>
                <td className="px-4 py-2.5">Wait and re-check status. On devnet, retry is usually safe.</td>
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

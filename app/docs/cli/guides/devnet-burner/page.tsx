import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { AtfCopyCommand } from "@/components/atf-copy-command";
import { PlatformRunbook } from "@/components/platform-runbook";
import { getAtfCliVersion } from "@/lib/version";

export const metadata: Metadata = {
  title: "ATF CLI Guide: Devnet Burner Quickstart",
  description:
    "Switch to devnet, simulate a swap, verify the receipt, and send the transaction in minutes.",
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
          The fastest way to try the ATF CLI. Switch to devnet,
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
        <PlatformRunbook
          ariaLabel="Devnet burner guide platform"
          macLinux={
            <p className="text-sm text-slate-400">Run each step directly with npx. No install needed.</p>
          }
          windows={
            <div className="space-y-2">
              <p className="text-sm text-slate-400">Install ATF once, then use <code className="font-mono text-slate-300">atf</code> instead of <code className="font-mono text-slate-300">npx @trucore/atf@{cliVersion}</code> in each step below.</p>
              <AtfCopyCommand
                label="Install"
                command={`npm install -g @trucore/atf@${cliVersion}`}
              />
            </div>
          }
        />

        <div className="space-y-6">
          <p className="text-xs font-bold uppercase tracking-wider text-accent-200">First time setup</p>

          {/* Step 1 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100">1. Create a devnet burner profile</h3>
            <p className="text-sm text-slate-300">
              Use a separate profile for burner testing so your
              production config stays clean.
            </p>
            <AtfCopyCommand
              label="Create burner profile"
              command={`npx @trucore/atf@${cliVersion} profile create devnet-burner --network devnet`}
            />
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100">2. Select the profile</h3>
            <p className="text-sm text-slate-300">
              Switch to the burner profile before enabling burner mode.
            </p>
            <AtfCopyCommand
              label="Select profile"
              command={`npx @trucore/atf@${cliVersion} profile select devnet-burner`}
            />
          </div>

          {/* Step 3 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100">3. Enable burner mode</h3>
            <p className="text-sm text-slate-300">
              The burner command switches the active profile to devnet for safe testing.
              Do not send real funds to devnet addresses.
            </p>
            <AtfCopyCommand
              label="Enable burner"
              command={`npx @trucore/atf@${cliVersion} burner enable`}
            />
            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`{\n  "ok": true,\n  "burner_enabled": true,\n  "profile": "devnet-burner",\n  "solana_cluster": "devnet",\n  "message": "Burner mode enabled on profile \\"devnet-burner\\" (cluster: devnet)."\n}`}
            </pre>
          </div>

          {/* Step 4 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100">4. Verify setup</h3>
            <p className="text-sm text-slate-300">
              Run doctor to confirm the profile, network, and RPC are configured correctly.
            </p>
            <AtfCopyCommand
              label="Verify"
              command={`npx @trucore/atf@${cliVersion} doctor --pretty`}
            />
          </div>

          {/* Step 5 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100">5. Ping the RPC to confirm connectivity</h3>
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

          {/* Step 6 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100">6. Simulate a small swap</h3>
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

          {/* Step 7 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100">7. Verify the receipt separately (optional)</h3>
            <p className="text-sm text-slate-300">
              If you want to double-check, verify the receipt as a standalone step.
            </p>
            <AtfCopyCommand
              label="Verify receipt"
              command={`npx @trucore/atf@${cliVersion} receipts verify --receipt last`}
            />
          </div>

          {/* Step 8 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100">8. Sign and send the transaction</h3>
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

          {/* Step 9 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100">9. Check the transaction status</h3>
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

      {/* ── Use Again Later ── */}
      <section className="space-y-4">
        <HeadingAnchor id="use-again">Use Again Later</HeadingAnchor>
        <p className="text-sm text-slate-300">
          If you have already created the devnet-burner profile, skip straight to these commands
          on repeat runs.
        </p>
        <PlatformRunbook
          ariaLabel="Burner repeat run platform"
          macLinux={
            <div className="space-y-3">
              <AtfCopyCommand
                label="1. Select the profile"
                command={`npx @trucore/atf@${cliVersion} profile select devnet-burner`}
              />
              <AtfCopyCommand
                label="2. Enable burner mode"
                command={`npx @trucore/atf@${cliVersion} burner enable`}
              />
              <AtfCopyCommand
                label="3. Verify if needed"
                command={`npx @trucore/atf@${cliVersion} doctor --pretty`}
              />
            </div>
          }
          windows={
            <div className="space-y-3">
              <AtfCopyCommand
                label="1. Select the profile"
                command="atf profile select devnet-burner"
              />
              <AtfCopyCommand
                label="2. Enable burner mode"
                command="atf burner enable"
              />
              <AtfCopyCommand
                label="3. Verify if needed"
                command="atf doctor --pretty"
              />
            </div>
          }
        />
        <div className="rounded-xl border border-primary-400/20 bg-primary-900/10 p-5">
          <h3 className="font-semibold text-primary-200">Already created this profile?</h3>
          <p className="mt-2 text-sm text-slate-300">
            If you see{" "}
            <code className="font-mono text-slate-200">
              Profile &quot;devnet-burner&quot; already exists.
            </code>
            , skip profile creation and use the commands above.
          </p>
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
                <td className="px-4 py-2.5">Profile &quot;devnet-burner&quot; already exists.</td>
                <td className="px-4 py-2.5">The profile was created on a previous run.</td>
                <td className="px-4 py-2.5">Skip <code className="font-mono text-slate-200">profile create</code> and run <code className="font-mono text-slate-200">profile select devnet-burner</code> instead.</td>
              </tr>
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
                <td className="px-4 py-2.5">Fund the wallet via devnet faucet or manual transfer.</td>
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

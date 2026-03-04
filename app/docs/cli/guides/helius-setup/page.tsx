import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { AtfCopyCommand } from "@/components/atf-copy-command";
import { getAtfCliVersion } from "@/lib/version";

export const metadata: Metadata = {
  title: "ATF CLI Guide: Helius RPC Setup",
  description:
    "Step-by-step guide to configuring a Helius RPC endpoint with ATF CLI profiles, including secrets separation and connectivity verification.",
};

const cliVersion = getAtfCliVersion();

export default function HeliusSetupGuidePage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          CLI &rsaquo; Guides &rsaquo; Helius Setup
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-5xl">
          Helius RPC Setup with Profiles
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Configure a Helius RPC endpoint within an ATF CLI profile. This guide walks through
          profile creation, endpoint configuration, and connectivity verification.
        </p>
      </header>

      {/* ── Prerequisites ── */}
      <section className="space-y-4">
        <HeadingAnchor id="prerequisites">Prerequisites</HeadingAnchor>
        <ul className="list-disc space-y-1 pl-6 text-sm text-slate-300">
          <li><code className="font-mono text-slate-200">doctor</code> passes with no errors.</li>
          <li>A Helius account with an API key. Sign up at <code className="font-mono text-slate-200">helius.dev</code> if you have not already.</li>
          <li>The ATF CLI installed (pinned version, not @latest).</li>
        </ul>
      </section>

      {/* ── Steps ── */}
      <section className="space-y-6">
        <HeadingAnchor id="steps">Step-by-Step</HeadingAnchor>

        <div className="space-y-6">
          {/* Step 1 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100">1. Create a profile (or select an existing one)</h3>
            <p className="text-sm text-slate-300">
              Profiles isolate configuration, wallet, and RPC settings. Create a dedicated profile
              for your Helius-connected environment.
            </p>
            <AtfCopyCommand
              label="Create profile"
              command={`npx @trucore/atf@${cliVersion} profile create --name helius-dev`}
            />
            <p className="text-sm text-slate-400">
              If the profile already exists, switch to it instead:
            </p>
            <AtfCopyCommand
              label="Switch profile"
              command={`npx @trucore/atf@${cliVersion} profile switch --name helius-dev`}
            />
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100">2. Set the Helius RPC endpoint</h3>
            <p className="text-sm text-slate-300">
              Configure the Helius endpoint using the <code className="font-mono text-slate-200">rpc set</code> command.
              Your API key is stored locally in the profile config and is never sent to ATF.
            </p>
            <AtfCopyCommand
              label="Set Helius RPC"
              command={`npx @trucore/atf@${cliVersion} rpc set --provider helius --api-key YOUR_KEY`}
            />
            <div className="rounded-lg border border-primary-300/20 bg-primary-950/10 p-4">
              <p className="text-sm text-slate-300">
                <strong className="text-primary-100">Secrets are never echoed.</strong> The CLI stores
                your API key in the profile config file on disk. It is never logged, printed to stdout,
                or included in any ATF API request or receipt.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100">3. Ping the endpoint</h3>
            <p className="text-sm text-slate-300">
              Confirm that the RPC endpoint is reachable and measure latency.
            </p>
            <AtfCopyCommand
              label="Ping RPC"
              command={`npx @trucore/atf@${cliVersion} rpc ping`}
            />
            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`Endpoint: https://devnet.helius-rpc.com/?api-key=****
Latency: 42ms
Status: reachable
Network: devnet`}
            </pre>
          </div>

          {/* Step 4 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100">4. Confirm the network</h3>
            <p className="text-sm text-slate-300">
              Use <code className="font-mono text-slate-200">whoami</code> to verify that the profile,
              wallet, and network are all set correctly.
            </p>
            <AtfCopyCommand
              label="Confirm identity"
              command={`npx @trucore/atf@${cliVersion} whoami`}
            />
            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`Profile: helius-dev
Network: devnet
RPC: https://devnet.helius-rpc.com/?api-key=****
Wallet: 5UBb...xYz3`}
            </pre>
          </div>

          {/* Step 5 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-100">5. Run doctor to confirm everything</h3>
            <p className="text-sm text-slate-300">
              Doctor validates the full environment. If all checks pass, you are ready to simulate.
            </p>
            <AtfCopyCommand
              label="Final check"
              command={`npx @trucore/atf@${cliVersion} doctor`}
            />
          </div>
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
                <td className="px-4 py-2.5">RPC ping fails with timeout</td>
                <td className="px-4 py-2.5">Invalid API key, wrong URL, or network issue.</td>
                <td className="px-4 py-2.5">Double-check your Helius API key and endpoint URL.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5">Wrong network in whoami</td>
                <td className="px-4 py-2.5">Profile is set to the wrong network.</td>
                <td className="px-4 py-2.5">Run <code className="font-mono text-slate-200">config set network devnet</code> (or mainnet-beta).</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5">Wallet not found</td>
                <td className="px-4 py-2.5">No keypair configured in the profile.</td>
                <td className="px-4 py-2.5">Generate or import a wallet. See the Profiles reference.</td>
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

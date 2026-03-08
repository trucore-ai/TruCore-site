import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { AtfCopyCommand } from "@/components/atf-copy-command";
import { getAtfCliVersion } from "@/lib/version";

export const metadata: Metadata = {
  title: "ATF CLI: Doctor",
  description:
    "Run atf doctor to check your environment, RPC connectivity, and CLI health before signing or simulating transactions.",
};

const cliVersion = getAtfCliVersion();

const CHECKS: { name: string; description: string }[] = [
  { name: "CLI version", description: "Confirms you are running the expected pinned version." },
  { name: "Node.js version", description: "Validates Node.js meets the minimum requirement (>=18)." },
  { name: "RPC reachability", description: "Pings the configured RPC endpoint and reports latency." },
  { name: "Network selection", description: "Confirms whether you are targeting mainnet, devnet, or a custom endpoint." },
  { name: "Profile loaded", description: "Shows the active profile name and config path." },
  { name: "Wallet detected", description: "Confirms whether a signer is available for the active profile." },
];

export default function DoctorPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          CLI &rsaquo; Doctor
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Doctor
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Your first command. Doctor validates your environment, checks RPC connectivity,
          and confirms the CLI is ready to use.
        </p>
      </header>

      <section className="space-y-4">
        <HeadingAnchor id="usage">Usage</HeadingAnchor>
        <AtfCopyCommand
          label="Run doctor"
          command={`npx @trucore/atf@${cliVersion} doctor`}
        />
        <AtfCopyCommand
          label="Verbose output"
          command={`npx @trucore/atf@${cliVersion} doctor --verbose`}
        />
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="what-it-checks">What Doctor Checks</HeadingAnchor>
        <div className="grid gap-3 sm:grid-cols-2">
          {CHECKS.map((check) => (
            <div
              key={check.name}
              className="rounded-lg border border-white/10 bg-neutral-950/50 p-4"
            >
              <p className="font-mono text-sm font-semibold text-primary-200">
                {check.name}
              </p>
              <p className="mt-1 text-sm text-slate-300">{check.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="example-output">Example Output</HeadingAnchor>
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`✔ CLI version    : ${cliVersion}
✔ Node.js        : v20.11.0
✔ RPC endpoint   : https://rpc.helius.xyz (42ms)
✔ Network        : devnet
✔ Profile        : default (~/.atf/profiles/default.json)
✔ Wallet         : detected (pubkey: 7xKp...3mNv)

All checks passed. You are ready to go.`}
        </pre>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="common-issues">Common Issues</HeadingAnchor>
        <div className="max-w-3xl space-y-3 text-slate-300">
          <p>
            <strong className="text-slate-100">RPC unreachable?</strong> Check
            your network connection and verify the endpoint with{" "}
            <code className="font-mono text-slate-200">rpc ping</code>. If you are behind
            a VPN or firewall, confirm outbound HTTPS is allowed.
          </p>
          <p>
            <strong className="text-slate-100">No wallet detected?</strong> Create a profile
            with <code className="font-mono text-slate-200">profile create</code> or use the{" "}
            <Link href="/docs/cli/burner" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
              devnet burner
            </Link>{" "}
            for quick testing.
          </p>
          <p>
            <strong className="text-slate-100">Wrong network?</strong> Switch with{" "}
            <code className="font-mono text-slate-200">config set network devnet</code> or{" "}
            <code className="font-mono text-slate-200">config set network mainnet</code>.
          </p>
        </div>
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
                <td className="px-4 py-2.5 font-mono text-primary-200">--verbose</td>
                <td className="px-4 py-2.5">Show detailed output for each check.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-primary-200">--json</td>
                <td className="px-4 py-2.5">Output results as JSON for scripting and CI.</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-primary-200">--profile &lt;name&gt;</td>
                <td className="px-4 py-2.5">Run checks against a specific named profile.</td>
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

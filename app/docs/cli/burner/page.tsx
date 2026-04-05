import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { AtfCopyCommand } from "@/components/atf-copy-command";
import { PlatformRunbook } from "@/components/platform-runbook";
import { getAtfCliVersion } from "@/lib/version";

export const metadata: Metadata = {
  title: "ATF CLI: Devnet Burner",
  description:
    "Switch to devnet for safe testing with the ATF CLI burner command.",
};

const cliVersion = getAtfCliVersion();

export default function BurnerPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          CLI &rsaquo; Devnet Burner
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Devnet Burner
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          The fastest way to test ATF on devnet. Switches your active profile to devnet so you can
          simulate and verify transactions safely before using real keys.
        </p>
      </header>

      <section className="space-y-4">
        <HeadingAnchor id="quickstart">Quickstart</HeadingAnchor>
        <PlatformRunbook
          ariaLabel="Burner quickstart platform"
          macLinux={
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-accent-200">First time</p>
              <p className="text-sm text-slate-400">Run directly with npx. No install needed.</p>
              <AtfCopyCommand
                label="1. Create a devnet burner profile"
                command={`npx @trucore/atf@${cliVersion} profile create devnet-burner --network devnet`}
              />
              <AtfCopyCommand
                label="2. Select the profile"
                command={`npx @trucore/atf@${cliVersion} profile select devnet-burner`}
              />
              <AtfCopyCommand
                label="3. Enable burner mode"
                command={`npx @trucore/atf@${cliVersion} burner enable`}
              />
              <AtfCopyCommand
                label="4. Verify setup"
                command={`npx @trucore/atf@${cliVersion} doctor --pretty`}
              />

              <hr className="border-white/10" />
              <p className="text-xs font-bold uppercase tracking-wider text-accent-200">Use again later</p>
              <AtfCopyCommand
                label="1. Select the profile"
                command={`npx @trucore/atf@${cliVersion} profile select devnet-burner`}
              />
              <AtfCopyCommand
                label="2. Enable burner mode"
                command={`npx @trucore/atf@${cliVersion} burner enable`}
              />
            </div>
          }
          windows={
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-accent-200">First time</p>
              <AtfCopyCommand
                label="1. Install ATF"
                command={`npm install -g @trucore/atf@${cliVersion}`}
              />
              <AtfCopyCommand
                label="2. Create a devnet burner profile"
                command="atf profile create devnet-burner --network devnet"
              />
              <AtfCopyCommand
                label="3. Select the profile"
                command="atf profile select devnet-burner"
              />
              <AtfCopyCommand
                label="4. Enable burner mode"
                command="atf burner enable"
              />
              <AtfCopyCommand
                label="5. Verify setup"
                command="atf doctor --pretty"
              />

              <hr className="border-white/10" />
              <p className="text-xs font-bold uppercase tracking-wider text-accent-200">Use again later</p>
              <AtfCopyCommand
                label="1. Select the profile"
                command="atf profile select devnet-burner"
              />
              <AtfCopyCommand
                label="2. Enable burner mode"
                command="atf burner enable"
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
            , skip profile creation and jump to <em>Use again later</em> above.
          </p>
        </div>
        <p className="text-sm text-slate-300">
          Once burner mode is active, you can test safely on devnet.
          Run <code className="font-mono text-slate-200">simulate</code> next to try a transaction.
        </p>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="example-output">Example Output</HeadingAnchor>
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`{\n  "ok": true,\n  "burner_enabled": true,\n  "profile": "default",\n  "solana_cluster": "devnet",\n  "message": "Burner mode enabled on profile \\"default\\" (cluster: devnet)."\n}`}
        </pre>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="burner-then-simulate">Burner, Then Simulate</HeadingAnchor>
        <p className="text-sm text-slate-300">
          A common testing workflow: create a burner, then immediately simulate a transaction.
        </p>
        <PlatformRunbook
          ariaLabel="Burner then simulate platform"
          macLinux={
            <AtfCopyCommand
              label="Burner + simulate"
              command={`npx @trucore/atf@${cliVersion} burner --network devnet && npx @trucore/atf@${cliVersion} simulate --preset swap_small --verify`}
            />
          }
          windows={
            <AtfCopyCommand
              label="Burner + simulate"
              command="atf burner --network devnet && atf simulate --preset swap_small --verify"
            />
          }
        />
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="warnings">Important Notes</HeadingAnchor>
        <div className="rounded-xl border border-amber-400/20 bg-amber-900/10 p-5">
          <h3 className="font-semibold text-amber-200">Devnet only</h3>
          <ul className="mt-2 space-y-2 text-sm text-slate-300">
            <li>Burner mode is devnet-only. It cannot be used on mainnet.</li>
            <li>Burner mode sets the profile cluster to devnet. Ephemeral keypair generation and airdrop are planned follow-up features.</li>
            <li>Do not send real funds to devnet addresses.</li>
          </ul>
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
                <td className="px-4 py-2.5 font-mono text-primary-200">--network devnet</td>
                <td className="px-4 py-2.5">Target network (only devnet is supported for burner).</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-primary-200">--json</td>
                <td className="px-4 py-2.5">Output burner details as JSON.</td>
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

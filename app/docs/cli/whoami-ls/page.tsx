import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { AtfCopyCommand } from "@/components/atf-copy-command";
import { getAtfCliVersion } from "@/lib/version";

export const metadata: Metadata = {
  title: "ATF CLI: Whoami & Ls",
  description:
    "Show your active profile, wallet identity, and list all configured profiles with the ATF CLI.",
};

const cliVersion = getAtfCliVersion();

export default function WhoamiLsPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          CLI &rsaquo; Whoami &amp; Ls
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Whoami &amp; Ls
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Quick identity and profile inspection. See what profile and wallet are active,
          and list all configured profiles.
        </p>
      </header>

      <section className="space-y-4">
        <HeadingAnchor id="whoami">Whoami</HeadingAnchor>
        <p className="text-sm text-slate-300">
          Show the active profile name, wallet public key, configured network, and RPC endpoint.
        </p>
        <AtfCopyCommand
          label="Who am I?"
          command={`npx @trucore/atf@${cliVersion} whoami`}
        />
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`Profile:  default
Wallet:   7xKp...3mNv
Network:  devnet
RPC:      https://rpc.helius.xyz
CLI:      ${cliVersion}`}
        </pre>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="ls">Ls (List Profiles)</HeadingAnchor>
        <p className="text-sm text-slate-300">
          List all configured profiles. The active profile is highlighted.
        </p>
        <AtfCopyCommand
          label="List profiles"
          command={`npx @trucore/atf@${cliVersion} ls`}
        />
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
{`Profiles:
▸ default     (devnet, 7xKp...3mNv)
  staging     (devnet, BrnR...4kXz)
  production  (mainnet, 9aWq...7jPr)`}
        </pre>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="json-output">JSON Output</HeadingAnchor>
        <p className="text-sm text-slate-300">
          Both commands support <code className="font-mono text-slate-200">--json</code> for
          scripting and CI integration.
        </p>
        <AtfCopyCommand
          label="Whoami as JSON"
          command={`npx @trucore/atf@${cliVersion} whoami --json`}
        />
        <AtfCopyCommand
          label="Ls as JSON"
          command={`npx @trucore/atf@${cliVersion} ls --json`}
        />
      </section>

      <nav className="pt-4 text-sm text-slate-400">
        <Link href="/docs/cli" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
          &larr; Back to CLI Documentation
        </Link>
      </nav>
    </article>
  );
}

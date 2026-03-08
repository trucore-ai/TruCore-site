import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { AtfCopyCommand } from "@/components/atf-copy-command";
import { getAtfCliVersion } from "@/lib/version";

export const metadata: Metadata = {
  title: "ATF CLI: Profiles & Config",
  description:
    "Manage named profiles, configuration values, and secrets separation in the ATF CLI.",
};

const cliVersion = getAtfCliVersion();

export default function ProfilesPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          CLI &rsaquo; Profiles &amp; Config
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Profiles &amp; Config
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Named profiles let you maintain separate configurations for different networks, wallets,
          and use cases. Secrets are stored separately from general config.
        </p>
      </header>

      <section className="space-y-4">
        <HeadingAnchor id="create-profile">Create a Profile</HeadingAnchor>
        <AtfCopyCommand
          label="Create named profile"
          command={`npx @trucore/atf@${cliVersion} profile create --name staging`}
        />
        <p className="text-sm text-slate-300">
          Creates a new profile directory at <code className="font-mono text-slate-200">~/.atf/profiles/staging/</code>.
          Config and secrets are stored in separate files within that directory.
        </p>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="switch-profile">Switch Profiles</HeadingAnchor>
        <AtfCopyCommand
          label="Switch active profile"
          command={`npx @trucore/atf@${cliVersion} profile switch staging`}
        />
        <p className="text-sm text-slate-300">
          All subsequent commands use the <code className="font-mono text-slate-200">staging</code> profile
          until you switch again.
        </p>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="config-values">Set and Read Config</HeadingAnchor>
        <AtfCopyCommand
          label="Set a config value"
          command={`npx @trucore/atf@${cliVersion} config set network devnet`}
        />
        <AtfCopyCommand
          label="Read a config value"
          command={`npx @trucore/atf@${cliVersion} config get network`}
        />
        <p className="text-sm text-slate-300">
          Configuration values are plain text and safe to commit to version control.
          Secrets like API keys use a separate, gitignored secrets file.
        </p>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="secrets">Secrets Handling</HeadingAnchor>
        <div className="max-w-3xl space-y-3 text-slate-300">
          <p>
            Secrets (API keys, private key paths) are stored in <code className="font-mono text-slate-200">~/.atf/profiles/&lt;name&gt;/secrets.json</code>,
            which is excluded from version control by default.
          </p>
          <p>
            Config values go in <code className="font-mono text-slate-200">config.json</code>. This separation
            ensures you can safely share or commit your config without leaking sensitive data.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="profile-listing">List All Profiles</HeadingAnchor>
        <AtfCopyCommand
          label="List profiles"
          command={`npx @trucore/atf@${cliVersion} ls`}
        />
        <p className="text-sm text-slate-300">
          Shows all configured profiles and highlights the currently active one.
          See also <Link href="/docs/cli/whoami-ls" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">whoami &amp; ls</Link>.
        </p>
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
                <td className="px-4 py-2.5 font-mono text-primary-200">--name &lt;profile&gt;</td>
                <td className="px-4 py-2.5">Specify the target profile for create/delete operations.</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-2.5 font-mono text-primary-200">--profile &lt;name&gt;</td>
                <td className="px-4 py-2.5">Override the active profile for any command.</td>
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

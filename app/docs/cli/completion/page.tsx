import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { AtfCopyCommand } from "@/components/atf-copy-command";
import { getAtfCliVersion } from "@/lib/version";

export const metadata: Metadata = {
  title: "ATF CLI: Shell Completion",
  description:
    "Generate shell completion scripts for bash, zsh, or fish to get tab-completion for all ATF CLI commands.",
};

const cliVersion = getAtfCliVersion();

export default function CompletionPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          CLI &rsaquo; Shell Completion
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Shell Completion
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Enable tab-completion for ATF CLI commands in your shell. Supports bash, zsh, and fish.
        </p>
      </header>

      <section className="space-y-4">
        <HeadingAnchor id="bash">Bash</HeadingAnchor>
        <AtfCopyCommand
          label="Generate bash completion"
          command={`npx @trucore/atf@${cliVersion} completion bash`}
        />
        <p className="text-sm text-slate-300">
          Add the output to your <code className="font-mono text-slate-200">~/.bashrc</code> or
          source it directly:
        </p>
        <AtfCopyCommand
          label="Source in bashrc"
          command={`npx @trucore/atf@${cliVersion} completion bash >> ~/.bashrc`}
        />
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="zsh">Zsh</HeadingAnchor>
        <AtfCopyCommand
          label="Generate zsh completion"
          command={`npx @trucore/atf@${cliVersion} completion zsh`}
        />
        <p className="text-sm text-slate-300">
          Add to your <code className="font-mono text-slate-200">~/.zshrc</code>:
        </p>
        <AtfCopyCommand
          label="Source in zshrc"
          command={`npx @trucore/atf@${cliVersion} completion zsh >> ~/.zshrc`}
        />
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="fish">Fish</HeadingAnchor>
        <AtfCopyCommand
          label="Generate fish completion"
          command={`npx @trucore/atf@${cliVersion} completion fish`}
        />
        <p className="text-sm text-slate-300">
          Save to fish completions directory:
        </p>
        <AtfCopyCommand
          label="Save fish completion"
          command={`npx @trucore/atf@${cliVersion} completion fish > ~/.config/fish/completions/atf.fish`}
        />
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="verify-completion">Verify It Works</HeadingAnchor>
        <p className="text-sm text-slate-300">
          After sourcing the completion script, type <code className="font-mono text-slate-200">atf </code>
          and press Tab. You should see available commands like <code className="font-mono text-slate-200">doctor</code>,{" "}
          <code className="font-mono text-slate-200">simulate</code>,{" "}
          <code className="font-mono text-slate-200">tx</code>, and more.
        </p>
      </section>

      <nav className="pt-4 text-sm text-slate-400">
        <Link href="/docs/cli" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
          &larr; Back to CLI Documentation
        </Link>
      </nav>
    </article>
  );
}

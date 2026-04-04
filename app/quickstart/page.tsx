import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { CopyBlock } from "@/components/copy-block";
import { AtfCopyCommand } from "@/components/atf-copy-command";
import { SafeToTryBanner, DemoVsRealBlock, WhatHappensBlock } from "@/components/safe-to-try-banner";
import { PlatformRunbook } from "@/components/platform-runbook";
import { getAtfCliVersion } from "@/lib/version";

export const metadata: Metadata = {
  title: "Quickstart - Try ATF in Four Commands | TruCore",
  description:
    "Run a protected trade, set up your API key, diagnose your environment, and verify a receipt - all from the CLI in under 60 seconds.",
};

const CLI_TRADE = `atf trade`;
const CLI_SETUP = `atf setup`;
const CLI_DOCTOR = `atf doctor`;
const CLI_VERIFY = `atf verify <receipt-id>`;

const cliVersion = getAtfCliVersion();

export default function QuickstartPage() {
  return (
    <Container>
      {/* ── Hero ── */}
      <Section id="hero" className="fade-in-up">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary-200">
            Quickstart
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
            Try ATF in Four Commands
          </h1>
          <p className="mt-4 text-lg text-slate-300">
            Zero config. Demo mode runs immediately.
          </p>
          <SafeToTryBanner />
        </div>
      </Section>

      {/* ── Install ── */}
      <Section id="install" divider className="fade-in-up">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            Install the CLI
          </h2>
          <div className="mt-4">
            <PlatformRunbook
              ariaLabel="Install platform"
              macLinux={
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">Run directly with npx. No install needed.</p>
                  <AtfCopyCommand
                    label="Run a protected trade"
                    command={`npx @trucore/atf@${cliVersion} trade`}
                    testId="quickstart-npx"
                  />
                </div>
              }
              windows={
                <div className="space-y-2">
                  <AtfCopyCommand
                    label="Install globally"
                    command={`npm install -g @trucore/atf@${cliVersion}`}
                    testId="quickstart-install"
                  />
                  <p className="mt-1 text-sm text-slate-400">Then run commands directly with <code className="font-mono text-slate-300">atf</code>.</p>
                </div>
              }
            />
          </div>
        </div>
      </Section>

      {/* ── Step 1 - Try a protected trade ── */}
      <Section id="step-1" divider className="fade-in-up fade-delay-1">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            <span className="mr-2 font-mono text-sm text-primary-200">01</span>
            Try a protected trade
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            Works immediately. No wallet needed.
          </p>
          <div className="mt-6">
            <CopyBlock
              label="CLI - run a protected trade"
              value={CLI_TRADE}
              copyButtonLabel="Copy"
            />
          </div>
          <WhatHappensBlock />
          <p className="mt-2 text-sm text-slate-400">
            You&apos;ll see: <code className="text-slate-300">&ldquo;\u2713 Protected trade complete&rdquo;</code>
            with route, classification, decision, and a verifiable receipt.
          </p>
        </div>
      </Section>

      {/* ── Step 2 - Connect your API key ── */}
      <Section id="step-2" divider className="fade-in-up fade-delay-2">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            <span className="mr-2 font-mono text-sm text-primary-200">02</span>
            Connect your API key
          </h2>
          <div className="mt-4">
            <DemoVsRealBlock />
          </div>
          <div className="mt-4">
            <CopyBlock
              label="CLI - interactive setup"
              value={CLI_SETUP}
              copyButtonLabel="Copy"
            />
          </div>
        </div>
      </Section>

      {/* ── Step 3 - Diagnose setup ── */}
      <Section id="step-3" divider className="fade-in-up fade-delay-3">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            <span className="mr-2 font-mono text-sm text-primary-200">03</span>
            Diagnose your setup
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            Checks API key, RPC, and wallet in one pass.
          </p>
          <div className="mt-6">
            <CopyBlock
              label="CLI - diagnose environment"
              value={CLI_DOCTOR}
              copyButtonLabel="Copy"
            />
          </div>
        </div>
      </Section>

      {/* ── Step 4 - Verify a receipt ── */}
      <Section id="step-4" divider className="fade-in-up fade-delay-4">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            <span className="mr-2 font-mono text-sm text-primary-200">04</span>
            Verify and share a receipt
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            Verify = proof. Confirm ATF approved the execution and share the link.
          </p>
          <div className="mt-6">
            <CopyBlock
              label="CLI - verify a receipt"
              value={CLI_VERIFY}
              copyButtonLabel="Copy"
            />
          </div>
          <Card className="mt-6">
            <p className="text-base text-slate-200">
              You can also verify receipts on the web:{" "}
              <Link
                href="/verify"
                className="font-medium text-accent-300 underline decoration-accent-300/30 underline-offset-2 transition-colors hover:text-accent-200 hover:decoration-accent-200/50"
              >
                Receipt Verifier
              </Link>
            </p>
          </Card>
        </div>
      </Section>

      {/* ── Dual-surface output ── */}
      <Section id="dual-surface" divider className="fade-in-up fade-delay-5">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            Readable for Humans, Structured for Agents
          </h2>
          <p className="mt-4 text-lg leading-[1.5] text-slate-300">
            Every command produces clear terminal output for operators and
            machine-readable JSON for automation. The same run gives you both.
          </p>
          <ul className="mt-4 space-y-2 text-base text-slate-300">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary-200">&#x2713;</span>
              <span><strong className="text-slate-100">Human output</strong> - clear status, actionable next steps, share snippets</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary-200">&#x2713;</span>
              <span><strong className="text-slate-100">Bot output</strong> - <code className="text-slate-200">machine_summary</code>, <code className="text-slate-200">suggested_action</code>, <code className="text-slate-200">suggested_command</code></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary-200">&#x2713;</span>
              <span><strong className="text-slate-100">Distribution</strong> - replay command, share snippet, bot-friendly line</span>
            </li>
          </ul>
        </div>
      </Section>

      {/* ── Next steps ── */}
      <Section id="next-steps" divider className="fade-in-up fade-delay-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            Next Steps
          </h2>
          <ul className="mt-6 space-y-3 text-lg text-slate-300">
            <li>
              <Link
                href="/docs/first-protected-trade"
                className="font-medium text-accent-300 underline decoration-accent-300/30 underline-offset-2 transition-colors hover:text-accent-200 hover:decoration-accent-200/50"
              >
                First Protected Trade
              </Link>{" "}
              - end-to-end walkthrough with HTTP, Python, TypeScript, CLI, and OpenClaw
            </li>
            <li>
              <Link
                href="/docs/cli"
                className="font-medium text-accent-300 underline decoration-accent-300/30 underline-offset-2 transition-colors hover:text-accent-200 hover:decoration-accent-200/50"
              >
                CLI Reference
              </Link>{" "}
              - advanced bot and operator commands beyond the golden path
            </li>
            <li>
              <Link
                href="/atf/how-it-works"
                className="font-medium text-accent-300 underline decoration-accent-300/30 underline-offset-2 transition-colors hover:text-accent-200 hover:decoration-accent-200/50"
              >
                How ATF Works
              </Link>{" "}
              - architecture overview and execution flow
            </li>
          </ul>
        </div>
      </Section>
    </Container>
  );
}

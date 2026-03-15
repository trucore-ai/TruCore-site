import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "OpenClaw Plugin: Agent Transaction Firewall | TruCore",
  description:
    "Route OpenClaw agent transactions through the Agent Transaction Firewall. Policy enforcement, unsafe-swap prevention, and verifiable execution receipts for every trade.",
  openGraph: {
    title: "OpenClaw Plugin: Agent Transaction Firewall",
    description:
      "Policy enforcement and verifiable execution receipts for OpenClaw agents on Solana.",
  },
};

export default function OpenClawPage() {
  return (
    <Container>
      {/* ── Hero ── */}
      <Section id="hero" className="fade-in-up">
        <Card className="glass-panel-hero relative overflow-hidden p-6 sm:p-12">
          <div className="hero-legibility-overlay" aria-hidden="true" />
          <div className="relative z-10">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary-200">
              Plugin Integration
            </p>
            <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight text-accent-200 md:text-5xl">
              OpenClaw Plugin: Agent Transaction Firewall
            </h1>
            <p className="mt-6 max-w-3xl text-xl leading-[1.6] text-slate-200">
              OpenClaw agents can route transactions through the Agent Transaction
              Firewall before signing them.
            </p>
            <p className="mt-4 max-w-3xl text-lg leading-[1.6] text-slate-300">
              This adds policy enforcement and produces deterministic execution
              receipts — giving bot developers provable guarantees that every
              trade followed the rules.
            </p>
          </div>
        </Card>
      </Section>

      {/* ── Capabilities ── */}
      <Section id="capabilities" divider className="fade-in-up fade-delay-1">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            What It Does
          </h2>
          <p className="mt-4 text-lg leading-[1.5] text-slate-200">
            The ATF plugin hooks into the OpenClaw transaction lifecycle and
            enforces configurable policies before any transaction reaches the
            network.
          </p>
        </div>

        <ul className="max-w-3xl space-y-3 text-base text-slate-200">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-primary-200">&#x2713;</span>
            Enforce transaction policies before execution
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-primary-200">&#x2713;</span>
            Prevent unsafe swaps or wrong pools
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-primary-200">&#x2713;</span>
            Generate verifiable execution receipts
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-primary-200">&#x2713;</span>
            Non-custodial — keys never leave the agent
          </li>
        </ul>
      </Section>

      {/* ── Protected Swap Example ── */}
      <Section id="example" divider className="fade-in-up fade-delay-2">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            Protected Swap Example
          </h2>
          <p className="mt-4 text-lg leading-[1.5] text-slate-200">
            When an OpenClaw agent submits a swap, ATF validates the transaction
            against your policy before it is signed and broadcast.
          </p>
        </div>

        <div className="max-w-3xl">
          <pre className="overflow-x-auto rounded-xl border border-white/[0.08] bg-neutral-950/70 p-5 font-mono text-sm text-slate-200 whitespace-pre-wrap break-words">
{`SOL → USDC
DEX: Jupiter
Policy enforcement: enabled
Receipt generated ✓`}
          </pre>

          <p className="mt-4 text-sm text-slate-400">
            Every protected trade produces a receipt you can verify independently.
          </p>

          <Link
            href="/verify"
            className="mt-4 inline-flex items-center gap-1 rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/10"
          >
            Verify a Receipt &rarr;
          </Link>
        </div>
      </Section>

      {/* ── Developer Quickstart ── */}
      <Section id="quickstart" divider className="fade-in-up fade-delay-3">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            Developer Quickstart
          </h2>
          <p className="mt-4 text-lg leading-[1.5] text-slate-200">
            Get from zero to a protected trade in minutes. Follow the guided
            walkthrough, then explore the builder tools.
          </p>
        </div>

        <div className="max-w-3xl space-y-4">
          <Link
            href="/docs/first-protected-trade"
            className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-neutral-950/40 px-6 py-4 transition-colors hover:bg-white/[0.04]"
          >
            <div>
              <p className="text-base font-semibold text-accent-200">
                First Protected Trade
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Step-by-step guide — devnet to verified receipt
              </p>
            </div>
            <span className="text-slate-500">&rarr;</span>
          </Link>

          <Link
            href="/builders"
            className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-neutral-950/40 px-6 py-4 transition-colors hover:bg-white/[0.04]"
          >
            <div>
              <p className="text-base font-semibold text-accent-200">
                Builder Tools
              </p>
              <p className="mt-1 text-sm text-slate-400">
                SDKs, APIs, and integration resources
              </p>
            </div>
            <span className="text-slate-500">&rarr;</span>
          </Link>

          <Link
            href="/verify"
            className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-neutral-950/40 px-6 py-4 transition-colors hover:bg-white/[0.04]"
          >
            <div>
              <p className="text-base font-semibold text-accent-200">
                Receipt Verification
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Independently verify any execution receipt
              </p>
            </div>
            <span className="text-slate-500">&rarr;</span>
          </Link>
        </div>
      </Section>
    </Container>
  );
}

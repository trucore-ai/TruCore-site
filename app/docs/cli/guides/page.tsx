import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";

export const metadata: Metadata = {
  title: "ATF CLI Guides",
  description:
    "Step-by-step guides for common ATF CLI workflows: swap permits, simulate-verify-execute, Helius RPC, devnet burner, and production bots.",
};

const GUIDES = [
  {
    href: "/docs/cli/guides/swap-permits",
    title: "Swap Permit Parameters",
    description:
      "Full glossary of swap permit parameters, safe defaults, and override precedence.",
  },
  {
    href: "/docs/cli/guides/simulate-verify-execute",
    title: "Simulate, Verify, Execute",
    description:
      "The canonical ATF workflow from simulation through receipt verification to execution.",
  },
  {
    href: "/docs/cli/guides/helius-setup",
    title: "Helius RPC Setup",
    description:
      "Configure profiles, set a Helius endpoint, and confirm connectivity.",
  },
  {
    href: "/docs/cli/guides/devnet-burner",
    title: "Devnet Burner Quickstart",
    description:
      "Spin up a throwaway devnet wallet, simulate, verify, and send in minutes.",
  },
  {
    href: "/docs/cli/guides/production-bot-basics",
    title: "Production Bot Basics",
    description:
      "Profile separation, receipts retention, and operational hygiene for automated agents.",
  },
];

export default function GuidesIndexPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          CLI &rsaquo; Guides
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-5xl">
          CLI Guides
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Practical, step-by-step walkthroughs for common ATF CLI workflows.
          Each guide includes prerequisites, copyable commands, expected outputs, and troubleshooting tips.
        </p>
      </header>

      <section className="space-y-4">
        <HeadingAnchor id="all-guides">All Guides</HeadingAnchor>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((guide) => (
            <Link
              key={guide.href}
              href={guide.href}
              className="rounded-xl border border-white/10 bg-neutral-950/50 p-5 transition-colors hover:border-primary-300/30 hover:bg-neutral-950/70"
            >
              <p className="font-semibold text-slate-100">{guide.title}</p>
              <p className="mt-2 text-sm text-slate-400">{guide.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <HeadingAnchor id="before-you-start">Before You Start</HeadingAnchor>
        <div className="max-w-3xl space-y-3 text-slate-300">
          <p>
            Every guide assumes you have already run{" "}
            <code className="font-mono text-slate-200">doctor</code> and
            have a passing environment. If you have not set up
            the CLI yet, start with the{" "}
            <Link
              href="/docs/cli/doctor"
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              Doctor reference
            </Link>{" "}
            first.
          </p>
          <p>
            Guides are ordered by complexity. If you are brand new to ATF,
            start with{" "}
            <Link
              href="/docs/cli/guides/devnet-burner"
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              Devnet Burner Quickstart
            </Link>{" "}
            to get a feel for the workflow before moving to production topics.
          </p>
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

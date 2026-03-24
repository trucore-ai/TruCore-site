import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { TrackedLink } from "@/components/tracked-link";

export const metadata: Metadata = {
  title: "Start Here — Agent Transaction Firewall",
  description:
    "Your starting path to ATF: try the sandbox, read the docs, choose a plan, and protect your first trade.",
};

const steps = [
  {
    step: "1",
    title: "Try",
    desc: "Run a sandbox trade and get a receipt in under 30 seconds. No signup needed.",
    href: "/try",
    cta: "Open Sandbox",
    event: "start_try_click",
  },
  {
    step: "2",
    title: "Learn",
    desc: "Understand what ATF enforces: spend caps, protocol allowlists, slippage bounds, and receipts.",
    href: "/docs/getting-started",
    cta: "Read Getting Started",
    event: "start_docs_click",
  },
  {
    step: "3",
    title: "Sign Up",
    desc: "Create a free account to get your API key. 100 protect calls/day included. No credit card.",
    href: "/signup",
    cta: "Create Account",
    event: "start_signup_click",
  },
  {
    step: "4",
    title: "Protect",
    desc: "Integrate ATF into your bot. Every trade gets a receipt. Every decision is verifiable.",
    href: "/docs/first-protected-trade",
    cta: "First Protected Trade",
    event: "start_protect_click",
  },
];

export default function StartPage() {
  return (
    <Container>
      <Section className="fade-in-up">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary-200">
            Getting Started
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-accent-200 sm:text-6xl">
            Start Here
          </h1>
          <p className="mt-4 text-xl leading-[1.5] text-slate-200">
            Four steps from zero to a verified receipt. Start in the sandbox
            — no signup required. Every execution feeds the Policy Intelligence
            Layer so your system keeps improving.
          </p>
        </div>
      </Section>

      <Section divider className="pt-0 fade-in-up fade-delay-1">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item) => (
            <div
              key={item.step}
              className="group rounded-xl border border-white/[0.07] bg-neutral-900/40 p-6 transition-colors hover:border-primary-300/20 hover:bg-neutral-900/60"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-200">
                Step {item.step}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-accent-300">
                {item.title}
              </h2>
              <p className="mt-2 text-base leading-relaxed text-slate-300">
                {item.desc}
              </p>
              <TrackedLink
                href={item.href}
                eventName={item.event}
                eventProps={{ location: "start_page" }}
                className="mt-4 inline-block text-sm font-semibold text-primary-200 transition-colors hover:text-primary-100"
              >
                {item.cta} &rarr;
              </TrackedLink>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Proof Strip ── */}
      <Section divider className="fade-in-up fade-delay-2">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            The ATF Path
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-lg font-semibold text-slate-200">
            <span className="rounded-lg bg-accent-500/10 px-4 py-2 text-accent-300">
              Try
            </span>
            <span className="text-slate-500" aria-hidden="true">&rarr;</span>
            <span className="rounded-lg bg-accent-500/10 px-4 py-2 text-accent-300">
              Protect
            </span>
            <span className="text-slate-500" aria-hidden="true">&rarr;</span>
            <span className="rounded-lg bg-accent-500/10 px-4 py-2 text-accent-300">
              Verify
            </span>
            <span className="text-slate-500" aria-hidden="true">&rarr;</span>
            <span className="rounded-lg bg-accent-500/10 px-4 py-2 text-accent-300">
              Upgrade
            </span>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            Start free. Get receipts. Upgrade when you are ready.
          </p>
        </div>
      </Section>

      {/* ── What ATF Is ── */}
      <Section divider className="fade-in-up fade-delay-3">
        <div className="mx-auto max-w-3xl space-y-4">
          <h2 className="text-2xl font-bold text-accent-300">
            What is ATF?
          </h2>
          <p className="text-base leading-relaxed text-slate-300">
            <strong className="text-slate-200">
              Agent Transaction Firewall
            </strong>{" "}
            is a pre-execution policy enforcement layer for AI trading agents
            on Solana. It evaluates bot trade intents against deterministic
            rules — spend caps, venue allowlists, slippage bounds, and
            time-locked permits — and returns a cryptographic receipt for every
            decision.
          </p>
          <p className="text-base leading-relaxed text-slate-300">
            Non-custodial. Fail-closed by default. Receipts are independently
            verifiable.
          </p>
        </div>
      </Section>

      {/* ── Quick Links ── */}
      <Section className="fade-in-up fade-delay-4">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-4 text-xl font-bold text-accent-300">
            Quick Links
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { title: "Docs Overview", href: "/docs" },
              { title: "When to Use ATF", href: "/docs/when-to-use-atf" },
              { title: "CLI Reference", href: "/docs/cli" },
              { title: "API Reference", href: "/docs/api" },
              { title: "Receipts Explorer", href: "/receipts" },
              { title: "Verify a Receipt", href: "/verify" },
              { title: "For Builders", href: "/builders" },
              { title: "Enterprise", href: "/enterprise" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg border border-white/[0.07] bg-neutral-900/30 px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:border-primary-300/20 hover:text-primary-100"
              >
                {link.title}
              </Link>
            ))}
          </div>
        </div>
      </Section>
    </Container>
  );
}

import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { TrackedLink } from "@/components/tracked-link";

export const metadata: Metadata = {
  title: "x402Fuel — Wallets for AI Agents",
  description:
    "Give every AI agent a USDC wallet with one API call. HTTP 402 native payment settlement on Base. MIT-licensed, open source.",
};

export default function X402FuelPage() {
  return (
    <Container>
      {/* Hero */}
      <Section className="fade-in-up pt-12 sm:pt-16 pb-8 sm:pb-10">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1.5">
            <span className="block h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-sm font-semibold uppercase tracking-wider text-amber-400/80">
              Coming Soon
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            x402Fuel
          </h1>
          <p className="mt-4 text-2xl font-semibold text-amber-200/90">
            Wallets for AI agents
          </p>
          <p className="mt-6 max-w-2xl mx-auto text-xl leading-relaxed text-slate-200/90">
            Every agent gets a USDC wallet with one API call. HTTP 402 native payment settlement on Base.
            Your agent pays for compute, APIs, and services — no credit cards, no human in the loop.
          </p>
        </div>
      </Section>

      {/* How it works */}
      <Section divider className="fade-in-up fade-delay-1">
        <div className="mb-8 max-w-2xl">
          <p className="section-label mb-3">How It Works</p>
          <h2 className="text-4xl font-bold tracking-tight text-accent-300">
            One API call. Agent gets a wallet.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { step: "1", title: "Create", desc: "POST /wallets → agent gets a Base USDC address." },
            { step: "2", title: "Fund", desc: "Add USDC. Set daily limits per service." },
            { step: "3", title: "Pay", desc: "Agent hits 402 → wallet auto-pays → service delivers." },
          ].map((item) => (
            <Card key={item.step}>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-200">
                Step {item.step}
              </p>
              <p className="mt-2 text-lg font-bold text-accent-300">{item.title}</p>
              <p className="mt-2 text-base leading-relaxed text-slate-200">{item.desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Pricing preview */}
      <Section divider className="fade-in-up fade-delay-1">
        <div className="mb-8 max-w-2xl">
          <p className="section-label mb-3">Pricing</p>
          <h2 className="text-4xl font-bold tracking-tight text-accent-300">
            Free to start. Pay as you grow.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { tier: "Free", price: "$0", desc: "Up to $500/mo volume. 1 wallet. Base only.", fee: "3% per txn" },
            { tier: "Pro", price: "$19/mo", desc: "Up to $5K/mo. 5 wallets. Multi-chain.", fee: "2% per txn" },
            { tier: "Business", price: "$99/mo", desc: "Up to $50K/mo. 25 wallets. Spending policies.", fee: "1% per txn" },
          ].map((p) => (
            <Card key={p.tier}>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-200">{p.tier}</p>
              <p className="mt-2 text-3xl font-bold text-accent-300">{p.price}</p>
              <p className="mt-1 text-sm text-slate-400">{p.fee}</p>
              <p className="mt-3 text-base leading-relaxed text-slate-200">{p.desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section className="fade-in-up fade-delay-2 pb-16 sm:pb-20">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            Be the first to know
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-200">
            x402Fuel is in development. Join the waitlist for early access and launch updates.
          </p>
          <div className="mt-8">
            <TrackedLink
              href="/atf#waitlist"
              eventName="x402fuel_waitlist_click"
              eventProps={{ location: "x402fuel_page" }}
              className="inline-flex items-center justify-center rounded-xl bg-accent-500 px-8 py-4 text-xl font-semibold text-neutral-950 transition-colors hover:bg-accent-400"
            >
              Join Waitlist
            </TrackedLink>
          </div>
        </div>
      </Section>
    </Container>
  );
}
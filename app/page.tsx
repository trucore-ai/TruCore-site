import type { Metadata } from "next";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GlassInnerPanel } from "@/components/ui/glass-slab-canvas";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { WaitlistForm } from "@/components/waitlist-form";
import { AtfDesignPartnerCta } from "@/components/atf-design-partner-cta";
import { TrackedLink } from "@/components/tracked-link";
import { TrustStrip } from "@/components/trust-strip";
import Image from "next/image";

export const metadata: Metadata = {
  title: "TruCore",
  description:
    "TruCore delivers Agent Transaction Firewall controls for Solana with policy-bound execution and tamper-evident receipts for autonomous finance.",
  openGraph: {
    title: "TruCore | Agent Transaction Firewall, Tamper-Evident Receipts, Solana",
    description:
      "Policy-bound execution, tamper-evident receipts, and fail-closed design for autonomous finance on Solana.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "TruCore home social preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TruCore | Agent Transaction Firewall, Tamper-Evident Receipts, Solana",
    description:
      "Policy-bound execution, tamper-evident receipts, and fail-closed design for autonomous finance on Solana.",
    images: ["/opengraph-image"],
  },
};

const metrics = [
  "Policy-bound execution",
  "Verifiable receipts",
  "Fail-closed design",
];

const whyItems = [
  {
    title: "Zero-trust guardrails",
    description:
      "Every autonomous action is evaluated against explicit trust boundaries before execution.",
  },
  {
    title: "Policy enforcement",
    description:
      "Deterministic controls keep agent behavior aligned with risk, compliance, and user intent.",
  },
  {
    title: "Cryptographic receipts",
    description:
      "Each critical event can produce tamper-evident evidence for post-trade verification and audit.",
  },
];

const trustPillars = [
  "Fail-closed defaults for autonomous actions",
  "Auditability across every critical decision",
  "Deterministic policy enforcement before execution",
  "Cryptographic receipts for verifiable operations",
];

const atfFeatures = [
  {
    title: "Policy-bound execution",
    description:
      "Every agent transaction is validated against explicit policy rules before on-chain submission.",
  },
  {
    title: "Slippage constraints",
    description:
      "Hard limits on price deviation protect capital from adverse execution and MEV extraction.",
  },
  {
    title: "Protocol allowlists",
    description:
      "Agents can only interact with pre-approved contracts. No unauthorized protocol access.",
  },
  {
    title: "Permit-based authorization",
    description:
      "Scoped, time-bound permits grant agents minimal execution rights with explicit boundaries.",
  },
  {
    title: "Cryptographic receipts",
    description:
      "Tamper-evident proof of every policy check, execution, and settlement for full auditability.",
  },
];

const visionItems = [
  {
    title: "AI-native DeFi infrastructure",
    description: "Purpose-built primitives for autonomous agents operating across decentralized financial protocols.",
  },
  {
    title: "Stable asset tooling",
    description: "Trust-verified instruments and guardrails for AI systems managing stable value representations.",
  },
  {
    title: "Agent coordination layers",
    description: "Secure multi-agent communication and settlement channels for complex financial workflows.",
  },
];

export default function Home() {
  return (
    <Container>
      {/* ── Hero ── */}
      <Section id="hero" className="fade-in-up">
        <Card className="glass-panel-hero relative overflow-hidden p-6 sm:p-12">
          <div className="hero-legibility-overlay" aria-hidden="true" />
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3">
              <Badge>Solana-native</Badge>
              <Badge>Zero-trust</Badge>
              <Badge>AI execution</Badge>
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-7xl lg:text-8xl">
              Security Infrastructure for Autonomous Finance
            </h1>
            <p className="mt-5 max-w-2xl text-3xl leading-[1.4] text-slate-200 sm:text-4xl">
              TruCore builds trust layers for AI agents transacting on-chain.
            </p>
            <p className="mt-3 max-w-2xl text-xl leading-[1.5] text-primary-200/80">
              Launching with Agent Transaction Firewall (ATF).
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <TrackedLink
                href="/atf/simulator"
                eventName="hero_sandbox_click"
                eventProps={{ location: "home_hero" }}
                className="inline-flex items-center justify-center rounded-xl bg-accent-500 px-7 py-4 text-xl font-semibold text-neutral-950 transition-colors hover:bg-accent-400"
              >
                Try sandbox
              </TrackedLink>
              <TrackedLink
                href="/atf/apply"
                eventName="hero_pilot_click"
                eventProps={{ location: "home_hero" }}
                className="inline-flex items-center justify-center rounded-xl border border-primary-300/40 bg-primary-500/10 px-7 py-4 text-xl font-semibold text-primary-100 transition-colors hover:border-primary-300/70 hover:bg-primary-500/20"
              >
                Apply for pilot
              </TrackedLink>
              <TrackedLink
                href="/docs/5-minute-quickstart"
                eventName="hero_quickstart_click"
                eventProps={{ location: "home_hero", target: "5_minute" }}
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-7 py-4 text-xl font-semibold text-slate-100 transition-colors hover:bg-white/10"
              >
                Get started in 5 min
              </TrackedLink>
            </div>
            <p className="mt-4 text-lg text-slate-300">
              Need proof first?{" "}
              <TrackedLink
                href="/receipts"
                eventName="hero_receipts_click"
                eventProps={{ location: "home_hero" }}
                className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
              >
                View example receipts
              </TrackedLink>
            </p>
            <ul className="mt-8 grid gap-4 text-2xl text-primary-50 sm:grid-cols-3 sm:auto-rows-fr">
              {metrics.map((item) => (
                <li key={item} className="h-full">
                  <GlassInnerPanel>{item}</GlassInnerPanel>
                </li>
              ))}
            </ul>

            <div className="mt-8 mx-auto hidden max-w-4xl md:block">
              <div className="relative overflow-hidden rounded-xl">
                <Image
                  src="/images/trucore-banner.png"
                  alt="TruCore banner"
                  width={1536}
                  height={1024}
                  className="h-auto w-full object-cover"
                  style={{
                    WebkitMaskImage:
                      "radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 72%)",
                    maskImage:
                      "radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 72%)",
                  }}
                  priority
                />
              </div>
            </div>
          </div>
        </Card>
      </Section>

      {/* ── Operational Controls Trust Strip ── */}
      <div className="-mt-4 mb-2">
        <TrustStrip />
      </div>

      {/* ── Flagship Product: ATF ── */}
      <Section id="atf" className="border-t border-white/10 fade-in-up fade-delay-1">
        <div className="mb-8 max-w-2xl">
          <Badge className="mb-4">Flagship Product</Badge>
          <h2 className="text-5xl font-bold tracking-tight text-[#f0a050]">
            Agent Transaction Firewall (ATF)
          </h2>
          <p className="mt-4 text-3xl leading-[1.4] text-slate-200">
            ATF is the enforcement layer between AI agents and on-chain execution.
            It applies deterministic policy checks to every transaction before
            submission, constraining slippage, restricting protocol access, and
            producing cryptographic receipts for full auditability.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {atfFeatures.map((feat) => (
            <Card key={feat.title} className="min-h-[220px]">
              <h3 className="text-2xl font-bold text-[#f2a65f]">{feat.title}</h3>
              <p className="mt-3 text-xl leading-[1.5] text-slate-100/95">{feat.description}</p>
            </Card>
          ))}
        </div>
        <div className="mt-6">
          <Button href="/atf" variant="secondary">
            Learn More →
          </Button>
        </div>
      </Section>

      {/* ── Why TruCore ── */}
      <Section id="why-trucore" className="border-t border-white/10 fade-in-up fade-delay-2">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-5xl font-bold tracking-tight text-[#f0a050]">Why TruCore</h2>
          <p className="mt-4 text-3xl leading-[1.4] text-slate-200">
            Trust-first controls and verifiable operations for AI systems handling financial decisions.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {whyItems.map((item) => (
            <Card key={item.title} className="min-h-[220px]">
              <h3 className="text-3xl font-bold text-[#e8944a]">{item.title}</h3>
              <p className="mt-3 text-2xl leading-[1.5] text-slate-200">{item.description}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ── The TruCore Vision ── */}
      <Section id="vision" className="border-t border-white/10 fade-in-up fade-delay-3">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-5xl font-bold tracking-tight text-[#f0a050]">The TruCore Vision</h2>
          <p className="mt-4 text-3xl leading-[1.4] text-slate-200">
            Agent Transaction Firewall is the first product, not the last. TruCore is building
            the foundational security infrastructure that autonomous financial systems require
            to operate at scale.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3 md:auto-rows-fr">
          {visionItems.map((item) => (
            <Card key={item.title} className="h-full">
              <h3 className="text-2xl font-bold text-[#e8944a]">{item.title}</h3>
              <p className="mt-3 text-xl leading-[1.5] text-slate-200">{item.description}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ── Trust & Integrity ── */}
      <Section id="trust-integrity" className="border-t border-white/10 fade-in-up fade-delay-4">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-5xl font-bold tracking-tight text-[#f0a050]">Trust &amp; Integrity</h2>
          <p className="mt-4 text-3xl leading-[1.4] text-slate-200">
            Security-grade principles govern every execution path from policy check to final settlement.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3 md:auto-rows-fr">
          <Card className="md:col-span-2">
            <ul className="grid gap-4 text-2xl text-slate-100 sm:grid-cols-2">
              {trustPillars.map((pillar) => (
                <li key={pillar} className="h-full">
                  <GlassInnerPanel>{pillar}</GlassInnerPanel>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="border-primary-300/25 bg-primary-500/10">
            <p className="text-xl font-bold uppercase tracking-[0.14em] text-primary-100">
              Security Contact
            </p>
            <p className="mt-3 text-2xl text-slate-200">
              For responsible disclosure and security coordination, contact our team directly.
            </p>
            <p className="mt-4 text-2xl font-bold text-white">security@trucore.xyz</p>
          </Card>
        </div>
      </Section>

      {/* ── V1 Integrations ── */}
      <Section id="integrations" className="border-t border-white/10 fade-in-up fade-delay-5">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-5xl font-bold tracking-tight text-[#f0a050]">V1 Integrations</h2>
          <p className="mt-4 text-3xl leading-[1.4] text-slate-200">
            Built with a Solana-first foundation and integrated with critical DeFi rails for execution.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3 md:auto-rows-fr">
          <Card className="border-primary-300/25 bg-primary-500/10 md:col-span-2">
            <h3 className="text-4xl font-bold text-[#e8944a]">Solana</h3>
            <p className="mt-3 max-w-xl text-2xl leading-[1.5] text-slate-200">
              Primary execution layer for low-latency policy-aware transactions, deterministic controls,
              and verifiable settlement pathways.
            </p>
          </Card>
          <div className="grid gap-4 md:col-span-1 md:auto-rows-fr">
            <Card className="h-full">
              <h3 className="text-3xl font-bold text-[#e8944a]">Jupiter</h3>
              <p className="mt-3 text-2xl leading-[1.5] text-slate-200">
                Secondary integration for route intelligence and best-execution support.
              </p>
            </Card>
            <Card className="h-full">
              <h3 className="text-3xl font-bold text-[#e8944a]">Solend</h3>
              <p className="mt-3 text-2xl leading-[1.5] text-slate-200">
                Secondary integration for lending and collateral-aware strategy primitives.
              </p>
            </Card>
          </div>
        </div>
      </Section>

      {/* ── Design Partner CTA ── */}
      <AtfDesignPartnerCta location="homepage_bottom" />

      {/* ── Waitlist ── */}
      <Section id="waitlist" className="border-t border-white/10 fade-in-up">
        <Card className="bg-accent-500/10 border-accent-500/30 p-8 sm:p-10">
          <h2 className="text-5xl font-bold text-accent-300">Join the ATF Waitlist</h2>
          <p className="mt-4 max-w-2xl text-3xl leading-[1.4] text-slate-100">
            Be first to access the Agent Transaction Firewall — TruCore’s trust-first enforcement layer for autonomous finance.
          </p>
          <div className="mt-6 max-w-xl">
            <Suspense fallback={null}>
              <WaitlistForm />
            </Suspense>
          </div>
        </Card>
      </Section>
    </Container>
  );
}

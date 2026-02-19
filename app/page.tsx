import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Tilt } from "@/components/ui/tilt";
import { WaitlistForm } from "@/components/waitlist-form";
import { ScrollLink } from "@/components/scroll-link";
import Image from "next/image";

const metrics = [
  "Policy-bound execution",
  "Verifiable receipts",
  "Fail-closed design",
];

const whyItems = [
  {
    icon: "ZT",
    title: "Zero-trust guardrails",
    description:
      "Every autonomous action is evaluated against explicit trust boundaries before execution.",
  },
  {
    icon: "PE",
    title: "Policy enforcement",
    description:
      "Deterministic controls keep agent behavior aligned with risk, compliance, and user intent.",
  },
  {
    icon: "CR",
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
    icon: "PB",
    title: "Policy-bound execution",
    description:
      "Every agent transaction is validated against explicit policy rules before on-chain submission.",
  },
  {
    icon: "SC",
    title: "Slippage constraints",
    description:
      "Hard limits on price deviation protect capital from adverse execution and MEV extraction.",
  },
  {
    icon: "PA",
    title: "Protocol allowlists",
    description:
      "Agents can only interact with pre-approved contracts. No unauthorized protocol access.",
  },
  {
    icon: "PZ",
    title: "Permit-based authorization",
    description:
      "Scoped, time-bound permits grant agents minimal execution rights with explicit boundaries.",
  },
  {
    icon: "CR",
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
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-neutral-900/75 backdrop-blur-md p-8 sm:p-12">
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
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ScrollLink
                targetId="waitlist"
                className="inline-flex items-center justify-center rounded-xl px-7 py-4 text-xl font-semibold transition-colors bg-accent-500 text-neutral-950 hover:bg-accent-400"
              >
                Join the ATF Waitlist
              </ScrollLink>
              <a
                href="/atf"
                className="inline-flex items-center justify-center rounded-xl px-7 py-4 text-xl font-semibold transition-colors border border-primary-300/40 bg-primary-500/10 text-primary-100 hover:border-primary-300/70 hover:bg-primary-500/20"
              >
                Explore ATF
              </a>
            </div>
            <ul className="mt-8 grid gap-4 text-2xl text-primary-50 sm:grid-cols-3">
              {metrics.map((item) => (
                <li key={item} className="rounded-lg border border-primary-300/25 bg-primary-500/15 px-7 py-5">
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 mx-auto max-w-4xl">
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
        </div>
      </Section>

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
            <Tilt key={feat.title} maxTilt={5} perspective={1100} className="h-full">
              <Card className="depth-scene h-full">
                <div className="depth-icon mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg border border-primary-300/40 bg-primary-500/20 text-base font-bold tracking-wide text-primary-50">
                  {feat.icon}
                </div>
                <h3 className="depth-title text-2xl font-bold text-[#e8944a]">{feat.title}</h3>
                <p className="depth-body mt-3 text-xl leading-[1.5] text-slate-200">{feat.description}</p>
              </Card>
            </Tilt>
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
            <Tilt key={item.title} maxTilt={6} perspective={1100} className="h-full">
              <Card className="depth-scene h-full">
                <div className="depth-icon mb-4 inline-flex h-16 w-16 items-center justify-center rounded-lg border border-primary-300/40 bg-primary-500/20 text-lg font-bold tracking-wide text-primary-50">
                  {item.icon}
                </div>
                <h3 className="depth-title text-3xl font-bold text-[#e8944a]">{item.title}</h3>
                <p className="depth-body mt-3 text-2xl leading-[1.5] text-slate-200">{item.description}</p>
              </Card>
            </Tilt>
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
        <div className="grid gap-4 md:grid-cols-3">
          {visionItems.map((item) => (
            <Card key={item.title}>
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
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <ul className="grid gap-4 text-2xl text-slate-100 sm:grid-cols-2">
              {trustPillars.map((pillar) => (
                <li
                  key={pillar}
                  className="rounded-lg border border-primary-300/25 bg-primary-500/15 px-7 py-5"
                >
                  {pillar}
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
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-primary-300/25 bg-primary-500/10 md:col-span-2">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-primary-300/40 text-sm font-semibold text-primary-100">
              S
            </div>
            <h3 className="text-4xl font-bold text-[#e8944a]">Solana</h3>
            <p className="mt-3 max-w-xl text-2xl leading-[1.5] text-slate-200">
              Primary execution layer for low-latency policy-aware transactions, deterministic controls,
              and verifiable settlement pathways.
            </p>
          </Card>
          <div className="grid gap-4 md:col-span-1">
            <Card>
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-sm font-semibold text-slate-200">
                J
              </div>
              <h3 className="text-3xl font-bold text-[#e8944a]">Jupiter</h3>
              <p className="mt-3 text-2xl leading-[1.5] text-slate-200">
                Secondary integration for route intelligence and best-execution support.
              </p>
            </Card>
            <Card>
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-sm font-semibold text-slate-200">
                L
              </div>
              <h3 className="text-3xl font-bold text-[#e8944a]">Solend</h3>
              <p className="mt-3 text-2xl leading-[1.5] text-slate-200">
                Secondary integration for lending and collateral-aware strategy primitives.
              </p>
            </Card>
          </div>
        </div>
      </Section>

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

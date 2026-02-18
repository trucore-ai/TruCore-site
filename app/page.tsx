import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { HeroBackground3D } from "@/components/hero-background-3d";
import { Section } from "@/components/ui/section";
import { Tilt } from "@/components/ui/tilt";
import { WaitlistForm } from "@/components/waitlist-form";
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

export default function Home() {
  return (
    <Container>
      <Section id="hero" className="fade-in-up">
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-neutral-900/80 p-8 sm:p-12">
          <HeroBackground3D />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3">
              <Badge>Solana-native</Badge>
              <Badge>Zero-trust</Badge>
              <Badge>AI execution</Badge>
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">
              Trust infrastructure for autonomous finance.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              TruCore is AI-native financial infrastructure that enforces policy before action,
              keeps execution accountable, and protects capital by default.
            </p>
            <Tilt maxTilt={4} perspective={1000} className="mt-8">
              <div className="depth-scene flex flex-col gap-3 sm:flex-row">
                <div className="depth-title">
                  <Button href="#waitlist" variant="primary">
                    Request Early Access
                  </Button>
                </div>
                <div className="depth-body">
                  <Button href="#integrations" variant="secondary">
                    Read the ATF Overview
                  </Button>
                </div>
              </div>
            </Tilt>
            <ul className="mt-8 grid gap-3 text-sm text-primary-100 sm:grid-cols-3">
              {metrics.map((item) => (
                <li key={item} className="rounded-lg border border-primary-300/20 bg-primary-500/10 px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 mx-auto max-w-4xl">
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-neutral-950/45">
                <Image
                  src="/images/trucore-banner.png"
                  alt="TruCore banner"
                  width={1600}
                  height={560}
                  className="h-auto w-full object-cover"
                  priority
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_46%,rgba(5,10,20,0.82)_100%)]"
                />
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section id="why-trucore" className="border-t border-white/10 fade-in-up fade-delay-1">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-primary-100">Why TruCore</h2>
          <p className="mt-3 text-slate-300">
            Trust-first controls and verifiable operations for AI systems handling financial decisions.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {whyItems.map((item) => (
            <Tilt key={item.title} maxTilt={6} perspective={1100} className="h-full">
              <Card className="depth-scene h-full">
                <div className="depth-icon mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-primary-300/35 bg-primary-500/15 text-xs font-semibold tracking-wide text-primary-100">
                  {item.icon}
                </div>
                <h3 className="depth-title text-lg font-semibold text-slate-100">{item.title}</h3>
                <p className="depth-body mt-3 text-sm leading-6 text-slate-300">{item.description}</p>
              </Card>
            </Tilt>
          ))}
        </div>
      </Section>

      <Section id="trust-integrity" className="border-t border-white/10 fade-in-up fade-delay-2">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-primary-100">Trust &amp; Integrity</h2>
          <p className="mt-3 text-slate-300">
            Security-grade principles govern every execution path from policy check to final settlement.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <ul className="grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
              {trustPillars.map((pillar) => (
                <li
                  key={pillar}
                  className="rounded-lg border border-primary-300/20 bg-primary-500/10 px-4 py-3"
                >
                  {pillar}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="border-primary-300/25 bg-primary-500/10">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-200">
              Security Contact
            </p>
            <p className="mt-3 text-sm text-slate-300">
              For responsible disclosure and security coordination, contact our team directly.
            </p>
            <p className="mt-4 text-base font-semibold text-primary-100">security@trucore.xyz</p>
          </Card>
        </div>
      </Section>

      <Section id="integrations" className="border-t border-white/10 fade-in-up fade-delay-3">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-primary-100">V1 Integrations</h2>
          <p className="mt-3 text-slate-300">
            Built with a Solana-first foundation and integrated with critical DeFi rails for execution.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-primary-300/25 bg-primary-500/10 md:col-span-2">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-primary-300/40 text-sm font-semibold text-primary-100">
              S
            </div>
            <h3 className="text-xl font-semibold text-slate-100">Solana</h3>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Primary execution layer for low-latency policy-aware transactions, deterministic controls,
              and verifiable settlement pathways.
            </p>
          </Card>
          <div className="grid gap-4 md:col-span-1">
            <Card>
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-sm font-semibold text-slate-200">
                J
              </div>
              <h3 className="text-lg font-semibold text-slate-100">Jupiter</h3>
              <p className="mt-2 text-sm text-slate-300">
                Secondary integration for route intelligence and best-execution support.
              </p>
            </Card>
            <Card>
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-sm font-semibold text-slate-200">
                L
              </div>
              <h3 className="text-lg font-semibold text-slate-100">Solend</h3>
              <p className="mt-2 text-sm text-slate-300">
                Secondary integration for lending and collateral-aware strategy primitives.
              </p>
            </Card>
          </div>
        </div>
      </Section>

      <Section id="waitlist" className="border-t border-white/10 fade-in-up fade-delay-4">
        <Card className="bg-accent-500/10 border-accent-500/30 p-8 sm:p-10">
          <h2 className="text-2xl font-semibold text-accent-400">Join the TruCore waitlist.</h2>
          <p className="mt-3 max-w-2xl text-slate-200">
            Get early updates on integrity-first autonomous finance infrastructure.
          </p>
          <div className="mt-6 max-w-xl">
            <WaitlistForm />
          </div>
        </Card>
      </Section>
    </Container>
  );
}

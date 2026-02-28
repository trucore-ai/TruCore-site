import type { Metadata } from "next";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { TrackedLink } from "@/components/tracked-link";
import { WaitlistForm } from "@/components/waitlist-form";

export const metadata: Metadata = {
  title: "TruCore | Agent Transaction Firewall",
  description:
    "Trustless enforcement for AI-driven capital. Deterministic decisions, verifiable receipts, zero runtime dependencies.",
  openGraph: {
    title: "TruCore | Agent Transaction Firewall",
    description:
      "Trustless enforcement for AI-driven capital. Deterministic decisions, verifiable receipts, zero runtime dependencies.",
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
    title: "TruCore | Agent Transaction Firewall",
    description:
      "Trustless enforcement for AI-driven capital. Deterministic decisions, verifiable receipts, zero runtime dependencies.",
    images: ["/opengraph-image"],
  },
};

export default function Home() {
  return (
    <Container>
      {/* ── Hero ── */}
      <Section id="hero" className="fade-in-up">
        <Card className="glass-panel-hero relative overflow-hidden p-6 sm:p-12">
          <div className="hero-legibility-overlay" aria-hidden="true" />
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3">
              <Badge>Live</Badge>
              <Badge>Zero-trust</Badge>
              <Badge>Deterministic</Badge>
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-[#ffe0b2] md:text-6xl">
              Agent Transaction Firewall
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-[1.5] text-slate-200">
              Trustless enforcement for AI-driven capital.
              Deterministic decisions. Verifiable receipts. Zero runtime dependencies.
            </p>

            <div className="mt-8">
              <pre className="rounded-xl bg-black text-white p-4 overflow-x-auto text-sm font-mono">
npx @trucore/atf@1.0.2 simulate --preset swap_small --verify
              </pre>
            </div>

            <p className="mt-4 text-sm text-primary-200/80">
              Returns a cryptographically verifiable ALLOWED decision with deterministic content_hash.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <TrackedLink
                href="#quickstart"
                eventName="hero_try_cli_click"
                eventProps={{ location: "home_hero" }}
                className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-lg font-semibold text-neutral-950 transition-colors hover:bg-slate-200"
              >
                Try the CLI
              </TrackedLink>
              <TrackedLink
                href="#architecture"
                eventName="hero_architecture_click"
                eventProps={{ location: "home_hero" }}
                className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-lg font-semibold text-slate-100 transition-colors hover:bg-white/10"
              >
                View Architecture
              </TrackedLink>
            </div>

            {/* ── Micro-nav ── */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-400">
              <TrackedLink
                href="/docs"
                eventName="hero_micronav_click"
                eventProps={{ target: "docs", location: "home_hero" }}
                className="transition-colors hover:text-primary-100"
              >
                Docs
              </TrackedLink>
              <span aria-hidden="true" className="text-white/20">/</span>
              <TrackedLink
                href="/changelog"
                eventName="hero_micronav_click"
                eventProps={{ target: "changelog", location: "home_hero" }}
                className="transition-colors hover:text-primary-100"
              >
                Changelog
              </TrackedLink>
              <span aria-hidden="true" className="text-white/20">/</span>
              <TrackedLink
                href="https://github.com/TruCore-AI"
                target="_blank"
                rel="noopener noreferrer"
                eventName="hero_micronav_click"
                eventProps={{ target: "github", location: "home_hero" }}
                className="transition-colors hover:text-primary-100"
              >
                GitHub
              </TrackedLink>
            </div>
          </div>
        </Card>
      </Section>

      {/* ── Quickstart ── */}
      <Section id="quickstart" className="border-t border-white/10 fade-in-up fade-delay-1">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-[#f0a050]">
            Quickstart
          </h2>
          <p className="mt-4 text-xl leading-[1.5] text-slate-200">
            Run a deterministic firewall simulation and verify the receipt locally.
            No installation required.
          </p>
        </div>

        <pre className="rounded-xl bg-black text-white p-6 overflow-x-auto text-sm font-mono max-w-3xl">
npx @trucore/atf@1.0.2 simulate --preset swap_small --verify
        </pre>

        <div className="mt-8 max-w-2xl space-y-3 text-sm text-slate-200">
          <p>&bull; Calls production ATF API</p>
          <p>&bull; Receives ALLOWED decision</p>
          <p>&bull; Validates deterministic content_hash</p>
          <p>&bull; Confirms receipt integrity locally</p>
        </div>
      </Section>

      {/* ── What Happens Under the Hood ── */}
      <Section id="architecture" className="border-t border-white/10 fade-in-up fade-delay-2">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-[#f0a050]">
            What Happens Under the Hood
          </h2>
        </div>

        <div className="max-w-3xl space-y-6 text-xl leading-[1.5] text-slate-200">
          <p>1. The CLI sends a deterministic transaction payload to ATF.</p>
          <p>2. ATF evaluates policy constraints under a zero-trust model.</p>
          <p>3. A decision object is generated with:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>decision (ALLOWED / BLOCKED)</li>
            <li>request_id</li>
            <li>content_hash</li>
            <li>timestamp</li>
          </ul>
          <p>4. The CLI independently verifies receipt integrity.</p>
          <p className="text-primary-200/80">
            No client secrets. No runtime dependencies. No hidden state.
          </p>
        </div>
      </Section>

      {/* ── Trust + Proof ── */}
      <Section id="trust" className="border-t border-white/10 fade-in-up fade-delay-3">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-[#f0a050]">
            Trust + Proof
          </h2>
          <p className="mt-4 text-xl leading-[1.5] text-slate-200">
            Every claim ATF makes is verifiable. Here is what backs it.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <Badge>Receipts</Badge>
            <h3 className="mt-4 text-lg font-semibold text-[#ffe0b2]">Deterministic Receipts</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Every decision produces a <code className="text-primary-200/90">content_hash</code> computed from stable
              JSON serialization. Re-hash the payload locally and the digest matches.
            </p>
          </Card>

          <Card>
            <Badge>Tracing</Badge>
            <h3 className="mt-4 text-lg font-semibold text-[#ffe0b2]">Request Tracing</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Every request carries an <code className="text-primary-200/90">X-Request-ID</code> header.
              Pass it through your stack for end-to-end correlation across services.
            </p>
          </Card>

          <Card>
            <Badge>CLI</Badge>
            <h3 className="mt-4 text-lg font-semibold text-[#ffe0b2]">Zero-Dependency CLI</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              The CLI ships with no runtime dependencies. Run it in CI, on air-gapped hosts,
              or inside containers without pulling transitive packages.
            </p>
          </Card>

          <Card>
            <Badge>Production</Badge>
            <h3 className="mt-4 text-lg font-semibold text-[#ffe0b2]">Production Path</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              <code className="text-primary-200/90">/v1/simulate</code> is the canonical API route.
              <code className="text-primary-200/90">/api/simulate</code> aliases it behind Caddy for convenience.
            </p>
          </Card>
        </div>
      </Section>

      {/* ── Why ATF Exists ── */}
      <Section id="why-atf" className="border-t border-white/10 fade-in-up fade-delay-4">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-[#f0a050]">
            Why ATF Exists
          </h2>
        </div>

        <div className="max-w-3xl space-y-6 text-xl leading-[1.5] text-slate-200">
          <p>
            AI agents will coordinate capital.
            Enforcement cannot rely on trust.
          </p>
          <p>
            ATF enforces deterministic transaction policy before execution.
          </p>
          <p>Built on:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Permit-based authorization</li>
            <li>Cryptographic execution receipts</li>
            <li>Deterministic content hashing</li>
            <li>Zero-trust threat modeling</li>
          </ul>
          <p>
            On-chain guardrails and vault enforcement are part of the roadmap.
          </p>
        </div>
      </Section>

      {/* ── Roadmap ── */}
      <Section id="roadmap" className="border-t border-white/10 fade-in-up fade-delay-5">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-[#f0a050]">
            Roadmap
          </h2>
        </div>

        <div className="max-w-3xl space-y-6 text-xl leading-[1.5] text-slate-200">
          <p><strong className="text-[#f2a65f]">Phase 1 &mdash; Deterministic Enforcement (Live)</strong></p>
          <p>&bull; Production API</p>
          <p>&bull; Zero-dependency CLI</p>
          <p>&bull; Deterministic receipts</p>

          <p className="pt-6"><strong className="text-[#f2a65f]">Phase 2 &mdash; Trustless Foundations</strong></p>
          <p>&bull; Permit-based cryptographic authorization</p>
          <p>&bull; Tamper-evident audit receipts</p>
          <p>&bull; Secure-by-default policy templates</p>

          <p className="pt-6"><strong className="text-[#f2a65f]">Phase 3 &mdash; On-Chain Guardrails (Solana)</strong></p>
          <p>&bull; Vault + invariant enforcement program</p>
          <p>&bull; Policy attestation registry</p>
          <p>&bull; Router enforcement layer</p>
        </div>
      </Section>

      {/* ── Get Updates ── */}
      <Section id="updates" className="border-t border-white/10 fade-in-up">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-[#f0a050]">
            Get Updates
          </h2>
          <p className="mt-4 text-lg leading-[1.5] text-slate-200">
            Get release notes and security updates. CLI versions are pinned; the changelog announces upgrades.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-xl">
          <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-white/5" />}>
            <WaitlistForm />
          </Suspense>
        </div>
      </Section>
    </Container>
  );
}

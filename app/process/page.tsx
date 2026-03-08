import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";

const lastUpdated = process.env.NEXT_PUBLIC_BUILD_DATE ?? "unknown";

export const metadata: Metadata = {
  title: "How ATF Is Built and Maintained",
  description:
    "Public proof-of-process for TruCore ATF covering development discipline, security hardening, release controls, and transparency signals.",
};

export default function ProcessPage() {
  return (
    <Container>
      <Section className="fade-in-up">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
            How ATF Is Built and Maintained
          </h1>
          <p className="mt-4 text-2xl leading-[1.5] text-slate-200">
            This page describes how TruCore builds and ships ATF with deterministic controls,
            public verification points, and repeatable operational discipline.
          </p>
          <p className="mt-4 text-sm font-medium text-slate-400">Last updated: {lastUpdated}</p>
        </div>
      </Section>

      <Section divider className="fade-in-up fade-delay-1">
        <div className="mx-auto max-w-3xl space-y-6">
          <Card>
            <h2 className="text-3xl font-bold text-accent-300">Development Discipline</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>Explicit version tagging for every release.</li>
              <li>CI enforcement for lint, unit tests, and e2e coverage.</li>
              <li>Parallelized CI jobs for deterministic and fast validation.</li>
              <li>Bundle guardrails to detect regressions before production.</li>
            </ul>
          </Card>

          <Card>
            <h2 className="text-3xl font-bold text-accent-300">Security Hardening</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>Content Security Policy enforcement with strict directives.</li>
              <li>Cookie scoping and secure session boundaries.</li>
              <li>Rate limiting and abuse resistance on exposed endpoints.</li>
              <li>No-store policies on sensitive API and admin surfaces.</li>
            </ul>
          </Card>

          <Card>
            <h2 className="text-3xl font-bold text-accent-300">Release Process</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>Tagged releases follow semantic pattern v0.x.y.</li>
              <li>Production smoke checks run before release completion.</li>
              <li>Ops checklist gates release readiness and deployment signoff.</li>
            </ul>
          </Card>

          <Card>
            <h2 className="text-3xl font-bold text-accent-300">Transparency</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>Public service health visibility via the status page.</li>
              <li>Responsible disclosure channel for coordinated reporting.</li>
              <li>Whitepaper hash verification for document integrity checks.</li>
            </ul>
          </Card>

          <Card>
            <h2 className="text-3xl font-bold text-accent-300">Why Process Matters</h2>
            <p className="mt-4 text-xl leading-[1.5] text-slate-300">
              Long-term infrastructure outcomes depend on repeatable process discipline. Clear
              release controls, verifiable checkpoints, and explicit operational standards keep ATF
              aligned with institutional expectations over time.
            </p>
          </Card>

          <div className="glass-panel rounded-xl p-6">
            <h2 className="text-2xl font-bold text-slate-100">Related Surfaces</h2>
            <ul className="mt-4 space-y-2 text-lg text-slate-200">
              <li>
                <Link
                  href="/security/overview"
                  className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
                >
                  /security/overview
                </Link>
              </li>
              <li>
                <Link
                  href="/status"
                  className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
                >
                  /status
                </Link>
              </li>
              <li>
                <Link
                  href="/agent-transaction-firewall"
                  className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
                >
                  /agent-transaction-firewall
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/anchoring-roadmap"
                  className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
                >
                  /docs/anchoring-roadmap
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com/trucore-ai/TruCore-site/blob/main/RELEASE.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
                >
                  RELEASE.md (GitHub)
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </Section>
    </Container>
  );
}
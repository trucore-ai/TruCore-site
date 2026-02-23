import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";

const lastUpdated = process.env.NEXT_PUBLIC_BUILD_DATE ?? "unknown";

export const metadata: Metadata = {
  title: "Security Overview",
  description:
    "Public security posture for TruCore with architecture philosophy, operational controls, data handling principles, and release discipline.",
};

export default function SecurityOverviewPage() {
  return (
    <Container>
      <Section className="fade-in-up">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-5xl">
            Security Overview
          </h1>
          <p className="mt-4 text-2xl leading-[1.5] text-slate-200">
            TruCore is designed as security-first infrastructure for autonomous
            finance. This page describes our public commitments without exposing
            private implementation details.
          </p>
          <p className="mt-4 text-sm font-medium text-slate-400">
            Last updated: {lastUpdated}
          </p>
        </div>
      </Section>

      <Section className="border-t border-white/10 fade-in-up fade-delay-1">
        <div className="mx-auto max-w-3xl space-y-6">
          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">
              Architecture Philosophy
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>Fail-closed by default.</li>
              <li>Deterministic policy enforcement.</li>
              <li>Permit-scoped authorization.</li>
              <li>Tamper-evident logging.</li>
            </ul>
          </Card>

          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">
              Operational Controls
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>CI enforced.</li>
              <li>CSP reporting.</li>
              <li>Admin audit logs.</li>
              <li>Rate limiting.</li>
              <li>Noindex on sensitive routes.</li>
            </ul>
          </Card>

          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">Data Handling</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>Minimal PII collection.</li>
              <li>No resale of data.</li>
              <li>Admin-gated metrics only.</li>
            </ul>
          </Card>

          <Card>
            <h2 className="text-3xl font-bold text-[#f0a050]">Release Discipline</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>Versioned releases (v0.x.y).</li>
              <li>Tagged and logged.</li>
              <li>Production smoke before tag.</li>
            </ul>
          </Card>

          <div className="glass-panel rounded-xl p-6 text-center">
            <p className="text-lg text-slate-200">
              Found an issue or need disclosure details? Visit{" "}
              <Link
                href="/security/disclosure"
                className="font-semibold text-primary-300 underline underline-offset-2 transition-colors hover:text-primary-200"
              >
                Responsible Disclosure
              </Link>
              .
            </p>
          </div>
        </div>
      </Section>
    </Container>
  );
}
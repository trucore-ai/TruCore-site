import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";

const lastUpdated = process.env.NEXT_PUBLIC_BUILD_DATE ?? "unknown";

export const metadata: Metadata = {
  title: "Enterprise & Institutional Readiness",
  description:
    "Structured due-diligence overview for enterprise and institutional buyers evaluating TruCore ATF.",
};

export default function EnterprisePage() {
  return (
    <Container>
      <Section className="fade-in-up">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
            Enterprise &amp; Institutional Readiness
          </h1>
          <p className="mt-4 text-2xl leading-[1.5] text-slate-200">
            TruCore is designed for control, transparency, and operational clarity. This page
            provides a concise due-diligence view of deployment, data handling, and roadmap
            direction.
          </p>
          <p className="mt-4 text-sm font-medium text-slate-400">Last updated: {lastUpdated}</p>
        </div>
      </Section>

      <Section divider className="fade-in-up fade-delay-1">
        <div className="mx-auto max-w-3xl space-y-6">
          <Card>
            <h2 className="text-3xl font-bold text-accent-300">Deployment Model</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>Stateless API architecture with deterministic evaluation paths.</li>
              <li>No custody model, policy enforcement without holding customer assets.</li>
              <li>Explicit permit scope for bounded autonomous execution rights.</li>
            </ul>
          </Card>

          <Card>
            <h2 className="text-3xl font-bold text-accent-300">Data Handling</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>No PII required for public simulation workflows.</li>
              <li>Aggregated metrics are used for public transparency reporting.</li>
              <li>No cross-partner data visibility in shared operational surfaces.</li>
            </ul>
          </Card>

          <Card>
            <h2 className="text-3xl font-bold text-accent-300">Security Posture</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>Content Security Policy enforcement and script control boundaries.</li>
              <li>Session hardening with scoped cookies and secure defaults.</li>
              <li>Rate limiting and abuse controls on exposed APIs.</li>
              <li>Fail-closed behavior for policy and signature validation paths.</li>
            </ul>
          </Card>

          <Card>
            <h2 className="text-3xl font-bold text-accent-300">Roadmap Direction</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>Vault + Guardrails program with a design-first rollout model.</li>
              <li>Policy attestation registry for stronger external verification.</li>
              <li>Router program as a future defense layer for execution routing.</li>
            </ul>
          </Card>

          <Card>
            <h2 className="text-3xl font-bold text-accent-300">Engagement Path</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>Pilot scope definition against target controls and policy model.</li>
              <li>Sandbox key issuance for controlled integration validation.</li>
              <li>Policy review with architecture and risk stakeholders.</li>
            </ul>
          </Card>

          <div className="glass-panel rounded-xl p-6">
            <h2 className="text-2xl font-bold text-slate-100">Related Links</h2>
            <ul className="mt-4 space-y-2 text-lg text-slate-200">
              <li>
                <Link
                  href="/process"
                  className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
                >
                  /process
                </Link>
              </li>
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
                  href="/atf"
                  className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
                >
                  /atf
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </Section>
    </Container>
  );
}
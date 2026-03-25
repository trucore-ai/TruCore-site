import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Build With ATF",
  description:
    "Build policy templates, agent middleware hooks, and receipt tooling around TruCore Agent Transaction Firewall (ATF).",
};

export default function BuildWithAtfPage() {
  return (
    <Container>
      <Section className="fade-in-up">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">Build With ATF</h1>
          <p className="mt-4 text-2xl leading-[1.5] text-slate-200">
            ATF is an enforcement layer for agent-driven finance. This page outlines structured,
            low-risk ways to build integrations, tooling, and reusable policy design surfaces.
          </p>
        </div>
      </Section>

      <Section divider className="fade-in-up fade-delay-1">
        <div className="mx-auto grid max-w-4xl gap-6">
          <Card>
            <h2 className="text-3xl font-bold text-accent-300">Who Should Build With ATF</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>Agent framework developers</li>
              <li>DeFi protocol integrators</li>
              <li>Risk and compliance engineers</li>
            </ul>
          </Card>

          <Card>
            <h2 className="text-3xl font-bold text-accent-300">What You Can Build</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>Policy templates</li>
              <li>Agent middleware hooks</li>
              <li>Receipt audit tools</li>
              <li>Monitoring dashboards</li>
              <li>Automation pipelines using ATF&apos;s bot-ready JSON outputs</li>
            </ul>
            <p className="mt-4 text-base text-slate-400">
              ATF outputs are dual-surface: every command produces operator-friendly terminal output and
              machine-readable JSON with <code className="text-slate-300">machine_summary</code>,{" "}
              <code className="text-slate-300">suggested_action</code>, and{" "}
              <code className="text-slate-300">suggested_command</code> fields - ready for automation.
            </p>
          </Card>

          <Card>
            <h2 className="text-3xl font-bold text-accent-300">Example Contribution Paths</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-xl text-slate-300">
              <li>Submit policy template PR</li>
              <li>Publish ATF-compatible agent demo</li>
              <li>Create receipt verification tooling</li>
            </ul>
          </Card>

          <div className="glass-panel rounded-xl p-6">
            <h2 className="text-2xl font-bold text-slate-100">Links</h2>
            <ul className="mt-4 space-y-2 text-lg text-slate-200">
              <li>
                <Link
                  href="https://github.com/TruCore-AI/ATF-policy-examples"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
                >
                  GitHub repository (read-only reference)
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/integration-pattern"
                  className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
                >
                  /docs/integration-pattern
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/atf-architecture"
                  className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
                >
                  /docs/atf-architecture
                </Link>
              </li>
              <li>
                <Link
                  href="/demo-policy"
                  className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
                >
                  /demo-policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </Section>
    </Container>
  );
}
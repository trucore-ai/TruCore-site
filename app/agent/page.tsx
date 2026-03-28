import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Agent Integration Guide",
  description:
    "Canonical agent integration guide for TruCore ATF. Simulate, compare, plan, execute, and self-upgrade AI-driven transactions.",
  openGraph: {
    title: "Agent Integration Guide - TruCore ATF",
    description:
      "Canonical agent integration guide for TruCore ATF. Simulate, compare, plan, execute, and self-upgrade AI-driven transactions.",
  },
};

const canonicalFlow = [
  {
    step: 1,
    title: "Preflight a single intent",
    desc: "Submit one intent for simulation and policy evaluation before execution.",
    endpoint: "/v1/bot/preflight",
  },
  {
    step: 2,
    title: "Compare multiple options",
    desc: "Rank multiple candidate intents to find the best option based on policy score and simulated outcome.",
    endpoint: "/v1/bot/preflight/compare",
  },
  {
    step: 3,
    title: "Plan quota and batch usage",
    desc: "Estimate safe throughput and batch sizes within current quota limits.",
    endpoint: "/v1/bot/quota/plan",
  },
  {
    step: 4,
    title: "Execute the best option",
    desc: "Select and execute the highest-ranking option. This mutates state and produces a transaction.",
    endpoint: "/v1/bot/execute-best",
  },
  {
    step: 5,
    title: "Read quota and upgrade signals",
    desc: "Check _meta.upgrade in responses to detect quota pressure and upgrade recommendations.",
    endpoint: "Any bot endpoint",
  },
  {
    step: 6,
    title: "Request self-upgrade when allowed",
    desc: "Request a plan upgrade if policy permits. Blocked upgrades return a deterministic denial.",
    endpoint: "/v1/bot/self-upgrade",
  },
];

const endpoints = [
  {
    method: "POST",
    path: "/v1/bot/preflight",
    purpose: "Simulate one intent against policy",
    readOnly: true,
    mutates: false,
  },
  {
    method: "POST",
    path: "/v1/bot/preflight/compare",
    purpose: "Rank multiple candidate intents",
    readOnly: true,
    mutates: false,
  },
  {
    method: "GET",
    path: "/v1/bot/quota/plan",
    purpose: "Estimate safe throughput within quota",
    readOnly: true,
    mutates: false,
  },
  {
    method: "POST",
    path: "/v1/bot/quota/plan-batch",
    purpose: "Estimate safe batch size within quota",
    readOnly: true,
    mutates: false,
  },
  {
    method: "POST",
    path: "/v1/bot/execute-best",
    purpose: "Select and execute the best option",
    readOnly: false,
    mutates: true,
  },
  {
    method: "POST",
    path: "/v1/bot/self-upgrade",
    purpose: "Request free-to-pro plan upgrade",
    readOnly: false,
    mutates: true,
  },
  {
    method: "GET",
    path: "/v1/bot/upgrade/status",
    purpose: "Check current plan and upgrade eligibility",
    readOnly: true,
    mutates: false,
  },
];

export default function AgentPage() {
  return (
    <Container>
      {/* Header */}
      <Section className="fade-in-up">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary-200">
            Agent Discovery
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-accent-200 sm:text-6xl">
            Agent Integration Guide
          </h1>
          <p className="mt-6 text-2xl leading-[1.5] text-slate-200">
            Use TruCore ATF to simulate, compare, protect, and upgrade AI-driven
            transactions.
          </p>
          <p className="mt-4 text-lg text-slate-300">
            This page provides the canonical bot-facing flow for integrating
            with the Agent Transaction Firewall. Machine-readable discovery is
            available at{" "}
            <Link
              href="/.well-known/agent.json"
              className="font-semibold text-primary-300 underline underline-offset-2 transition-colors hover:text-primary-200"
            >
              /.well-known/agent.json
            </Link>
            .
          </p>
        </div>
      </Section>

      {/* Canonical Flow */}
      <Section divider className="fade-in-up fade-delay-1">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            Canonical Bot Flow
          </h2>
          <p className="mt-3 text-xl text-slate-300">
            The recommended sequence for AI agents using ATF.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {canonicalFlow.map((item) => (
            <Card key={item.step} className="flex flex-col">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent-400/40 text-sm font-bold text-accent-300">
                  {item.step}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-accent-300">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-base leading-[1.5] text-slate-200">
                    {item.desc}
                  </p>
                  <code className="mt-2 inline-block rounded bg-neutral-800 px-2 py-0.5 text-sm text-primary-200">
                    {item.endpoint}
                  </code>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Bot-Facing Endpoints */}
      <Section divider className="fade-in-up fade-delay-2">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            Bot-Facing Endpoints
          </h2>
          <p className="mt-3 text-xl text-slate-300">
            All endpoints available for agent integration.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="pb-3 pr-4 text-sm font-semibold text-slate-400">
                  Method
                </th>
                <th className="pb-3 pr-4 text-sm font-semibold text-slate-400">
                  Endpoint
                </th>
                <th className="pb-3 pr-4 text-sm font-semibold text-slate-400">
                  Purpose
                </th>
                <th className="pb-3 pr-4 text-sm font-semibold text-slate-400">
                  Read-Only
                </th>
                <th className="pb-3 text-sm font-semibold text-slate-400">
                  Mutates State
                </th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((ep) => (
                <tr
                  key={ep.path}
                  className="border-b border-white/5 last:border-0"
                >
                  <td className="py-3 pr-4">
                    <span className="rounded bg-primary-500/20 px-2 py-0.5 text-sm font-semibold text-primary-200">
                      {ep.method}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <code className="text-sm text-accent-300">{ep.path}</code>
                  </td>
                  <td className="py-3 pr-4 text-sm text-slate-200">
                    {ep.purpose}
                  </td>
                  <td className="py-3 pr-4 text-sm">
                    {ep.readOnly ? (
                      <span className="text-green-400">Yes</span>
                    ) : (
                      <span className="text-amber-400">No</span>
                    )}
                  </td>
                  <td className="py-3 text-sm">
                    {ep.mutates ? (
                      <span className="text-amber-400">Yes</span>
                    ) : (
                      <span className="text-green-400">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Upgrade Behavior */}
      <Section divider className="fade-in-up">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            Upgrade Behavior
          </h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h3 className="text-xl font-bold text-accent-300">
              Quota Pressure Signals
            </h3>
            <p className="mt-3 text-lg leading-[1.5] text-slate-200">
              Bots may receive{" "}
              <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-base text-primary-200">
                _meta.upgrade
              </code>{" "}
              in responses when approaching or exceeding quota limits. This
              signal includes:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1 text-base text-slate-300">
              <li>
                <code className="text-primary-200">recommended: true</code> when
                upgrade would help
              </li>
              <li>
                <code className="text-primary-200">reason</code> indicating the
                trigger (e.g., quota_near_limit)
              </li>
              <li>
                <code className="text-primary-200">upgrade_endpoint</code>{" "}
                pointing to self-upgrade
              </li>
            </ul>
          </Card>
          <Card className="border-amber-500/20 bg-amber-500/[0.04]">
            <h3 className="text-xl font-bold text-accent-300">
              Policy-Gated Self-Upgrade
            </h3>
            <p className="mt-3 text-lg leading-[1.5] text-slate-200">
              Self-upgrade requests may be blocked by operator policy. When
              blocked, the response includes:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1 text-base text-slate-300">
              <li>
                <code className="text-primary-200">allowed: false</code>
              </li>
              <li>
                <code className="text-primary-200">reason</code> such as{" "}
                <code className="text-amber-300">
                  self_serve_upgrade_disabled
                </code>{" "}
                or{" "}
                <code className="text-amber-300">monetization_disabled</code>
              </li>
              <li>
                <code className="text-primary-200">
                  next_action: contact_operator
                </code>
              </li>
            </ul>
            <p className="mt-4 text-base font-semibold text-amber-300">
              When blocked, bots should stop retrying and follow next_action.
            </p>
          </Card>
        </div>
      </Section>

      {/* Discovery Links */}
      <Section divider className="fade-in-up">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-accent-300">
            Discovery Links
          </h2>
          <p className="mt-3 text-xl text-slate-300">
            Key resources for agent discovery and integration.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/builders"
            className="block rounded-lg border border-primary-300/25 bg-primary-500/10 p-5 transition-colors hover:border-primary-300/40"
          >
            <h3 className="text-lg font-bold text-accent-300">For Builders</h3>
            <p className="mt-1 text-base leading-[1.5] text-slate-200">
              Get started with ATF integration. Sandbox, golden path, and
              partner access.
            </p>
            <span className="mt-2 inline-block text-sm font-semibold text-primary-200">
              View page &rarr;
            </span>
          </Link>
          <Link
            href="/status"
            className="block rounded-lg border border-primary-300/25 bg-primary-500/10 p-5 transition-colors hover:border-primary-300/40"
          >
            <h3 className="text-lg font-bold text-accent-300">System Status</h3>
            <p className="mt-1 text-base leading-[1.5] text-slate-200">
              Live operational status and health checks for TruCore services.
            </p>
            <span className="mt-2 inline-block text-sm font-semibold text-primary-200">
              Check status &rarr;
            </span>
          </Link>
          <Link
            href="/.well-known/agent.json"
            className="block rounded-lg border border-accent-500/20 bg-accent-500/[0.04] p-5 transition-colors hover:border-accent-500/40"
          >
            <h3 className="text-lg font-bold text-accent-300">
              Machine-Readable Manifest
            </h3>
            <p className="mt-1 text-base leading-[1.5] text-slate-200">
              JSON manifest for automated agent discovery at
              /.well-known/agent.json.
            </p>
            <span className="mt-2 inline-block text-sm font-semibold text-primary-200">
              View JSON &rarr;
            </span>
          </Link>
        </div>
      </Section>

      {/* Get Started CTA */}
      <Section className="fade-in-up">
        <Card className="border-primary-300/25 bg-primary-500/10 p-6 text-center">
          <h2 className="text-2xl font-bold text-accent-300">
            Ready to integrate?
          </h2>
          <p className="mt-2 text-lg text-slate-200">
            Start with the sandbox or request early access for production
            integration.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/atf/simulator"
              className="inline-flex items-center justify-center rounded-xl border border-primary-300/40 bg-primary-500/15 px-6 py-3 text-lg font-semibold text-primary-100 transition-colors hover:bg-primary-500/25"
            >
              Try the sandbox &rarr;
            </Link>
            <Link
              href="/atf/apply"
              className="inline-flex items-center justify-center rounded-xl border border-accent-400/40 bg-accent-500/10 px-6 py-3 text-lg font-semibold text-accent-200 transition-colors hover:bg-accent-500/20"
            >
              Request access &rarr;
            </Link>
          </div>
        </Card>
      </Section>
    </Container>
  );
}

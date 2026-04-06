import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { sections } from "@/lib/docs-nav";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Technical documentation for TruCore ATF covering quickstart flows, policy model concepts, and permit semantics.",
};

const docsCards = sections.flatMap((section) => section.items).filter((item) => item.href !== "/docs");

export default function DocsHubPage() {
  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">ATF Docs</p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">Documentation</h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Start with a practical quickstart, then dive into policy primitives, permit construction,
          and the Policy Intelligence Layer. The docs are intentionally concise so teams can
          evaluate integration fit quickly.
        </p>
        <p className="max-w-3xl text-base leading-relaxed text-slate-400">
          <strong className="text-slate-200">New here?</strong>{" "}
          Start with{" "}
          <Link
            href="/docs/getting-started"
            className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            Getting Started
          </Link>
          {" "}for the full signup-to-receipt walkthrough.{" "}
          <strong className="text-slate-200">Bot developer?</strong>{" "}
          Jump straight to{" "}
          <Link
            href="/docs/first-protected-trade"
            className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            First Protected Trade
          </Link>
          {" "}to protect an intent, get a receipt, and verify it in minutes. See{" "}
          <Link
            href="/docs/surfaces"
            className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            Integration Surfaces
          </Link>
          {" "}for API/CLI/Plugin coverage.{" "}
          <strong className="text-slate-200">Agent runtime?</strong>{" "}
          See{" "}
          <Link
            href="/docs/mcp"
            className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            MCP Integration
          </Link>
          {" "}for tool-based policy enforcement via hosted endpoint, or{" "}
          <Link
            href="/docs/plans"
            className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            Plans &amp; Feature Tiers
          </Link>
          {" "}for what each plan includes.{" "}
          <strong className="text-slate-200">Prefer code?</strong>{" "}
          See the{" "}
          <Link
            href="/docs/hello-world-bot"
            className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            hello-world bot tutorial
          </Link>
          {" "}for a minimal Python bot, unprotected then ATF-protected, in under 30 lines.
        </p>
        <div className="gradient-divider mt-2" aria-hidden="true" />
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {docsCards.map((item) => (
          <Card key={item.href} className="group h-full p-6 transition-colors hover:border-white/[0.12]">
            <h2 className="text-xl font-bold tracking-tight text-accent-300">{item.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.description}</p>
            <Link
              href={item.href}
              className="mt-5 inline-flex text-sm font-semibold text-primary-200 transition-colors group-hover:text-primary-100"
            >
              Read {item.title} &rarr;
            </Link>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="glass-panel rounded-xl p-7">
          <HeadingAnchor id="ready-to-test-atf-in-your-workflow">
            Ready to test ATF in your workflow?
          </HeadingAnchor>
          <p className="mt-3 text-slate-400">
            Apply to the design partner program to help shape policy and permit ergonomics for production teams.
          </p>
          <Button href="/atf/apply" size="sm" className="mt-5">
            Apply as Design Partner
          </Button>
        </section>

        <section className="glass-panel rounded-xl p-7">
          <HeadingAnchor id="need-integration-help">
            Need integration help?
          </HeadingAnchor>
          <p className="mt-3 text-slate-400">
            Building a bot or agent and want hands-on guidance? See the builder
            landing for your fastest path from sandbox to production.
          </p>
          <Button href="/builders" size="sm" className="mt-5">
            For Bot Builders &rarr;
          </Button>
        </section>
      </div>
    </div>
  );
}
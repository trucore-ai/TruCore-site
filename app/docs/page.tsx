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
          Start with a practical quickstart, then dive into policy primitives and permit construction.
          The docs are intentionally concise so teams can evaluate integration fit quickly.
        </p>
        <p className="max-w-3xl text-base leading-relaxed text-slate-400">
          If you are new to the category, read{" "}
          <Link
            href="/agent-transaction-firewall"
            className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            Agent Transaction Firewall
          </Link>
          . Then continue with the{" "}
          <Link
            href="/docs/atf-architecture"
            className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            architecture deep dive
          </Link>
          . For receipt semantics, read the formal{" "}
          <Link
            href="/docs/receipt-specification-v1"
            className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            Receipt Specification v1
          </Link>
          {" "}and the{" "}
          <Link
            href="/docs/anchoring-roadmap"
            className="font-semibold text-primary-200 transition-colors hover:text-primary-100"
          >
            Anchoring &amp; Execution Roadmap
          </Link>
          .
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
    </div>
  );
}
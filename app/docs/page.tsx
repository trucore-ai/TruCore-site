import type { Metadata } from "next";
import Link from "next/link";
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
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">ATF Docs</p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-100 sm:text-5xl">Documentation</h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Start with a practical quickstart, then dive into policy primitives and permit construction.
          The docs are intentionally concise so teams can evaluate integration fit quickly.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {docsCards.map((item) => (
          <Card key={item.href} className="h-full p-6">
            <h2 className="text-2xl font-semibold text-slate-100">{item.title}</h2>
            <p className="mt-2 text-base leading-relaxed text-slate-300">{item.description}</p>
            <Link
              href={item.href}
              className="mt-5 inline-flex text-sm font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              Read {item.title} →
            </Link>
          </Card>
        ))}
      </section>

      <section className="rounded-xl border border-white/10 bg-neutral-900/40 p-6">
        <h2 className="text-2xl font-semibold text-slate-100">Ready to test ATF in your workflow?</h2>
        <p className="mt-2 text-slate-300">
          Apply to the design partner program to help shape policy and permit ergonomics for production teams.
        </p>
        <Link
          href="/atf/apply"
          className="mt-5 inline-flex items-center justify-center rounded-lg bg-accent-500 px-5 py-3 text-sm font-semibold text-neutral-950 transition-colors hover:bg-accent-400"
        >
          Apply as Design Partner
        </Link>
      </section>
    </div>
  );
}
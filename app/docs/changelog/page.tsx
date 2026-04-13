import type { Metadata } from "next";
import { HeadingAnchor } from "@/components/heading-anchor";

export const metadata: Metadata = {
  title: "Changelog | TruCore ATF",
  description:
    "Versioned release notes for the ATF CLI and public API.",
  keywords: [
    "ATF changelog",
    "release notes",
    "ATF CLI versions",
    "API changes",
    "TruCore ATF",
  ],
  openGraph: {
    title: "Changelog | TruCore ATF",
    description: "Versioned release notes for the ATF CLI and public API.",
    url: "https://trucore.xyz/docs/changelog",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Changelog | TruCore ATF",
    description: "Versioned release notes for the ATF CLI and public API.",
    images: ["/opengraph-image"],
  },
  alternates: { canonical: "https://trucore.xyz/docs/changelog" },
};

export default function DocsChangelogPage() {
  return (
    <article className="space-y-10">
      {/* ── Header ── */}
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          Release Notes
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">
          Changelog
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Versioned release notes for the ATF CLI and public API.
        </p>
      </header>

      {/* ── Version 1.0.2 ── */}
      <section className="space-y-4">
        <HeadingAnchor id="v1-0-2">Version 1.0.2</HeadingAnchor>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">CLI</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-6 text-slate-300">
              <li>Zero runtime dependencies.</li>
              <li>
                <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">request_id</code>{" "}
                passthrough on all simulation calls.
              </li>
              <li>
                Deterministic verification support via{" "}
                <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">--verify</code>.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-100">API</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-6 text-slate-300">
              <li>
                <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">POST /v1/simulate</code>{" "}
                endpoint live.
              </li>
              <li>
                <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">/api/simulate</code>{" "}
                convenience alias.
              </li>
              <li>
                <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">X-Request-ID</code>{" "}
                header passthrough.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-100">Notes</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-6 text-slate-300">
              <li>Pinned installs recommended for production use.</li>
              <li>No breaking changes from 1.0.1.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Version 1.0.1 ── */}
      <section className="space-y-4">
        <HeadingAnchor id="v1-0-1">Version 1.0.1</HeadingAnchor>
        <ul className="list-disc space-y-1.5 pl-6 text-slate-300">
          <li>Initial public CLI release.</li>
          <li>Deterministic ALLOWED preset support.</li>
        </ul>
      </section>

      {/* ── Versioning Policy ── */}
      <section className="space-y-4">
        <HeadingAnchor id="versioning-policy">Versioning Policy</HeadingAnchor>
        <ul className="list-disc space-y-1.5 pl-6 text-slate-300">
          <li>Semantic versioning (major.minor.patch).</li>
          <li>Pinned versions recommended in production.</li>
          <li>Minor versions do not break receipt structure.</li>
          <li>Breaking changes bump the major version.</li>
        </ul>
      </section>
    </article>
  );
}

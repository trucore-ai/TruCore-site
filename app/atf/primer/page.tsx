import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { TrackedLink } from "@/components/tracked-link";
import { primerMeta, primerSections } from "@/lib/primer-content";

export const metadata: Metadata = {
  title: primerMeta.title,
  description: primerMeta.subtitle,
};

export default function PrimerPage() {
  return (
    <Container>
      {/* ── Hero ── */}
      <Section className="fade-in-up">
        <div className="max-w-3xl">
          <Badge className="mb-4">ATF</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-6xl lg:text-7xl">
            {primerMeta.title}
          </h1>
          <p className="mt-5 text-2xl leading-[1.4] text-slate-200 sm:text-3xl">
            {primerMeta.subtitle}
          </p>

          {/* Download PDF CTA */}
          <div className="mt-8 flex flex-wrap gap-4">
            <TrackedLink
              href="/atf/primer/pdf"
              eventName="primer_download_click"
              eventProps={{ location: "primer_page" }}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl px-7 py-4 text-xl font-semibold transition-colors bg-accent-500 text-neutral-950 hover:bg-accent-400"
            >
              Download PDF
            </TrackedLink>
            <TrackedLink
              href="/atf/apply"
              eventName="design_partner_apply_click"
              eventProps={{ location: "primer_hero" }}
              className="inline-flex items-center justify-center rounded-xl border border-primary-300/40 bg-primary-500/15 px-7 py-4 text-xl font-semibold text-primary-100 transition-colors hover:bg-primary-500/25"
            >
              Apply as Design Partner
            </TrackedLink>
          </div>
        </div>
      </Section>

      {/* ── Primer Sections ── */}
      {primerSections.map((section) => (
        <Section
          key={section.id}
          id={section.id}
          className="border-t border-white/10 fade-in-up"
        >
          <div className="max-w-3xl">
            <h2 className="text-4xl font-bold tracking-tight text-[#f0a050]">
              {section.heading}
            </h2>

            {section.paragraphs?.map((p, i) => (
              <p
                key={i}
                className="mt-4 text-2xl leading-[1.4] text-slate-200"
              >
                {p}
              </p>
            ))}

            {section.bullets && (
              <ul className="mt-4 space-y-3">
                {section.bullets.map((b, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-xl leading-[1.5] text-slate-200"
                  >
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary-400" />
                    {b}
                  </li>
                ))}
              </ul>
            )}

            {/* CTA for "How to Engage" section */}
            {section.id === "engage" && (
              <div className="mt-6">
                <TrackedLink
                  href="/atf/apply"
                  eventName="design_partner_apply_click"
                  eventProps={{ location: "primer_engage" }}
                  className="inline-flex items-center justify-center rounded-xl px-7 py-4 text-xl font-semibold transition-colors bg-accent-500 text-neutral-950 hover:bg-accent-400"
                >
                  Apply as Design Partner &rarr;
                </TrackedLink>
              </div>
            )}
          </div>
        </Section>
      ))}

      {/* ── Callout ── */}
      <Section className="border-t border-white/10 fade-in-up">
        <Card className="max-w-3xl border-primary-300/25 bg-primary-500/10">
          <p className="text-xl leading-[1.5] text-slate-200">
            {primerMeta.callout}
          </p>
        </Card>
      </Section>

      {/* ── Bottom CTA ── */}
      <Section className="border-t border-white/10 fade-in-up">
        <div className="flex flex-wrap gap-4">
          <TrackedLink
            href="/atf/primer/pdf"
            eventName="primer_download_click"
            eventProps={{ location: "primer_bottom" }}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl px-7 py-4 text-xl font-semibold transition-colors bg-accent-500 text-neutral-950 hover:bg-accent-400"
          >
            Download PDF
          </TrackedLink>
          <TrackedLink
            href="/atf"
            eventName="cta_click"
            eventProps={{ target: "atf_page", location: "primer_bottom" }}
            className="inline-flex items-center justify-center rounded-xl border border-primary-300/40 bg-primary-500/15 px-7 py-4 text-xl font-semibold text-primary-100 transition-colors hover:bg-primary-500/25"
          >
            &larr; Back to ATF
          </TrackedLink>
        </div>
      </Section>
    </Container>
  );
}

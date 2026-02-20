import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { TrackedLink } from "@/components/tracked-link";
import { WhitepaperHashPanel } from "@/components/whitepaper-hash-panel";
import { whitepaperMeta, whitepaperSections } from "@/lib/whitepaper-content";

export const metadata: Metadata = {
  title: whitepaperMeta.title,
  description: whitepaperMeta.subtitle,
};

export default function WhitepaperPage() {
  return (
    <Container>
      <Section className="fade-in-up">
        <div className="max-w-3xl">
          <Badge className="mb-4">ATF</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-6xl lg:text-7xl">
            {whitepaperMeta.title}
          </h1>
          <p className="mt-5 text-2xl leading-[1.4] text-slate-200 sm:text-3xl">
            {whitepaperMeta.subtitle}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <TrackedLink
              href="/atf/whitepaper/pdf"
              eventName="whitepaper_download_click"
              eventProps={{ location: "whitepaper_page" }}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl px-7 py-4 text-xl font-semibold transition-colors bg-accent-500 text-neutral-950 hover:bg-accent-400"
            >
              Download PDF
            </TrackedLink>
          </div>

          <div className="mt-6">
            <WhitepaperHashPanel />
          </div>
        </div>
      </Section>

      {whitepaperSections.map((section) => (
        <Section key={section.id} className="border-t border-white/10 fade-in-up">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-bold tracking-tight text-[#f0a050]">
              {section.heading}
            </h2>

            {section.paragraphs?.map((paragraph, idx) => (
              <p key={idx} className="mt-4 text-2xl leading-[1.4] text-slate-200">
                {paragraph}
              </p>
            ))}

            {section.bullets && (
              <ul className="mt-4 space-y-3">
                {section.bullets.map((bullet, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-xl leading-[1.5] text-slate-200"
                  >
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary-400" />
                    {bullet}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>
      ))}

      <Section className="border-t border-white/10 fade-in-up">
        <Card className="max-w-3xl border-primary-300/25 bg-primary-500/10">
          <p className="text-lg leading-[1.6] text-slate-200">
            This is a short preview, not a full specification. It reflects the
            current ATF security model and deployment scope.
          </p>
        </Card>
      </Section>
    </Container>
  );
}

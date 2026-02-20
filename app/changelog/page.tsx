import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import changelog from "@/lib/changelog";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "A chronological record of updates, improvements, and new features shipped to the TruCore platform.",
};

export default function ChangelogPage() {
  return (
    <Container>
      <Section className="fade-in-up">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-5xl">
            Changelog
          </h1>
          <p className="mt-4 text-2xl leading-[1.5] text-slate-200">
            A record of what we ship. Latest updates first.
          </p>
        </div>
      </Section>

      <Section className="border-t border-white/10 fade-in-up fade-delay-1">
        <div className="mx-auto max-w-3xl space-y-6">
          {changelog.map((entry) => (
            <Card key={entry.date + entry.title}>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
                <time
                  dateTime={entry.date}
                  className="shrink-0 text-sm font-medium text-slate-400"
                >
                  {entry.date}
                </time>
                <h2 className="text-2xl font-bold text-[#f0a050]">
                  {entry.title}
                </h2>
              </div>
              <ul className="mt-3 list-disc space-y-1.5 pl-6 text-lg leading-[1.6] text-slate-200">
                {entry.changes.map((change) => (
                  <li key={change}>{change}</li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </Section>
    </Container>
  );
}

import type { Metadata } from "next";
import { CuzaLiveStream } from "@/components/cuza-live-stream";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Cuza Live",
  description: "Deterministic demo receipts stream with one-click verify links and preview anchor status.",
  openGraph: {
    title: "Cuza Live",
    description: "Deterministic demo receipts stream with one-click verify links and preview anchor status.",
    images: [
      {
        url: "/cuza/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Cuza Live receipts stream preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cuza Live",
    description: "Deterministic demo receipts stream with one-click verify links and preview anchor status.",
    images: ["/cuza/opengraph-image"],
  },
};

export default function CuzaPage() {
  return (
    <Container>
      <Section className="fade-in-up">
        <div className="max-w-3xl">
          <Badge className="mb-4">Public Demo Surface</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-6xl">Cuza Live</h1>
          <p className="mt-4 text-xl leading-[1.5] text-slate-200">
            Demo receipts stream (deterministic). No wallets. No partner data.
          </p>
          <p className="mt-3 text-sm text-slate-300">
            Stream is deterministic and non-custodial. It rotates a fixed demo set by time bucket without external
            randomness.
          </p>
        </div>
      </Section>

      <Section className="pt-0 fade-in-up fade-delay-1">
        <CuzaLiveStream />
      </Section>
    </Container>
  );
}

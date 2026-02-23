import type { Metadata } from "next";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

const mediaAssets = [
  {
    label: "TruCore Wordmark",
    href: "/media/trucore-wordmark.png",
    preview: "/media/trucore-wordmark.png",
  },
  {
    label: "TruCore Logo Mark",
    href: "/media/trucore-logo-mark.png",
    preview: "/media/trucore-logo-mark.png",
  },
  {
    label: "ATF Badge",
    href: "/media/atf-badge.png",
    preview: "/media/atf-badge.png",
  },
];

export const metadata: Metadata = {
  title: "Media",
  description: "TruCore press and media kit with brand assets and contact details.",
};

export default function MediaPage() {
  return (
    <Container>
      <Section className="fade-in-up">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-5xl">
            Media Kit
          </h1>
          <p className="mt-4 text-2xl leading-[1.5] text-slate-200">
            TruCore builds trust infrastructure for autonomous finance, focused on enforcement-first
            controls, verifiable execution trails, and operational safety for agent-driven
            systems.
          </p>
          <p className="mt-4 text-2xl leading-[1.5] text-slate-200">
            Agent Transaction Firewall (ATF) is TruCore&apos;s flagship layer for policy-bound
            execution, permit-scoped authorization, and tamper-evident receipts that improve
            accountability for autonomous transactions.
          </p>
        </div>
      </Section>

      <Section className="border-t border-white/10 fade-in-up fade-delay-1">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold tracking-tight text-[#f0a050]">Downloads</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {mediaAssets.map((asset) => (
              <Card key={asset.href} className="h-full p-5">
                <div className="overflow-hidden rounded-lg border border-white/10 bg-neutral-900/60 p-3">
                  <Image
                    src={asset.preview}
                    alt={asset.label}
                    width={320}
                    height={180}
                    className="h-32 w-full object-contain"
                  />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-slate-100">{asset.label}</h3>
                <a
                  href={asset.href}
                  download
                  className="mt-3 inline-flex text-base font-semibold text-primary-200 transition-colors hover:text-primary-100"
                >
                  Download PNG
                </a>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      <Section className="border-t border-white/10 fade-in-up fade-delay-2">
        <div className="mx-auto max-w-3xl space-y-6">
          <Card>
            <h2 className="text-2xl font-bold text-[#f0a050]">Brand usage</h2>
            <p className="mt-3 text-lg leading-[1.55] text-slate-200">
              Use provided assets without distortion or recoloring, keep clear spacing around marks,
              and avoid implying endorsement of third-party products without written approval.
            </p>
          </Card>
          <Card>
            <h2 className="text-2xl font-bold text-[#f0a050]">Contact</h2>
            <p className="mt-3 text-lg leading-[1.55] text-slate-200">
              General press and company inquiries: <a href="mailto:info@trucore.xyz" className="font-semibold text-primary-300 underline underline-offset-2 transition-colors hover:text-primary-200">info@trucore.xyz</a>
            </p>
            <p className="mt-2 text-lg leading-[1.55] text-slate-200">
              Security inquiries: <a href="mailto:security@trucore.xyz" className="font-semibold text-primary-300 underline underline-offset-2 transition-colors hover:text-primary-200">security@trucore.xyz</a>
            </p>
          </Card>
        </div>
      </Section>
    </Container>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "5-Minute Developer Quickstart | TruCore ATF",
  description:
    "Run one command to see a deterministic decision and receipt. The fastest way to try ATF.",
  keywords: [
    "ATF quickstart",
    "5 minute quickstart",
    "developer quickstart",
    "deterministic receipt",
    "one command demo",
    "TruCore ATF",
  ],
  openGraph: {
    title: "5-Minute Developer Quickstart | TruCore ATF",
    description:
      "Run one command to see a deterministic decision and receipt. The fastest way to try ATF.",
    url: "https://trucore.xyz/docs/5-minute-quickstart",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "5-Minute Developer Quickstart | TruCore ATF",
    description:
      "Run one command to see a deterministic decision and receipt.",
    images: ["/opengraph-image"],
  },
  alternates: { canonical: "https://trucore.xyz/docs/5-minute-quickstart" },
};

export default function FiveMinuteQuickstartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/react";
import { Container } from "@/components/ui/container";
import { HeroBackgroundPulses } from "@/components/hero-background-pulses";
import { TrackedLink } from "@/components/tracked-link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://trucore.xyz"),
  title: {
    default: "TruCore | Trust Infrastructure for Autonomous Finance",
    template: "%s | TruCore",
  },
  description:
    "TruCore delivers trust-first, AI-native financial infrastructure with policy-bound execution, cryptographic receipts, and fail-closed safeguards.",
  keywords: [
    "TruCore",
    "autonomous finance",
    "AI infrastructure",
    "crypto infrastructure",
    "policy enforcement",
    "zero-trust",
    "Solana",
  ],
  openGraph: {
    type: "website",
    url: "https://trucore.xyz",
    siteName: "TruCore",
    title: "TruCore | Trust Infrastructure for Autonomous Finance",
    description:
      "Policy-bound execution, verifiable receipts, and fail-closed design for autonomous finance.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "TruCore social preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TruCore | Trust Infrastructure for Autonomous Finance",
    description:
      "AI-native financial infrastructure with policy-first controls and verifiable execution.",
    images: ["/twitter-image"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Analytics />
        <HeroBackgroundPulses />
        <div className="relative z-10 flex min-h-screen flex-col">
          <header className="border-b border-white/10 bg-neutral-900/50 backdrop-blur-md">
            <Container className="flex h-16 items-center justify-between">
              <a href="#hero" aria-label="TruCore home" className="flex items-center gap-3">
                <Image
                  src="/images/trucore-logo.png"
                  alt="TruCore logo"
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-sm object-contain"
                  priority
                />
                <span className="text-2xl font-bold tracking-tight text-white">
                  TruCore
                </span>
              </a>
              <nav
                aria-label="Primary"
                className="flex items-center gap-5 text-xl font-medium text-slate-100 sm:gap-8"
              >
                <Link href="/#hero" className="transition-colors hover:text-primary-200">
                  Home
                </Link>
                <Link
                  href="/atf"
                  className="transition-colors hover:text-primary-200"
                >
                  ATF
                </Link>
                <Link
                  href="/#why-trucore"
                  className="transition-colors hover:text-primary-200"
                >
                  Why TruCore
                </Link>
                <Link
                  href="/#trust-integrity"
                  className="transition-colors hover:text-primary-200"
                >
                  Trust
                </Link>
                <Link
                  href="/#integrations"
                  className="transition-colors hover:text-primary-200"
                >
                  Integrations
                </Link>
                <Link href="/#waitlist" className="transition-colors hover:text-accent-400">
                  Waitlist
                </Link>
              </nav>
            </Container>
          </header>

          <main className="flex-1">{children}</main>

          <footer id="footer" className="border-t border-white/10 bg-neutral-900/30 backdrop-blur-sm">
            <Container className="flex flex-col gap-6 py-8 text-xl text-slate-200">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <p>© {new Date().getFullYear()} TruCore. Built on trust and integrity.</p>
                <div className="flex flex-wrap items-center gap-4">
                  <TrackedLink href="https://x.com/TruCore_AI" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary-200" eventName="outbound_click" eventProps={{ target: "x", location: "footer" }}>
                    X
                  </TrackedLink>
                  <TrackedLink href="https://github.com/TruCore-AI" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary-200" eventName="outbound_click" eventProps={{ target: "github", location: "footer" }}>
                    GitHub
                  </TrackedLink>
                </div>
              </div>
              <div className="flex flex-col gap-4 border-t border-white/10 pt-5 text-lg sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Products</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <Link href="/atf" className="transition-colors hover:text-primary-200">
                      Agent Transaction Firewall (ATF)
                    </Link>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <Link href="/security" className="transition-colors hover:text-primary-200">
                    Security
                  </Link>
                  <Link href="/privacy" className="transition-colors hover:text-primary-200">
                    Privacy
                  </Link>
                  <Link href="/terms" className="transition-colors hover:text-primary-200">
                    Terms
                  </Link>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <a href="mailto:hello@trucore.xyz" className="transition-colors hover:text-primary-200">
                    hello@trucore.xyz
                  </a>
                  <a href="mailto:security@trucore.xyz" className="transition-colors hover:text-primary-200">
                    security@trucore.xyz
                  </a>
                </div>
              </div>
            </Container>
          </footer>
        </div>
      </body>
    </html>
  );
}

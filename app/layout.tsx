import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { HeroBackground3D } from "@/components/hero-background-3d";
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
        <HeroBackground3D />
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
                <span className="text-xl font-bold tracking-tight text-white">
                  TruCore
                </span>
              </a>
              <nav
                aria-label="Primary"
                className="flex items-center gap-5 text-lg font-medium text-slate-100 sm:gap-7"
              >
                <a href="#hero" className="transition-colors hover:text-primary-200">
                  Home
                </a>
                <a
                  href="#why-trucore"
                  className="transition-colors hover:text-primary-200"
                >
                  Why TruCore
                </a>
                <a
                  href="#trust-integrity"
                  className="transition-colors hover:text-primary-200"
                >
                  Trust
                </a>
                <a
                  href="#integrations"
                  className="transition-colors hover:text-primary-200"
                >
                  Integrations
                </a>
                <a href="#waitlist" className="transition-colors hover:text-accent-400">
                  Waitlist
                </a>
              </nav>
            </Container>
          </header>

          <main className="flex-1">{children}</main>

          <footer id="footer" className="border-t border-white/10 bg-neutral-900/30 backdrop-blur-sm">
            <Container className="flex flex-col gap-5 py-8 text-lg text-slate-200 sm:flex-row sm:items-center sm:justify-between">
              <p>© {new Date().getFullYear()} TruCore. Built on trust and integrity.</p>
              <div className="flex flex-wrap items-center gap-4">
                <a href="#" className="transition-colors hover:text-primary-200">
                  X
                </a>
                <a href="#" className="transition-colors hover:text-primary-200">
                  GitHub
                </a>
                <a href="#" className="transition-colors hover:text-primary-200">
                  Email
                </a>
                <span className="text-primary-100">security@trucore.xyz</span>
              </div>
            </Container>
          </footer>
        </div>
      </body>
    </html>
  );
}

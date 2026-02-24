import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { Container } from "@/components/ui/container";
import { HeroBackgroundPulses } from "@/components/hero-background-pulses";
import { SkipLink } from "@/components/skip-link";
import { TrackedLink } from "@/components/tracked-link";
import { UTM_COOKIE_MAX_AGE, UTM_COOKIE_NAME, UTM_QUERY_KEYS } from "@/lib/utm";
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
    icon: [
      { url: "/favicon.png", sizes: "48x48", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.png",
    apple: "/icon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://trucore.xyz",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const showAnalytics = process.env.NODE_ENV === "production";
  const utmKeysJson = JSON.stringify(UTM_QUERY_KEYS);
  const structuredDataJson = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "TruCore",
        url: "https://trucore.xyz",
        sameAs: ["https://github.com/TruCore-AI", "https://x.com/TruCore_AI"],
      },
      {
        "@type": "SoftwareApplication",
        name: "Agent Transaction Firewall (ATF)",
        applicationCategory: "SecurityApplication",
        operatingSystem: "Web",
        description: "Permit-based enforcement layer for autonomous finance",
        url: "https://trucore.xyz/atf",
        publisher: {
          "@type": "Organization",
          name: "TruCore",
        },
      },
    ],
  });

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: structuredDataJson }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script id="trucore-utm-capture" strategy="afterInteractive">
          {`(function() {
  try {
    var cookieName = "${UTM_COOKIE_NAME}";
    var hasCookie = document.cookie
      .split('; ')
      .some(function(part) { return part.indexOf(cookieName + '=') === 0; });

    if (hasCookie) return;

    var url = new URL(window.location.href);
    var keys = ${utmKeysJson};
    var payload = {};
    var found = false;

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var value = url.searchParams.get(key);
      if (!value) continue;

      var trimmed = value.trim();
      if (!trimmed) continue;

      payload[key] = trimmed.slice(0, 120);
      found = true;
    }

    if (!found) return;

    var encoded = encodeURIComponent(JSON.stringify(payload));
    document.cookie = cookieName + '=' + encoded + '; Max-Age=${UTM_COOKIE_MAX_AGE}; Path=/; SameSite=Lax';
  } catch {}
})();`}
        </Script>
        <SkipLink />
        {showAnalytics ? <Analytics /> : null}
        <HeroBackgroundPulses />
        <div className="relative z-10 flex min-h-screen flex-col">
          <header className="border-b border-white/10 bg-neutral-900/50 backdrop-blur-md">
            <Container className="flex h-16 items-center justify-between">
              <a
                href="#hero"
                aria-label="TruCore home"
                className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
              >
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
                className="flex items-center gap-3 text-sm font-medium text-slate-100 sm:gap-5 sm:text-base md:gap-8 md:text-xl"
              >
                <Link
                  href="/#hero"
                  className="rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                >
                  Home
                </Link>
                <Link
                  href="/atf"
                  className="rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                >
                  ATF
                </Link>
                <Link
                  href="/#why-trucore"
                  className="hidden rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 sm:inline"
                >
                  Why TruCore
                </Link>
                <Link
                  href="/#trust-integrity"
                  className="hidden rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 sm:inline"
                >
                  Trust
                </Link>
                <Link
                  href="/#integrations"
                  className="hidden rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 md:inline"
                >
                  Integrations
                </Link>
                <Link
                  href="/#waitlist"
                  className="rounded-sm transition-colors hover:text-accent-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                >
                  Waitlist
                </Link>
              </nav>
            </Container>
          </header>

          <main id="main" className="flex-1">
            {children}
          </main>

          <footer id="footer" className="border-t border-white/10 bg-neutral-900/30 backdrop-blur-sm">
            <Container className="flex flex-col gap-6 py-8 text-xl text-slate-200">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <p>© {new Date().getFullYear()} TruCore. Built on trust and integrity.</p>
                <div className="flex flex-wrap items-center gap-4">
                  <TrackedLink href="https://x.com/TruCore_AI" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary-100" eventName="outbound_click" eventProps={{ target: "x", location: "footer" }}>
                    X
                  </TrackedLink>
                  <TrackedLink href="https://github.com/TruCore-AI" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary-100" eventName="outbound_click" eventProps={{ target: "github", location: "footer" }}>
                    GitHub
                  </TrackedLink>
                </div>
              </div>
              <div className="flex flex-col gap-4 border-t border-white/10 pt-5 text-lg sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-300">Products</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <Link href="/atf" className="rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">
                      Agent Transaction Firewall (ATF)
                    </Link>
                    <Link href="/atf/primer" className="rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">
                      ATF Primer
                    </Link>
                    <Link href="/atf/roadmap" className="rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">
                      ATF Roadmap
                    </Link>
                    <Link href="/atf/whitepaper" className="rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">
                      ATF Whitepaper (Preview)
                    </Link>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-300">Company</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <Link href="/status" className="rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">
                      Status
                    </Link>
                    <Link href="/changelog" className="rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">
                      Changelog
                    </Link>
                    <Link href="/contact" className="rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">
                      Contact
                    </Link>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-300">Resources</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <Link href="/launch" className="rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">
                      Launch
                    </Link>
                    <Link href="/media" className="rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">
                      Media
                    </Link>
                    <Link href="/docs" className="rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">
                      Docs
                    </Link>
                    <Link href="/blog" className="rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">
                      Blog
                    </Link>
                    <Link href="/security/overview" className="rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">
                      Security Overview
                    </Link>
                    <Link href="/security/disclosure" className="rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">
                      Responsible Disclosure
                    </Link>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-300">Legal</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <Link href="/security" className="rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">
                      Security
                    </Link>
                    <Link href="/privacy" className="rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">
                      Privacy
                    </Link>
                    <Link href="/terms" className="rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">
                      Terms
                    </Link>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-300">Email</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <a href="mailto:info@trucore.xyz" className="rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">
                      info@trucore.xyz
                    </a>
                    <a href="mailto:security@trucore.xyz" className="rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">
                      security@trucore.xyz
                    </a>
                  </div>
                </div>
              </div>
            </Container>
          </footer>
        </div>
      </body>
    </html>
  );
}

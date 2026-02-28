import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import truCoreFavicon from "@/images/TruCore-favicon.png";
import { Container } from "@/components/ui/container";
import { HeroBackgroundPulses } from "@/components/hero-background-pulses";
import { MotionToggle } from "@/components/motion-toggle";
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
    default:
      "TruCore | Agent Transaction Firewall, Tamper-Evident Receipts, Solana",
    template: "%s | TruCore",
  },
  description:
    "TruCore delivers Agent Transaction Firewall controls for Solana with policy-bound execution and tamper-evident receipts for autonomous finance.",
  keywords: [
    "TruCore",
    "Agent Transaction Firewall",
    "tamper-evident receipts",
    "autonomous finance",
    "AI infrastructure",
    "crypto infrastructure",
    "policy enforcement",
    "trustless",
    "Solana",
  ],
  openGraph: {
    type: "website",
    url: "https://trucore.xyz",
    siteName: "TruCore",
    title:
      "TruCore | Agent Transaction Firewall, Tamper-Evident Receipts, Solana",
    description:
      "Policy-bound execution, tamper-evident receipts, and fail-closed design for autonomous finance on Solana.",
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
    title:
      "TruCore | Agent Transaction Firewall, Tamper-Evident Receipts, Solana",
    description:
      "Agent Transaction Firewall with policy-first controls and tamper-evident receipts for Solana execution.",
    images: ["/opengraph-image"],
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
      {
        "@type": "CreativeWork",
        name: "ATF Demo Receipt Example",
        description:
          "Static demo-only receipt structure showing tamper-evident verification fields.",
        url: "https://trucore.xyz/receipts",
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
        <Script id="trucore-motion-preference-init" strategy="beforeInteractive">
          {`(function() {
  try {
    var key = "trucore.motionPreference";
    var stored = window.localStorage.getItem(key);
    var systemReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var reduced = stored === "reduce" || (stored !== "reduce" && systemReduced);
    document.documentElement.dataset.reduceMotion = reduced ? "true" : "false";
  } catch {
    document.documentElement.dataset.reduceMotion = "false";
  }
})();`}
        </Script>
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
          <header className="glass-surface border-b border-white/10 bg-neutral-900/45 backdrop-blur-md">
            <Container className="flex h-20 items-center justify-between">
              <Link
                href="/"
                aria-label="TruCore home"
                className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
              >
                <Image
                  src={truCoreFavicon}
                  alt="TruCore logo"
                  width={92}
                  height={92}
                  className="h-20 w-20 rounded-md object-contain"
                  priority
                />
                <span className="text-4xl font-bold tracking-tight text-white">
                  TruCore
                </span>
              </Link>
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
                  href="/receipts"
                  className="rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                >
                  Receipts
                </Link>
                <Link
                  href="/demo"
                  className="hidden rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 md:inline"
                >
                  Demo Live
                </Link>
                <Link
                  href="/#why-trucore"
                  className="hidden rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 sm:inline"
                >
                  Why TruCore
                </Link>
                <Link
                  href="/#verify"
                  className="hidden rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 sm:inline"
                >
                  Verify
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

          <footer id="footer" className="glass-surface border-t border-white/10 bg-gradient-to-b from-neutral-900/35 to-neutral-950/80 backdrop-blur-sm">
            <Container className="py-8 text-sm text-slate-400">
              <div className="border-t border-white/15 pt-7">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
                  <div className="space-y-5">
                    <Link
                      href="/"
                      aria-label="TruCore home"
                      className="inline-flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                    >
                      <Image
                        src={truCoreFavicon}
                        alt="TruCore logo"
                        width={44}
                        height={44}
                        className="h-11 w-11 rounded-md object-contain"
                      />
                      <span className="text-3xl font-bold tracking-tight text-slate-100">TruCore</span>
                    </Link>
                    <p className="max-w-sm text-slate-300">
                      Deterministic policy enforcement and tamper-evident receipts for autonomous finance.
                    </p>
                    <div className="flex flex-wrap items-center gap-5 text-slate-300">
                      <TrackedLink href="https://x.com/TruCore_AI" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary-100" eventName="outbound_click" eventProps={{ target: "x", location: "footer" }}>
                        X
                      </TrackedLink>
                      <TrackedLink href="https://github.com/TruCore-AI" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary-100" eventName="outbound_click" eventProps={{ target: "github", location: "footer" }}>
                        GitHub
                      </TrackedLink>
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="border-l border-white/10 pl-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">Product</p>
                      <div className="mt-3 space-y-2">
                        <Link href="/atf" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">ATF</Link>
                        <Link href="/atf/primer" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">ATF Primer</Link>
                        <Link href="/atf/roadmap" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">ATF Roadmap</Link>
                        <Link href="/enterprise" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Enterprise</Link>
                      </div>
                    </div>

                    <div className="border-l border-white/10 pl-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">Resources</p>
                      <div className="mt-3 space-y-2">
                        <Link href="/docs" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Docs</Link>
                        <Link href="/atf/whitepaper" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Whitepaper</Link>
                        <Link href="/verify" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Verify Receipt</Link>
                        <Link href="/receipts" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Receipts Explorer</Link>
                        <Link href="/demo" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Demo Live</Link>
                        <Link href="/blog" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Blog</Link>
                      </div>
                    </div>

                    <div className="border-l border-white/10 pl-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">Company</p>
                      <div className="mt-3 space-y-2">
                        <Link href="/status" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Status</Link>
                        <Link href="/changelog" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Changelog</Link>
                        <Link href="/contact" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Contact</Link>
                        <Link href="/manifesto" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Manifesto</Link>
                      </div>
                    </div>

                    <div className="border-l border-white/10 pl-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">Support</p>
                      <div className="mt-3 space-y-2">
                        <Link href="/terms" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Terms</Link>
                        <Link href="/privacy" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Privacy</Link>
                        <Link href="/security" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Security</Link>
                        <a href="mailto:info@trucore.xyz" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Email</a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-7 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3 text-slate-400">
                    <Link href="/docs/permit-schema-v1" className="rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Permit Schema v1</Link>
                    <span aria-hidden="true" className="text-slate-600">|</span>
                    <Link href="/build-with-atf" className="rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Build With ATF</Link>
                    <span aria-hidden="true" className="text-slate-600">|</span>
                    <Link href="/process" className="rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">How ATF is built</Link>
                    <span aria-hidden="true" className="text-slate-600">|</span>
                    <MotionToggle />
                  </div>
                  <p className="text-slate-400">© {new Date().getFullYear()} TruCore. Trustless enforcement for AI-driven capital.</p>
                </div>
              </div>
            </Container>
          </footer>
        </div>
      </body>
    </html>
  );
}

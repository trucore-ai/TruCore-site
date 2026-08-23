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
import { ReleaseBadge } from "@/components/status/release-badge";
import { HeaderAuthActions } from "@/components/header-auth-actions";
import { HeaderScrollState } from "@/components/header-scroll-state";
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
      "TruCore — AI Infrastructure for Autonomous Agents",
    template: "%s | TruCore",
  },
  description:
    "Open-source infrastructure for the agent economy. Transaction firewalls, service registries, and agent wallets — MIT-licensed, built for production.",
  keywords: [
    "TruCore",
    "Agent Transaction Firewall",
    "ATF",
    "MeshDNS",
    "MCP service registry",
    "x402Fuel",
    "agent wallets",
    "AI agent infrastructure",
    "autonomous finance",
    "tamper-evident receipts",
    "policy enforcement",
    "trustless",
    "Solana",
    "open source",
  ],
  openGraph: {
    type: "website",
    url: "https://trucore.xyz",
    siteName: "TruCore",
    title:
      "TruCore — AI Infrastructure for Autonomous Agents",
    description:
      "Transaction firewalls, service registries, and agent wallets — open source infrastructure for the agent economy.",
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
      "TruCore — AI Infrastructure for Autonomous Agents",
    description:
      "Transaction firewalls, service registries, and agent wallets — open source infrastructure for the agent economy.",
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
        description: "Open-source infrastructure for AI agents — transaction firewalls, service registries, and agent wallets.",
      },
      {
        "@type": "SoftwareApplication",
        name: "Agent Transaction Firewall (ATF)",
        applicationCategory: "SecurityApplication",
        operatingSystem: "Web",
        description: "Permit-based enforcement layer for autonomous finance on Solana.",
        url: "https://trucore.xyz/atf",
        publisher: { "@type": "Organization", name: "TruCore" },
      },
      {
        "@type": "SoftwareApplication",
        name: "MeshDNS",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        description: "MCP-native service registry with capability discovery and health checks.",
        url: "https://meshdns.trucore.xyz",
        publisher: { "@type": "Organization", name: "TruCore" },
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
    var reduced = true;
    if (stored === "enable" && !systemReduced) {
      reduced = false;
    }
    document.documentElement.dataset.reduceMotion = reduced ? "true" : "false";
  } catch {
    document.documentElement.dataset.reduceMotion = "true";
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
          <header className="site-header sticky top-0 z-50 backdrop-blur-md">
            <HeaderScrollState />
            <div className="absolute right-4 top-0 z-20 flex h-full items-center sm:right-6 md:right-8">
              <HeaderAuthActions />
            </div>
            <Container className="flex flex-col items-center gap-1 py-2.5 sm:py-0">
              <div className="flex w-full items-center gap-24 sm:h-[4.25rem]">
              <Link
                href="/"
                aria-label="TruCore home"
                className="flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
              >
                <Image
                  src={truCoreFavicon}
                  alt="TruCore logo"
                  width={56}
                  height={56}
                  className="h-10 w-10 rounded-md object-contain sm:h-14 sm:w-14"
                  priority
                />
                <span className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  TruCore
                </span>
              </Link>
              <nav
                aria-label="Primary"
                className="hidden items-center gap-x-1 text-sm font-medium text-slate-300 sm:flex md:text-[0.9375rem]"
              >
                <Link
                  href="/docs"
                  className="rounded-md px-2.5 py-1.5 transition-all duration-200 hover:bg-white/[0.05] hover:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                >
                  Docs
                </Link>
                <Link
                  href="/atf"
                  className="rounded-md px-2.5 py-1.5 transition-all duration-200 hover:bg-white/[0.05] hover:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                >
                  ATF
                </Link>
                <Link
                  href="https://meshdns.trucore.xyz"
                  className="rounded-md px-2.5 py-1.5 transition-all duration-200 hover:bg-white/[0.05] hover:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  MeshDNS
                </Link>
                <Link
                  href="/x402fuel"
                  className="rounded-md px-2.5 py-1.5 transition-all duration-200 hover:bg-white/[0.05] hover:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                >
                  x402Fuel
                </Link>
                <Link
                  href="/receipts"
                  className="rounded-md px-2.5 py-1.5 transition-all duration-200 hover:bg-white/[0.05] hover:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                >
                  Receipts
                </Link>
                <Link
                  href="/pricing"
                  className="rounded-md px-2.5 py-1.5 transition-all duration-200 hover:bg-white/[0.05] hover:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                >
                  Pricing
                </Link>
                <Link
                  href="/builders"
                  className="rounded-md px-2.5 py-1.5 transition-all duration-200 hover:bg-white/[0.05] hover:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                >
                  Builders
                </Link>
                <Link
                  href="/try"
                  className="rounded-md bg-accent-500/15 px-2.5 py-1.5 font-semibold text-accent-300 transition-all duration-200 hover:bg-accent-500/25 hover:text-accent-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                >
                  Try ATF
                </Link>
              </nav>
              </div>
            </Container>
            <div className="gradient-divider absolute inset-x-0 bottom-0" aria-hidden="true" />
          </header>

          <main id="main" className="flex-1">
            {children}
          </main>

          <footer id="footer" className="glass-surface relative bg-gradient-to-b from-neutral-900/35 to-neutral-950/80 backdrop-blur-sm">
            <div className="gradient-divider absolute inset-x-0 top-0" aria-hidden="true" />
            <Container className="py-10 text-sm text-slate-400">
              <div className="pt-2">
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
                      Open-source infrastructure for the agent economy. Transaction firewalls, service registries, and agent wallets.
                    </p>
                    <div className="flex flex-wrap items-center gap-5 text-slate-300">
                      <TrackedLink href="https://x.com/TruCore_AI" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary-100" eventName="outbound_click" eventProps={{ target: "x", location: "footer" }}>
                        X
                      </TrackedLink>
                      <TrackedLink href="https://github.com/TruCore-AI" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary-100" eventName="outbound_click" eventProps={{ target: "github", location: "footer" }}>
                        GitHub
                      </TrackedLink>
                      <TrackedLink
                        href={process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "https://discord.gg/hZWTn6Vr"}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Join TruCore Discord"
                        className="transition-colors hover:text-primary-100"
                        eventName="outbound_click"
                        eventProps={{ target: "discord", location: "footer" }}
                      >
                        Discord
                      </TrackedLink>
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="border-l border-white/10 pl-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Products</p>
                      <div className="mt-3 space-y-2">
                        <Link href="/atf" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">ATF</Link>
                        <Link href="https://meshdns.trucore.xyz" target="_blank" rel="noopener noreferrer" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">MeshDNS</Link>
                        <Link href="/x402fuel" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">x402Fuel</Link>
                        <Link href="/atf/roadmap" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Roadmap</Link>
                        <Link href="/enterprise" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Enterprise</Link>
                        <Link href="/pricing" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Pricing</Link>
                        <Link href="/builders" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">For Builders</Link>
                      </div>
                    </div>

                    <div className="border-l border-white/10 pl-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Resources</p>
                      <div className="mt-3 space-y-2">
                        <Link href="/docs" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Docs</Link>
                        <Link href="/docs/cli" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">ATF CLI</Link>
                        <Link href="/docs/verify" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Verification</Link>
                        <Link href="/docs/api" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">API</Link>
                        <Link href="/atf/whitepaper" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Whitepaper</Link>
                        <Link href="/verify" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Verify Receipt</Link>
                        <Link href="/receipts" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Receipts Explorer</Link>
                        <Link href="/demo" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Demo Live</Link>
                        <Link href="/blog" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Blog</Link>
                        <Link href="/feedback" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Feedback</Link>
                      </div>
                    </div>

                    <div className="border-l border-white/10 pl-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Company</p>
                      <div className="mt-3 space-y-2">
                        <Link href="/status" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Status</Link>
                        <Link href="/docs/changelog" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Changelog</Link>
                        <Link href="/contact" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Contact</Link>
                        <Link href="/manifesto" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Manifesto</Link>
                      </div>
                    </div>

                    <div className="border-l border-white/10 pl-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Support</p>
                      <div className="mt-3 space-y-2">
                        <Link href="/terms" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Terms</Link>
                        <Link href="/privacy" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Privacy</Link>
                        <Link href="/security" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Security</Link>
                        <a href="mailto:info@trucore.xyz" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Email</a>
                        <Link href="/feedback" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Feedback</Link>
                        <Link href="/atf#updates" className="block rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Waitlist</Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* For Automated Integrators (de-emphasized) */}
                <div className="mt-5 flex items-center gap-4 text-[10px] text-slate-600">
                  <span className="font-medium uppercase tracking-[0.12em]">For Automated Integrators</span>
                  <Link href="/docs/agent-discovery" className="rounded-sm transition-colors hover:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Integration Runbook</Link>
                  <span aria-hidden="true" className="text-slate-700">|</span>
                  <span className="text-slate-600">.well-known/atf.json manifest</span>
                </div>

                <div className="mt-8 flex flex-col gap-3 border-t border-white/[0.06] pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3 text-slate-400">
                    <Link href="/docs/permit-schema-v1" data-testid="footer-permit-schema-link" className="rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Permit Schema v1</Link>
                    <span aria-hidden="true" className="text-slate-600">|</span>
                    <Link href="/build-with-atf" className="rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">Build With ATF</Link>
                    <span aria-hidden="true" className="text-slate-600">|</span>
                    <Link href="/process" className="rounded-sm transition-colors hover:text-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950">How ATF is built</Link>
                    <span aria-hidden="true" className="text-slate-600">|</span>
                    <MotionToggle />
                  </div>
                  <p className="text-slate-400">© {new Date().getFullYear()} TruCore. Trustless enforcement for AI-driven capital.</p>
                </div>
                <ReleaseBadge />
              </div>
            </Container>
          </footer>
        </div>
      </body>
    </html>
  );
}

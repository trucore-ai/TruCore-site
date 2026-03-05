import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import withBundleAnalyzerPlugin from "@next/bundle-analyzer";
import {
  SECURITY_HEADERS,
  SENSITIVE_ROUTE_NO_STORE_HEADERS,
  SENSITIVE_ROUTE_ROBOTS_HEADERS,
} from "./lib/security-headers";

export function getSecurityHeaderRules() {
  return [
    {
      source: "/admin/:path*",
      headers: SENSITIVE_ROUTE_ROBOTS_HEADERS,
    },
    {
      source: "/portal/:path*",
      headers: [...SENSITIVE_ROUTE_ROBOTS_HEADERS, ...SENSITIVE_ROUTE_NO_STORE_HEADERS],
    },
    {
      source: "/api/:path*",
      headers: SENSITIVE_ROUTE_ROBOTS_HEADERS,
    },
    {
      source: "/(.*)",
      headers: SECURITY_HEADERS,
    },
  ];
}

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

const withBundleAnalyzer = withBundleAnalyzerPlugin({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_DATE:
      process.env.NEXT_PUBLIC_BUILD_DATE ?? new Date().toISOString().slice(0, 10),
  },
  pageExtensions: ["ts", "tsx", "mdx"],
  turbopack: {
    root: process.cwd(),
  },

  async redirects() {
    // Legacy manifest runbook paths redirect to the canonical agent-discovery page.
    // These paths were referenced in openclaw_plugin.discovery.openclaw_runbook
    // and discovery.universal_runbook in manifest versions prior to Stage 3.
    return [
      {
        source: "/docs/runbooks/openclaw-atf-agent",
        destination: "/docs/agent-discovery",
        permanent: false,
      },
      {
        source: "/docs/runbooks/openclaw-atf-agent.md",
        destination: "/docs/agent-discovery",
        permanent: false,
      },
      {
        source: "/docs/runbooks/agent-adoption-atf",
        destination: "/docs/agent-discovery",
        permanent: false,
      },
      {
        source: "/docs/runbooks/agent-adoption-atf.md",
        destination: "/docs/agent-discovery",
        permanent: false,
      },
    ];
  },

  async headers() {
    return getSecurityHeaderRules();
  },
};

export default withBundleAnalyzer(withMDX(nextConfig));

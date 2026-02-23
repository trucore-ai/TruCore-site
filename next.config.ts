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
  pageExtensions: ["ts", "tsx", "mdx"],
  turbopack: {
    root: process.cwd(),
  },

  async headers() {
    return getSecurityHeaderRules();
  },
};

export default withBundleAnalyzer(withMDX(nextConfig));

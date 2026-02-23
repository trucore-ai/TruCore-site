import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import withBundleAnalyzerPlugin from "@next/bundle-analyzer";
import { SECURITY_HEADERS } from "./lib/security-headers";

const SENSITIVE_ROUTE_ROBOTS_HEADERS = [
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

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
    return [
      {
        source: "/admin/:path*",
        headers: SENSITIVE_ROUTE_ROBOTS_HEADERS,
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
  },
};

export default withBundleAnalyzer(withMDX(nextConfig));

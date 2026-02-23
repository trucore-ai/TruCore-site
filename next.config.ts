import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import { SECURITY_HEADERS } from "./lib/security-headers";

const SENSITIVE_ROUTE_ROBOTS_HEADERS = [
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const withMDX = createMDX({
  extension: /\.mdx?$/,
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

export default withMDX(nextConfig);

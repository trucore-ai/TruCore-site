import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import { SECURITY_HEADERS } from "./lib/security-headers";

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
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default withMDX(nextConfig);

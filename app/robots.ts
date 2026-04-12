import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/docs/guide/",
      },
    ],
    sitemap: "https://trucore.xyz/sitemap.xml",
  };
}

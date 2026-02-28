import type { MetadataRoute } from "next";
import { getAllPostsMeta } from "@/lib/mdx";

const siteUrl = "https://trucore.xyz";

const corePages: Array<{
  path: string;
  priority: number;
}> = [
  { path: "/", priority: 1.0 },
  { path: "/atf", priority: 1.0 },
  { path: "/atf/how-it-works", priority: 0.8 },
  { path: "/atf/primer", priority: 0.8 },
  { path: "/atf/whitepaper", priority: 0.8 },
  { path: "/atf/roadmap", priority: 0.8 },
  { path: "/atf/apply", priority: 0.9 },
  { path: "/build-with-atf", priority: 0.8 },
  { path: "/pilot/ecommerce", priority: 0.8 },
  { path: "/manifesto", priority: 0.8 },
  { path: "/direction", priority: 0.8 },
  { path: "/process", priority: 0.8 },
  { path: "/demo", priority: 0.8 },
  { path: "/enterprise", priority: 0.8 },
  { path: "/docs/permit-schema-v1", priority: 0.7 },
  { path: "/docs/receipt-specification-v1", priority: 0.7 },
  { path: "/docs/anchoring-roadmap", priority: 0.7 },
  { path: "/docs/policy-examples", priority: 0.7 },
  { path: "/docs/changelog", priority: 0.7 },
  { path: "/blog", priority: 0.7 },
  { path: "/security", priority: 0.6 },
  { path: "/security/compliance", priority: 0.6 },
  { path: "/privacy", priority: 0.6 },
  { path: "/terms", priority: 0.6 },
  { path: "/status", priority: 0.6 },
  { path: "/changelog", priority: 0.6 },
  { path: "/contact", priority: 0.6 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPostsMeta();

  const pageEntries: MetadataRoute.Sitemap = corePages.map((page) => ({
    url: `${siteUrl}${page.path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: page.priority,
  }));

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...pageEntries, ...postEntries];
}
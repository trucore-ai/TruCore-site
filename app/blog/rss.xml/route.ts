import { NextResponse } from "next/server";
import { getAllPostsMeta } from "@/lib/mdx";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const feedPosts = (await getAllPostsMeta()).slice(0, 20);

  const items = feedPosts
    .map((post) => {
      const url = `https://trucore.xyz/blog/${post.slug}`;
      const pubDate = new Date(post.date).toUTCString();

      return [
        "<item>",
        `<title>${escapeXml(post.title)}</title>`,
        `<description>${escapeXml(post.description)}</description>`,
        `<link>${url}</link>`,
        `<guid>${url}</guid>`,
        `<pubDate>${pubDate}</pubDate>`,
        "</item>",
      ].join("");
    })
    .join("");

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>TruCore Blog</title>
    <description>Short technical posts from TruCore on secure autonomous finance infrastructure.</description>
    <link>https://trucore.xyz/blog</link>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new NextResponse(rssXml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

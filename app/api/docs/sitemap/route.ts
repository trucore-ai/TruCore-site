import { NextResponse } from "next/server";
import { docsMetadata } from "@/lib/docs-metadata";
import { DOCS_VERSION, LAST_UPDATED } from "@/lib/docs-nav";

/**
 * GET /api/docs/sitemap
 *
 * Machine-readable JSON discovery surface for ATF documentation.
 * Intended consumers: LLMs, crawlers, retrieval systems, and external agents.
 *
 * Public and authenticated docs are both listed. Authenticated entries
 * are clearly marked with auth_required: true and are not exposed via
 * public crawling paths (robots.txt, sitemap.xml, or llms.txt).
 */
export async function GET() {
  const payload = {
    $schema: "https://trucore.xyz/api/docs/sitemap",
    version: DOCS_VERSION,
    last_updated: LAST_UPDATED,
    generated_at: new Date().toISOString(),
    base_url: "https://trucore.xyz",
    total: docsMetadata.length,
    entries: docsMetadata.map((entry) => ({
      href: entry.href,
      url: `https://trucore.xyz${entry.href}`,
      title: entry.title,
      summary: entry.summary,
      layer: entry.layer,
      audience: entry.audience,
      status: entry.status,
      product_area: entry.product_area,
      auth_required: entry.auth_required,
      ...(entry.spec_ref ? { spec_ref: entry.spec_ref } : {}),
      ...(entry.related ? { related: entry.related } : {}),
    })),
  };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

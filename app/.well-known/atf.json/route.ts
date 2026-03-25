import { readTextFile } from "@/lib/fs-helpers";
import path from "path";

/**
 * Explicit Next.js route handler for /.well-known/atf.json.
 *
 * Next.js serves dotfiles from `public/` automatically in most configurations,
 * but some Vercel edge-cache states or CDN rules may bypass static-file serving
 * for dotfile directories. This handler provides a deterministic, cache-controllable
 * fallback that always wins over any CDN ambiguity.
 *
 * The file is read from `public/.well-known/atf.json` at request time so the
 * canonical source of truth remains a single file - no duplication.
 */
export async function GET() {
  const filePath = path.join(process.cwd(), "public", ".well-known", "atf.json");

  let body: string;
  try {
    body = await readTextFile(filePath);
  } catch {
    return new Response(JSON.stringify({ error: "manifest_not_found" }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  // Validate that the file is parseable JSON before returning it.
  try {
    JSON.parse(body);
  } catch {
    return new Response(JSON.stringify({ error: "manifest_parse_error" }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // 5-minute edge cache; agents re-fetch on miss and get a fresh copy.
      "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
    },
  });
}

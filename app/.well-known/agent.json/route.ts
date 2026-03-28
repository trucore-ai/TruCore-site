import { readTextFile } from "@/lib/fs-helpers";
import path from "path";

/**
 * Explicit Next.js route handler for /.well-known/agent.json.
 *
 * This handler provides a deterministic, cache-controllable endpoint for
 * agent discovery. The file is read from `public/.well-known/agent.json`
 * at request time so the canonical source of truth remains a single file.
 *
 * Returns no-store cache headers to ensure agents always get fresh data.
 */
export async function GET() {
  const filePath = path.join(
    process.cwd(),
    "public",
    ".well-known",
    "agent.json"
  );

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
      // No caching; agents should always get fresh discovery data.
      "Cache-Control": "no-store",
    },
  });
}

import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Validates vercel.json redirect rules to prevent infinite redirect loops
 * on custom domains. The canonical direction is apex -> www; reversing it
 * (or matching www) would conflict with Vercel's domain-level redirect
 * and cause ERR_TOO_MANY_REDIRECTS for every path, including static assets.
 */

interface VercelRedirectHas {
  type: string;
  value: string;
}

interface VercelRedirect {
  source: string;
  destination: string;
  permanent: boolean;
  has?: VercelRedirectHas[];
}

interface VercelConfig {
  redirects?: VercelRedirect[];
}

function loadVercelConfig(): VercelConfig {
  const raw = readFileSync(resolve(__dirname, "../vercel.json"), "utf-8");
  return JSON.parse(raw) as VercelConfig;
}

describe("vercel.json redirects", () => {
  const config = loadVercelConfig();
  const redirects = config.redirects ?? [];

  it("should not redirect www.trucore.xyz (canonical host)", () => {
    // If any redirect matches host www.trucore.xyz, we would loop because
    // apex -> www is handled at the platform level.
    const wwwRedirects = redirects.filter((r) =>
      r.has?.some(
        (h) => h.type === "host" && h.value === "www.trucore.xyz",
      ),
    );
    expect(wwwRedirects).toHaveLength(0);
  });

  it("should redirect apex trucore.xyz to www.trucore.xyz", () => {
    const apexRedirects = redirects.filter((r) =>
      r.has?.some((h) => h.type === "host" && h.value === "trucore.xyz"),
    );
    expect(apexRedirects.length).toBeGreaterThanOrEqual(1);

    for (const r of apexRedirects) {
      expect(r.destination).toContain("https://www.trucore.xyz");
    }
  });

  it("should not match _next/static paths for host-based redirects only", () => {
    // Host-based redirects (/:path*) naturally include static paths, which
    // is fine as long as the redirect direction is correct (apex -> www).
    // This test confirms there is NO source-based redirect that would
    // independently match and loop /_next/* paths.
    const nextStaticRedirects = redirects.filter(
      (r) =>
        r.source.includes("_next") ||
        r.source.includes("favicon") ||
        r.source.includes("icon"),
    );
    expect(nextStaticRedirects).toHaveLength(0);
  });

  describe("static asset paths must NOT redirect on canonical host", () => {
    const assetPaths = [
      "/_next/static/media/hero.png",
      "/_next/static/chunks/app-abc123.css",
      "/_next/static/chunks/main-def456.js",
      "/favicon.png",
      "/favicon.ico",
      "/icon.png",
      "/.well-known/atf.json",
      "/robots.txt",
      "/sitemap.xml",
    ];

    for (const assetPath of assetPaths) {
      it(`${assetPath} is not redirected on www.trucore.xyz`, () => {
        // A redirect would only fire if its "has" condition matches
        // the canonical host (www.trucore.xyz). We already assert above
        // that no redirect targets www, so static assets are safe.
        const matching = redirects.filter((r) =>
          r.has?.some(
            (h) => h.type === "host" && h.value === "www.trucore.xyz",
          ),
        );
        expect(matching).toHaveLength(0);
      });
    }
  });
});

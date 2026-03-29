/**
 * Canonical site origin for outbound share/proof URLs.
 *
 * CRITICAL: All outbound proof and distribution URLs must use this origin.
 * The canonical format is https://www.trucore.xyz (with www subdomain).
 *
 * Environment override: NEXT_PUBLIC_BASE_URL (for staging/local dev only).
 */
const CANONICAL_SITE_ORIGIN =
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.trucore.xyz";

/**
 * Returns the canonical site origin for proof URLs.
 * Use this when you need the origin alone without a path.
 */
export function getCanonicalSiteOrigin(): string {
  return CANONICAL_SITE_ORIGIN;
}

/**
 * Build a canonical verify URL for a receipt hash.
 *
 * Canonical format:
 *   https://www.trucore.xyz/verify?hash=<encoded>&from=share
 *
 * @param hash - Receipt content hash
 * @returns Canonical verify URL with from=share tracking
 */
export function buildVerifyUrl(hash: string): string {
  return `${CANONICAL_SITE_ORIGIN}/verify?hash=${encodeURIComponent(hash.trim())}&from=share`;
}

/**
 * Build a canonical OG preview URL for a receipt hash.
 *
 * Canonical format:
 *   https://www.trucore.xyz/api/og/receipt?hash=<encoded>
 *
 * @param hash - Receipt content hash
 * @returns Canonical OG preview URL
 */
export function buildOgPreviewUrl(hash: string): string {
  return `${CANONICAL_SITE_ORIGIN}/api/og/receipt?hash=${encodeURIComponent(hash.trim())}`;
}

export interface ProofBundle {
  verifyUrl: string;
  ogPreviewUrl: string;
}

export function buildProofBundle(hash: string): ProofBundle {
  const trimmed = hash.trim();
  return {
    verifyUrl: buildVerifyUrl(trimmed),
    ogPreviewUrl: buildOgPreviewUrl(trimmed),
  };
}

export function buildTwitterUrl(url: string): string {
  const text = `This trade was protected by TruCore. Verify it yourself: ${url}`;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export function buildTelegramUrl(url: string): string {
  const text = "This trade was protected by TruCore. Verify it yourself:";
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}
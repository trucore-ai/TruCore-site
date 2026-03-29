const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://trucore.xyz";

export function buildVerifyUrl(hash: string): string {
  return `${BASE_URL}/verify?hash=${encodeURIComponent(hash.trim())}&from=share`;
}

export function buildOgPreviewUrl(hash: string): string {
  return `${BASE_URL}/api/og/receipt?hash=${encodeURIComponent(hash.trim())}`;
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
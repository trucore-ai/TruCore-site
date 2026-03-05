/**
 * Strict security headers applied to every response.
 *
 * CSP allowances:
 * - 'unsafe-inline' for framework-required inline styles and scripts.
 * - 'unsafe-eval' only in script-src for Next.js HMR in dev; harmless in prod
 *   builds since Next does not eval at runtime, but kept for parity.
 * - Explicit -elem directives ensure browsers apply consistent fallbacks.
 * - va.vercel-scripts.com for Vercel Web Analytics (script load + transport).
 * - img-src allows https: to cover OG images, hero art, and external avatars.
 *
 * Browser-extension violations (Phantom wallet's solana.js, MetaMask's
 * evmAsk.js, etc.) are expected and not addressable via CSP. These
 * extensions inject scripts/styles/images from their own origins.
 *
 * Stage 24: added CSP-Report-Only header + Report-To for violation collection.
 * Stage 26: removed Report-Only header to eliminate console noise
 *   ("upgrade-insecure-requests is ignored when delivered in a report-only
 *   policy"). Enforced CSP is unchanged.
 */

/* ---------- CSP directives ---------- */

export const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
  "script-src-elem 'self' 'unsafe-inline' https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "style-src-elem 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://va.vercel-scripts.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
];

/** Enforce CSP value (blocks violations) */
const CSP_ENFORCE = CSP_DIRECTIVES.join("; ");

export const SENSITIVE_ROUTE_ROBOTS_HEADERS = [
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

export const SENSITIVE_ROUTE_NO_STORE_HEADERS = [
  { key: "Cache-Control", value: "no-store" },
];

/* ---------- Merged header list ---------- */

export const SECURITY_HEADERS: { key: string; value: string }[] = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: CSP_ENFORCE,
  },
];

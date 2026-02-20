/**
 * Strict security headers applied to every response.
 *
 * CSP allowances:
 * - 'unsafe-inline' for Tailwind and Next.js inline styles/scripts
 * - vercel.live + *.vercel.app for Vercel toolbar on preview deploys
 * - va.vercel-scripts.com + vitals.vercel-insights.com for Vercel Analytics
 * - blob: on img-src for CSV blob download previews
 *
 * Stage 24: added CSP-Report-Only header + Report-To for violation collection.
 */

/* ---------- CSP directives ---------- */

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://vercel.live https://*.vercel.app",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com https://vercel.live wss://ws-us3.pusher.com",
  "frame-ancestors 'none'",
];

/** Enforce CSP value (blocks violations) */
const CSP_ENFORCE = CSP_DIRECTIVES.join("; ");

/** Report-Only CSP value (mirrors enforce + sends reports without blocking) */
const CSP_REPORT_ONLY = [...CSP_DIRECTIVES, "report-to csp"].join("; ");

/* ---------- Report-To header (Reporting API) ---------- */

const REPORT_TO_VALUE = JSON.stringify({
  group: "csp",
  max_age: 10886400,
  endpoints: [{ url: "/api/csp-report" }],
});

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
  {
    key: "Content-Security-Policy-Report-Only",
    value: CSP_REPORT_ONLY,
  },
  {
    key: "Report-To",
    value: REPORT_TO_VALUE,
  },
];

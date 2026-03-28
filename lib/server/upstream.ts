/**
 * Canonical upstream URL resolution for all server-side API routes.
 *
 * Rules:
 * - Server-only: never import from client components
 * - Prefers FIREWALL_API_BASE_URL for firewall-specific calls
 * - Uses ATF_API_BASE_URL (server-only) or NEXT_PUBLIC_ATF_API_URL for ATF API calls
 * - Normalizes trailing slashes
 * - Rejects obviously invalid/missing config with explicit error classification
 */

// ---------------------------------------------------------------------------
// Failure classification
// ---------------------------------------------------------------------------

export type UpstreamFailureClass =
  | "config_error"
  | "network_error"
  | "upstream_4xx"
  | "upstream_5xx"
  | "invalid_upstream_response";

export interface UpstreamErrorEnvelope {
  error: string;
  message: string;
  failure_class: UpstreamFailureClass;
}

// ---------------------------------------------------------------------------
// URL resolution
// ---------------------------------------------------------------------------

function stripTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Canonical base URL for ATF API calls (auth, dashboard, onboarding).
 * Used by server-side proxy routes.
 *
 * Resolution order:
 * 1. ATF_API_BASE_URL (server-only, preferred)
 * 2. NEXT_PUBLIC_ATF_API_URL (shared, fallback)
 * 3. Default: https://api.trucore.xyz
 */
export function getAtfApiBaseUrl(): string {
  const serverOnly = process.env.ATF_API_BASE_URL?.trim();
  if (serverOnly) return stripTrailingSlashes(serverOnly);

  const shared = process.env.NEXT_PUBLIC_ATF_API_URL?.trim();
  if (shared) return stripTrailingSlashes(shared);

  return "https://api.trucore.xyz";
}

/**
 * Canonical base URL for firewall API calls (simulate, status, sandbox).
 *
 * Resolution order:
 * 1. FIREWALL_API_BASE_URL (server-only)
 * 2. Returns null if not configured (caller decides behavior)
 */
export function getFirewallApiBaseUrl(): string | null {
  const baseUrl = process.env.FIREWALL_API_BASE_URL?.trim();
  if (!baseUrl) return null;
  return stripTrailingSlashes(baseUrl);
}

/**
 * Canonical base URL for sandbox routes.
 * Sandbox can use either firewall API or ATF API as upstream.
 *
 * Resolution order:
 * 1. FIREWALL_API_BASE_URL (preferred for sandbox)
 * 2. ATF_API_BASE_URL (server-only fallback)
 * 3. NEXT_PUBLIC_ATF_API_URL
 * 4. Default: https://api.trucore.xyz
 */
export function getSandboxApiBaseUrl(): string {
  const firewall = getFirewallApiBaseUrl();
  if (firewall) return firewall;
  return getAtfApiBaseUrl();
}

/**
 * Join a base URL with a path segment safely.
 * Handles double-slash and missing-slash edge cases.
 */
export function joinUpstreamUrl(base: string, path: string): string {
  const cleanBase = stripTrailingSlashes(base);
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

// ---------------------------------------------------------------------------
// Error envelope helpers
// ---------------------------------------------------------------------------

/**
 * Classify an HTTP status code from upstream into a failure class.
 */
export function classifyUpstreamStatus(status: number): UpstreamFailureClass {
  if (status >= 500) return "upstream_5xx";
  if (status >= 400) return "upstream_4xx";
  return "upstream_4xx"; // fallback for unexpected non-ok codes
}

/**
 * Build a normalized error envelope for upstream failures.
 */
export function buildErrorEnvelope(
  errorCode: string,
  message: string,
  failureClass: UpstreamFailureClass,
): UpstreamErrorEnvelope {
  return { error: errorCode, message, failure_class: failureClass };
}

/**
 * Build an error envelope from a caught network/timeout error.
 */
export function networkErrorEnvelope(
  serviceName: string,
): UpstreamErrorEnvelope {
  return buildErrorEnvelope(
    "upstream_unavailable",
    `${serviceName} is temporarily unavailable.`,
    "network_error",
  );
}

/**
 * Build an error envelope for missing configuration.
 */
export function configErrorEnvelope(
  detail: string,
): UpstreamErrorEnvelope {
  return buildErrorEnvelope(
    "upstream_unconfigured",
    detail,
    "config_error",
  );
}

// ---------------------------------------------------------------------------
// Request IP extraction (shared utility)
// ---------------------------------------------------------------------------

export function getRequestIp(req: { headers: { get(name: string): string | null } }): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
}

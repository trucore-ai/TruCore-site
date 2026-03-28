/**
 * Customer authentication helpers for the self-serve dashboard.
 *
 * - Stores JWT in localStorage (client-side only)
 * - Provides signup / login API calls against the ATF API
 * - Auth guard utility for protected pages
 *
 * NOTE: signup, login, and verify-email calls are routed through same-origin
 * Next.js API proxy routes (/api/customer/auth/*) to avoid browser CORS
 * dependency on api.trucore.xyz for onboarding-critical paths.
 * Post-auth calls that carry Authorization headers still target ATF_API_BASE
 * directly and are deferred for proxy migration (see docs/onboarding/SITE_API_PROXY_AUDIT.md).
 */

import { parseApiError, getUserFacingMessage } from "@/lib/auth-errors";

const ATF_API_BASE =
  process.env.NEXT_PUBLIC_ATF_API_URL || "https://api.trucore.xyz";

// Same-origin proxy base for onboarding-critical unauthenticated auth calls.
// On the server (SSR/RSC) this will be an empty string — these functions are
// client-only (called from "use client" pages), so the relative path resolves
// to the same origin as the browser.
const AUTH_PROXY_BASE = "/api/customer/auth";

// Same-origin proxy bases for first-use authenticated calls.
// These avoid CORS/origin drift and keep credentials controlled server-side.
const DASHBOARD_PROXY_BASE = "/api/dashboard";
const ONBOARDING_PROXY_BASE = "/api/onboarding";

const TOKEN_KEY = "atf_customer_token";
const TENANT_KEY = "atf_customer_tenant";
const API_KEY_KEY = "atf_customer_api_key";

// ---------------------------------------------------------------------------
// Token storage (client-side only)
// ---------------------------------------------------------------------------

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getTenantId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TENANT_KEY);
}

export function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(API_KEY_KEY);
}

export function storeAuth(token: string, tenantId: string, apiKey?: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TENANT_KEY, tenantId);
  if (apiKey) {
    localStorage.setItem(API_KEY_KEY, apiKey);
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TENANT_KEY);
  localStorage.removeItem(API_KEY_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/**
 * Error thrown by API calls that carries a machine-readable error code.
 */
export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Parse a failed response into an ApiError with structured code. */
async function throwApiError(
  res: Response,
  fallbackMessage: string,
): Promise<never> {
  const body = await res.json().catch(() => ({}));
  const parsed = parseApiError(body);
  const message = getUserFacingMessage(parsed.code, parsed.message || fallbackMessage);
  throw new ApiError(parsed.code, message, parsed.retryAfterSeconds);
}

export interface AuthResult {
  token: string;
  tenant_id: string;
  api_key?: string;
  email_verified?: boolean;
}

export async function signup(
  email: string,
  password: string,
): Promise<AuthResult> {
  const res = await fetch(`${AUTH_PROXY_BASE}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    await throwApiError(res, "Signup failed");
  }

  return res.json();
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResult> {
  const res = await fetch(`${AUTH_PROXY_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    await throwApiError(res, "Login failed");
  }

  return res.json();
}

export async function fetchDashboard(): Promise<Record<string, unknown>> {
  const token = getToken();
  if (!token) throw new ApiError("unauthorized", "Not authenticated");

  let res: Response;
  try {
    res = await fetch(`${DASHBOARD_PROXY_BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new ApiError("network_error", "We couldn't reach the dashboard service.");
  }

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Your session has expired. Please sign in again.");
  }

  if (res.status >= 500) {
    throw new ApiError("upstream_5xx", "We couldn't load your dashboard right now. Please try again in a moment.");
  }

  if (!res.ok) {
    // Parse structured error from proxy route
    let body: Record<string, unknown> = {};
    try { body = await res.json(); } catch { /* use default */ }
    const msg = typeof body.message === "string" ? body.message : "We couldn't load your dashboard right now. Please try again in a moment.";
    throw new ApiError(typeof body.error === "string" ? body.error : "api_error", msg);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Onboarding — first protected trade flow
// ---------------------------------------------------------------------------

export async function fetchSampleIntent(): Promise<Record<string, unknown>> {
  const token = getToken();
  if (!token) throw new ApiError("unauthorized", "Not authenticated");

  let res: Response;
  try {
    res = await fetch(`${ONBOARDING_PROXY_BASE}/sample-intent`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new ApiError("network_error", "We couldn't reach the sample trade service.");
  }

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Your session has expired. Please sign in again.");
  }

  if (res.status === 429) {
    await throwApiError(res, "Rate limit reached. Please try again later.");
  }

  if (res.status >= 500) {
    throw new ApiError("upstream_5xx", "Sample trade generation is temporarily unavailable.");
  }

  if (!res.ok) {
    let body: Record<string, unknown> = {};
    try { body = await res.json(); } catch { /* use default */ }
    const msg = typeof body.message === "string" ? body.message : "Sample trade generation is temporarily unavailable.";
    throw new ApiError(typeof body.error === "string" ? body.error : "api_error", msg);
  }

  return res.json();
}

export async function simulateProtection(
  intent: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const token = getToken();
  if (!token) throw new ApiError("unauthorized", "Not authenticated");

  let res: Response;
  try {
    res = await fetch(`${ONBOARDING_PROXY_BASE}/protect-dry-run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(intent),
    });
  } catch {
    throw new ApiError("network_error", "We couldn't reach the protection service.");
  }

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Your session has expired. Please sign in again.");
  }

  if (res.status === 429) {
    await throwApiError(res, "Rate limit reached. Please try again later.");
  }

  if (res.status >= 500) {
    throw new ApiError("upstream_5xx", "Protection simulation is temporarily unavailable.");
  }

  if (!res.ok) {
    let body: Record<string, unknown> = {};
    try { body = await res.json(); } catch { /* use default */ }
    const msg = typeof body.message === "string" ? body.message : "Protection simulation is temporarily unavailable.";
    throw new ApiError(typeof body.error === "string" ? body.error : "api_error", msg);
  }

  return res.json();
}

export async function executeSample(
  intent: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const token = getToken();
  if (!token) throw new ApiError("unauthorized", "Not authenticated");

  let res: Response;
  try {
    res = await fetch(`${ONBOARDING_PROXY_BASE}/execute-sample`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(intent),
    });
  } catch {
    throw new ApiError("network_error", "We couldn't reach the execution service.");
  }

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Your session has expired. Please sign in again.");
  }

  if (res.status === 429) {
    await throwApiError(res, "Rate limit reached. Please try again later.");
  }

  if (res.status >= 500) {
    throw new ApiError("upstream_5xx", "Sample trade execution is temporarily unavailable.");
  }

  if (!res.ok) {
    let body: Record<string, unknown> = {};
    try { body = await res.json(); } catch { /* use default */ }
    const msg = typeof body.message === "string" ? body.message : "Sample trade execution is temporarily unavailable.";
    throw new ApiError(typeof body.error === "string" ? body.error : "api_error", msg);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Activation state — onboarding progress tracking
// ---------------------------------------------------------------------------

export async function fetchActivation(): Promise<Record<string, unknown>> {
  const token = getToken();
  if (!token) throw new ApiError("unauthorized", "Not authenticated");

  let res: Response;
  try {
    res = await fetch(`${DASHBOARD_PROXY_BASE}/activation`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new ApiError("network_error", "Could not reach activation service.");
  }

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Your session has expired. Please sign in again.");
  }

  if (!res.ok) throw new ApiError("api_error", "Failed to fetch activation state");

  return res.json();
}

export async function markActivationStep(
  step: string,
  receiptId?: string,
): Promise<Record<string, unknown>> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const body: Record<string, unknown> = { step };
  if (receiptId) body.receipt_id = receiptId;

  const res = await fetch(`${DASHBOARD_PROXY_BASE}/activation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Session expired");
  }

  if (!res.ok) throw new Error("Failed to update activation");

  return res.json();
}

// ---------------------------------------------------------------------------
// Customer receipts — history, detail, verification
// ---------------------------------------------------------------------------

export interface ReceiptListParams {
  limit?: number;
  offset?: number;
  status?: string;
  dry_run?: boolean;
  protected_by?: string;
}

export async function fetchReceipts(
  params: ReceiptListParams = {},
): Promise<Record<string, unknown>> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.offset !== undefined) query.set("offset", String(params.offset));
  if (params.status) query.set("status", params.status);
  if (params.dry_run !== undefined)
    query.set("dry_run", String(params.dry_run));
  if (params.protected_by) query.set("protected_by", params.protected_by);

  const qs = query.toString();
  const url = `${ATF_API_BASE}/customer/receipts${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Session expired");
  }

  if (!res.ok) throw new Error("Failed to fetch receipts");

  return res.json();
}

export async function fetchReceiptDetail(
  receiptId: string,
): Promise<Record<string, unknown>> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(
    `${ATF_API_BASE}/customer/receipts/${encodeURIComponent(receiptId)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Session expired");
  }

  if (!res.ok) throw new Error("Receipt not found");

  return res.json();
}

export async function verifyReceipt(
  receiptIdOrObject: string | Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const body: Record<string, unknown> =
    typeof receiptIdOrObject === "string"
      ? { receipt_id: receiptIdOrObject }
      : { receipt: receiptIdOrObject };

  const res = await fetch(`${ATF_API_BASE}/customer/receipts/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Session expired");
  }

  if (!res.ok) throw new Error("Verification failed");

  return res.json();
}

// ---------------------------------------------------------------------------
// Customer API key management
// ---------------------------------------------------------------------------

export interface CustomerKey {
  key_id: string;
  label: string;
  status: string;
  created_at: number;
  last_used_at?: number | null;
  preview: string;
}

export interface CustomerKeyListResponse {
  keys: CustomerKey[];
  count: number;
}

export interface CustomerKeyCreateResponse extends CustomerKey {
  raw_secret: string;
}

export interface CustomerKeyRotateResponse extends CustomerKey {
  raw_secret: string;
  rotated_from: string;
}

export async function fetchCustomerKeys(): Promise<CustomerKeyListResponse> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${ATF_API_BASE}/customer/keys`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Session expired");
  }

  if (!res.ok) throw new Error("Failed to fetch API keys");

  return res.json();
}

export async function createCustomerKey(
  label: string = "",
): Promise<CustomerKeyCreateResponse> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${ATF_API_BASE}/customer/keys`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ label }),
  });

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Session expired");
  }

  if (!res.ok) {
    await throwApiError(res, "Failed to create API key");
  }

  return res.json();
}

export async function revokeCustomerKey(keyId: string): Promise<void> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(
    `${ATF_API_BASE}/customer/keys/${encodeURIComponent(keyId)}/revoke`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Session expired");
  }

  if (!res.ok) {
    await throwApiError(res, "Failed to revoke key");
  }
}

export async function rotateCustomerKey(
  keyId: string,
): Promise<CustomerKeyRotateResponse> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(
    `${ATF_API_BASE}/customer/keys/${encodeURIComponent(keyId)}/rotate`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Session expired");
  }

  if (!res.ok) {
    await throwApiError(res, "Failed to rotate key");
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Email verification
// ---------------------------------------------------------------------------

export interface VerificationStatus {
  email: string;
  email_verified: boolean;
  email_verified_at: number | null;
  verification_pending: boolean;
}

export async function requestVerificationEmail(email?: string): Promise<{ status: string }> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const payload: Record<string, string> = {};
  if (email) payload.email = email;

  const res = await fetch(`${AUTH_PROXY_BASE}/verify-email/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Session expired");
  }

  if (res.status === 429) {
    await throwApiError(res, "Too many resend attempts. Please try again later.");
  }

  if (!res.ok) throw new Error("Failed to resend verification email");

  return res.json();
}

export async function confirmVerificationEmail(
  verifyToken: string,
): Promise<{ status: string; email?: string }> {
  const res = await fetch(`${AUTH_PROXY_BASE}/verify-email/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: verifyToken }),
  });

  if (!res.ok) {
    await throwApiError(res, "Verification failed");
  }

  return res.json();
}

export async function fetchVerificationStatus(): Promise<VerificationStatus> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${ATF_API_BASE}/auth/verify-email/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Session expired");
  }

  if (!res.ok) throw new Error("Failed to fetch verification status");

  return res.json();
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

export async function requestPasswordReset(
  email: string,
): Promise<{ status: string; message: string }> {
  const res = await fetch(`${ATF_API_BASE}/auth/password-reset/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (res.status === 429) {
    await throwApiError(res, "Too many requests. Please try again later.");
  }

  if (!res.ok) throw new Error("Failed to request password reset");

  return res.json();
}

export async function confirmPasswordReset(
  resetToken: string,
  newPassword: string,
): Promise<{ status: string; message: string }> {
  const res = await fetch(`${ATF_API_BASE}/auth/password-reset/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: resetToken, new_password: newPassword }),
  });

  if (res.status === 429) {
    await throwApiError(res, "Too many attempts. Please try again later.");
  }

  if (!res.ok) {
    await throwApiError(res, "Password reset failed");
  }

  return res.json();
}

export async function validateResetToken(
  resetToken: string,
): Promise<{ valid: boolean; reason?: string }> {
  const res = await fetch(`${ATF_API_BASE}/auth/password-reset/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: resetToken }),
  });

  if (!res.ok) {
    await throwApiError(res, "Failed to validate reset token");
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Upgrade requests
// ---------------------------------------------------------------------------

export interface UpgradeRequestData {
  request_id: string;
  tenant_id: string;
  user_id: string;
  requested_plan: string;
  requested_features: string[];
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  created_at: number;
  reviewed_at: number;
  reviewed_by: string;
  review_note: string;
}

export async function submitUpgradeRequest(params: {
  requested_plan: string;
  requested_features?: string[];
  reason?: string;
}): Promise<{ request: UpgradeRequestData }> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${ATF_API_BASE}/customer/upgrades/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Session expired");
  }

  if (!res.ok) {
    await throwApiError(res, "Failed to submit upgrade request");
  }

  const data = await res.json();
  if (data.error) {
    throw new ApiError(data.error.code, data.error.message);
  }

  return data;
}

export async function fetchUpgradeRequests(): Promise<{
  requests: UpgradeRequestData[];
}> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${ATF_API_BASE}/customer/upgrades`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Session expired");
  }

  if (!res.ok) throw new Error("Failed to fetch upgrade requests");

  return res.json();
}

export async function cancelUpgradeRequest(
  requestId: string,
): Promise<{ request: UpgradeRequestData }> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(
    `${ATF_API_BASE}/customer/upgrades/${encodeURIComponent(requestId)}/cancel`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Session expired");
  }

  if (!res.ok) {
    await throwApiError(res, "Failed to cancel upgrade request");
  }

  const data = await res.json();
  if (data.error) {
    throw new ApiError(data.error.code, data.error.message);
  }

  return data;
}

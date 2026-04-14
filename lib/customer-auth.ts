/**
 * Customer authentication helpers for the self-serve dashboard.
 *
 * - Stores JWT in localStorage (client-side only)
 * - Provides signup / login API calls against the ATF API
 * - Auth guard utility for protected pages
 *
 * All customer-facing flows route through same-origin Next.js API proxy routes
 * to avoid browser CORS dependency on api.trucore.xyz and keep backend URLs
 * controlled server-side. This includes:
 * - Auth: /api/customer/auth/*
 * - Dashboard: /api/dashboard/*
 * - Onboarding: /api/onboarding/*
 * - Receipts: /api/customer/receipts/*
 * - Keys: /api/customer/keys/*
 * - Upgrades: /api/customer/upgrades/*
 */

import { parseApiError, getUserFacingMessage } from "@/lib/auth-errors";

// Same-origin proxy bases for all authenticated customer calls.
const AUTH_PROXY_BASE = "/api/customer/auth";
const DASHBOARD_PROXY_BASE = "/api/dashboard";
const ONBOARDING_PROXY_BASE = "/api/onboarding";
const RECEIPTS_PROXY_BASE = "/api/customer/receipts";
const KEYS_PROXY_BASE = "/api/customer/keys";
const UPGRADES_PROXY_BASE = "/api/customer/upgrades";
const POLICY_PROXY_BASE = "/api/customer/policy";

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
  if (!token) throw new ApiError("unauthorized", "Not authenticated");

  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.offset !== undefined) query.set("offset", String(params.offset));
  if (params.status) query.set("status", params.status);
  if (params.dry_run !== undefined)
    query.set("dry_run", String(params.dry_run));
  if (params.protected_by) query.set("protected_by", params.protected_by);

  const qs = query.toString();
  const url = `${RECEIPTS_PROXY_BASE}${qs ? `?${qs}` : ""}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new ApiError("network_error", "We couldn't reach the receipts service.");
  }

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Your session has expired. Please sign in again.");
  }

  if (res.status >= 500) {
    let body: Record<string, unknown> = {};
    try { body = await res.json(); } catch { /* use default */ }
    const msg = typeof body.message === "string" ? body.message : "Receipts service is temporarily unavailable.";
    throw new ApiError(typeof body.error === "string" ? body.error : "upstream_5xx", msg);
  }

  if (!res.ok) {
    let body: Record<string, unknown> = {};
    try { body = await res.json(); } catch { /* use default */ }
    const msg = typeof body.message === "string" ? body.message : "We couldn't load your receipts right now.";
    throw new ApiError(typeof body.error === "string" ? body.error : "api_error", msg);
  }

  return res.json();
}

export async function fetchReceiptDetail(
  receiptId: string,
): Promise<Record<string, unknown>> {
  const token = getToken();
  if (!token) throw new ApiError("unauthorized", "Not authenticated");

  let res: Response;
  try {
    res = await fetch(
      `${RECEIPTS_PROXY_BASE}/${encodeURIComponent(receiptId)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
  } catch {
    throw new ApiError("network_error", "We couldn't reach the receipts service.");
  }

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Your session has expired. Please sign in again.");
  }

  if (res.status === 404) {
    throw new ApiError("not_found", "Receipt not found.");
  }

  if (res.status >= 500) {
    let body: Record<string, unknown> = {};
    try { body = await res.json(); } catch { /* use default */ }
    const msg = typeof body.message === "string" ? body.message : "Receipts service is temporarily unavailable.";
    throw new ApiError(typeof body.error === "string" ? body.error : "upstream_5xx", msg);
  }

  if (!res.ok) {
    let body: Record<string, unknown> = {};
    try { body = await res.json(); } catch { /* use default */ }
    const msg = typeof body.message === "string" ? body.message : "We couldn't load this receipt.";
    throw new ApiError(typeof body.error === "string" ? body.error : "api_error", msg);
  }

  return res.json();
}

export async function verifyReceipt(
  receiptIdOrObject: string | Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const token = getToken();
  if (!token) throw new ApiError("unauthorized", "Not authenticated");

  const body: Record<string, unknown> =
    typeof receiptIdOrObject === "string"
      ? { receipt_id: receiptIdOrObject }
      : { receipt: receiptIdOrObject };

    let res: Response;
  try {
    res = await fetch(`${RECEIPTS_PROXY_BASE}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError("network_error", "We couldn't reach the verification service.");
  }

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Your session has expired. Please sign in again.");
  }

  if (res.status >= 500) {
    throw new ApiError("upstream_5xx", "Verification service is temporarily unavailable.");
  }

    if (!res.ok) {
    let body: Record<string, unknown> = {};
    try { body = await res.json(); } catch { /* use default */ }
    const msg = typeof body.message === "string" ? body.message : "We couldn't verify this receipt.";
    throw new ApiError(typeof body.error === "string" ? body.error : "api_error", msg);
  }

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
  scopes?: string[];
  purpose?: string;
  revoked_at?: number | null;
}

export interface CustomerKeyListResponse {
  keys: CustomerKey[];
  count: number;
  plan_tier?: string;
  allowed_scopes?: string[];
  mcp_endpoint?: string;
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
  if (!token) throw new ApiError("unauthorized", "Not authenticated");

  let res: Response;
  try {
    res = await fetch(`${KEYS_PROXY_BASE}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new ApiError("network_error", "We couldn't reach the API keys service.");
  }

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Your session has expired. Please sign in again.");
  }

  if (res.status >= 500) {
    throw new ApiError("upstream_5xx", "API keys service is temporarily unavailable.");
  }

  if (!res.ok) {
    let body: Record<string, unknown> = {};
    try { body = await res.json(); } catch { /* use default */ }
    const msg = typeof body.message === "string" ? body.message : "We couldn't load your API keys.";
    throw new ApiError(typeof body.error === "string" ? body.error : "api_error", msg);
  }

  return res.json();
}

export async function createCustomerKey(
  label: string = "",
  scopes?: string[],
  purpose?: string,
): Promise<CustomerKeyCreateResponse> {
  const token = getToken();
  if (!token) throw new ApiError("unauthorized", "Not authenticated");

  const payload: Record<string, unknown> = { label };
  if (scopes && scopes.length > 0) payload.scopes = scopes;
  if (purpose) payload.purpose = purpose;

  let res: Response;
  try {
    res = await fetch(`${KEYS_PROXY_BASE}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new ApiError("network_error", "We couldn't reach the API keys service.");
  }

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Your session has expired. Please sign in again.");
  }

  if (res.status === 429) {
    await throwApiError(res, "Rate limit reached. Please try again later.");
  }

  if (res.status >= 500) {
    throw new ApiError("upstream_5xx", "API keys service is temporarily unavailable.");
  }

  if (!res.ok) {
    await throwApiError(res, "Failed to create API key");
  }

  return res.json();
}

export async function revokeCustomerKey(keyId: string): Promise<void> {
  const token = getToken();
  if (!token) throw new ApiError("unauthorized", "Not authenticated");

  let res: Response;
  try {
    res = await fetch(
      `${KEYS_PROXY_BASE}/${encodeURIComponent(keyId)}/revoke`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  } catch {
    throw new ApiError("network_error", "We couldn't reach the API keys service.");
  }

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Your session has expired. Please sign in again.");
  }

  if (res.status >= 500) {
    throw new ApiError("upstream_5xx", "API keys service is temporarily unavailable.");
  }

  if (!res.ok) {
    await throwApiError(res, "Failed to revoke key");
  }
}

export async function rotateCustomerKey(
  keyId: string,
): Promise<CustomerKeyRotateResponse> {
  const token = getToken();
  if (!token) throw new ApiError("unauthorized", "Not authenticated");

  let res: Response;
  try {
    res = await fetch(
      `${KEYS_PROXY_BASE}/${encodeURIComponent(keyId)}/rotate`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  } catch {
    throw new ApiError("network_error", "We couldn't reach the API keys service.");
  }

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Your session has expired. Please sign in again.");
  }

  if (res.status >= 500) {
    throw new ApiError("upstream_5xx", "API keys service is temporarily unavailable.");
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
  if (!token) throw new ApiError("unauthorized", "Not authenticated");

  const payload: Record<string, string> = {};
  if (email) payload.email = email;

  let res: Response;
  try {
    res = await fetch(`${AUTH_PROXY_BASE}/verify-email/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new ApiError("network_error", "We couldn't reach the verification service.");
  }

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Your session has expired. Please sign in again.");
  }

  if (res.status === 429) {
    await throwApiError(res, "Too many resend attempts. Please try again later.");
  }

  if (res.status >= 500) {
    throw new ApiError("upstream_5xx", "Verification service is temporarily unavailable.");
  }

  if (!res.ok) {
    let body: Record<string, unknown> = {};
    try { body = await res.json(); } catch { /* use default */ }
    const msg = typeof body.message === "string" ? body.message : "Failed to resend verification email.";
    throw new ApiError(typeof body.error === "string" ? body.error : "api_error", msg);
  }

  return res.json();
}

export async function confirmVerificationEmail(
  verifyToken: string,
): Promise<{ status: string; email?: string }> {
  let res: Response;
  try {
    res = await fetch(`${AUTH_PROXY_BASE}/verify-email/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: verifyToken }),
    });
  } catch {
    throw new ApiError("network_error", "We couldn't reach the verification service.");
  }

  if (res.status >= 500) {
    throw new ApiError("upstream_5xx", "Verification service is temporarily unavailable.");
  }

  if (!res.ok) {
    await throwApiError(res, "Verification failed");
  }

  return res.json();
}

export async function fetchVerificationStatus(): Promise<VerificationStatus> {
  const token = getToken();
  if (!token) throw new ApiError("unauthorized", "Not authenticated");

  let res: Response;
  try {
    res = await fetch(`${AUTH_PROXY_BASE}/verify-email/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new ApiError("network_error", "We couldn't reach the verification service.");
  }

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Your session has expired. Please sign in again.");
  }

  if (res.status >= 500) {
    throw new ApiError("upstream_5xx", "Verification service is temporarily unavailable.");
  }

  if (!res.ok) {
    let body: Record<string, unknown> = {};
    try { body = await res.json(); } catch { /* use default */ }
    const msg = typeof body.message === "string" ? body.message : "Failed to fetch verification status.";
    throw new ApiError(typeof body.error === "string" ? body.error : "api_error", msg);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

export async function requestPasswordReset(
  email: string,
): Promise<{ status: string; message: string }> {
  let res: Response;
  try {
    res = await fetch(`${AUTH_PROXY_BASE}/password-reset/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  } catch {
    throw new ApiError("network_error", "We couldn't reach the password reset service.");
  }

  if (res.status === 429) {
    await throwApiError(res, "Too many requests. Please try again later.");
  }

  if (res.status >= 500) {
    throw new ApiError("upstream_5xx", "Password reset service is temporarily unavailable.");
  }

  if (!res.ok) {
    let body: Record<string, unknown> = {};
    try { body = await res.json(); } catch { /* use default */ }
    const msg = typeof body.message === "string" ? body.message : "Failed to request password reset.";
    throw new ApiError(typeof body.error === "string" ? body.error : "api_error", msg);
  }

  return res.json();
}

export async function confirmPasswordReset(
  resetToken: string,
  newPassword: string,
): Promise<{ status: string; message: string }> {
  let res: Response;
  try {
    res = await fetch(`${AUTH_PROXY_BASE}/password-reset/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: resetToken, new_password: newPassword }),
    });
  } catch {
    throw new ApiError("network_error", "We couldn't reach the password reset service.");
  }

  if (res.status === 429) {
    await throwApiError(res, "Too many attempts. Please try again later.");
  }

  if (res.status >= 500) {
    throw new ApiError("upstream_5xx", "Password reset service is temporarily unavailable.");
  }

  if (!res.ok) {
    await throwApiError(res, "Password reset failed");
  }

  return res.json();
}

export async function validateResetToken(
  resetToken: string,
): Promise<{ valid: boolean; reason?: string }> {
  let res: Response;
  try {
    res = await fetch(`${AUTH_PROXY_BASE}/password-reset/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: resetToken }),
    });
  } catch {
    throw new ApiError("network_error", "We couldn't reach the password reset service.");
  }

  if (res.status >= 500) {
    throw new ApiError("upstream_5xx", "Password reset service is temporarily unavailable.");
  }

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
  if (!token) throw new ApiError("unauthorized", "Not authenticated");

  let res: Response;
  try {
    res = await fetch(`${UPGRADES_PROXY_BASE}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });
  } catch {
    throw new ApiError("network_error", "We couldn't reach the upgrades service.");
  }

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Your session has expired. Please sign in again.");
  }

  if (res.status >= 500) {
    throw new ApiError("upstream_5xx", "Upgrades service is temporarily unavailable.");
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
  if (!token) throw new ApiError("unauthorized", "Not authenticated");

  let res: Response;
  try {
    res = await fetch(`${UPGRADES_PROXY_BASE}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new ApiError("network_error", "We couldn't reach the upgrades service.");
  }

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Your session has expired. Please sign in again.");
  }

  if (res.status >= 500) {
    throw new ApiError("upstream_5xx", "Upgrades service is temporarily unavailable.");
  }

  if (!res.ok) {
    let body: Record<string, unknown> = {};
    try { body = await res.json(); } catch { /* use default */ }
    const msg = typeof body.message === "string" ? body.message : "We couldn't load your upgrade requests.";
    throw new ApiError(typeof body.error === "string" ? body.error : "api_error", msg);
  }

  return res.json();
}

export async function cancelUpgradeRequest(
  requestId: string,
): Promise<{ request: UpgradeRequestData }> {
  const token = getToken();
  if (!token) throw new ApiError("unauthorized", "Not authenticated");

  let res: Response;
  try {
    res = await fetch(
      `${UPGRADES_PROXY_BASE}/${encodeURIComponent(requestId)}/cancel`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  } catch {
    throw new ApiError("network_error", "We couldn't reach the upgrades service.");
  }

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Your session has expired. Please sign in again.");
  }

  if (res.status >= 500) {
    throw new ApiError("upstream_5xx", "Upgrades service is temporarily unavailable.");
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

// ---------------------------------------------------------------------------
// Policy
// ---------------------------------------------------------------------------

export interface PolicyPlanLimits {
  tx_limit_per_month: number;
  policy_overrides_enabled: boolean;
}

export interface EffectivePolicyResponse {
  plan_code: string;
  plan_limits: PolicyPlanLimits;
  overrides: Record<string, unknown>;
  effective: Record<string, unknown>;
}

export interface PolicyOverridesUpdateResponse {
  overrides: Record<string, unknown>;
  message: string;
}

export async function fetchPolicy(): Promise<EffectivePolicyResponse> {
  const token = getToken();
  if (!token) throw new ApiError("unauthorized", "Not authenticated");

  let res: Response;
  try {
    res = await fetch(`${POLICY_PROXY_BASE}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new ApiError("network_error", "We couldn't reach the policy service.");
  }

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Your session has expired. Please sign in again.");
  }

  if (res.status >= 500) {
    throw new ApiError("upstream_5xx", "Policy service is temporarily unavailable.");
  }

  if (!res.ok) {
    let body: Record<string, unknown> = {};
    try { body = await res.json(); } catch { /* use default */ }
    const msg = typeof body.message === "string" ? body.message : "We couldn't load your policy data.";
    throw new ApiError(typeof body.error === "string" ? body.error : "api_error", msg);
  }

  return res.json();
}

export async function updatePolicyOverrides(
  overrides: Record<string, unknown>,
): Promise<PolicyOverridesUpdateResponse> {
  const token = getToken();
  if (!token) throw new ApiError("unauthorized", "Not authenticated");

  let res: Response;
  try {
    res = await fetch(`${POLICY_PROXY_BASE}/overrides`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ overrides }),
    });
  } catch {
    throw new ApiError("network_error", "We couldn't reach the policy service.");
  }

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", "Your session has expired. Please sign in again.");
  }

  if (res.status === 403) {
    let body: Record<string, unknown> = {};
    try { body = await res.json(); } catch { /* use default */ }
    const msg = typeof body.message === "string" ? body.message : "Your plan does not support policy overrides.";
    throw new ApiError("forbidden", msg);
  }

  if (res.status === 429) {
    await throwApiError(res, "Rate limit reached. Please try again later.");
  }

  if (res.status >= 500) {
    throw new ApiError("upstream_5xx", "Policy service is temporarily unavailable.");
  }

  if (!res.ok) {
    let body: Record<string, unknown> = {};
    try { body = await res.json(); } catch { /* use default */ }
    const msg = typeof body.message === "string" ? body.message : "We couldn't update your policy overrides.";
    throw new ApiError(typeof body.error === "string" ? body.error : "api_error", msg);
  }

  return res.json();
}

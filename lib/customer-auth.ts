/**
 * Customer authentication helpers for the self-serve dashboard.
 *
 * - Stores JWT in localStorage (client-side only)
 * - Provides signup / login API calls against the ATF API
 * - Auth guard utility for protected pages
 */

const ATF_API_BASE =
  process.env.NEXT_PUBLIC_ATF_API_URL || "https://api.trucore.xyz";

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

export interface AuthResult {
  token: string;
  tenant_id: string;
  api_key?: string;
}

export async function signup(
  email: string,
  password: string,
): Promise<AuthResult> {
  const res = await fetch(`${ATF_API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 429) {
      const secs = body?.retry_after_seconds ?? res.headers.get("Retry-After") ?? "";
      throw new Error(
        secs
          ? `Too many signup attempts. Please try again in ${secs} seconds.`
          : "Too many signup attempts. Please try again later.",
      );
    }
    const msg =
      body?.detail?.message || body?.detail || "Signup failed";
    throw new Error(msg);
  }

  return res.json();
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResult> {
  const res = await fetch(`${ATF_API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 429) {
      const secs = body?.retry_after_seconds ?? res.headers.get("Retry-After") ?? "";
      throw new Error(
        secs
          ? `Too many login attempts. Please try again in ${secs} seconds.`
          : "Too many login attempts. Please try again later.",
      );
    }
    const msg =
      body?.detail?.message || body?.detail || "Login failed";
    throw new Error(msg);
  }

  return res.json();
}

export async function fetchDashboard(): Promise<Record<string, unknown>> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${ATF_API_BASE}/dashboard/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    clearAuth();
    throw new Error("Session expired");
  }

  if (!res.ok) throw new Error("Failed to fetch dashboard");

  return res.json();
}

// ---------------------------------------------------------------------------
// Onboarding — first protected trade flow
// ---------------------------------------------------------------------------

export async function fetchSampleIntent(): Promise<Record<string, unknown>> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${ATF_API_BASE}/onboarding/sample-intent`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    clearAuth();
    throw new Error("Session expired");
  }

  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    const secs = body?.retry_after_seconds ?? "";
    throw new Error(
      secs
        ? `Rate limit reached. Please try again in ${secs} seconds.`
        : "Rate limit reached. Please try again later.",
    );
  }

  if (!res.ok) throw new Error("Failed to fetch sample intent");

  return res.json();
}

export async function simulateProtection(
  intent: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${ATF_API_BASE}/onboarding/protect-dry-run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(intent),
  });

  if (res.status === 401) {
    clearAuth();
    throw new Error("Session expired");
  }

  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    const secs = body?.retry_after_seconds ?? "";
    throw new Error(
      secs
        ? `Rate limit reached. Please try again in ${secs} seconds.`
        : "Rate limit reached. Please try again later.",
    );
  }

  if (!res.ok) throw new Error("Protection simulation failed");

  return res.json();
}

export async function executeSample(
  intent: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${ATF_API_BASE}/onboarding/execute-sample`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(intent),
  });

  if (res.status === 401) {
    clearAuth();
    throw new Error("Session expired");
  }

  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    const secs = body?.retry_after_seconds ?? "";
    throw new Error(
      secs
        ? `Rate limit reached. Please try again in ${secs} seconds.`
        : "Rate limit reached. Please try again later.",
    );
  }

  if (!res.ok) throw new Error("Sample execution failed");

  return res.json();
}

// ---------------------------------------------------------------------------
// Activation state — onboarding progress tracking
// ---------------------------------------------------------------------------

export async function fetchActivation(): Promise<Record<string, unknown>> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${ATF_API_BASE}/dashboard/activation`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    clearAuth();
    throw new Error("Session expired");
  }

  if (!res.ok) throw new Error("Failed to fetch activation state");

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

  const res = await fetch(`${ATF_API_BASE}/dashboard/activation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    clearAuth();
    throw new Error("Session expired");
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
    throw new Error("Session expired");
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
    throw new Error("Session expired");
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
    throw new Error("Session expired");
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
    throw new Error("Session expired");
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
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail || "Failed to create API key");
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
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail || "Failed to revoke key");
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
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail || "Failed to rotate key");
  }

  return res.json();
}

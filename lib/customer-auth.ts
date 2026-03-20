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

  if (!res.ok) throw new Error("Sample execution failed");

  return res.json();
}

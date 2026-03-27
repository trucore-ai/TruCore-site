/**
 * ATF backend client utilities.
 *
 * All calls go through the same-origin proxy routes to avoid CORS and to keep
 * the ATF base URL server-side only.
 */

export interface CreateApiKeyResult {
  api_key: string;
  label: string;
  created_at: number;
}

/**
 * Request a real ATF API key from the backend.
 *
 * Calls the Next.js proxy at /api/keys/issue which forwards to
 * POST /auth/api-keys/create on the ATF backend.
 *
 * Returns a result with api_key starting with "atf_".
 * The raw key is returned exactly once — it is never re-retrievable.
 */
export async function createApiKey(): Promise<CreateApiKeyResult> {
  const res = await fetch("/api/keys/issue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label: "trucore-site" }),
  });

  if (!res.ok) throw new Error("Failed to create API key");

  return res.json() as Promise<CreateApiKeyResult>;
}

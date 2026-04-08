"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  isLoggedIn,
  clearAuth,
  fetchCustomerKeys,
  createCustomerKey,
  revokeCustomerKey,
  rotateCustomerKey,
  ApiError,
} from "@/lib/customer-auth";
import type {
  CustomerKey,
  CustomerKeyCreateResponse,
  CustomerKeyRotateResponse,
} from "@/lib/customer-auth";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PURPOSE_OPTIONS = [
  { value: "", label: "General" },
  { value: "api", label: "REST API" },
  { value: "bot", label: "Bot / Agent" },
  { value: "mcp", label: "MCP Integration" },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(epoch: number): string {
  if (!epoch) return "-";
  // Handle both seconds and milliseconds
  const ms = epoch < 1e12 ? epoch * 1000 : epoch;
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CustomerKeysPage() {
  const router = useRouter();
  const [keys, setKeys] = useState<CustomerKey[]>([]);
  const [error, setError] = useState("");
  const [verifyRequired, setVerifyRequired] = useState(false);
  const [loading, setLoading] = useState(true);

  // Create flow state
  const [showCreate, setShowCreate] = useState(false);
  const [createLabel, setCreateLabel] = useState("");
  const [createScopes, setCreateScopes] = useState<string[]>([]);
  const [createPurpose, setCreatePurpose] = useState("");
  const [creating, setCreating] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Plan metadata from list response
  const [planTier, setPlanTier] = useState<string>("free");
  const [allowedScopes, setAllowedScopes] = useState<string[]>([]);
  const [mcpEndpoint, setMcpEndpoint] = useState<string | null>(null);

  // Revoke flow state
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  // Rotate flow state
  const [confirmRotateId, setConfirmRotateId] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);
  const [rotatedSecret, setRotatedSecret] = useState<string | null>(null);
  const [rotatedCopied, setRotatedCopied] = useState(false);

  // Copy key ID state
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // ------------------------------------------------------------------
  // Load keys
  // ------------------------------------------------------------------

  const loadKeys = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchCustomerKeys();
      setKeys(data.keys);
      if (data.plan_tier) setPlanTier(data.plan_tier);
      if (data.allowed_scopes) setAllowedScopes(data.allowed_scopes);
      if (data.mcp_endpoint) setMcpEndpoint(data.mcp_endpoint);
      setError("");
    } catch (err) {
      if (err instanceof ApiError && err.code === "unauthorized") {
        router.replace("/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load keys");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    loadKeys();
  }, [router, loadKeys]);

  // ------------------------------------------------------------------
  // Create key
  // ------------------------------------------------------------------

  async function handleCreate() {
    try {
      setCreating(true);
      setError("");
      setVerifyRequired(false);
      const result: CustomerKeyCreateResponse =
        await createCustomerKey(createLabel, createScopes, createPurpose);
      setNewSecret(result.raw_secret);
      setCreateLabel("");
      setCreateScopes([]);
      setCreatePurpose("");
      await loadKeys();
    } catch (err) {
      if (err instanceof ApiError && err.code === "unauthorized") {
        router.replace("/login");
        return;
      }
      if (err instanceof ApiError && err.code === "email_not_verified") {
        setVerifyRequired(true);
      } else {
        setError(err instanceof Error ? err.message : "Failed to create key");
      }
    } finally {
      setCreating(false);
    }
  }

  function handleCopyNew() {
    if (newSecret) {
      navigator.clipboard.writeText(newSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // ------------------------------------------------------------------
  // Revoke key
  // ------------------------------------------------------------------

  async function handleRevoke(keyId: string) {
    try {
      setRevoking(true);
      setError("");
      setVerifyRequired(false);
      await revokeCustomerKey(keyId);
      setConfirmRevokeId(null);
      await loadKeys();
    } catch (err) {
      if (err instanceof ApiError && err.code === "unauthorized") {
        router.replace("/login");
        return;
      }
      if (err instanceof ApiError && err.code === "email_not_verified") {
        setVerifyRequired(true);
        setConfirmRevokeId(null);
      } else {
        setError(err instanceof Error ? err.message : "Failed to revoke key");
      }
    } finally {
      setRevoking(false);
    }
  }

  // ------------------------------------------------------------------
  // Rotate key
  // ------------------------------------------------------------------

  async function handleRotate(keyId: string) {
    try {
      setRotating(true);
      setError("");
      setVerifyRequired(false);
      const result: CustomerKeyRotateResponse =
        await rotateCustomerKey(keyId);
      setRotatedSecret(result.raw_secret);
      setConfirmRotateId(null);
      await loadKeys();
    } catch (err) {
      if (err instanceof ApiError && err.code === "unauthorized") {
        router.replace("/login");
        return;
      }
      if (err instanceof ApiError && err.code === "email_not_verified") {
        setVerifyRequired(true);
        setConfirmRotateId(null);
      } else {
        setError(err instanceof Error ? err.message : "Failed to rotate key");
      }
    } finally {
      setRotating(false);
    }
  }

  function handleCopyRotated() {
    if (rotatedSecret) {
      navigator.clipboard.writeText(rotatedSecret);
      setRotatedCopied(true);
      setTimeout(() => setRotatedCopied(false), 2000);
    }
  }

  function handleCopyKeyId(keyId: string) {
    navigator.clipboard.writeText(keyId);
    setCopiedKeyId(keyId);
    setTimeout(() => setCopiedKeyId(null), 2000);
  }

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">API Keys</h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage API keys for your integrations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/customer/dashboard"
            className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5"
          >
            Dashboard
          </Link>
          <button
            onClick={() => {
              clearAuth();
              router.push("/login");
            }}
            className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5"
          >
            Log out
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Email verification required banner */}
      {verifyRequired && (
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-4 space-y-2">
          <p className="text-sm text-amber-200">
            Email verification required. You must verify your email before
            creating, revoking, or rotating API keys.
          </p>
          <Link
            href="/customer/dashboard"
            className="inline-block rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10"
          >
            Go to dashboard to verify
          </Link>
        </div>
      )}

      {/* New secret reveal - shown once on create */}
      {newSecret && (
        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <p className="mb-2 text-sm font-semibold text-emerald-300">
            New Secret API Key Created
          </p>
          <p className="mb-3 text-xs text-amber-300">
            This is your secret API key. It will only be shown once. Copy it now and store it securely.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all rounded-lg border border-white/10 bg-neutral-900 px-4 py-2.5 font-mono text-sm text-slate-100">
              {newSecret}
            </code>
            <button
              onClick={handleCopyNew}
              className="shrink-0 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-400"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button
            onClick={() => setNewSecret(null)}
            className="mt-3 text-xs text-slate-400 underline hover:text-slate-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Rotated secret reveal - shown once on rotate */}
      {rotatedSecret && (
        <div className="mb-6 rounded-xl border border-blue-500/30 bg-blue-500/10 p-5">
          <p className="mb-2 text-sm font-semibold text-blue-300">
            Key Rotated - New Secret API Key
          </p>
          <p className="mb-3 text-xs text-amber-300">
            This is your new secret API key. It will only be shown once. The old key has been revoked
            and will no longer work.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all rounded-lg border border-white/10 bg-neutral-900 px-4 py-2.5 font-mono text-sm text-slate-100">
              {rotatedSecret}
            </code>
            <button
              onClick={handleCopyRotated}
              className="shrink-0 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-400"
            >
              {rotatedCopied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button
            onClick={() => setRotatedSecret(null)}
            className="mt-3 text-xs text-slate-400 underline hover:text-slate-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create key section */}
      <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.02] p-5">
        {!showCreate ? (
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-400"
          >
            Create API Key
          </button>
        ) : (
          <div className="space-y-4">
            <label className="block text-sm text-slate-300">
              Label{" "}
              <span className="text-slate-500">(optional)</span>
            </label>
            <input
              type="text"
              value={createLabel}
              onChange={(e) => setCreateLabel(e.target.value)}
              placeholder="e.g. production-bot"
              maxLength={64}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30"
            />

            {/* Purpose selector */}
            <div>
              <label className="mb-1.5 block text-sm text-slate-300">Purpose</label>
              <div className="flex flex-wrap gap-2">
                {PURPOSE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCreatePurpose(opt.value)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      createPurpose === opt.value
                        ? "border-primary-400 bg-primary-500/20 text-primary-300"
                        : "border-white/10 text-slate-400 hover:bg-white/5"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scope checkboxes */}
            {allowedScopes.length > 0 && (
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">
                  Scopes{" "}
                  <span className="text-slate-500">
                    (leave empty for all {planTier} tier scopes)
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {allowedScopes.map((scope) => {
                    const checked = createScopes.includes(scope);
                    return (
                      <button
                        key={scope}
                        type="button"
                        onClick={() =>
                          setCreateScopes((prev) =>
                            checked
                              ? prev.filter((s) => s !== scope)
                              : [...prev, scope],
                          )
                        }
                        className={`rounded-lg border px-3 py-1.5 text-xs font-mono transition ${
                          checked
                            ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-300"
                            : "border-white/10 text-slate-500 hover:bg-white/5"
                        }`}
                      >
                        {scope}
                      </button>
                    );
                  })}
                </div>
                {createPurpose === "mcp" &&
                  createScopes.length > 0 &&
                  !createScopes.includes("atf:mcp") && (
                    <p className="mt-1 text-xs text-amber-400">
                      MCP keys require the <code className="font-mono">atf:mcp</code> scope.
                      It will be added automatically.
                    </p>
                  )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={handleCreate}
                disabled={creating}
                className="rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-400 disabled:opacity-50"
              >
                {creating ? "Creating…" : "Create"}
              </button>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setCreateLabel("");
                  setCreateScopes([]);
                  setCreatePurpose("");
                }}
                className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-slate-400 transition hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Keys table */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="mb-1 text-lg font-semibold text-white">Your Keys</h2>
        <p className="mb-4 text-xs text-slate-500">
          Copy Key ID copies the internal key identifier, not the secret API key. Secret keys are only shown once when created or rotated.
        </p>

        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : keys.length === 0 ? (
          <p className="text-sm text-slate-400">No API keys found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-slate-500">
                  <th className="pb-2 pr-4 font-medium">Secret Preview</th>
                  <th className="pb-2 pr-4 font-medium">Label</th>
                  <th className="pb-2 pr-4 font-medium">Purpose</th>
                  <th className="pb-2 pr-4 font-medium">Scopes</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Created</th>
                  <th className="pb-2 pr-4 font-medium">Last Used</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr
                    key={k.key_id}
                    className="border-b border-white/5 last:border-0"
                  >
                    <td className="py-2.5 pr-4 font-mono text-slate-200">
                      {k.preview}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-300">
                      {k.label || "-"}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-400 text-xs">
                      {k.purpose || "-"}
                    </td>
                    <td className="py-2.5 pr-4">
                      {k.scopes && k.scopes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {k.scopes.map((s) => (
                            <span
                              key={s}
                              className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-400"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">all</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={
                          k.status === "active"
                            ? "rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300"
                            : "rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-300"
                        }
                      >
                        {k.status}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-400">
                      {formatDate(k.created_at)}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-400">
                      {k.last_used_at ? formatDate(k.last_used_at) : "Never"}
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        {/* Copy Key ID */}
                        <button
                          onClick={() => handleCopyKeyId(k.key_id)}
                          className="inline-flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-xs text-slate-400 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400"
                        >
                          {copiedKeyId === k.key_id ? (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3 text-emerald-400"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                              </svg>
                              Copy Key ID
                            </>
                          )}
                        </button>

                        {k.status === "active" && (
                          <>
                          {/* Revoke */}
                          {confirmRevokeId === k.key_id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleRevoke(k.key_id)}
                                disabled={revoking}
                                className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
                              >
                                {revoking ? "…" : "Confirm"}
                              </button>
                              <button
                                onClick={() => setConfirmRevokeId(null)}
                                className="rounded border border-white/10 px-2 py-1 text-xs text-slate-400  hover:bg-white/5"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setConfirmRevokeId(k.key_id);
                                setConfirmRotateId(null);
                              }}
                              className="rounded border border-red-500/30 px-2 py-1 text-xs text-red-400 transition hover:bg-red-500/10"
                            >
                              Revoke
                            </button>
                          )}

                          {/* Rotate */}
                          {confirmRotateId === k.key_id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleRotate(k.key_id)}
                                disabled={rotating}
                                className="rounded bg-amber-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-amber-500 disabled:opacity-50"
                              >
                                {rotating ? "…" : "Confirm"}
                              </button>
                              <button
                                onClick={() => setConfirmRotateId(null)}
                                className="rounded border border-white/10 px-2 py-1 text-xs text-slate-400 hover:bg-white/5"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setConfirmRotateId(k.key_id);
                                setConfirmRevokeId(null);
                              }}
                              className="rounded border border-amber-500/30 px-2 py-1 text-xs text-amber-400 transition hover:bg-amber-500/10"
                              title="Revoke this key and issue a replacement. Existing integrations using this key will stop working."
                            >
                              Rotate
                            </button>
                          )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MCP setup section */}
      {mcpEndpoint && (
        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <h2 className="mb-1 text-lg font-semibold text-white">
            MCP Integration
          </h2>
          <p className="mb-3 text-sm text-slate-400">
            Connect your AI agent to ATF via the Model Context Protocol. Create
            a key with <code className="font-mono text-xs text-primary-300">atf:mcp</code> scope,
            then configure your agent with the endpoint below.
          </p>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-500">
              MCP Endpoint
            </label>
            <code className="block break-all rounded-lg border border-white/10 bg-neutral-900 px-4 py-2.5 font-mono text-sm text-slate-100">
              {mcpEndpoint}
            </code>
          </div>
          <div className="mt-4 rounded-lg border border-white/5 bg-white/[0.01] px-4 py-3">
            <p className="text-xs text-slate-500">
              <strong className="text-slate-400">Protocol:</strong> JSON-RPC 2.0 over HTTPS.{" "}
              <strong className="text-slate-400">Auth:</strong>{" "}
              <code className="font-mono text-[10px]">X-API-Key</code> header with
              your secret key. Your key&apos;s scopes determine which MCP tools are
              available.{" "}
              <Link
                href="/agent"
                className="text-primary-400 underline hover:text-primary-300"
              >
                View full integration guide
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Plan tier info */}
      {planTier && (
        <div className="mt-6 rounded-lg border border-white/5 bg-white/[0.01] px-4 py-3">
          <p className="text-xs text-slate-500">
            <strong className="text-slate-400">Plan:</strong>{" "}
            <span className="capitalize">{planTier}</span>.{" "}
            {allowedScopes.length > 0 && (
              <>
                <strong className="text-slate-400">Available scopes:</strong>{" "}
                {allowedScopes.map((s) => (
                  <code
                    key={s}
                    className="mr-1 font-mono text-[10px] text-slate-400"
                  >
                    {s}
                  </code>
                ))}
              </>
            )}
          </p>
        </div>
      )}

      {/* Warning / info footer */}
      <div className="mt-6 rounded-lg border border-white/5 bg-white/[0.01] px-4 py-3">
        <p className="text-xs text-slate-500">
          <strong className="text-slate-400">Revoke</strong> permanently
          deactivates a key. Revoked keys cannot be restored.{" "}
          <strong className="text-slate-400">Rotate</strong> revokes the
          old key and creates a replacement - existing integrations using
          the old key will immediately stop working.
        </p>
      </div>
    </main>
  );
}

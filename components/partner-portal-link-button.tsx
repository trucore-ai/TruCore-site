"use client";

import { useState, useTransition } from "react";

type PortalTokenResponse = {
  ok: true;
  portal_token: {
    id: string;
    owner_email: string;
    owner_project: string | null;
    created_at: string;
    expires_at: string;
    revoked_at: string | null;
  };
  raw_token: string;
  portal_link: string;
};

export function PartnerPortalLinkButton({
  email,
  projectName,
  activeTokenId,
  activeTokenExpiresAt,
}: {
  email: string;
  projectName?: string | null;
  activeTokenId?: string | null;
  activeTokenExpiresAt?: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [portalLink, setPortalLink] = useState<string | null>(null);
  const [rawToken, setRawToken] = useState<string | null>(null);
  const [createdTokenId, setCreatedTokenId] = useState<string | null>(null);
  const [copiedState, setCopiedState] = useState<"none" | "token" | "link">("none");
  const [revoking, setRevoking] = useState(false);
  const [revoked, setRevoked] = useState(false);

  const liveTokenId = createdTokenId ?? activeTokenId ?? null;
  const hasActiveToken = Boolean(liveTokenId) && !revoked;

  function onCreatePortalLink() {
    startTransition(async () => {
      setError(null);
      setCopiedState("none");
      setRevoked(false);

      try {
        const response = await fetch("/api/portal/token/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            owner_email: email,
            owner_project: projectName ?? null,
          }),
        });

        if (!response.ok) {
          setError("Unable to create portal link. Please retry.");
          return;
        }

        const data = (await response.json()) as PortalTokenResponse;
        setCreatedTokenId(data.portal_token.id);
        setPortalLink(data.portal_link);
        setRawToken(data.raw_token);
      } catch {
        setError("Unable to create portal link. Please retry.");
      }
    });
  }

  async function onCopy(value: string, mode: "token" | "link") {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedState(mode);
    } catch {
      setCopiedState("none");
    }
  }

  async function onRevoke() {
    if (!liveTokenId || revoking) return;

    setRevoking(true);
    setError(null);

    try {
      const response = await fetch("/api/portal/token/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({ id: liveTokenId }),
      });

      if (!response.ok) {
        setError("Unable to revoke portal token. Please retry.");
        return;
      }

      setRevoked(true);
      setPortalLink(null);
      setRawToken(null);
      setCreatedTokenId(null);
    } catch {
      setError("Unable to revoke portal token. Please retry.");
    } finally {
      setRevoking(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onCreatePortalLink}
          disabled={isPending}
          className="rounded border border-white/10 bg-primary-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Creating..." : "Create Portal Link"}
        </button>

        {hasActiveToken && (
          <button
            type="button"
            onClick={onRevoke}
            disabled={revoking}
            className="rounded border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {revoking ? "Revoking..." : "Revoke"}
          </button>
        )}
      </div>

      {activeTokenId && activeTokenExpiresAt && !createdTokenId && !revoked && (
        <p className="text-[11px] text-slate-400">
          Active link expires {new Date(activeTokenExpiresAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" })} UTC
        </p>
      )}

      {error && <p className="text-xs text-red-300">{error}</p>}

      {portalLink && rawToken && (
        <div className="max-w-[420px] space-y-2 rounded border border-emerald-500/30 bg-emerald-500/10 p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
            Portal token, shown once
          </p>

          <p className="break-all rounded bg-black/30 px-2 py-1 font-mono text-[11px] text-emerald-200">
            {rawToken}
          </p>

          <p className="break-all rounded bg-black/30 px-2 py-1 font-mono text-[11px] text-emerald-200">
            {portalLink}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onCopy(rawToken, "token")}
              className="rounded border border-white/10 bg-white/10 px-2 py-1 text-[11px] font-medium text-slate-200 transition hover:bg-white/20"
            >
              {copiedState === "token" ? "Token copied" : "Copy token"}
            </button>
            <button
              type="button"
              onClick={() => onCopy(portalLink, "link")}
              className="rounded border border-white/10 bg-white/10 px-2 py-1 text-[11px] font-medium text-slate-200 transition hover:bg-white/20"
            >
              {copiedState === "link" ? "Link copied" : "Copy link"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

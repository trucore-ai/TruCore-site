"use client";

import { useMemo, useState, useTransition } from "react";

type IssueResponse = {
  ok: true;
  key: {
    id: string;
    label: string | null;
    owner_email: string | null;
    owner_project: string | null;
    created_at: string;
    revoked_at: string | null;
  };
  raw_key: string;
};

export function PartnerIssueKeyButton({
  email,
  projectName,
  isAlreadyIssued = false,
}: {
  email: string;
  projectName?: string | null;
  isAlreadyIssued?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [issuedRawKey, setIssuedRawKey] = useState<string | null>(null);
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [copied, setCopied] = useState(false);

  const issued = isAlreadyIssued || isAcknowledged;

  const label = useMemo(() => {
    const basis = projectName?.trim() || email;
    return `Sandbox - ${basis}`.slice(0, 120);
  }, [email, projectName]);

  const showRevealPanel = Boolean(issuedRawKey) && !isAcknowledged;

  function handleIssue() {
    startTransition(async () => {
      setError(null);
      setCopied(false);

      try {
        const response = await fetch("/api/keys/issue-for-partner", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            email,
            project_name: projectName ?? null,
            label,
          }),
        });

        if (!response.ok) {
          setError("Unable to issue sandbox key. Please retry.");
          return;
        }

        const data = (await response.json()) as IssueResponse;
        setIssuedRawKey(data.raw_key);
      } catch {
        setError("Unable to issue sandbox key. Please retry.");
      }
    });
  }

  async function copyKey() {
    if (!issuedRawKey) return;

    try {
      await navigator.clipboard.writeText(issuedRawKey);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function acknowledgeSaved() {
    setIssuedRawKey(null);
    setIsAcknowledged(true);
    setCopied(false);
  }

  if (issued) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-300">
        Key issued
      </span>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleIssue}
        disabled={isPending}
        className="rounded border border-white/10 bg-primary-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Issuing..." : "Issue Sandbox Key"}
      </button>

      {error && <p className="text-xs text-red-300">{error}</p>}

      {showRevealPanel && (
        <div className="max-w-[320px] rounded border border-emerald-500/30 bg-emerald-500/10 p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
            Raw key, shown once
          </p>
          <p className="mt-1 break-all rounded bg-black/30 px-2 py-1 font-mono text-[11px] text-emerald-200">
            {issuedRawKey}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={copyKey}
              className="rounded border border-white/10 bg-white/10 px-2 py-1 text-[11px] font-medium text-slate-200 transition hover:bg-white/20"
            >
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={acknowledgeSaved}
              className="rounded border border-white/10 bg-white/10 px-2 py-1 text-[11px] font-medium text-slate-200 transition hover:bg-white/20"
            >
              I saved it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

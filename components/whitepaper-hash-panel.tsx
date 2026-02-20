"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";

export function WhitepaperHashPanel() {
  const [hash, setHash] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadHash() {
      try {
        const res = await fetch("/atf/whitepaper/hash", { cache: "force-cache" });
        if (!res.ok) {
          throw new Error("Failed to load hash");
        }
        const data = (await res.json()) as { sha256?: string };
        if (active) {
          setHash(data.sha256 ?? "");
        }
      } catch {
        if (active) {
          setHash("");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadHash();

    return () => {
      active = false;
    };
  }, []);

  const copyHash = async () => {
    if (!hash) return;
    try {
      await navigator.clipboard.writeText(hash);
      trackEvent("whitepaper_hash_copy_click", { location: "whitepaper_page" });
    } catch {
      // No-op for clipboard failures
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-neutral-900/50 p-5">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={copyHash}
          disabled={!hash}
          className="inline-flex items-center justify-center rounded-xl border border-primary-300/40 bg-primary-500/15 px-5 py-3 text-sm font-semibold text-primary-100 transition-colors hover:bg-primary-500/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Copy PDF SHA-256
        </button>
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-primary-300">
        PDF SHA-256
      </p>
      <p className="mt-2 break-all rounded-lg border border-white/10 bg-neutral-950/60 px-3 py-2 font-mono text-xs text-slate-200">
        {isLoading ? "Loading hash..." : hash || "Hash unavailable"}
      </p>
      <p className="mt-3 text-sm text-slate-400">
        Verify you have the authentic document by matching this hash.
      </p>
    </div>
  );
}

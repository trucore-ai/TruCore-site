"use client";

import { forwardRef, useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { bytesToHex } from "@/lib/hex";

type PdfIntegrityVerifierProps = {
  expectedHash: string;
};

type VerificationStatus = "idle" | "computing" | "match" | "mismatch" | "error";

export const PdfIntegrityVerifier = forwardRef<HTMLInputElement, PdfIntegrityVerifierProps>(
  function PdfIntegrityVerifier({ expectedHash }, fileInputRef) {
    const [computedHash, setComputedHash] = useState("");
    const [status, setStatus] = useState<VerificationStatus>("idle");
    const [errorMessage, setErrorMessage] = useState("");

    const normalizedExpectedHash = useMemo(() => expectedHash.trim().toLowerCase(), [expectedHash]);

    const supportsWebCrypto = typeof window !== "undefined" && !!window.crypto?.subtle;

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      if (!supportsWebCrypto) {
        setStatus("error");
        setErrorMessage("Browser hashing is unavailable. Please use the local commands below.");
        return;
      }

      trackEvent("whitepaper_verify_browser_start", { location: "whitepaper_page" });
      setStatus("computing");
      setErrorMessage("");

      try {
        await new Promise((resolve) => window.setTimeout(resolve, 0));
        const buf = await file.arrayBuffer();
        const digest = await crypto.subtle.digest("SHA-256", buf);
        const hex = bytesToHex(new Uint8Array(digest)).trim().toLowerCase();
        const isMatch = hex === normalizedExpectedHash;

        setComputedHash(hex);
        setStatus(isMatch ? "match" : "mismatch");

        trackEvent(isMatch ? "whitepaper_verify_browser_match" : "whitepaper_verify_browser_mismatch", {
          location: "whitepaper_page",
        });
      } catch {
        setStatus("error");
        setErrorMessage("Could not compute hash for this file. Please try again or use local commands.");
      }
    };

    const reset = () => {
      setComputedHash("");
      setStatus("idle");
      setErrorMessage("");
    };

    const copyComputedHash = async () => {
      if (!computedHash) {
        return;
      }

      try {
        await navigator.clipboard.writeText(computedHash);
      } catch {
        // No-op for clipboard failures.
      }
    };

    return (
      <div className="mt-3 rounded-lg border border-white/10 bg-neutral-950/50 p-4">
        <label htmlFor="whitepaper-verify-file" className="block text-sm font-semibold text-slate-100">
          Choose the downloaded PDF
        </label>
        <input
          ref={fileInputRef}
          id="whitepaper-verify-file"
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="mt-2 block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border file:border-primary-300/40 file:bg-primary-500/15 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-100 hover:file:bg-primary-500/25"
        />

        <p className="mt-3 text-xs text-slate-400">Privacy: file never leaves your device.</p>

        <div className="mt-3 min-h-6 text-sm" aria-live="polite">
          {status === "computing" ? <p className="text-slate-200">Computing…</p> : null}
          {status === "match" ? <p className="font-semibold text-emerald-300">Match ✅ Authentic copy</p> : null}
          {status === "mismatch" ? <p className="font-semibold text-rose-300">Mismatch ❌ Different file</p> : null}
          {status === "error" ? <p className="text-amber-300">{errorMessage}</p> : null}
        </div>

        {computedHash ? (
          <div className="mt-3 rounded-lg border border-white/10 bg-neutral-950/80 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-200">Computed SHA-256</p>
            <p className="mt-2 break-all font-mono text-xs text-slate-200">{computedHash}</p>
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copyComputedHash}
            disabled={!computedHash}
            className="inline-flex items-center justify-center rounded-xl border border-primary-300/40 bg-primary-500/15 px-3 py-2 text-xs font-semibold text-primary-100 transition-colors hover:bg-primary-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Copy hash
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            Reset
          </button>
        </div>
      </div>
    );
  },
);

PdfIntegrityVerifier.displayName = "PdfIntegrityVerifier";
"use client";

import { useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { PdfIntegrityVerifier } from "@/components/pdf-integrity-verifier";
import { Sha256InfoPopover } from "@/components/sha256-info-popover";
import { CopyBlock } from "@/components/copy-block";
import { OsTabs, type OsTab } from "@/components/os-tabs";

const localVerifyTabs: OsTab[] = [
  { id: "mac", label: "macOS" },
  { id: "linux", label: "Linux" },
  { id: "windows", label: "Windows" },
];

const localVerifyCommands: Record<OsTab["id"], string> = {
  mac: "shasum -a 256 ATF-Security-Whitepaper-Preview.pdf",
  linux: "sha256sum ATF-Security-Whitepaper-Preview.pdf",
  windows: "Get-FileHash .\\ATF-Security-Whitepaper-Preview.pdf -Algorithm SHA256 | Format-List",
};

export function WhitepaperHashPanel({ hasSigningKey = false }: { hasSigningKey?: boolean }) {
  const [hash, setHash] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [signature, setSignature] = useState<string>("");
  const [signatureError, setSignatureError] = useState(false);
  const [isSignatureLoading, setIsSignatureLoading] = useState(false);
  const [isBrowserVerifierOpen, setIsBrowserVerifierOpen] = useState(false);
  const [activeOs, setActiveOs] = useState<OsTab["id"]>("mac");
  const browserVerifierDetailsRef = useRef<HTMLDetailsElement>(null);
  const browserFileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (!hasSigningKey) {
      setSignature("");
      setSignatureError(false);
      setIsSignatureLoading(false);
      return;
    }

    let active = true;

    async function loadSignature() {
      setIsSignatureLoading(true);
      setSignatureError(false);

      try {
        const res = await fetch("/atf/whitepaper/signature", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to load signature");
        }

        const data = (await res.json()) as { signature?: string };
        if (active) {
          const nextSignature = data.signature ?? "";
          setSignature(nextSignature);
          if (nextSignature) {
            trackEvent("whitepaper_signature_view", { location: "whitepaper_page" });
          }
        }
      } catch {
        if (active) {
          setSignature("");
          setSignatureError(true);
        }
      } finally {
        if (active) {
          setIsSignatureLoading(false);
        }
      }
    }

    loadSignature();

    return () => {
      active = false;
    };
  }, [hasSigningKey]);

  const signaturePreview = signature ? `${signature.slice(0, 16)}...${signature.slice(-16)}` : "";

  const copyHash = async () => {
    if (!hash) return;
    try {
      await navigator.clipboard.writeText(hash);
      trackEvent("whitepaper_hash_copy_click", { location: "whitepaper_page" });
    } catch {
      // No-op for clipboard failures
    }
  };

  const focusBrowserVerifier = () => {
    setIsBrowserVerifierOpen(true);
    trackEvent("whitepaper_verify_cta_click", { location: "whitepaper_hash_panel" });

    window.requestAnimationFrame(() => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      browserVerifierDetailsRef.current?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });

      window.setTimeout(
        () => {
          browserFileInputRef.current?.focus();
        },
        prefersReducedMotion ? 0 : 220,
      );
    });
  };

  return (
    <div className="glass-panel rounded-xl p-5">
      <div className="rounded-lg border border-white/10 bg-neutral-950/40 p-4">
        <p className="text-sm font-semibold text-slate-100">How to verify</p>
        <ol className="mt-2 space-y-1 text-sm text-slate-300">
          <li>1. Download the PDF</li>
          <li>2. Verify in your browser, fast</li>
          <li>3. Optional, verify locally in terminal</li>
        </ol>
        <button
          type="button"
          onClick={focusBrowserVerifier}
          className="mt-3 inline-flex items-center justify-center rounded-xl border border-primary-300/40 bg-primary-500/15 px-4 py-2 text-sm font-semibold text-primary-100 transition-colors hover:bg-primary-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
        >
          Verify the PDF I downloaded
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={copyHash}
          disabled={!hash}
          aria-label="Copy PDF SHA-256 hash"
          className="inline-flex items-center justify-center rounded-xl border border-primary-300/40 bg-primary-500/15 px-5 py-3 text-sm font-semibold text-primary-100 transition-colors hover:bg-primary-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Copy PDF SHA-256
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-200">PDF SHA-256</p>
        <Sha256InfoPopover />
      </div>
      <p className="mt-2 break-all rounded-lg border border-white/10 bg-neutral-950/60 px-3 py-2 font-mono text-xs text-slate-200">
        {isLoading ? "Loading hash..." : hash || "Hash unavailable"}
      </p>
      <p className="mt-3 text-sm text-slate-400">
        Verify you have the authentic document by matching this hash.
      </p>

      <div className="mt-4 rounded-lg border border-white/10 bg-neutral-950/40 px-4 py-3">
        <p className="text-sm font-semibold text-slate-100">Signature available</p>
        {hasSigningKey ? (
          <>
            <p className="mt-2 break-all rounded-lg border border-white/10 bg-neutral-950/60 px-3 py-2 font-mono text-xs text-slate-200">
              {isSignatureLoading
                ? "Loading signature..."
                : signaturePreview || (signatureError ? "Signature unavailable" : "Signature unavailable")}
            </p>
            <details className="mt-3 rounded-lg border border-white/10 bg-neutral-950/40 px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-100">
                Verify signature
              </summary>
              <p className="mt-3 text-sm text-slate-300">
                This signature is generated using an HMAC key to attest to the published hash.
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Compare the full signature from <span className="font-mono">/atf/whitepaper/signature</span> with your local HMAC output over the published SHA-256 value.
              </p>
            </details>
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-400">
            Signature verification is enabled in environments with a configured signing key.
          </p>
        )}
      </div>

      <details
        ref={browserVerifierDetailsRef}
        open={isBrowserVerifierOpen}
        onToggle={(event) => setIsBrowserVerifierOpen(event.currentTarget.open)}
        className="mt-4 rounded-lg border border-white/10 bg-neutral-950/40 px-4 py-3"
      >
        <summary className="cursor-pointer text-sm font-semibold text-slate-100">Verify in browser</summary>
        <PdfIntegrityVerifier ref={browserFileInputRef} expectedHash={hash} />
      </details>

      <details className="mt-3 rounded-lg border border-white/10 bg-neutral-950/40 px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-100">Verify locally</summary>
        <OsTabs tabs={localVerifyTabs} activeTab={activeOs} onChange={setActiveOs} />
        <div id={`local-verify-${activeOs}-panel`} role="tabpanel" aria-label={`${activeOs} command`}>
          <CopyBlock
            value={localVerifyCommands[activeOs]}
            copyButtonLabel="Copy command"
            helperText="Compare the printed hash to the value above."
            onCopy={() => trackEvent("whitepaper_verify_local_copy", { os: activeOs })}
          />
        </div>
      </details>
    </div>
  );
}

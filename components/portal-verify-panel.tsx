"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CopyBlock } from "@/components/copy-block";
import { trackEvent } from "@/lib/analytics";
import { buildVerifyUrl } from "@/lib/verification-kit";

type ReceiptSigningKeyPayload = {
  available: boolean;
  public_key: string | null;
};

export function PortalVerifyPanel() {
  const router = useRouter();
  const [receiptHash, setReceiptHash] = useState("");
  const [signingKey, setSigningKey] = useState<ReceiptSigningKeyPayload | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSigningKey() {
      try {
        const response = await fetch("/api/receipt-signing-key", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("failed_signing_key_request");
        }

        const payload = (await response.json()) as ReceiptSigningKeyPayload;
        if (!isMounted) {
          return;
        }

        setSigningKey(payload);
        setKeyError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setSigningKey(null);
        setKeyError("Could not load receipt signing key.");
      }
    }

    loadSigningKey();

    return () => {
      isMounted = false;
    };
  }, []);

  function openVerifyPage() {
    const trimmedHash = receiptHash.trim();
    if (!trimmedHash) {
      return;
    }

    trackEvent("portal_verify_open_click");
    router.push(buildVerifyUrl({ hash: trimmedHash, from: "portal" }));
  }

  return (
    <section className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-5">
      <h2 className="text-xl font-semibold">Verify a receipt</h2>
      <p className="text-sm text-slate-300">Paste a receipt hash and jump into the verification kit.</p>

      <div className="space-y-2">
        <label htmlFor="portal-receipt-hash" className="text-sm font-medium text-slate-200">
          receipt_hash
        </label>
        <input
          id="portal-receipt-hash"
          value={receiptHash}
          onChange={(event) => setReceiptHash(event.target.value)}
          placeholder="64-character hex hash"
          className="w-full rounded border border-white/10 bg-neutral-950/70 px-3 py-2 font-mono text-sm text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          spellCheck={false}
        />
      </div>

      <button
        type="button"
        onClick={openVerifyPage}
        disabled={!receiptHash.trim()}
        className="inline-flex items-center justify-center rounded border border-primary-300/40 bg-primary-500/10 px-3 py-2 text-sm font-medium text-primary-100 transition-colors hover:bg-primary-500/20 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
      >
        Verify
      </button>

      {keyError ? <p className="text-xs text-slate-400">{keyError}</p> : null}
      {signingKey?.available && signingKey.public_key ? (
        <CopyBlock
          label="Current signing public key (base64)"
          value={signingKey.public_key}
          copyButtonLabel="Copy public key"
          helperText="Use this key to verify Ed25519 receipt signatures locally."
        />
      ) : null}
    </section>
  );
}
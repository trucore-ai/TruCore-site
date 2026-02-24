"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyBlock } from "@/components/copy-block";
import { OsTabs, type OsTab } from "@/components/os-tabs";
import { trackEvent } from "@/lib/analytics";
import {
  buildHashRecomputeCommand,
  buildSignatureVerifyCommand,
  buildSignatureVerifyScript,
  type VerificationKitOs,
} from "@/lib/verification-kit";

type VerifyReceiptResult =
  | {
      valid_format: boolean;
      supported_version: boolean;
      version: string | null;
      format_valid?: never;
      ok?: never;
      recomputed_hash?: never;
      matches?: never;
    }
  | {
      valid_format?: never;
      ok: true;
      format_valid: boolean;
      supported_version: true;
      version: string | null;
      recomputed_hash: string;
      matches: boolean;
    }
  | {
      valid_format?: never;
      ok: true;
      format_valid: boolean;
      supported_version: false;
      version: string;
      recomputed_hash?: never;
      matches?: never;
    };

type VerifyReceiptFormProps = {
  initialHash: string;
  initialFrom?: "verify" | "receipts" | "portal";
  shouldAutofetchSignature?: boolean;
};

type ReceiptSigningKeyPayload = {
  available: boolean;
  public_key: string | null;
  alg: "Ed25519";
  encoding: "base64";
};

type ReceiptSignaturePayload = {
  ok: true;
  receipt_hash: string;
  signature: string;
  public_key: string;
  alg: "Ed25519";
};

type VerifyReceiptSignaturePayload = {
  ok: true;
  verified: boolean;
};

const OS_TABS: OsTab[] = [
  { id: "mac", label: "macOS" },
  { id: "linux", label: "Linux" },
  { id: "windows", label: "Windows" },
];

export function VerifyReceiptForm({
  initialHash,
  initialFrom = "verify",
  shouldAutofetchSignature = false,
}: VerifyReceiptFormProps) {
  const [receiptHash, setReceiptHash] = useState(initialHash);
  const [receiptJson, setReceiptJson] = useState("");
  const [result, setResult] = useState<VerifyReceiptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [signingKey, setSigningKey] = useState<ReceiptSigningKeyPayload | null>(null);
  const [signingKeyError, setSigningKeyError] = useState<string | null>(null);
  const [signaturePayload, setSignaturePayload] = useState<ReceiptSignaturePayload | null>(null);
  const [signatureStatus, setSignatureStatus] = useState<"idle" | "verified" | "invalid" | "unavailable">("idle");
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const [isFetchingSignature, setIsFetchingSignature] = useState(false);
  const [kitOs, setKitOs] = useState<VerificationKitOs>("mac");
  const [isSignatureInfoOpen, setIsSignatureInfoOpen] = useState(false);
  const hasAutofetchedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSigningKeyAvailability() {
      try {
        const response = await fetch("/api/receipt-signing-key", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("failed_key_request");
        }

        const payload = (await response.json()) as ReceiptSigningKeyPayload;
        if (!isMounted) {
          return;
        }

        setSigningKey(payload);
        setSigningKeyError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setSigningKey(null);
        setSigningKeyError("Could not load receipt signing key availability.");
      }
    }

    loadSigningKeyAvailability();

    return () => {
      isMounted = false;
    };
  }, []);

  async function verifyReceiptHash() {
    setError(null);
    setResult(null);

    const trimmedHash = receiptHash.trim();
    if (!trimmedHash) {
      setError("Receipt hash is required.");
      return;
    }

    let parsedReceipt: unknown;
    const trimmedReceiptJson = receiptJson.trim();

    if (trimmedReceiptJson) {
      try {
        parsedReceipt = JSON.parse(trimmedReceiptJson);
      } catch {
        setError("Receipt JSON must be valid JSON.");
        return;
      }
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/verify-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          receipt_hash: trimmedHash,
          ...(typeof parsedReceipt === "undefined" ? {} : { receipt: parsedReceipt }),
        }),
      });

      const payload = (await response.json()) as
        | VerifyReceiptResult
        | {
            error?: string;
          };

      if (!response.ok) {
        if (payload && typeof payload === "object" && "error" in payload && payload.error === "invalid_receipt") {
          setError("Receipt JSON must be a simulator request object or a demo receipt object with an input field.");
        } else if (payload && typeof payload === "object" && "error" in payload && payload.error === "invalid_request") {
          setError("Request must include a receipt_hash string.");
        } else {
          setError("Verification failed. Please retry.");
        }
        return;
      }

      setResult(payload as VerifyReceiptResult);
    } catch {
      setError("Unable to reach verification endpoint.");
    } finally {
      setIsLoading(false);
    }
  }

  const fetchAndVerifySignature = useCallback(async (location: "verify" | "receipts") => {
    const trimmedHash = receiptHash.trim().toLowerCase();

    if (!trimmedHash) {
      setSignatureError("Receipt hash is required before requesting a signature.");
      return;
    }

    if (!signingKey?.available) {
      setSignatureStatus("unavailable");
      setSignatureError("Signature service is not available in this environment.");
      return;
    }

    setIsFetchingSignature(true);
    setSignatureError(null);
    setSignaturePayload(null);
    setSignatureStatus("idle");
    trackEvent("verify_autofetch_signature_click", {
      location,
    });

    try {
      const signResponse = await fetch("/api/receipt-signature", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          receipt_hash: trimmedHash,
        }),
      });

      const signPayload = (await signResponse.json()) as
        | ReceiptSignaturePayload
        | {
            ok?: false;
            error?: string;
          };

      if (!signResponse.ok || !("ok" in signPayload) || !signPayload.ok) {
        if (signPayload && typeof signPayload === "object" && "error" in signPayload) {
          if (signPayload.error === "signature_unavailable") {
            setSignatureStatus("unavailable");
            setSignatureError("Signature not available in this environment.");
          } else if (signPayload.error === "invalid_receipt_hash") {
            setSignatureError("Receipt hash must be a 64-character hex string.");
          } else {
            setSignatureError("Unable to fetch signature for this hash.");
          }
        } else {
          setSignatureError("Unable to fetch signature for this hash.");
        }
        return;
      }

      setSignaturePayload(signPayload);

      const verifyResponse = await fetch("/api/verify-receipt-signature", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          receipt_hash: signPayload.receipt_hash,
          signature: signPayload.signature,
          public_key: signPayload.public_key,
        }),
      });

      const verifyPayload = (await verifyResponse.json()) as
        | VerifyReceiptSignaturePayload
        | {
            ok?: false;
            error?: string;
          };

      if (!verifyResponse.ok || !("ok" in verifyPayload) || !verifyPayload.ok) {
        setSignatureStatus("invalid");
        setSignatureError("Unable to verify signature at this time.");
        return;
      }

      setSignatureStatus(verifyPayload.verified ? "verified" : "invalid");
    } catch {
      setSignatureError("Unable to reach signature endpoints.");
      setSignatureStatus("invalid");
    } finally {
      setIsFetchingSignature(false);
    }
  }, [receiptHash, signingKey]);

  useEffect(() => {
    if (!shouldAutofetchSignature || hasAutofetchedRef.current) {
      return;
    }

    if (!signingKey?.available || !receiptHash.trim()) {
      return;
    }

    hasAutofetchedRef.current = true;
    void fetchAndVerifySignature(initialFrom === "receipts" ? "receipts" : "verify");
  }, [shouldAutofetchSignature, signingKey, receiptHash, initialFrom, fetchAndVerifySignature]);

  const trimmedHash = receiptHash.trim().toLowerCase();
  const parsedReceiptJson = useMemo(() => {
    if (!receiptJson.trim()) {
      return null;
    }

    try {
      return JSON.stringify(JSON.parse(receiptJson), null, 2);
    } catch {
      return null;
    }
  }, [receiptJson]);

  const canShowHashRecomputeKit =
    Boolean(parsedReceiptJson) &&
    Boolean(result) &&
    "supported_version" in (result ?? {}) &&
    Boolean(result?.supported_version) &&
    "recomputed_hash" in (result ?? {});

  const publicKeyForKit = signaturePayload?.public_key ?? signingKey?.public_key ?? "";
  const signatureForKit = signaturePayload?.signature ?? "";
  const signatureCommand =
    trimmedHash && publicKeyForKit && signatureForKit
      ? buildSignatureVerifyCommand(kitOs, trimmedHash, publicKeyForKit, signatureForKit)
      : "Fetch signature first to generate a ready-to-run signature verification command.";
  const signatureScript =
    trimmedHash && publicKeyForKit && signatureForKit
      ? buildSignatureVerifyScript(trimmedHash, publicKeyForKit, signatureForKit)
      : "Fetch signature first to generate a verification script.";
  const hashRecomputeCommand =
    canShowHashRecomputeKit && parsedReceiptJson
      ? buildHashRecomputeCommand(kitOs, trimmedHash, parsedReceiptJson)
      : "Add full receipt JSON and click Verify to unlock deterministic recompute command.";

  return (
    <div className="space-y-5 rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div className="rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
        <p className="text-xs uppercase tracking-[0.12em] text-slate-400">What you&apos;re verifying</p>
        <ul className="mt-2 space-y-2 text-sm text-slate-300">
          <li>
            <span className="font-semibold text-slate-100">Receipt hash (SHA-256):</span> deterministic fingerprint of
            the receipt payload.
          </li>
          <li>
            <span className="font-semibold text-slate-100">Ed25519 signature:</span> proof that the hash was signed by
            the configured TruCore receipt signing key.
          </li>
          <li>
            <span className="font-semibold text-slate-100">Deterministic recompute (optional):</span> available for
            supported demo receipt schemas only.
          </li>
        </ul>
      </div>

      <div className="space-y-2">
        <label htmlFor="receipt-hash" className="text-sm font-medium text-slate-200">
          Paste receipt_hash
        </label>
        <input
          id="receipt-hash"
          value={receiptHash}
          onChange={(event) => {
            setReceiptHash(event.target.value);
            setSignaturePayload(null);
            setSignatureStatus("idle");
            setSignatureError(null);
          }}
          placeholder="64-character hex hash"
          className="w-full rounded border border-white/10 bg-neutral-950/70 px-3 py-2 font-mono text-sm text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          spellCheck={false}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="receipt-json" className="text-sm font-medium text-slate-200">
          Optional, paste full receipt JSON
        </label>
        <textarea
          id="receipt-json"
          value={receiptJson}
          onChange={(event) => setReceiptJson(event.target.value)}
          rows={10}
          placeholder='{"id":"demo-1","input":{...},"result":{...},"created_at":"..."}'
          className="w-full resize-y rounded border border-white/10 bg-neutral-950/70 p-3 font-mono text-sm text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          spellCheck={false}
        />
      </div>

      <Button type="button" onClick={verifyReceiptHash} disabled={isLoading} className="text-base">
        {isLoading ? "Verifying..." : "Verify"}
      </Button>

      {error ? (
        <p className="text-sm text-red-300" role="status" aria-live="polite">
          {error}
        </p>
      ) : null}

      <div aria-live="polite" aria-atomic="true">
        {result ? (
          <div className="rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
            <p>
              format_valid:{" "}
              <span className="font-semibold text-slate-100">
                {"valid_format" in result ? String(result.valid_format) : String(result.format_valid)}
              </span>
            </p>

            {"supported_version" in result && !result.supported_version ? (
              <div className="mt-2 space-y-1 text-amber-200">
                <p>
                  Unsupported receipt format version: <span className="font-mono">{result.version}</span>
                </p>
                <p className="text-xs text-slate-300">
                  Next step, verify hash format and signature only for this receipt.
                </p>
              </div>
            ) : null}

            {"recomputed_hash" in result ? (
              <>
                <p className="mt-2 break-all font-mono text-xs">recomputed_hash: {result.recomputed_hash}</p>
                <p className="mt-2">
                  matches:{" "}
                  <span className={result.matches ? "font-semibold text-emerald-300" : "font-semibold text-red-300"}>
                    {result.matches ? "true (exact match)" : "false (mismatch)"}
                  </span>
                </p>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
        <div className="flex items-center gap-2">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Verify signature</p>
          <button
            type="button"
            aria-label="About signature verification"
            onClick={() => setIsSignatureInfoOpen((prev) => !prev)}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-primary-300/40 bg-primary-500/15 text-[11px] font-semibold text-primary-100 transition-colors hover:bg-primary-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            ?
          </button>
        </div>

        {isSignatureInfoOpen ? (
          <div className="mt-2 rounded border border-white/10 bg-neutral-950/80 p-3 text-xs text-slate-300">
            <ul className="space-y-1">
              <li>Only the receipt hash is sent to the signature endpoint.</li>
              <li>Signature validation can be performed here or fully in your local environment.</li>
              <li>Tampered receipts change the hash, so signature validation fails.</li>
            </ul>
          </div>
        ) : null}

        {signingKeyError ? <p className="mt-2 text-red-300">{signingKeyError}</p> : null}

        {signingKey && !signingKey.available ? (
          <p className="mt-2 text-amber-200">Signature not configured (demo mode).</p>
        ) : null}

        {signingKey?.available ? (
          <div className="mt-3 space-y-3">
            <Button
              type="button"
              onClick={() => fetchAndVerifySignature(initialFrom === "receipts" ? "receipts" : "verify")}
              disabled={isFetchingSignature}
            >
              {isFetchingSignature ? "Fetching signature..." : "Fetch signature for this hash"}
            </Button>

            <div aria-live="polite" aria-atomic="true">
              {signatureStatus === "verified" ? <p className="text-emerald-300">Signature status: Verified ✅</p> : null}
              {signatureStatus === "invalid" ? <p className="text-red-300">Signature status: Invalid ❌</p> : null}
              {signatureStatus === "unavailable" ? (
                <p className="text-amber-200">Signature status: Not configured (demo mode)</p>
              ) : null}
            </div>

            {signatureError ? <p className="text-red-300">{signatureError}</p> : null}

            {signaturePayload ? (
              <>
                <CopyBlock label="Public key (base64)" value={signaturePayload.public_key} copyButtonLabel="Copy public key" />
                <CopyBlock label="Signature (base64)" value={signaturePayload.signature} copyButtonLabel="Copy signature" />
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-sm text-slate-200">
        <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Verification Kit</p>
        <p className="mt-2 text-slate-300">
          Copy these values and commands to verify this receipt independently in your local environment.
        </p>

        <CopyBlock label="receipt_hash" value={trimmedHash || "(paste receipt hash above)"} copyButtonLabel="Copy hash" />

        {publicKeyForKit ? (
          <CopyBlock label="public_key (base64)" value={publicKeyForKit} copyButtonLabel="Copy public key" />
        ) : (
          <p className="mt-3 text-xs text-slate-400">Public key appears when signature support is configured.</p>
        )}

        {signatureForKit ? (
          <CopyBlock label="signature (base64)" value={signatureForKit} copyButtonLabel="Copy signature" />
        ) : (
          <p className="mt-2 text-xs text-slate-400">Fetch signature to include signed proof in the kit.</p>
        )}

        <OsTabs tabs={OS_TABS} activeTab={kitOs} onChange={(tabId) => setKitOs(tabId)} ariaLabel="Verification kit operating system" />

        <CopyBlock
          label="Command, verify signature"
          value={signatureCommand}
          helperText="Runs Ed25519 verification over the receipt hash bytes."
          copyButtonLabel="Copy command"
          onCopy={() =>
            trackEvent("verify_kit_copy_command_click", {
              os: kitOs,
              kind: "sig",
            })
          }
        />

        <CopyBlock
          label="Script, verify signature"
          value={signatureScript}
          copyButtonLabel="Copy verification script"
          helperText="Save as verify-receipt-signature.mjs, then run: node verify-receipt-signature.mjs"
          onCopy={() =>
            trackEvent("verify_kit_copy_command_click", {
              os: kitOs,
              kind: "sig",
            })
          }
        />

        {canShowHashRecomputeKit ? (
          <CopyBlock
            label="Command, recompute hash from receipt JSON"
            value={hashRecomputeCommand}
            helperText="Uses /api/verify-receipt to recompute deterministic demo receipt hash."
            copyButtonLabel="Copy recompute command"
            onCopy={() =>
              trackEvent("verify_kit_copy_command_click", {
                os: kitOs,
                kind: "hash",
              })
            }
          />
        ) : (
          <p className="mt-3 text-xs text-slate-400">
            Hash recompute command appears after you provide full receipt JSON and receive a supported version result.
          </p>
        )}
      </div>
    </div>
  );
}
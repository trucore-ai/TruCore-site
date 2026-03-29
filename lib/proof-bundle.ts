/**
 * Proof bundle export utilities.
 *
 * Builds a portable, machine-readable receipt proof artifact.
 * Contains only safe, user-facing fields — no wallet addresses,
 * policy internals, secrets, or backend-only metadata.
 */

import { buildOgPreviewUrl, buildVerifyUrl } from "@/lib/share-utils";

/** Version of the bundle schema. Increment only on breaking shape changes. */
export const PROOF_BUNDLE_VERSION = 1 as const;

/** Canonical manifest type identifier. */
export const PROOF_BUNDLE_TYPE = "trucore_proof_bundle" as const;

/** Safe proof fields included in every export. */
export interface ProofBundleProof {
  hash: string;
  receipt_id?: string;
  decision?: string;
  verified?: boolean;
  created_at?: string;
  exported_at: string;
  source: "trucore";
}

/** Top-level bundle manifest shape. */
export interface ProofBundleData {
  version: typeof PROOF_BUNDLE_VERSION;
  type: typeof PROOF_BUNDLE_TYPE;
  proof: ProofBundleProof;
  links: {
    verify_url: string;
    og_preview_url: string;
  };
}

/** Options for building bundle data. */
export interface BuildProofBundleDataOptions {
  decision?: string;
  verified?: boolean;
  timestamp?: string;
  receiptId?: string;
}

/**
 * Fields explicitly excluded from bundle export.
 * Documented for safety — these must never appear in exported JSON.
 */
export const EXCLUDED_BUNDLE_FIELDS = [
  "wallet_address",
  "private_key",
  "token",
  "secret",
  "amount",
  "policy_internals",
  "raw_policy",
  "backend_meta",
] as const;

/**
 * Build a safe, deterministic proof bundle manifest.
 *
 * hash must be non-empty after trimming. Only safe, user-visible
 * fields from opts are included. Sensitive fields are never written.
 */
export function buildProofBundleData(
  hash: string,
  opts: BuildProofBundleDataOptions = {},
): ProofBundleData {
  const trimmed = hash.trim();

  const proof: ProofBundleProof = {
    hash: trimmed,
    source: "trucore",
    exported_at: new Date().toISOString(),
  };

  if (opts.receiptId != null && opts.receiptId.trim()) {
    proof.receipt_id = opts.receiptId.trim();
  }
  if (opts.decision != null && opts.decision.trim()) {
    proof.decision = opts.decision.trim().toUpperCase();
  }
  if (typeof opts.verified === "boolean") {
    proof.verified = opts.verified;
  }
  if (opts.timestamp != null && opts.timestamp.trim()) {
    proof.created_at = opts.timestamp.trim();
  }

  return {
    version: PROOF_BUNDLE_VERSION,
    type: PROOF_BUNDLE_TYPE,
    proof,
    links: {
      verify_url: buildVerifyUrl(trimmed),
      og_preview_url: buildOgPreviewUrl(trimmed),
    },
  };
}

/**
 * Sanitize a raw receipt object for safe inclusion in a proof bundle.
 *
 * Only retains known-safe fields. All other fields — including wallet
 * addresses, amounts, policy internals — are silently dropped.
 */
export function sanitizeReceiptForBundle(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  receipt: Record<string, any>,
): BuildProofBundleDataOptions {
  return {
    receiptId:
      typeof receipt.receipt_id === "string" ? receipt.receipt_id : undefined,
    decision:
      typeof receipt.decision === "string" ? receipt.decision : undefined,
    verified:
      typeof receipt.verified === "boolean" ? receipt.verified : undefined,
    timestamp:
      typeof receipt.created_at === "string"
        ? receipt.created_at
        : typeof receipt.timestamp === "string"
          ? receipt.timestamp
          : undefined,
  };
}

/**
 * Generate a deterministic filename for the proof bundle JSON export.
 * Uses the first 12 alphanumeric characters of the hash as a prefix.
 */
export function getProofBundleFilename(hash: string): string {
  const trimmed = hash.trim();
  const prefix = trimmed.slice(0, 12).replace(/[^a-z0-9]/gi, "");
  return `trucore-proof-${prefix || "bundle"}.json`;
}

/**
 * Trigger a client-side JSON download of the proof bundle.
 *
 * Uses Blob + URL.createObjectURL — no external dependencies.
 * Fails silently if the environment does not support this API.
 */
export function downloadProofBundle(
  data: ProofBundleData,
  filename: string,
): void {
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    // Blob/download not supported in this environment — fail silently.
  }
}

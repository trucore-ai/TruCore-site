/**
 * Proof packet — machine-readable proof format for agents and developers.
 *
 * Optimised for programmatic consumption: flat, predictable, versioned.
 * Reuses bundle sanitisation logic — no duplicated field-exclusion rules.
 *
 * Differs from proof bundle:
 *   - Restructured meta block (exported_at + source separated from proof)
 *   - status field for quick health checks
 *   - No receipt_id in top-level proof (packet is hash-centric)
 *   - type = "trucore_proof_packet"
 */

import {
  buildProofBundleData,
  type BuildProofBundleDataOptions,
  sanitizeReceiptForBundle,
} from "@/lib/proof-bundle";

/** Version of the packet schema. Increment only on breaking shape changes. */
export const PROOF_PACKET_VERSION = 1 as const;

/** Canonical machine-readable type identifier. */
export const PROOF_PACKET_TYPE = "trucore_proof_packet" as const;

/** Proof fields in the packet — hash-centric, no receipt_id. */
export interface ProofPacketProof {
  hash: string;
  decision: "ALLOW" | "DENY" | "UNKNOWN";
  verified: boolean;
  created_at?: string;
}

/** Top-level packet shape. */
export interface ProofPacket {
  version: typeof PROOF_PACKET_VERSION;
  type: typeof PROOF_PACKET_TYPE;
  status: "success";
  proof: ProofPacketProof;
  links: {
    verify_url: string;
    og_preview_url: string;
  };
  meta: {
    exported_at: string;
    source: "trucore-site";
  };
}

/** Canonical object input for machine consumers. */
export interface BuildProofPacketInput {
  hash: string;
  decision?: string;
  verified?: boolean;
  created_at?: string;
  timestamp?: string;
  receipt_id?: string;
  receiptId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  receipt?: Record<string, any>;
}

/**
 * Build a machine-readable proof packet from a hash and optional proof opts.
 *
 * Delegates field sanitisation to buildProofBundleData so there is a single
 * source of truth for which fields are safe to surface.
 *
 * hash must be non-empty after trimming.
 */
export function buildProofPacket(data: BuildProofPacketInput): ProofPacket;
export function buildProofPacket(
  hash: string,
  opts?: BuildProofBundleDataOptions,
): ProofPacket;
export function buildProofPacket(
  dataOrHash: BuildProofPacketInput | string,
  opts: BuildProofBundleDataOptions = {},
): ProofPacket {
  const hash = typeof dataOrHash === "string" ? dataOrHash : dataOrHash.hash;

  const derivedOpts: BuildProofBundleDataOptions =
    typeof dataOrHash === "string"
      ? opts
      : (() => {
          const fromReceipt = dataOrHash.receipt
            ? sanitizeReceiptForBundle(dataOrHash.receipt)
            : {};

          const fromExplicit: BuildProofBundleDataOptions = {};
          if (typeof dataOrHash.decision === "string") {
            fromExplicit.decision = dataOrHash.decision;
          }
          if (typeof dataOrHash.verified === "boolean") {
            fromExplicit.verified = dataOrHash.verified;
          }
          const timestamp = dataOrHash.created_at ?? dataOrHash.timestamp;
          if (typeof timestamp === "string") {
            fromExplicit.timestamp = timestamp;
          }
          const receiptId = dataOrHash.receiptId ?? dataOrHash.receipt_id;
          if (typeof receiptId === "string") {
            fromExplicit.receiptId = receiptId;
          }

          return {
            ...fromReceipt,
            ...fromExplicit,
          };
        })();

  // Delegate to bundle builder — reuse sanitisation and URL construction.
  const bundle = buildProofBundleData(hash, derivedOpts);

  const decisionRaw = bundle.proof.decision?.toUpperCase() ?? "";
  const decision: ProofPacketProof["decision"] =
    decisionRaw === "ALLOW" || decisionRaw === "DENY" ? decisionRaw : "UNKNOWN";

  const proof: ProofPacketProof = {
    hash: bundle.proof.hash,
    decision,
    verified: bundle.proof.verified ?? false,
  };
  if (bundle.proof.created_at) {
    proof.created_at = bundle.proof.created_at;
  }

  return {
    version: PROOF_PACKET_VERSION,
    type: PROOF_PACKET_TYPE,
    status: "success",
    proof,
    links: {
      verify_url: bundle.links.verify_url,
      og_preview_url: bundle.links.og_preview_url,
    },
    meta: {
      exported_at: bundle.proof.exported_at,
      source: "trucore-site",
    },
  };
}

/**
 * Generate a deterministic filename for a proof packet download.
 * Uses the first 12 alphanumeric characters of the hash as a prefix.
 */
export function getProofPacketFilename(hash: string): string {
  const trimmed = hash.trim();
  const prefix = trimmed.slice(0, 12).replace(/[^a-z0-9]/gi, "");
  return `trucore-packet-${prefix || "packet"}.json`;
}

/**
 * Trigger a client-side JSON download of a proof packet.
 *
 * Uses Blob + URL.createObjectURL — no external dependencies.
 * Fails silently when the environment does not support this API.
 */
export function downloadProofPacket(
  data: ProofPacket,
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
    // Fail silently — download unsupported in current environment.
  }
}

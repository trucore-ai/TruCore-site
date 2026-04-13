import type { Metadata } from "next";
import Link from "next/link";
import { SpecCodeBlock } from "@/components/spec-code-block";
import { SpecSection } from "@/components/spec-section";
import { RECEIPT_SPEC_VERSION, SUPPORTED_RECEIPT_VERSIONS } from "@/lib/receipt-spec-constants";

const canonicalReceiptJson = `{
  "version": "v1",
  "timestamp": "ISO-8601",
  "request": {
    "action": "string",
    "token_in": "string",
    "token_out": "string",
    "amount": "number",
    "max_slippage_bps": "number",
    "ttl_seconds": "number"
  },
  "result": {
    "status": "allowed | denied",
    "reason": "string",
    "invariant_checks": ["string"],
    "receipt_hash": "hex-encoded SHA-256"
  }
}`;

const title = "Receipt Specification v1";
const description =
  "Formal RFC-style specification for deterministic ATF receipts, including version contract and receipt hash rules.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "receipt specification",
    "ATF receipt format",
    "deterministic receipts",
    "content_hash",
    "SHA-256",
    "receipt version contract",
    "RFC-style spec",
    "TruCore ATF",
  ],
  openGraph: {
    title,
    description,
    url: "https://trucore.xyz/docs/receipt-specification-v1",
    images: ["/docs/receipt-specification-v1/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/docs/receipt-specification-v1/opengraph-image"],
  },
  alternates: {
    canonical: "https://trucore.xyz/docs/receipt-specification-v1",
  },
};

export default function ReceiptSpecificationV1Page() {
  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">RFC-style Specification</p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">Receipt Specification v1</h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          This document defines the canonical ATF receipt contract for deterministic evaluation outputs and receipt
          verification workflows.
        </p>
      </header>

      <SpecSection id="status-of-this-document" title="1. Status of This Document">
        <ul className="space-y-2">
          <li>
            <span className="font-semibold text-slate-100">Version:</span> {RECEIPT_SPEC_VERSION}
          </li>
          <li>
            <span className="font-semibold text-slate-100">Stability:</span> Production-compatible
          </li>
          <li>
            <span className="font-semibold text-slate-100">Determinism guarantee:</span> Same input and policy context
            MUST produce the same decision and receipt hash.
          </li>
        </ul>
      </SpecSection>

      <SpecSection id="abstract" title="2. Abstract">
        <p>
          A receipt is a deterministic, tamper-evident record of a policy evaluation outcome for a financial action
          request.
        </p>
        <ul className="space-y-2">
          <li>This specification defines what a receipt is.</li>
          <li>This specification defines what a receipt proves.</li>
          <li>This specification defines what a receipt does not prove.</li>
        </ul>
      </SpecSection>

      <SpecSection id="receipt-model-overview" title="3. Receipt Model Overview">
        <p>The canonical JSON structure below is normative for Receipt Specification v1.</p>
        <SpecCodeBlock id="canonical-json" code={canonicalReceiptJson} copyButtonLabel="Copy JSON" />
      </SpecSection>

      <SpecSection id="deterministic-evaluation-contract" title="4. Deterministic Evaluation Contract">
        <ul className="space-y-2">
          <li>Implementations MUST produce deterministic outputs for equivalent normalized inputs.</li>
          <li>Implementations MUST NOT introduce randomness into receipt-relevant output fields.</li>
          <li>Implementations MUST NOT mutate receipt-relevant fields based on wall-clock timing.</li>
          <li>Equivalent input MUST produce equivalent decision and equivalent receipt hash.</li>
        </ul>
      </SpecSection>

      <SpecSection id="receipt-hash-definition" title="5. Receipt Hash Definition">
        <ul className="space-y-2">
          <li>The receipt hash MUST be SHA-256 over canonical serialized JSON receipt data.</li>
          <li>The receipt hash MUST be hex-encoded, 64 characters, and lowercase.</li>
          <li>
            Any mutation of canonical receipt data MUST change the receipt hash, providing tamper evidence.
          </li>
        </ul>
      </SpecSection>

      <SpecSection id="versioning-rules" title="6. Versioning Rules">
        <ul className="space-y-2">
          <li>The receipt version field is REQUIRED for explicit v1 receipts.</li>
          <li>Missing version MUST be treated as legacy v1 for backward compatibility.</li>
          <li>Unknown version MUST return supported_version=false in verification responses.</li>
          <li>Supported versions for this deployment: {SUPPORTED_RECEIPT_VERSIONS.join(", ")}.</li>
        </ul>
      </SpecSection>

      <SpecSection id="signature-layer" title="7. Signature Layer (Optional Extension)">
        <ul className="space-y-2">
          <li>Ed25519 signatures MAY be produced over the receipt hash.</li>
          <li>Signature encoding SHOULD be base64 for transport interoperability.</li>
          <li>Signatures are outside the core receipt object in this version contract.</li>
        </ul>
      </SpecSection>

      <SpecSection id="anchoring-layer" title="8. Anchoring Layer (Future Extension)">
        <ul className="space-y-2">
          <li>Receipt hash anchoring to external systems MAY be implemented as an out-of-band proof.</li>
          <li>Anchoring MUST NOT modify the core receipt structure defined in this document.</li>
        </ul>
      </SpecSection>

      <SpecSection id="security-considerations" title="9. Security Considerations">
        <ul className="space-y-2">
          <li>Deterministic hashing provides reproducible integrity checks.</li>
          <li>Receipt hashes provide tamper evidence for stored and transmitted receipt payloads.</li>
          <li>The ATF receipt system does not custody funds.</li>
          <li>The ATF receipt system does not sign transactions for execution.</li>
        </ul>
      </SpecSection>

      <SpecSection id="related-links" title="10. Related Links">
        <ul className="space-y-2">
          <li>
            <a
              href="https://github.com/trucore-ai/atf-spec/blob/main/spec/receipt.md"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              Normative Receipt Specification (atf-spec) &rarr;
            </a>
            <span className="ml-1 text-sm text-slate-400">
              JCS + SHA-256 receipt format, required fields, content_hash computation
            </span>
          </li>
          <li>
            <a
              href="https://github.com/trucore-ai/atf-spec/blob/main/spec/verification.md"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              Normative Verification Procedure (atf-spec) &rarr;
            </a>
            <span className="ml-1 text-sm text-slate-400">
              5-step deterministic verification, Mode A and Mode B
            </span>
          </li>
          <li>
            <Link
              href="/docs/integration-pattern"
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              Integration Pattern
            </Link>
          </li>
          <li>
            <Link href="/verify" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
              Verify Receipt Utility
            </Link>
          </li>
          <li>
            <Link
              href="/docs/terminology-and-endpoints"
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              Terminology &amp; Endpoint Glossary &rarr;
            </Link>
            <span className="ml-1 text-sm text-slate-400">
              Maps spec, API, CLI, and UI terms to canonical definitions
            </span>
          </li>
        </ul>
      </SpecSection>
    </article>
  );
}

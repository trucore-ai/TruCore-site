import { isSimRequest, normalizeSimRequest, simulatePolicy, type SimRequest } from "@/lib/simulator";
import { SUPPORTED_RECEIPT_VERSIONS } from "@/lib/receipt-spec-constants";

export const RECEIPT_HASH_PATTERN = /^[a-f0-9]{64}$/i;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
}

function extractSimRequest(value: unknown): SimRequest | null {
  if (isSimRequest(value)) {
    return normalizeSimRequest(value);
  }

  const record = asRecord(value);
  if (!record || !("input" in record) || !isSimRequest(record.input)) {
    return null;
  }

  return normalizeSimRequest(record.input);
}

export function isReceiptHashFormatValid(receiptHash: string): boolean {
  return RECEIPT_HASH_PATTERN.test(receiptHash);
}

export function isSupportedReceiptVersion(version?: string | null): boolean {
  if (!version) {
    return true;
  }

  return SUPPORTED_RECEIPT_VERSIONS.includes(version as (typeof SUPPORTED_RECEIPT_VERSIONS)[number]);
}

export function getReceiptVersion(receipt: unknown): string | null {
  const record = asRecord(receipt);
  if (!record || !("version" in record)) {
    return null;
  }

  return typeof record.version === "string" ? record.version : null;
}

export function recomputeDemoReceiptHash(receipt: unknown): string | null {
  const input = extractSimRequest(receipt);
  if (!input) {
    return null;
  }

  return simulatePolicy(input).receipt_hash;
}
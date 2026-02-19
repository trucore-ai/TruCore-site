import { createHash } from "node:crypto";

/**
 * Returns a hex-encoded SHA-256 hash of the input string.
 * Used to hash IP addresses so we never store raw PII.
 */
export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

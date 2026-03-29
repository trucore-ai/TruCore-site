/**
 * Distribution utilities for proof surfaces.
 *
 * Converts verified receipts into distribution units:
 * - Human-readable share text (Twitter / social)
 * - Bot-ingestible single-line output
 * - Unified distribution bundles
 *
 * "Receipts are distribution." — ATF Canon
 */

import { buildProofBundle, buildVerifyUrl } from "@/lib/share-utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default hashtags for social sharing. */
const SHARE_HASHTAGS = ["#AITrading", "#DeFi"] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ShareTextInput {
  hash: string;
  action?: string;
  status?: string;
}

export interface BotLineInput {
  hash: string;
  status?: string;
}

export interface DistributionBundle {
  shareText: string;
  botLine: string;
  verifyUrl: string;
  ogPreviewUrl: string;
}

// ---------------------------------------------------------------------------
// Share Text Generation
// ---------------------------------------------------------------------------

/**
 * Generate human-readable share text for Twitter/social.
 *
 * Rules:
 * - Must include verify URL (uses buildVerifyUrl)
 * - Must be safe for Twitter (no encoding issues)
 * - No emojis unless already used elsewhere
 * - Deterministic output
 *
 * @param input - Hash and optional metadata
 * @returns Formatted share text string
 */
export function generateShareText(input: ShareTextInput): string {
  const trimmedHash = (input.hash ?? "").trim();

  if (!trimmedHash) {
    return "";
  }

  const verifyUrl = buildVerifyUrl(trimmedHash);
  const hashtags = SHARE_HASHTAGS.join(" ");

  // Build action line if provided
  const actionLine = input.action?.trim()
    ? `Action: ${input.action.trim()}`
    : null;

  // Build status line if provided
  const statusLine = input.status?.trim()
    ? `Status: ${input.status.trim()}`
    : null;

  // Compose the share text
  const lines: string[] = [
    "Protected trade verified via TruCore ATF.",
  ];

  if (actionLine) {
    lines.push(actionLine);
  }

  if (statusLine) {
    lines.push(statusLine);
  }

  lines.push(""); // Empty line before URL
  lines.push(`Verify: ${verifyUrl}`);
  lines.push(""); // Empty line before hashtags
  lines.push(hashtags);

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Bot Line Generation
// ---------------------------------------------------------------------------

/**
 * Generate machine-readable single-line output for LLMs and bots.
 *
 * Format:
 *   ATF_PROOF hash=XYZ status=verified verify_url=https://www.trucore.xyz/verify?hash=XYZ&from=share
 *
 * Rules:
 * - One line only
 * - No spaces except separators
 * - Deterministic order of fields
 * - No JSON (designed for LLM + bot parsing)
 *
 * @param input - Hash and optional status
 * @returns Single-line bot-parseable string
 */
export function generateBotLine(input: BotLineInput): string {
  const trimmedHash = (input.hash ?? "").trim();

  if (!trimmedHash) {
    return "";
  }

  const verifyUrl = buildVerifyUrl(trimmedHash);
  const status = input.status?.trim() || "verified";

  // Build deterministic key=value pairs
  // Order: hash, status, verify_url (alphabetical-ish, stable)
  const parts: string[] = [
    "ATF_PROOF",
    `hash=${trimmedHash}`,
    `status=${status}`,
    `verify_url=${verifyUrl}`,
  ];

  return parts.join(" ");
}

// ---------------------------------------------------------------------------
// Distribution Bundle
// ---------------------------------------------------------------------------

/**
 * Generate a complete distribution bundle for a receipt hash.
 *
 * Combines:
 * - buildProofBundle(hash) for URLs
 * - generateShareText for human-readable text
 * - generateBotLine for machine-readable output
 *
 * @param hash - The receipt content hash
 * @returns Complete distribution bundle
 */
export function generateDistributionBundle(hash: string): DistributionBundle {
  const trimmedHash = (hash ?? "").trim();

  // Get URLs from existing proof bundle utility
  const { verifyUrl, ogPreviewUrl } = buildProofBundle(trimmedHash);

  // Generate share text and bot line
  const shareText = generateShareText({ hash: trimmedHash });
  const botLine = generateBotLine({ hash: trimmedHash });

  return {
    shareText,
    botLine,
    verifyUrl,
    ogPreviewUrl,
  };
}

// ---------------------------------------------------------------------------
// Validation Helpers
// ---------------------------------------------------------------------------

/**
 * Check if a hash is valid for distribution.
 * Non-empty after trimming.
 */
export function isValidDistributionHash(hash: string | null | undefined): hash is string {
  return typeof hash === "string" && hash.trim().length > 0;
}

/**
 * Sanitize hash for safe usage in distribution outputs.
 * Trims whitespace but does not modify the hash itself.
 */
export function sanitizeDistributionHash(hash: string): string {
  return (hash ?? "").trim();
}

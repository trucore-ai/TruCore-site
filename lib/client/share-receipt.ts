/**
 * Receipt Sharing - Generate shareable text and handle sharing actions
 *
 * Events:
 *   - receipt_copied
 *   - receipt_shared
 */

export type ShareEventName =
  | "receipt_copied"
  | "receipt_shared";

interface ShareEvent {
  event_name: ShareEventName;
  timestamp: string;
  platform?: "twitter" | "telegram" | "copy" | "native";
  receipt_id?: string;
}

/**
 * Fire-and-forget telemetry event posting.
 * Does not block or throw - failures are silently ignored.
 */
export function trackShareEvent(
  eventName: ShareEventName,
  details?: { platform?: "twitter" | "telegram" | "copy" | "native"; receipt_id?: string }
): void {
  const event: ShareEvent = {
    event_name: eventName,
    timestamp: new Date().toISOString(),
    ...details,
  };

  // Console log for log drain / observability
  // eslint-disable-next-line no-console
  console.log("[share-receipt-telemetry]", JSON.stringify(event));

  // Fire-and-forget POST
  if (typeof window !== "undefined") {
    fetch("/api/telemetry/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    }).catch(() => {
      // Intentionally swallow - telemetry is non-critical
    });
  }
}

export function trackReceiptCopied(platform: "copy" = "copy", receiptId?: string): void {
  trackShareEvent("receipt_copied", { platform, receipt_id: receiptId });
}

export function trackReceiptShared(
  platform: "twitter" | "telegram" | "native",
  receiptId?: string
): void {
  trackShareEvent("receipt_shared", { platform, receipt_id: receiptId });
}

// ---------------------------------------------------------------------------
// Share Text Generation
// ---------------------------------------------------------------------------

interface ReceiptData {
  receipt_id?: string;
  content_hash?: string;
  decision?: string;
  created_at?: number;
}

/**
 * Generate shareable text for a protected trade receipt.
 * Keeps messaging short, clean, and credible - no hype.
 */
export function generateShareText(receipt: ReceiptData): string {
  const verifyUrl = getVerifyUrl(receipt);

  return `Just executed a protected trade with @TruCoreAI

✔ Transaction evaluated
✔ Risk enforced
✔ Receipt verified

Verify it yourself:
${verifyUrl}`;
}

/**
 * Generate the verification URL for a receipt.
 * Uses content_hash for direct verification if available.
 * Adds from=share for telemetry tracking.
 */
export function getVerifyUrl(receipt: ReceiptData): string {
  const baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : "https://trucore.xyz";

  // Prefer content_hash for direct verification
  if (receipt.content_hash) {
    return `${baseUrl}/verify?hash=${encodeURIComponent(receipt.content_hash)}&from=share`;
  }

  // Fall back to receipt_id if no hash
  if (receipt.receipt_id) {
    return `${baseUrl}/verify?receipt_id=${encodeURIComponent(receipt.receipt_id)}&from=share`;
  }

  // Generic verify page
  return `${baseUrl}/verify`;
}

/**
 * Truncate a string (like receipt_id) for display.
 */
export function truncateId(id: string, prefixLen = 8, suffixLen = 4): string {
  if (id.length <= prefixLen + suffixLen + 3) return id;
  return `${id.slice(0, prefixLen)}...${id.slice(-suffixLen)}`;
}

// ---------------------------------------------------------------------------
// Share Actions
// ---------------------------------------------------------------------------

/**
 * Copy share text to clipboard.
 * Returns true if successful.
 */
export async function copyShareText(receipt: ReceiptData): Promise<boolean> {
  const text = generateShareText(receipt);
  try {
    await navigator.clipboard.writeText(text);
    const receiptId = receipt.receipt_id ?? receipt.content_hash;
    trackReceiptCopied("copy", receiptId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Open Twitter/X intent with share text.
 */
export function shareToTwitter(receipt: ReceiptData): void {
  const text = generateShareText(receipt);
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  const receiptId = receipt.receipt_id ?? receipt.content_hash;
  trackReceiptShared("twitter", receiptId);
  window.open(url, "_blank", "noopener,noreferrer,width=600,height=400");
}

/**
 * Open Telegram share link.
 */
export function shareToTelegram(receipt: ReceiptData): void {
  const text = generateShareText(receipt);
  const url = `https://t.me/share/url?url=${encodeURIComponent(getVerifyUrl(receipt))}&text=${encodeURIComponent(text)}`;
  const receiptId = receipt.receipt_id ?? receipt.content_hash;
  trackReceiptShared("telegram", receiptId);
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Use native Web Share API if available, otherwise fall back to copy.
 * Returns true if share or copy succeeded.
 */
export async function shareNative(receipt: ReceiptData): Promise<boolean> {
  const text = generateShareText(receipt);
  const url = getVerifyUrl(receipt);
  const receiptId = receipt.receipt_id ?? receipt.content_hash;

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: "Protected Trade Receipt",
        text,
        url,
      });
      trackReceiptShared("native", receiptId);
      return true;
    } catch (err) {
      // User cancelled or share failed - fall back to copy
      if ((err as Error)?.name === "AbortError") {
        return false;
      }
    }
  }

  // Fallback: copy to clipboard
  return copyShareText(receipt);
}

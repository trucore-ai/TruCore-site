const DEFAULT_VERIFY_BASE_URL = "https://trucore.xyz";

export function getRateLimitMetadata(headers) {
  const limit = headers.get("x-ratelimit-limit");
  const remaining = headers.get("x-ratelimit-remaining");
  const reset = headers.get("x-ratelimit-reset");
  const retryAfter = headers.get("retry-after");

  return {
    limit,
    remaining,
    reset,
    retryAfter,
    hasAny: Boolean(limit || remaining || reset || retryAfter),
  };
}

export function formatRateLimitMetadata(rateLimit) {
  if (!rateLimit?.hasAny) {
    return [];
  }

  const lines = ["Rate limits:"];

  if (rateLimit.limit && rateLimit.remaining) {
    lines.push(`- Remaining: ${rateLimit.remaining}/${rateLimit.limit}`);
  } else if (rateLimit.remaining) {
    lines.push(`- Remaining: ${rateLimit.remaining}`);
  } else if (rateLimit.limit) {
    lines.push(`- Limit: ${rateLimit.limit}`);
  }

  if (rateLimit.reset) {
    lines.push(`- Reset: epoch ${rateLimit.reset}`);
  }

  if (rateLimit.retryAfter) {
    lines.push(`- Retry-After: ${rateLimit.retryAfter}s`);
  }

  return lines;
}

export function parseErrorPayload(value) {
  if (!value) {
    return { code: undefined, message: undefined, raw: undefined };
  }

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object") {
      const code = typeof parsed.code === "string" ? parsed.code : typeof parsed.error === "string" ? parsed.error : undefined;
      const message = typeof parsed.message === "string" ? parsed.message : undefined;
      return { code, message, raw: undefined };
    }
  } catch {
    // Non-JSON body.
  }

  return { code: undefined, message: undefined, raw: value };
}

export function resolveVerificationBaseUrl(baseUrl) {
  try {
    const parsed = new URL(baseUrl);
    const isLocalhost =
      parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "0.0.0.0";

    if (isLocalhost) {
      return `${parsed.protocol}//${parsed.host}`;
    }
  } catch {
    // Ignore malformed URL and use default.
  }

  return DEFAULT_VERIFY_BASE_URL;
}

export function buildVerificationUrl(baseUrl, receiptHash) {
  if (!receiptHash || typeof receiptHash !== "string") {
    return undefined;
  }

  return `${baseUrl}/verify?hash=${encodeURIComponent(receiptHash)}`;
}

export function formatPrettyResponse(body, options = {}) {
  const status = body?.result?.status === "denied" ? "denied" : "allowed";
  const reason = body?.result?.reason ?? "n/a";
  const receiptHash = body?.result?.receipt_hash ?? "n/a";
  const checks = Array.isArray(body?.result?.invariant_checks) ? body.result.invariant_checks : [];

  const lines = [
    `Status: ${status}`,
    `Reason: ${reason}`,
    `Receipt hash: ${receiptHash}`,
    "Invariant checks:",
  ];

  if (checks.length === 0) {
    lines.push("- n/a");
  } else {
    for (const check of checks) {
      lines.push(`- ${check}`);
    }
  }

  if (options.verificationUrl) {
    lines.push(`Verification URL: ${options.verificationUrl}`);
  }

  for (const rateLine of formatRateLimitMetadata(options.rateLimit)) {
    lines.push(rateLine);
  }

  return lines.join("\n");
}

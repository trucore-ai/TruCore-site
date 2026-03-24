/**
 * Centralized auth/account error normalization.
 *
 * The ATF backend returns structured error responses:
 *
 *   { "error": { "code": "...", "message": "..." } }           — for rate limits (429)
 *   { "detail": { "error": { "code": "...", "message": "..." } } } — for HTTPException errors
 *
 * This module provides helpers to:
 * - Parse any API error response into a normalized shape
 * - Map machine-readable codes to user-facing copy
 * - Classify errors for UI branching
 */

// ---------------------------------------------------------------------------
// Error codes (mirrors firewall_api/error_codes.py)
// ---------------------------------------------------------------------------

export const AuthErrorCode = {
  INVALID_CREDENTIALS: "invalid_credentials",
  EMAIL_NOT_VERIFIED: "email_not_verified",
  VERIFICATION_TOKEN_INVALID: "verification_token_invalid",
  VERIFICATION_TOKEN_EXPIRED: "verification_token_expired",
  RESET_TOKEN_INVALID: "reset_token_invalid",
  RESET_TOKEN_EXPIRED: "reset_token_expired",
  RATE_LIMIT_EXCEEDED: "rate_limit_exceeded",
  DISPOSABLE_EMAIL_BLOCKED: "disposable_email_blocked",
  EMAIL_ALREADY_EXISTS: "email_already_exists",
  KEY_LIMIT_REACHED: "key_limit_reached",
  FORBIDDEN: "forbidden",
  UNAUTHORIZED: "unauthorized",
  INVALID_REQUEST: "invalid_request",
  ONBOARDING_EXECUTION_UNAVAILABLE: "onboarding_execution_unavailable",
} as const;

export type AuthErrorCodeValue =
  (typeof AuthErrorCode)[keyof typeof AuthErrorCode];

// ---------------------------------------------------------------------------
// Parsed error shape
// ---------------------------------------------------------------------------

export interface ParsedApiError {
  code: AuthErrorCodeValue | string;
  message: string;
  retryAfterSeconds?: number;
}

// ---------------------------------------------------------------------------
// Default user-facing copy per error code
// ---------------------------------------------------------------------------

const USER_FACING_MESSAGES: Record<string, string> = {
  [AuthErrorCode.INVALID_CREDENTIALS]: "Invalid email or password.",
  [AuthErrorCode.EMAIL_NOT_VERIFIED]:
    "Please verify your email to continue.",
  [AuthErrorCode.VERIFICATION_TOKEN_INVALID]:
    "This verification link is invalid or has already been used.",
  [AuthErrorCode.VERIFICATION_TOKEN_EXPIRED]:
    "This verification link has expired. Please request a new one.",
  [AuthErrorCode.RESET_TOKEN_INVALID]:
    "This reset link is invalid or has already been used.",
  [AuthErrorCode.RESET_TOKEN_EXPIRED]:
    "That reset link has expired. Request a new one.",
  [AuthErrorCode.RATE_LIMIT_EXCEEDED]:
    "Too many attempts. Please try again shortly.",
  [AuthErrorCode.DISPOSABLE_EMAIL_BLOCKED]:
    "Disposable email addresses are not allowed. Please use a permanent email.",
  [AuthErrorCode.EMAIL_ALREADY_EXISTS]:
    "An account with this email already exists.",
  [AuthErrorCode.KEY_LIMIT_REACHED]:
    "You've reached the maximum number of API keys.",
  [AuthErrorCode.UNAUTHORIZED]: "Please sign in to continue.",
  [AuthErrorCode.FORBIDDEN]: "You don't have permission to do that.",
  [AuthErrorCode.ONBOARDING_EXECUTION_UNAVAILABLE]:
    "Onboarding execution is temporarily unavailable.",
};

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

/**
 * Extract a structured error from any API error response body.
 *
 * Handles these backend shapes:
 *   1. `{ "error": { "code": ..., "message": ... } }`  — rate limit / auth_error_response
 *   2. `{ "detail": { "error": { "code": ..., "message": ... } } }` — HTTPException
 *   3. `{ "detail": "<string>" }` — legacy plain-text detail
 *   4. `{ "detail": { "error": "<string>", "message": "<string>" } }` — older shape
 */
export function parseApiError(
  body: Record<string, unknown>,
): ParsedApiError {
  // Shape 1: top-level error object (rate limits)
  const topError = body?.error as Record<string, unknown> | undefined;
  if (topError && typeof topError === "object" && typeof topError.code === "string") {
    return {
      code: topError.code,
      message: (topError.message as string) || "",
      retryAfterSeconds:
        typeof topError.retry_after_seconds === "number"
          ? topError.retry_after_seconds
          : undefined,
    };
  }

  // Shape 2 & 4: nested in detail
  const detail = body?.detail as Record<string, unknown> | string | undefined;
  if (detail && typeof detail === "object") {
    const nestedErr = (detail as Record<string, unknown>).error as
      | Record<string, unknown>
      | string
      | undefined;
    if (nestedErr && typeof nestedErr === "object" && typeof nestedErr.code === "string") {
      return {
        code: nestedErr.code,
        message: (nestedErr.message as string) || "",
        retryAfterSeconds:
          typeof nestedErr.retry_after_seconds === "number"
            ? nestedErr.retry_after_seconds
            : undefined,
      };
    }
    // Old shape: detail.error is a string code
    if (typeof nestedErr === "string") {
      return {
        code: nestedErr,
        message:
          typeof (detail as Record<string, unknown>).message === "string"
            ? ((detail as Record<string, unknown>).message as string)
            : nestedErr,
      };
    }
  }

  // Shape 3: detail is a plain string
  if (typeof detail === "string") {
    return { code: "", message: detail };
  }

  return { code: "", message: "" };
}

/**
 * Get user-facing message for a given error code.
 * Falls back to the provided fallback or a generic message.
 */
export function getUserFacingMessage(
  code: string,
  fallbackMessage?: string,
): string {
  return (
    USER_FACING_MESSAGES[code] || fallbackMessage || "Something went wrong."
  );
}

/**
 * Classify an error code into a UI-actionable category.
 */
export function classifyAuthError(code: string): "auth" | "verification" | "rate_limit" | "validation" | "unknown" {
  switch (code) {
    case AuthErrorCode.INVALID_CREDENTIALS:
    case AuthErrorCode.UNAUTHORIZED:
    case AuthErrorCode.FORBIDDEN:
      return "auth";
    case AuthErrorCode.EMAIL_NOT_VERIFIED:
    case AuthErrorCode.VERIFICATION_TOKEN_INVALID:
    case AuthErrorCode.VERIFICATION_TOKEN_EXPIRED:
    case AuthErrorCode.RESET_TOKEN_INVALID:
    case AuthErrorCode.RESET_TOKEN_EXPIRED:
      return "verification";
    case AuthErrorCode.RATE_LIMIT_EXCEEDED:
      return "rate_limit";
    case AuthErrorCode.DISPOSABLE_EMAIL_BLOCKED:
    case AuthErrorCode.EMAIL_ALREADY_EXISTS:
    case AuthErrorCode.KEY_LIMIT_REACHED:
    case AuthErrorCode.INVALID_REQUEST:
      return "validation";
    default:
      return "unknown";
  }
}

/**
 * IP-based login throttle for admin auth.
 *
 * Tracks consecutive failed login attempts per IP fingerprint.
 * After `MAX_FAILURES` failures within `FAILURE_WINDOW_MS`,
 * the IP is locked out for `COOLDOWN_MS`.
 *
 * In-memory — resets on cold start. This is an abuse guard,
 * not a hard security boundary.
 */

import { sha256 } from "./hash";

/** Max failed attempts before cooldown kicks in. */
const MAX_FAILURES = 5;

/** Window in which failures are counted (10 minutes). */
const FAILURE_WINDOW_MS = 10 * 60 * 1000;

/** Cooldown duration after exceeding max failures (15 minutes). */
const COOLDOWN_MS = 15 * 60 * 1000;

interface LoginRecord {
  /** Timestamps (ms) of recent failed attempts. */
  failures: number[];
  /** If set, the IP is locked until this epoch (ms). */
  lockedUntil: number | null;
}

const store = new Map<string, LoginRecord>();

/**
 * Test-only time offset (ms) added to Date.now().
 * Always 0 in production — only mutated by _advanceTime / _resetThrottleStore.
 */
let _timeOffset = 0;

/** Internal clock — uses real time + test offset. */
function _now(): number {
  return Date.now() + _timeOffset;
}

/** Derive a stable key from a raw IP. */
function ipKey(rawIp: string | undefined): string {
  if (!rawIp || rawIp === "unknown") return "unknown";
  return sha256(rawIp).slice(0, 16);
}

/** Exposed for tests only — clear all throttle state and reset clock offset. */
export function _resetThrottleStore(): void {
  store.clear();
  _timeOffset = 0;
}

/**
 * Advance the internal test clock by `ms` milliseconds.
 * Only meaningful in test — production never calls this.
 */
export function _advanceTime(ms: number): void {
  _timeOffset += ms;
}

/** Return the current test clock offset (ms). Exposed for diagnostics. */
export function _getTimeOffset(): number {
  return _timeOffset;
}

/**
 * Check whether the given IP is currently in cooldown.
 * Returns the number of seconds remaining if locked, or 0 if allowed.
 */
export function checkLoginThrottle(rawIp: string | undefined): number {
  const key = ipKey(rawIp);
  const record = store.get(key);
  if (!record) return 0;

  const now = _now();

  if (record.lockedUntil && now < record.lockedUntil) {
    return Math.ceil((record.lockedUntil - now) / 1000);
  }

  // Cooldown expired — clear the lock
  if (record.lockedUntil && now >= record.lockedUntil) {
    store.delete(key);
    return 0;
  }

  return 0;
}

/**
 * Record a failed login attempt for the given IP.
 * Returns the cooldown seconds if the IP just became locked, or 0.
 */
export function recordLoginFailure(rawIp: string | undefined): number {
  const key = ipKey(rawIp);
  const now = _now();
  let record = store.get(key);

  if (!record) {
    record = { failures: [], lockedUntil: null };
    store.set(key, record);
  }

  // If already locked, don't extend — just return remaining time
  if (record.lockedUntil && now < record.lockedUntil) {
    return Math.ceil((record.lockedUntil - now) / 1000);
  }

  // Prune old failures outside the window
  record.failures = record.failures.filter(
    (ts) => now - ts < FAILURE_WINDOW_MS,
  );

  record.failures.push(now);

  if (record.failures.length >= MAX_FAILURES) {
    record.lockedUntil = now + COOLDOWN_MS;
    record.failures = [];
    return Math.ceil(COOLDOWN_MS / 1000);
  }

  return 0;
}

/**
 * Clear failure tracking on successful login.
 */
export function clearLoginFailures(rawIp: string | undefined): void {
  const key = ipKey(rawIp);
  store.delete(key);
}

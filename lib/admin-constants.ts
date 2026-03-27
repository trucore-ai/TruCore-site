/**
 * Shared admin constants — safe to import from request boundary (proxy / formerly middleware).
 *
 * This module intentionally imports NOTHING from Node.js so it can be
 * used in both the Node.js server runtime and the proxy runtime.
 */

export const ADMIN_COOKIE_NAME = "admin_session";

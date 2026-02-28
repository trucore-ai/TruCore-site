# Environment Variable Inventory

All variables are configured in **Vercel Project Settings -> Environment Variables** unless noted otherwise.

| Variable | Required | Where set | Affects | Safe default |
| --- | --- | --- | --- | --- |
| `POSTGRES_URL` | Required in Preview + Production | Vercel (Neon integration or manual) | Waitlist storage, admin CRM data, audit log, CSP reports, status-backed reads | None, application features that depend on DB will fail without this |
| `RESEND_API_KEY` | Required in Preview + Production for email delivery | Vercel (manual) | Waitlist confirmation emails and admin notifications | None, email sending is skipped when missing |
| `WAITLIST_FROM` | Optional | Vercel (manual) | From-address used by outbound waitlist/admin emails | `TruCore <info@trucore.xyz>` fallback in code |
| `ADMIN_DASHBOARD_KEY` | Required in Preview + Production | Vercel (manual, secret) | Admin login authentication for `/admin/*` routes | No production default. Tests use local fallback only |
| `DESIGN_PARTNER_SCHEDULING_URL` | Optional | Vercel (manual) | Scheduling CTA in design partner success state and email copy | Empty string, scheduling CTA is hidden |
| `WAITLIST_NOTIFY_TO` | Recommended | Vercel (manual) | Internal recipient for waitlist/admin notifications | No hard fallback, use `info@trucore.xyz` operationally |
| `PARTNER_PORTAL_SESSION_SECRET` | Recommended in Preview + Production | Vercel (manual, secret) | Signature secret for `partner_portal_session` cookie on `/portal/*` | Falls back to `ADMIN_DASHBOARD_KEY` if unset |
| `RECEIPT_SIGNING_KEY` | **Launch Required in Production** | Vercel (manual, secret) | Enables receipt signature generation and public key availability endpoints | None, signature surfaces remain unavailable when missing or invalid |
| `WHITEPAPER_SIGNING_KEY` | **Launch Required in Production** | Vercel (manual, secret) | Enables signed integrity proof at `/atf/whitepaper/signature` | None in production. Development uses local fallback key |
| `NEXT_PUBLIC_ATF_CLI_VERSION` | **Launch Required in Production** | Vercel (manual, public) | Pinned ATF CLI version shown on quickstart surfaces and `/status` metadata | `0.1.0` fallback for local development |
| `NEXT_PUBLIC_DISCORD_INVITE_URL` | Optional | Vercel (manual, public) | Discord invite link shown in site footer | `https://discord.gg/hZWTn6Vr` fallback when missing |
| `VERCEL_GIT_COMMIT_SHA` | Optional runtime metadata | Injected by Vercel | Release metadata display on `/status` | Not shown when unavailable |
| `VERCEL_ENV` | Optional runtime metadata | Injected by Vercel | Environment label on `/status` (`production`, `preview`, `development`) | `unknown` label when unavailable |

## Launch-required signing key formats

- `RECEIPT_SIGNING_KEY` supports base64-encoded Ed25519 material in either format:
  - 32-byte seed (recommended)
  - 64-byte secret value, where the first 32 bytes are used as seed
- `WHITEPAPER_SIGNING_KEY` is an HMAC signing secret string used for whitepaper integrity signatures.
- Both signing keys must be configured in Vercel Production before launch and followed by redeploy.

## Environment Scope Guidance

- **Production**: All required vars must be set.
- **Preview**: Keep production-parity values where safe, especially DB and email test domain settings.
- **Development**: Use `.env.local` for local testing, never commit secrets.

## CLI Version Pinning Policy

- `NEXT_PUBLIC_ATF_CLI_VERSION` controls the pinned one-liner on public quickstart surfaces.
- Bump this value only after publishing a new `@trucore/atf` tag.
- Keep the site pinned to the current value until you intentionally advance launch behavior.

## Secret Handling Notes

- Treat `ADMIN_DASHBOARD_KEY` and `RESEND_API_KEY` as credentials.
- Rotate secrets immediately if exposed in logs, screenshots, or chat.
- Record rotation timestamp and owner in internal ops notes.

## Stage 56 Operational Notes

- Partner sandbox key issuance is performed from `/admin/waitlist` and `/api/keys/issue-for-partner`.
- Raw API keys are one-time reveal values and must not be copied into tickets, chat logs, or email.
- Key ownership metadata (`owner_email`, `owner_project`, `label`) is visible only in admin pages.
- `/api/simulate` now exposes rate-limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`) for partner troubleshooting.

## Stage 57 Operational Notes

- Partner portal access links are created and revoked from admin actions backed by `/api/portal/token/create` and `/api/portal/token/revoke`.
- Portal access tokens are one-time reveal values, store or transmit only through approved secure channels.
- Database stores only token hash (`partner_portal_tokens.token_hash`), never raw token values.
- Token default TTL is 7 days, rotate by issuing a new link when needed.
- `/portal/*` is noindex/nofollow and no-store, suitable for private partner troubleshooting views.

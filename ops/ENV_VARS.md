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
| `VERCEL_GIT_COMMIT_SHA` | Optional runtime metadata | Injected by Vercel | Release metadata display on `/status` | Not shown when unavailable |
| `VERCEL_ENV` | Optional runtime metadata | Injected by Vercel | Environment label on `/status` (`production`, `preview`, `development`) | `unknown` label when unavailable |

## Environment Scope Guidance

- **Production**: All required vars must be set.
- **Preview**: Keep production-parity values where safe, especially DB and email test domain settings.
- **Development**: Use `.env.local` for local testing, never commit secrets.

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

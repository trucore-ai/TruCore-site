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

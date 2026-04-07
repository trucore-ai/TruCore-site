# Admin Monetization Branch Triage

**Date:** 2026-04-07
**Stale branch:** `feat/admin-monetization-ui`
**Replacement branch:** `feat/admin-monetization-ui-v2`
**Base:** `main` @ `c1f6885`

## Original Branch Purpose

The `feat/admin-monetization-ui` branch added:

1. An admin monetization settings page (`/admin/monetization`) for operators to configure pricing toggles, quota enforcement, and launch mode.
2. API routes for reading, updating, and resetting monetization settings.
3. Client-side feature-flag gating on the customer dashboard to conditionally show/hide upgrade CTAs and pricing links based on operator monetization settings.
4. Layout-level pricing nav link gating using the `PricingNavLink` server component.

## What Was Safely Preserved

All admin-scoped monetization functionality was ported to `feat/admin-monetization-ui-v2`:

- `app/admin/monetization/page.tsx` -- admin settings page
- `app/api/admin/monetization/route.ts` -- GET/POST admin API
- `app/api/admin/monetization/reset/route.ts` -- POST reset API
- `components/admin-monetization-form.tsx` -- admin form component
- `lib/dashboard-client.ts` -- monetization schema, fetch/update/reset helpers (appended)
- `tests/admin-monetization-routes.test.ts` -- 9 route tests
- `tests/dashboard-client.test.ts` -- 5 schema contract tests (appended)

## What Was Intentionally Not Carried Forward

### 1. Customer dashboard feature-flag fetch (`app/customer/dashboard/page.tsx`)

**Removed.** The stale branch added a client-side `fetch()` to `/admin/monetization` inside the customer dashboard's `useEffect`. This introduced a runtime dependency on an admin endpoint from a customer-facing page. The `/admin/monetization` route may require admin authentication, making the fetch unreliable or broken for unauthenticated customer sessions. Defaults-to-visible graceful degradation masked this issue in testing but would not correctly reflect operator intent in production.

**Risk:** Admin endpoint dependency in customer runtime; stale assumptions about endpoint auth behavior.

### 2. Customer dashboard CTA and link gating

**Removed.** The stale branch gated "Upgrade to Pro" buttons and "View plans" links using feature flags fetched from the admin endpoint above. Because the fetch itself was unreliable for customer sessions, the gating behavior was also unreliable. The `UsageMeter` component's `pricingEnabled` prop and all conditional rendering tied to `featureFlags` state were reverted.

**Risk:** Conditional UI behavior dependent on an unreliable data source.

### 3. Layout pricing nav link swap (`app/layout.tsx`)

**Removed.** The stale branch replaced static `<Link href="/pricing">` elements in the root layout with `<PricingNavLink>`, a conditional server component that hides the link when `pricing_page_enabled` is false. While `PricingNavLink` exists in current main and is a canonical abstraction, wiring it into the root layout is a public-facing navigation behavior change that affects every page. This exceeds the admin-scoped intent of the salvage and was deferred.

**Risk:** Public navigation behavior change; scope exceeds admin-only intent.

## Future Clean Work Needed

To revisit the deferred customer-facing monetization gating safely:

1. **Public feature-flags endpoint.** Create a dedicated public `/api/flags` or `/plans/feature-flags` endpoint that does not require admin auth. The customer dashboard should never call `/admin/monetization` directly.
2. **Server-side flag resolution for customer dashboard.** Prefer server-side feature flag resolution (like `PricingNavLink` does via `getFeatureFlags()`) over client-side fetch in the customer dashboard.
3. **Scoped layout change.** Wire `PricingNavLink` into `app/layout.tsx` as a separate, focused PR after the admin monetization infrastructure is merged and validated in staging.
4. **Integration tests.** Add e2e or integration tests for flag-gated rendering before shipping conditional customer-facing behavior.

## Stale Branch Retirement

The `feat/admin-monetization-ui` branch should be deleted only after `feat/admin-monetization-ui-v2` is merged into `main` and validated in staging.

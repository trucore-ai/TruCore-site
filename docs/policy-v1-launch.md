# Policy System — Premium v1 Launch Package

> **Status:** Launch-ready  
> **Date:** 2026-04-16  
> **Scope:** `/customer/policies` (TruCore-site)  
> **Author:** Engineering / Copilot-assisted

---

## 1. Premium v1 Scope Statement

### What is included

| Area | Detail |
|---|---|
| **Editable policy controls** | `max_slippage_bps`, `max_notional_usd`, `max_value_sol`, `require_simulation_success`, `allowed_programs`, `denied_programs`, token policy (open / denylist / allowlist) |
| **Policy presets** | Conservative, Balanced, Aggressive — frontend-only guided defaults |
| **Plain-English guidance** | Per-field hint + range guidance rendered inline |
| **Effective policy preview** | Computed view of the full effective policy (base + overrides) with field-level source labeling |
| **Policy simulation preview** | Scenario-based simulation outcomes (deny / allow / conditional) rendered in the UI |
| **Risk profile** | Computed `low / medium / high / very_high` profile with rationale, rendered on save |
| **Multi-source recommendations** | Six recommendation sources: Customer history, Market analysis, Policy Intelligence (PIL), Cohort benchmark, External context, Base policy (free tier fallback) |
| **Recommendation prioritization** | `high / medium / low` priority model with card emphasis styling and sort order |
| **Source freshness badges** | Signal freshness indicator per recommendation source (`fresh / stale / unavailable`) |
| **Expandable recommendation detail** | Per-recommendation expandable section with evidence framing and source attribution |
| **"New" recommendation badges** | localStorage snapshot tracks prior rec IDs; newly-appearing recs get a green "New" badge |
| **Plan gating + upgrade teaser** | Gated sources (PIL, Cohort benchmark at Advanced/Enterprise; Customer history, Market analysis at Pro) show upgrade teaser with CTA; mix-aware lead text and ranked source display |
| **Safe apply + undo** | One-click apply for `require_simulation_success` and `max_slippage_bps`; per-field undo to prior value; analytics events on apply/undo |
| **Trend surface** | 7-day vs 30-day receipt window comparison; deny-rate, simulation-failure, trade-size cues with status dots; hidden when data is sparse |
| **Market condition cue** | Single market condition informational cue from `MarketConditions` API |
| **Analytics tracking** | Impression, expand, collapse, view-setting, apply, undo, teaser-view, teaser-click, signal-refresh events via `policy-recommendation-analytics` |
| **Admin analytics & ops** | Admin policy analytics summary, daily snapshot, snapshot diff, store — all with tests |

### What is intentionally excluded / deferred

| Deferred Item | Rationale |
|---|---|
| PIL / ML-backed numeric recommendations with field-level diffs | PIL confidence and priority maps exist; actual model-driven numeric values are a backend maturation item |
| Cohort benchmark absolute numeric values | Backend aggregation pipeline not yet shipping benchmark field values; teaser shows gated state correctly |
| Policy version history / audit trail in customer UI | Backend audit log exists; customer-facing history view is post-v1 |
| Bulk preset import / export | Low demand for v1; manageable via presets |
| Push notifications for policy drift | Requires notification infrastructure; deferred |
| Email digest of recommendation changes | Same dependency; deferred |
| Policy diff comparison view (before / after) | Would be valuable post-v1; simulation preview covers the key need for now |
| Shared test fixture extraction | The 3-file jsdom split shares a ~237-line boilerplate header; extraction to a shared helper is a post-v1 housekeeping item |

### Special monitoring post-launch

- Apply / undo error rate per recommendation class
- Upgrade teaser click-through rate (teaser-click analytics events)
- Recommendation impression → apply conversion rate
- Snapshot `loadRecSnapshot` / `saveRecSnapshot` localStorage errors (graceful no-op, but worth monitoring)
- Trend surface visibility rate (sparse data → hidden; may need data-seeding for new accounts)
- PIL `gated_count` non-zero events (signals backend is returning PIL data for gating UI to display)

---

## 2. Launch Checklist

### 2a. Build & Test

- [ ] `npm run build` passes with 0 TypeScript errors, 0 warnings-as-errors
- [ ] Build produces ≥ 213 pages (policy page included)
- [ ] `npx vitest run tests/customer-policy-overrides.test.tsx` — **48/48 pass**
- [ ] `npx vitest run tests/customer-policy-recommendations.test.tsx` — **80/80 pass**
- [ ] `npx vitest run tests/customer-policy-advanced.test.tsx` — **38/38 pass**
- [ ] `npx vitest run tests/customer-policy-trend-surface.test.tsx` — **18/18 pass**
- [ ] `npx vitest run tests/customer-policy-recommendation-apply.test.ts` — **66/66 pass**
- [ ] Policy admin tests pass: `policy-analytics-daily-snapshot`, `policy-analytics-snapshot`, `policy-analytics-store`, `policy-recommendation-analytics`, `ops-policy-analytics-summary`, `admin-policy-analytics-page`, `policy-analytics-snapshot-diff`
- [ ] `npx vitest run tests/` — full suite green (≥ 250 policy tests)

### 2b. Policy Page Core Flows

- [ ] Unauthenticated visit to `/customer/policies` redirects to login
- [ ] Authenticated visit loads policy fields populated from API
- [ ] Each editable field (`max_slippage_bps`, `max_notional_usd`, `max_value_sol`, `require_simulation_success`, `allowed_programs`, `denied_programs`) renders correctly
- [ ] Token policy mode selector (Open / Block Selected / Allow Selected Only) renders and persists selection
- [ ] Preset selector (Conservative / Balanced / Aggressive) populates fields correctly
- [ ] `Custom` preset indicator appears when fields diverge from any named preset
- [ ] Save override posts to API and reflects updated effective policy
- [ ] Risk profile recalculates and displays after save
- [ ] Plain-English guidance renders below each field

### 2c. Plan Gating Verification

- [ ] **Free tier**: only Base policy recommendations visible; teaser shown for Customer history + Market analysis (Pro) and PIL + Cohort benchmark (Advanced/Enterprise)
- [ ] **Pro tier**: Customer history and Market analysis recommendations visible; PIL and Cohort benchmark still teaser-only
- [ ] **Advanced/Enterprise tier**: all six recommendation sources visible; no upgrade teaser shown
- [ ] Teaser CTA label matches the dominant gated source's tier requirement
- [ ] Teaser lead text correctly reflects the number and type of gated sources
- [ ] Teaser renders `trackUpgradeTeaserView` and `trackUpgradeTeaserClick` analytics events

### 2d. Recommendation Rendering Sanity

- [ ] Recommendations render with correct priority badge (high / medium / low) and card border styling
- [ ] High-priority recommendations appear at top of list
- [ ] Source label and freshness badge render correctly per recommendation
- [ ] Expandable detail section opens and closes; `trackRecommendationExpand` / `trackRecommendationCollapse` fire
- [ ] "New" badge appears on first page load for recs not in prior localStorage snapshot
- [ ] "New" badge does not appear on repeat load for the same recommendation set
- [ ] Signal refresh button triggers `trackSignalRefreshClick` and `trackSignalRefreshComplete`

### 2e. Apply / Undo Sanity

- [ ] Apply button visible only for `require_simulation_success` and `max_slippage_bps` recommendation classes
- [ ] Apply click calls API, shows success state, fires `trackRecommendationApplySuccess`
- [ ] Apply failure shows error state, fires `trackRecommendationApplyError`
- [ ] Undo button appears after successful apply
- [ ] Undo click restores prior value, fires `trackRecommendationUndoSuccess`
- [ ] Undo button tooltip describes what will be restored (field-specific text)

### 2f. Trend Surface Sanity

- [ ] "Recent Policy Signals" section is hidden when receipt data is sparse (< 3 receipts in 7d window or < 5 in 30d window)
- [ ] When data is sufficient: deny-rate, simulation-failure, and trade-size cues render with status dots
- [ ] Status dot colors match `TREND_STATUS_DOT` (emerald/red/amber/slate)
- [ ] Market condition cue renders from API response when present
- [ ] Section absent on first visit with no receipt history (new account)

### 2g. Analytics Sanity

- [ ] Recommendation impression events fire on scroll-into-view (not on hidden/gated recs)
- [ ] Apply / undo events carry correct `mutationKey` and value fields
- [ ] Teaser events carry `dominantSource` and `tier` fields
- [ ] No analytics events fire for gated (teaser) recommendations

### 2h. Admin Analytics / Snapshot Sanity

- [ ] Admin policy analytics summary page loads and renders for admin-role session
- [ ] Daily snapshot endpoint returns valid data structure
- [ ] Snapshot diff endpoint correctly identifies changed recommendations between snapshots

### 2i. Copy / UX Final Signoff

- [ ] Field labels, hints, and guidance copy reviewed by product
- [ ] Recommendation `why` text reviewed for all six sources
- [ ] Upgrade teaser CTA copy reviewed for all tier variants
- [ ] Risk profile narrative text reviewed
- [ ] "New" badge accessible label verified
- [ ] Freshness badge labels verified (`Fresh`, `Stale`, `Unavailable`)

### 2j. Env / Config Prerequisites

- [ ] `NEXT_PUBLIC_*` feature flags for plan gating are set correctly in Vercel env for production
- [ ] All policy-related API routes (`fetchPolicy`, `updatePolicyOverrides`, `fetchReceiptSummary`, `fetchMarketConditions`, `fetchPilRecommendations`, `fetchCohortBenchmarks`, `fetchExternalContext`) are reachable in production
- [ ] PIL and Cohort benchmark endpoints return `gated: true` with `gated_count > 0` for ineligible tiers (not 404 or error)
- [ ] localStorage not blocked by browser policy in target environments

---

## 3. Rollout Plan

### Stage 1 — Internal Verification (Day 0–1)

**Who:** Core engineering + product  
**Traffic:** Zero external users

**Actions:**
- Deploy to staging/preview environment
- Run full test suite against staging build
- Walk through the full policy checklist above manually (2b–2j) on a staging account with at least one free, one pro, and one advanced session

**Validate:**
- All checklist items pass
- No console errors in production build (no `use client` leakage, no missing env vars)
- Analytics events appear in the analytics sink for apply, undo, teaser-click, signal-refresh

**Exit criteria:** All checklist items pass, no P0 issues found.

#### Day 0 Launch Runbook

Ordered steps for the engineer executing the production enable.

**Pre-enable (T−30 min)**

1. Confirm the latest Vercel deployment is live and the build passed (check Vercel deployment dashboard — zero TS errors, ≥ 213 pages).
2. Verify all required env vars are set in the Vercel production environment:
   *(Values are in Vercel dashboard → Project → Settings → Environment Variables.)*
   - `NEXT_PUBLIC_*` plan-gating flags (all plan tiers)
   - `ATF_OPS_KEY` (ops analytics endpoint auth)
   - `CRON_SECRET` (daily snapshot cron auth)
   - All policy API base URL vars (`fetchPolicy`, `updatePolicyOverrides`, `fetchReceiptSummary`, `fetchMarketConditions`, `fetchPilRecommendations`, `fetchCohortBenchmarks`, `fetchExternalContext`)
3. Confirm the staging walk-through (Section 2b–2j) has been signed off — no P0 items outstanding.
4. Force a Day 0 baseline snapshot to establish the "before" comparison point for the snapshot diff panel:

   ```bash
   # Replace <production-domain> with your actual Vercel production URL (e.g. trucore.xyz)
   curl -H "Authorization: Bearer $CRON_SECRET" \
     https://<production-domain>/api/internal/policy-analytics-daily-snapshot
   ```

   Expected: `{ "ok": true, "skipped": false, ... }`. Confirm the snapshot appears in `/admin/policy-analytics` → "Durable snapshot" status row.

**Enable (T±0)**

5. Enable `/customer/policies` for the target cohort (feature flag toggle or Vercel env override, per your deployment process).
6. Perform one authenticated load of the policy page in production to confirm it renders without console errors.
7. Confirm the analytics sink receives at least one `policy-rec-impression` event within 5 minutes of the first user visit.

**Post-enable checks (T+15 min and T+1 h)**

8. Open `/admin/policy-analytics` → confirm headline metrics (Total Events) are non-zero.
9. Check Vercel function logs, filter path `/api/customer/policy/overrides` — confirm error rate is below 1%.
10. Confirm the daily cron is scheduled: Vercel dashboard → Project → Cron Jobs → `policy-analytics-daily-snapshot` shows next run.

**Rollback signal check (T+1 h)**

11. If `updatePolicyOverrides` 5xx rate exceeds 5% for 15 consecutive minutes: disable the route (revert the feature flag or redeploy the prior release tag). See Stage 2 rollback procedure below.
12. If the analytics sink shows zero events after 30 minutes of confirmed user traffic: investigate the analytics event pipeline — not necessarily a code regression, could be a sink configuration issue.

---

### Stage 2 — Limited Rollout (Day 1–3)

**Who:** 5–10% of authenticated customer accounts, or an explicit cohort of beta accounts  
**Traffic:** Staged flag rollout via feature flag or canary deployment

**Actions:**
- Enable `/customer/policies` for the limited cohort
- Monitor error rates on all policy API routes
- Monitor recommendation impression → apply conversion (expect low initially)
- Monitor upgrade teaser click-through rate

**Watch for:**
- `updatePolicyOverrides` error rate > 1%
- Apply/undo `trackRecommendationApplyError` / `trackRecommendationUndoError` rate > 2%
- JavaScript exceptions in `/customer/policies` render path
- localStorage-related errors (snapshot save/load)
- PIL or Cohort benchmark API returning 5xx instead of gated response

**Rollback triggers:**
- API error rate on `updatePolicyOverrides` > 5% sustained over 15 minutes
- Page renders blank / crash for > 1% of sessions
- Analytics sink missing events for > 10 minutes (indicates event pipeline failure)

#### Rollback Procedure

If any rollback trigger fires:

1. **Disable the route** — revert the feature flag or redeploy the prior release tag (do not skip this, even if investigation is ongoing).
2. **Confirm the disable** — make one authenticated request to `/customer/policies`; it should redirect or return the expected fallback state for ineligible accounts.
3. **Preserve evidence** — before any code change, export the current analytics state: `GET /api/internal/policy-analytics-snapshot` (Authorization: Bearer $CRON_SECRET) and save the response.
4. **Open the incident** — create a tracking issue with: trigger observed, time of onset, first user affected (account ID if known), error payload, and snapshot export.
5. **Do not hotfix under time pressure** — redeploy the last known-good build tag rather than patching forward unless the root cause is trivially obvious and the fix is a 1-line change.

---

### Stage 3 — Full Availability (Day 3–7)

**Who:** All authenticated customer accounts  
**Traffic:** 100%

**Actions:**
- Enable policy page for all plans
- Continue monitoring for 7 days post-launch
- Capture first week of teaser click-through data for conversion analysis

**Watch for:**
- Recommendation source mix (what fraction of users see PIL / Cohort recs vs teaser)
- Trend surface visibility rate (hidden for sparse accounts — if > 50% of accounts never see it, consider data-seeding or a threshold adjustment)
- Any spike in denied transaction rates correlating with policy tightening after save

**Post-launch observation window:** 7 days

---

### Stage 4 — Post-Launch Stabilization (Day 7–30)

**Actions:**
- Triage any issues surfaced in limited or full rollout
- Review analytics to identify highest-value follow-on features
- Decide on first post-v1 item (likely: shared fixture extraction, or customer-facing policy history view)

---

### Hotfix Triggers

Any of the following warrant an immediate hotfix:
- `updatePolicyOverrides` silently accepting invalid values (policy integrity regression)
- Apply or undo writing to wrong field key
- Gating logic inverting (advanced-only recs leaking to free tier)
- `require_simulation_success` undo restoring wrong value

---

## 4. Acceptance / Signoff Report

### What Was Built

The `/customer/policies` page for TruCore-site is a comprehensive, production-ready policy management surface for the premium-v1 tier. It provides:

1. **Editable policy controls** for six policy fields with type-validated inputs, preset shortcuts, plain-English guidance, and field-level range hints.
2. **Effective policy preview** showing the computed policy (base + overrides) with per-field source attribution.
3. **Risk profile computation** with a human-readable narrative rendered on save.
4. **Multi-source recommendation engine** pulling from six signal sources (Customer history, Market analysis, PIL, Cohort benchmark, External context, Base policy) with priority ranking, confidence scoring, and source freshness badges.
5. **Plan-gated teaser UX** correctly gating higher-tier sources and showing conversion-optimized upgrade CTAs.
6. **Safe apply + undo** for two recommendation classes, with analytics instrumentation.
7. **Trend surface** comparing 7-day vs 30-day receipt windows for deny-rate, simulation-failure, and trade-size directional signals.
8. **"New" recommendation badges** via localStorage snapshot diffing.
9. **Admin analytics** including daily snapshots, snapshot diffs, recommendation analytics summary, and ops policy analytics summary.

### Evidence of Readiness

| Evidence | Detail |
|---|---|
| **Test coverage** | 250 policy-related tests pass (0 failures): 48 overrides, 80 recommendations, 38 advanced UX, 18 trend surface, 66 apply/undo, + analytics/snapshot/admin tests |
| **OOM resolution** | Prior jsdom/WSL OOM crash structurally resolved: monolithic 3,607-line test file split into 3 focused files; Vitest configured with `pool: "forks"` and `execArgv: ["--max-old-space-size=6144"]` |
| **Clean build** | Next.js build passes with 0 TypeScript errors, ≥ 213 pages compiled |
| **No new dependencies** | All features built on existing npm dependencies; no third-party risk additions |
| **No breaking changes** | Existing pages and routes unaffected; policy page is additive |
| **Analytics instrumented** | 14 distinct analytics event types wired; apply/undo/teaser/signal-refresh all covered |

### Known Limitations Acceptable for v1

1. **PIL and Cohort numeric values are not yet model-driven.** The backend returns `gated: true` / `gated_count` for ineligible tiers; the confidence and priority maps in the frontend are placeholder-calibrated. This is the correct gating behavior for v1.
2. **Trend surface requires receipt history.** New accounts with < 3 receipts in 7 days will not see the trend section. This is intentional — the section hides rather than fabricating signals.
3. **Shared boilerplate in 3-file test split.** The ~237-line boilerplate header is duplicated across the three jsdom test files. Functional risk: zero. Maintenance burden: low. Accepted for v1.
4. **`maxWorkers: 2` means policy jsdom suite runs sequentially.** Full suite wall time ~2.5 min on WSL. Acceptable for CI. Can be tuned if resources increase.

### Explicitly Deferred to Post-v1

- Customer-facing policy version history / audit trail
- PIL / ML model-driven numeric recommendations with field-level diff display
- Cohort benchmark absolute numeric values
- Shared test fixture extraction (`tests/helpers/policy-boilerplate.ts`)
- Push / email notifications for policy drift
- Policy diff comparison view (before / after)
- Bulk preset import / export

### Signoff

| Role | Name | Status |
|---|---|---|
| Engineering | — | Pending sign |
| Product | — | Pending sign |
| QA / Ops | — | Pending sign |

---

## 5. Monitoring Reference

Use this section during the live rollout to locate and act on each watchpoint.

### 5a. Watchpoint Inspection Map

| Watchpoint | Alert threshold | Where to inspect | DRI |
|---|---|---|---|
| `updatePolicyOverrides` error rate | > 5% for 15 min → roll back | Vercel function logs → filter `/api/customer/policy/overrides`; count 5xx responses | Engineering |
| Apply error rate (`trackRecommendationApplyError`) | > 2% | **Vercel Analytics dashboard** → filter `policy_recommendation_apply_error` events; compute rate vs `policy_recommendation_apply_click`. *(Apply/undo events go to Vercel Analytics only — they are not stored in the server-side analytics store and will not appear in `/admin/policy-analytics`.)* | Engineering |
| Undo error rate (`trackRecommendationUndoError`) | > 2% | **Vercel Analytics dashboard** → filter `policy_recommendation_undo_error` events; compute rate vs `policy_recommendation_undo_click`. *(Same as above — Vercel Analytics only.)* | Engineering |
| Upgrade teaser click-through rate | < 0.5% after Day 7 → review copy | `/admin/policy-analytics` → Teaser Performance table → CTR column | Product |
| Trend surface visibility | < 50% of active accounts hidden → review sparse threshold | `GET /api/ops/policy-analytics-summary` (x-ops-key header) | Engineering |
| `localStorage` save/load errors | Non-zero count in browser error tracker | Browser error tracking sink; search `loadRecSnapshot` / `saveRecSnapshot` | Engineering |
| PIL `gated_count` non-zero rate | Signals backend returning real PIL data (positive indicator) | `/admin/policy-analytics` → Source breakdown: PIL rows | Engineering |
| Analytics event pipeline gap | Zero events for > 10 min during confirmed user traffic | Analytics sink → event stream; Vercel function logs | Engineering |
| Recommendation impression → apply conversion | Baseline week 1; flag if < 0.5% in week 2+ | `/admin/policy-analytics` → Featured Engagement + Apply Events | Product |
| Snapshot diff headline deltas spiking unexpectedly | Large apply/undo delta with no known launch event | `/admin/policy-analytics` → "Trend Since Last Snapshot" diff panel | Ops |

### 5b. Ops API Quick Reference

All routes below are internal-only and never customer-facing.

**Aggregated analytics summary (in-memory, per-instance):**

```bash
GET /api/ops/policy-analytics-summary
Header: x-ops-key: $ATF_OPS_KEY
```

Returns: aggregated impression, apply, undo, teaser, expand counts. No PII. Resets on cold start.

**Force a manual snapshot (useful for Day 0 baseline or mid-rollout comparison):**

```bash
GET /api/internal/policy-analytics-daily-snapshot
Header: Authorization: Bearer $CRON_SECRET
```

Returns: `{ ok: true, skipped: false, snapshot_id, captured_at }`. Skips if a snapshot was captured within the last 23 hours.

**Export current in-memory summary as JSON (for archiving before deploy):**

```bash
GET /api/internal/policy-analytics-snapshot
Header: Authorization: Bearer $CRON_SECRET
```

Returns: full `PolicyAnalyticsSummary` JSON. Safe to run at any time.

**View snapshot diff and headline metrics (admin UI):**

Navigate to `/admin/policy-analytics` (requires admin session). Displays:
- Durable snapshot status and last capture timestamp
- "Trend Since Last Snapshot" diff panel (requires ≥ 2 captured snapshots)
- Headline metrics: Total Events, Expand Rate, Teaser CTR, View-Setting Rate
- Teaser performance breakdown by dominant source and tier
- Apply/undo event counts by recommendation class

### 5c. Escalation Path

| Severity | Trigger | Action |
|---|---|---|
| **P0 — Rollback now** | `updatePolicyOverrides` > 5% error rate for 15 min; blank page > 1% of sessions | Disable route → preserve evidence → open incident → redeploy prior tag |
| **P1 — Investigate within 1 h** | Apply or undo error rate > 2%; analytics pipeline gap > 30 min | Open investigation thread; do not roll back unless escalates to P0 |
| **P2 — Monitor, no immediate action** | Teaser CTR < 0.5% (first 7 days — not yet actionable); trend surface hidden > 50% accounts | Log in weekly review; schedule threshold tuning post-v1 if sustained |
| **Positive signal** | PIL `gated_count` non-zero in source breakdown | Note in weekly review; indicates backend delivering real PIL data |

---

## 5. Post-Launch Watchpoints Summary

| Metric | Threshold for action |
|---|---|
| `updatePolicyOverrides` error rate | > 5% → investigate immediately |
| Apply error rate (`trackRecommendationApplyError`) | > 2% → investigate |
| Undo error rate (`trackRecommendationUndoError`) | > 2% → investigate |
| Teaser click-through rate | < 0.5% after 7 days → review teaser copy |
| Trend surface visibility rate | < 50% of active accounts → review sparse threshold |
| Recommendation impression → apply conversion | Baseline capture in week 1; no threshold yet |
| PIL gated_count > 0 rate | Monitor for backend readiness signal |
| Snapshot save/load localStorage errors | Any sustained errors → investigate |

---

*This document is the authoritative launch record for TruCore-site Policy System Premium v1.*

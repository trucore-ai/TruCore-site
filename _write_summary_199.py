summary = """\
PROMPT 199 - Premium-v1 Policy Rollout Rehearsal
Project: TruCore-site / customer/policies
Date: 2026-04-17
Commit: abcd7a4  docs(policy): finalize premium-v1 rollout rehearsal

== REHEARSAL AUDIT RESULTS ==

All key paths confirmed inspectable:
  - /customer/policies                                EXISTS (app/customer/policies/page.tsx)
  - /admin/policy-analytics                           EXISTS (app/admin/policy-analytics/page.tsx)
  - GET /api/ops/policy-analytics-summary             EXISTS (x-ops-key auth, aggregated counts)
  - GET /api/internal/policy-analytics-snapshot       EXISTS (Bearer CRON_SECRET auth)
  - GET /api/internal/policy-analytics-daily-snapshot EXISTS (Bearer CRON_SECRET auth)
  - POST /api/customer/policy/overrides               EXISTS (policy save endpoint)
  - /api/track                                        EXISTS (internal event ingest)

Admin page panels verified present:
  - Durable snapshot status row with last capture timestamp
  - Trend Since Last Snapshot diff panel (requires >=2 snapshots)
  - Headline metrics: Total Events, Expand Rate, Teaser CTR, View-Setting Rate
  - Gated-Source Teaser Performance table (CTR by source and tier)
  - By Event Type, By Source, By Display Section bucket tables
  - Premium v1 launch monitoring banner with runbook reference
  - Snapshot export link

== REHEARSAL GAPS FOUND (3) ==

GAP 1 -- CRITICAL (watchpoint mismatch):
  Section 5a watchpoint map said:
    Apply/undo error rates -> /admin/policy-analytics -> Apply Events table
  This is wrong. Apply/undo events (policy_recommendation_apply_error,
  policy_recommendation_undo_error) are NOT in POLICY_EVENT_NAMES and are NOT
  stored server-side. They fire only to Vercel Analytics via trackVercel.
  The admin page will never show these rows.
  FIX: Updated watchpoint rows to Vercel Analytics dashboard with correct
  event name filter and ratio computation instructions.

GAP 2 -- curl placeholder not flagged:
  Day 0 step 4 used https://<production-domain>/... without noting the operator
  must substitute the real URL before running the command.
  FIX: Added comment line inside the code block.

GAP 3 -- env var location:
  Day 0 step 2 listed required env vars without saying where to retrieve them.
  FIX: Added note pointing to Vercel dashboard -> Project -> Settings ->
  Environment Variables.

== CLEANUP MADE ==

File changed: docs/policy-v1-launch.md (TruCore-site repo)
  1. Section 5a: corrected Apply and Undo error rate inspection paths
  2. Day 0 step 4 curl block: added substitution comment for <production-domain>
  3. Day 0 step 2: added env var location note

No code changes. No new features. Build not required.

== WATCHPOINTS: ALL INSPECTABLE ==

Watchpoint                            Where to Inspect                                        Status
--------------------------------------|--------------------------------------------------------|--------
updatePolicyOverrides error rate      | Vercel function logs -> /api/customer/policy/overrides | OK
Apply error rate                      | Vercel Analytics -> policy_recommendation_apply_error  | FIXED
Undo error rate                       | Vercel Analytics -> policy_recommendation_undo_error   | FIXED
Teaser CTR                            | /admin/policy-analytics -> Teaser Performance table    | OK
Trend surface visibility              | GET /api/ops/policy-analytics-summary                  | OK
localStorage errors                   | Browser error sink (loadRecSnapshot/saveRecSnapshot)   | OK
PIL gated_count rate                  | /admin/policy-analytics -> By Source -> PIL rows       | OK
Analytics event pipeline              | Analytics sink + Vercel function logs                  | OK
Impression -> apply conversion        | /admin/policy-analytics -> Featured Engagement         | OK
Snapshot diff headline deltas         | /admin/policy-analytics -> Trend Since Last Snapshot   | OK
Durable snapshot status               | /admin/policy-analytics -> snapshot status row         | OK

== VALIDATION ==

Docs-only changes -- no build required.
Git commit: abcd7a4
Push: origin/main -> trucore-ai/TruCore-site

== RISKS / FOLLOW-UPS ==

- Apply/undo monitoring depends on Vercel Analytics being accessible to on-call
  engineers. If not, this watchpoint has no fallback. Post-v1: add apply/undo
  events to server-side analytics store so they appear in /admin/policy-analytics.
- Day 0 snapshot curl requires CRON_SECRET exported in shell; operator should
  verify access before launch hour.
- Rollback "disable the route" step relies on deployment-process-specific
  tribal knowledge (feature flag or env override). Should be formalized before
  Stage 2 rollout.
"""

out = "/home/kontractkoder/repo/agent-transaction-firewall/SUMMARY.txt"
with open(out, "w") as f:
    f.write(summary)
print(f"Written to {out}")

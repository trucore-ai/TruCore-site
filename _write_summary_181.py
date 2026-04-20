#!/usr/bin/env python3
import pathlib

SUMMARY = r"""PROMPT 181 — SUMMARY
Tune recommendation display using engagement insights

1. Analytics signals reviewed from the new summary path:
   - by_source: engagement counts per recommendation source
   - by_display_section: featured / top / more engagement volumes
   - derived.expand_rate: user drill-down engagement rate
   - derived.view_setting_click_rate: action conversion rate
   - derived.upgrade_teaser_click_rate: teaser-to-upgrade conversion
   - derived.featured_impressions / expands / view_setting_clicks: featured card performance
   - derived.more_engagement: more-suggestions section total engagement

2. Display/ranking weaknesses identified:
   - compareRecommendations() was source-blind — signal-backed sources (PIL, Market,
     External context) sorted identically to static guidance at same priority
   - classifyDisplaySection() demoted all medium-priority cards without fieldKey,
     even high-confidence signal-backed ones
   - computeCardEmphasis() never showed inline reason in "more" section, even for
     high-value intelligence cards
   - Featured eligibility required fieldKey — high-confidence intelligence cards
     without a direct setting link could never be featured
   - Inline confidence in "more" section required >= 0.7; moderate-confidence (0.5-0.7)
     cards were stripped of all signal indicators

3. Tuning model implemented:
   - SOURCE_ENGAGEMENT_TIER constant: tier 0 (PIL, External, Market), tier 1 (Cohort,
     Customer history), tier 2 (Policy analysis, Default guidance) — informed by
     analytics patterns, documented and explainable
   - isSignalBackedSource() helper: checks if source is in tier 0 or 1
   - Source engagement tier added as sort dimension in compareRecommendations()
     between actionability and source trust
   - classifyDisplaySection() broadened: medium-priority + confidence >= 0.7 +
     signal-backed source -> promoted to "top" section
   - computeCardEmphasis() refined:
     a) Featured eligibility broadened: first high-priority card that is actionable
        OR (confidence >= 0.7 + signal-backed source)
     b) "more" section: high-confidence signal-backed cards now show inline reason
     c) "more" section: inline confidence threshold lowered from 0.7 to 0.5

4. UI/display logic changes made:
   - compareRecommendations(): new 5-dimension sort (was 4): priority -> actionability
     -> source engagement tier -> source trust -> confidence
   - classifyDisplaySection(): 4 rules (was 3): added medium + high-confidence +
     signal-backed -> "top"
   - computeCardEmphasis(): featured eligibility broadened; "more" section now shows
     inline reason for high-confidence signal-backed cards and inline confidence at >= 0.5

5. Exact files changed:
   - app/customer/policies/page.tsx — display logic refinements
   - lib/server/policy-analytics-store.ts — added by_source_and_section cross-tab
  - tests/customer-policy-overrides-plans.test.tsx — 3 new analytics-informed display tests
   - tests/policy-analytics-store.test.ts — 1 new by_source_and_section cross-tab test

6. Test/build results:
   - Vitest: 199 tests passed (180 + 19), 0 failed
   - npm run build: success, no errors

7. Git commit hash: baead66c0b6ffe518211f896b7b31f743d649058

Risks / Follow-ups:
- SOURCE_ENGAGEMENT_TIER is static; should be reviewed against analytics summary
  periodically (e.g. quarterly) and updated if source engagement patterns shift
- The by_source_and_section cross-tab is in-memory and per-instance; it is not
  persisted. For durable tuning decisions, export summary periodically.
- Medium-priority promotion threshold (confidence >= 0.7 + signal-backed) is
  conservative; may need to be loosened if analytics show 0.6+ cards are also
  high-engagement
- PIL confidence mapping ("medium" -> 0.6) sits just below the 0.7 promotion
  threshold; a future PIL confidence recalibration could shift display behavior
- No Playwright tests added — visible UI behavior changes are subtle (ordering
  shifts, emphasis changes) and not reliably assertable at the E2E level
""".strip() + "\n"

path = pathlib.Path("/home/kontractkoder/repo/agent-transaction-firewall/SUMMARY.txt")
path.write_text(SUMMARY)
print("Done")

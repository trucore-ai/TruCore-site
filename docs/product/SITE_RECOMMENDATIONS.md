# ATF Site Recommendations

**Date:** 2026-03-21
**Branch:** `audit/site-onboarding-command-alignment`
**Scope:** Design, content, and layout recommendations based on the onboarding and command alignment audits

---

## 1. Design Recommendations

### D1. Single primary CTA in the homepage hero

**Current:** Hero has two side-by-side CTAs ("Try ATF" going to /try, "Try sandbox" going to /demo or sandbox).
**Recommendation:** One primary CTA: "Try ATF in 4 Commands" linking to /quickstart. A smaller secondary link for the web sandbox. The CLI path is the canonical golden path, and the hero should drive users there.

### D2. Copyable golden path on the homepage

**Current:** The homepage golden path card grid shows `atf trade`, `atf setup`, `atf doctor`, `atf verify` but they are display-only labels. No install instruction is shown nearby.
**Recommendation:** Add an install command above the cards and make each card's command copyable using AtfCopyCommand. A user should be able to start the golden path from the homepage without navigating away.

### D3. SafeToTryBanner on every page that shows a first command

**Current:** SafeToTryBanner appears on 5 of 13+ relevant pages.
**Recommendation:** Add SafeToTryBanner to: homepage (golden path section), /try (above the sandbox), /docs/cli/commands, /docs/live-demo, /launch, /docs/5-minute-quickstart (if not redirected).

### D4. Bridge from sandbox to CLI

**Current:** /try ends with "Create Account" CTA. No mention of CLI.
**Recommendation:** After the sandbox results pane, add a block: "Want to run this from your terminal?" with install command and link to /quickstart. This captures users who just experienced the value and are ready to install.

### D5. Reduce homepage explore grid to 6 cards

**Current:** 12-card explore grid creates decision paralysis for first-time visitors.
**Recommendation:** Show the 6 most important cards. Place the remaining 6 behind a "Show more" toggle or move them to a dedicated /explore or /docs page.

---

## 2. Content Recommendations

### C1. Eliminate the three-quickstart confusion

**Current:** Three pages compete for the "quickstart" intent:
- /quickstart (CLI-first, best page, golden path)
- /docs/quickstart (architecture primer, misleading title)
- /docs/5-minute-quickstart (API-first, outdated)

**Recommendation:**
- /quickstart remains the canonical quickstart. All "try ATF" and "quickstart" links site-wide point here.
- /docs/quickstart is renamed to "Architecture Overview" or "ATF Concepts," or a redirect to /quickstart is added with a prominent banner at the top.
- /docs/5-minute-quickstart is redirected to /quickstart with a 301. Its current content (API/curl) is moved to a dedicated /docs/api-quickstart if needed.

### C2. Standardize command form after install

**Current:** Multiple pages show the global install command, then use `npx @trucore/atf@<version> <cmd>` for all subsequent code blocks.
**Recommendation:** After showing `npm install -g @trucore/atf@<version>`, use the short `atf <cmd>` form for all subsequent commands on the same page. If the npx form is needed (e.g., for users who skip install), show it as a secondary tab or collapsible section, not inline.

### C3. Fix /atf hero CTA

**Current:** The /atf hero CTA says "Run This First" and links to the doctor section (step 3 of the golden path).
**Recommendation:** The CTA should link to trade (step 1) or to the golden path section near the top of the page. Doctor is a diagnostic tool, not the entry point.

### C4. Fix /docs/cli "Run This First" section

**Current:** "Run This First: Doctor" positions doctor as the first command to run.
**Recommendation:** Rename to "Verify Your Setup: Doctor" and position it after the golden path overview. Or change to "Run This First: `atf trade`" which is the actual first step.

### C5. Standardize cliVersion vs cliTag

**Current:** /docs/dex-guardrails and /docs/perps use `cliTag` for simulate commands but `cliVersion` for install. These could produce different version strings.
**Recommendation:** Audit `getAtfCliVersion()` vs `getAtfCliTag()` and standardize on one for all command blocks. If they always return the same value, use one consistently. If they differ, document why and ensure each usage is intentional.

### C6. Add `atf verify` context to /receipts

**Current:** /receipts shows a receipts explorer with demo data but never mentions the `atf verify` command.
**Recommendation:** Add a small section explaining that receipts can also be verified via CLI: `atf verify <receipt-id>`. Link to /quickstart for install.

---

## 3. Layout Recommendations

### L1. Table of contents for long pages

**Current:** /docs/first-protected-trade and /atf are very long (10+ sections). Users must scroll to find content.
**Recommendation:** Add a floating table of contents or quick-nav header for pages longer than 5 sections.

### L2. Reduce /atf section count

**Current:** 11+ sections on /atf. The page tries to be a landing page, a reference, and a tutorial.
**Recommendation:** Consolidate into 5-6 sections: hero, golden path (with install), features/surfaces, toolbox reference, get started CTA. Move burner quickstart, Helius setup, and SimulateVerifyExecuteFlow details to subpages or to /docs.

### L3. Unify micro-nav styling on homepage

**Current:** The homepage has 7+ micro-nav links in different styles/positions between the hero and the main content.
**Recommendation:** Cap at 3-4 micro-nav links. Group into a single well-designed "Quick links" bar.

---

## 4. Priority Buckets

### Fix Now (high confidence, high impact, low effort)

| # | Action | Pages affected | Impact |
|---|---|---|---|
| 1 | Standardize all commands to short `atf` form after global install on each page | /atf, /docs/cli | Eliminates mixed messaging, makes copy-paste reliable |
| 2 | Change /atf hero CTA from "Run This First: Doctor" to "Run This First: Trade" | /atf | Aligns the highest-traffic product page with the golden path |
| 3 | Redirect /docs/5-minute-quickstart to /quickstart (301) | /docs/5-minute-quickstart | Eliminates the most outdated/confusing onboarding page |

### Fix Next (medium effort, high clarity gain)

| # | Action | Pages affected | Impact |
|---|---|---|---|
| 4 | Add SafeToTryBanner to homepage golden path section | / | Trust signal on highest-traffic page |
| 5 | Make homepage golden path commands copyable | / | Users can start the golden path without leaving the homepage |
| 6 | Rename /docs/quickstart to "Architecture Overview" | /docs/quickstart | Eliminates title/content mismatch |
| 7 | Add CLI bridge CTA to /try after results | /try | Converts sandbox users to CLI users |
| 8 | Fix cliVersion vs cliTag inconsistency | /docs/dex-guardrails, /docs/perps | Prevents version string confusion |

### Nice to Have (polish, lower priority)

| # | Action | Pages affected | Impact |
|---|---|---|---|
| 9 | Add table of contents to /atf and /docs/first-protected-trade | /atf, /docs/first-protected-trade | Improved navigation on long pages |
| 10 | Reduce homepage explore grid from 12 to 6 cards | / | Less decision paralysis, cleaner layout |
| 11 | Add `atf verify` section to /receipts | /receipts | Closes the CLI loop for receipt inspection |
| 12 | Add SafeToTryBanner to /docs/cli/commands, /docs/live-demo, /launch | Multiple | Broader trust signal coverage |
| 13 | Add WhatHappensBlock after `atf trade` on /atf golden path | /atf | Matches the /quickstart approach |

---

## 5. Proposed Follow-up Prompt Shape

The following prompt can be used to implement the "Fix Now" and "Fix Next" items:

```
PROMPT 175: fix(site): align ATF onboarding golden path and command surface

Context: Audit docs in docs/product/ identified the top friction points.

Scope:
1. /atf page:
   - Change hero CTA from "Run This First: Doctor" to "Run This First: atf trade"
   - Standardize all npx commands after the install section to use short `atf` form
   - Consolidate or remove redundant bottom sections (burner quickstart, Helius setup)

2. /docs/5-minute-quickstart:
   - Redirect to /quickstart with a 301

3. /docs/quickstart:
   - Rename to "Architecture Overview" or add a banner redirecting CLI users to /quickstart

4. / (homepage):
   - Add SafeToTryBanner to the golden path section
   - Make golden path commands copyable (add AtfCopyCommand to each card)
   - Add install command (AtfCopyCommand) above the golden path cards
   - Reduce hero to one primary CTA: "Try ATF in 4 Commands" -> /quickstart

5. /try:
   - Add a bridge CTA after the sandbox results: "Run this from your terminal" with install command

6. /docs/cli:
   - Change "Run This First: Doctor" to "Verify Your Setup: Doctor"
   - Change all dev flow commands from npx to short `atf` form

7. /docs/dex-guardrails and /docs/perps:
   - Standardize cliVersion/cliTag usage

Constraint: No new dependencies. No new pages. No API changes.
```

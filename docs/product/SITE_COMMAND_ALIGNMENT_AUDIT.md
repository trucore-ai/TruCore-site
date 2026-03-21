# ATF Site Command Alignment Audit

**Date:** 2026-03-21
**Branch:** `audit/site-onboarding-command-alignment`
**Scope:** Command consistency, install/run paths, page-by-page findings, component consistency

---

## 1. Command Consistency Review

### Commands Shown Across the Site

| Command | Canonical form | Pages showing it |
|---|---|---|
| Install (global) | `npm install -g @trucore/atf@<version>` | /quickstart, /atf, /docs/quickstart, /docs/first-protected-trade, /docs/cli, /docs/cli/commands, /docs/dex-guardrails, /docs/perps, /docs/live-demo |
| Install (npx) | `npx @trucore/atf@<version> trade` | /quickstart, /atf, /docs/quickstart, /docs/first-protected-trade, /docs/cli, /docs/cli/commands |
| trade | `atf trade` | /quickstart, /atf, /docs/first-protected-trade, /docs/cli/commands, / (homepage cards) |
| setup | `atf setup` | /quickstart, /atf, /docs/first-protected-trade, /docs/cli/commands, / (homepage cards) |
| doctor | `atf doctor` | /quickstart, /atf, /docs/cli, /docs/cli/commands, / (homepage cards) |
| verify | `atf verify <receipt-id>` | /quickstart, /atf, /docs/first-protected-trade, /docs/cli/commands, / (homepage cards) |
| doctor (npx) | `npx @trucore/atf@<version> doctor --pretty` | /atf (doctor section) |
| doctor (npx, no flag) | `npx @trucore/atf@<version> doctor` | /docs/cli |

### Aligned Pages

These pages are fully aligned with the canonical golden path and install recommendations:

- **/quickstart** - Global install primary, npx as alternative, all four golden path commands in order
- **/docs/first-protected-trade** - Same structure, with multi-surface (HTTP, Python, TS, CLI) paths added
- **/docs/cli/commands** - Comprehensive reference with golden path as first section
- **/atf** (golden path section) - Correct order and install instructions

### Misaligned Pages

| Page | Issue |
|---|---|
| **/atf** (doctor section) | Uses `npx @trucore/atf@<version> doctor --pretty` as the primary command. Inconsistent with the golden path which starts with `atf trade`. The `--pretty` flag appears only here. |
| **/atf** (burner section) | All 6 commands use npx form, not the short `atf` form. This contradicts the golden path section on the same page which uses the short form. |
| **/atf** (Helius section) | Same issue: all 3 commands use npx form. |
| **/atf** (footer CTA) | Uses `npx @trucore/atf@<version> trade` instead of `atf trade`. Since the page has already shown global install in the golden path section, the footer should use the short form. |
| **/docs/cli** | "Run This First: Doctor" section uses `npx @trucore/atf@<version> doctor`. This is a docs page that already shows global install above, so should use `atf doctor`. |
| **/docs/cli** (dev flows) | All four dev flow cards use npx form. After showing install at the top of the page, these should use short `atf` form for consistency. |
| **/docs/5-minute-quickstart** | Uses SingleCommandQuickstart (which has global/npx/curl tabs) but then immediately pivots to a curl API example. Does not show `atf trade` as a standalone command. |
| **/docs/dex-guardrails** | CLI quickstart uses `npx @trucore/atf@<version>` form alongside `npx @trucore/atf@<cliTag>` (tag vs version). Uses `cliTag` for simulate commands but `cliVersion` for install. |
| **/docs/perps** | Same cliTag vs cliVersion inconsistency. Uses `cliTag` for perps commands but `cliVersion` for install. |
| **/docs/live-demo** | Install note mentions both forms but then says "bare `atf` commands below assume a global install." Commands below use `atf bot protect` correctly, consistent with this note. |
| **/launch** | Uses SingleCommandQuickstart component but no golden path commands shown directly on the page. |

### Key inconsistency: `cliVersion` vs `cliTag`

Two helper functions are used: `getAtfCliVersion()` and `getAtfCliTag()`. Some pages mix them:

- **/docs/dex-guardrails**: install uses `cliVersion`, simulate commands use `cliTag`
- **/docs/perps**: install uses `cliVersion`, perps commands use `cliTag`

This could produce different version strings in the same page. Should be standardized.

### Key inconsistency: npx form after global install

Multiple pages show the global install command first, then immediately revert to npx for all subsequent commands. This sends mixed signals: "we recommend global install, but here are all the commands in npx form anyway."

**Affected pages:** /atf (burner, Helius, footer), /docs/cli (dev flows, doctor)

**Fix:** After showing global install, use the short `atf` form for all subsequent commands on the same page.

---

## 2. Install / Run Path Review

### Where global install is prominent

| Page | Global install position | Visual treatment |
|---|---|---|
| /quickstart | Section 2, dedicated "Install the CLI" section | Prominent with AtfCopyCommand |
| /docs/first-protected-trade | Early, highlighted install section | Bordered panel with "Recommended" label |
| /docs/cli | Early, highlighted install section | Bordered panel with "Recommended" label |
| /docs/cli/commands | Early, dedicated section | Bordered panel with "Recommended" badge |
| /atf (golden path text) | Inline text mention | Small text under section heading |
| /docs/dex-guardrails | CLI quickstart section | Bordered panel |
| /docs/perps | CLI quickstart section | Bordered panel |
| /docs/quickstart | Early section | Bordered panel |

### Where npx is too dominant

| Page | Issue |
|---|---|
| /atf (doctor section) | npx is the primary command, not global |
| /atf (burner quickstart) | All 6 commands are npx, none use short form |
| /atf (Helius setup) | All 3 commands are npx |
| /atf (footer CTA) | npx form for `trade` |
| /docs/cli (Run This First) | npx form for `doctor` |
| /docs/cli (dev flows) | All 4 flow cards use npx |
| /docs/5-minute-quickstart | curl/API approach alongside SingleCommandQuickstart |

### Where install context is missing

| Page | Issue |
|---|---|
| / (homepage) | Golden path card grid shows `atf trade`, `atf setup`, etc. but no install command is shown nearby. User sees the commands but does not know how to get the CLI. |
| / (homepage hero) | "Try ATF" goes to /try (web sandbox). No CLI install CTA in the hero. |
| /launch | SingleCommandQuickstart component handles install tabs, but the page itself has no install instruction in its own content. |
| /try | Web-only sandbox. No CLI install path shown at all. After completing the sandbox flow, the CTA is "Create Account" not "Install the CLI." |
| /receipts | Receipts explorer page. Shows demo receipts but does not mention `atf verify` or CLI install. |

---

## 3. Page-by-Page Findings

---

### / (Homepage)

**Role:** Primary landing page, first impression, conversion hub
**What works:**
- Hero messaging is strong and concise
- Golden path card grid communicates the four-step flow
- "Try ATF" CTA is prominent and visually dominant
- Explore grid provides comprehensive navigation
- Trust signals (SecurityIntegrityStrip, LiveStatusStrip) are well-placed

**What confuses:**
- Hero has two CTAs ("Try ATF" and "Try sandbox") going to different experiences
- 7+ micro-nav links below the hero create choice overload
- Golden path cards are not actionable (no copy buttons, no install)
- "5-min quickstart" link in micro-nav goes to the API-first quickstart
- Explore grid has 12 cards, too many for a first-time visitor
- The page is extremely long (golden path, enforcement model, ecosystem, production readiness, V1 scope, explore grid, why TruCore, enforcement proof, roadmap, waitlist, design partner CTA, moat signals)

**Command clarity:** 3/5 - Commands shown but not copyable
**Visual clarity:** 3/5 - Too many sections, too many navigation options
**Recommended action:** Simplify hero to one primary CTA. Add install + copy button to golden path section. Reduce explore grid to 6 cards.

---

### /quickstart

**Role:** The canonical quickstart for CLI users
**What works:**
- Install section is prominent and well-structured
- SafeToTryBanner is in the hero
- Four-step flow is perfectly ordered with CopyBlock components
- WhatHappensBlock explains what step 1 does
- DemoVsRealBlock explains the transition at step 2
- Next steps section links to deeper resources
- Page is focused and scannable

**What confuses:**
- Nothing significant. This is the best onboarding page.

**Command clarity:** 5/5
**Visual clarity:** 5/5
**Recommended action:** Make this the canonical destination for all "try ATF" CTAs. Consider merging /docs/quickstart and /docs/5-minute-quickstart into this page or having them redirect.

---

### /atf

**Role:** Main ATF product page, comprehensive reference
**What works:**
- Golden path section is well-structured with all four commands
- SafeToTryBanner in hero
- Toolbox section provides a complete command reference
- Dual-surface explanation (human + bot) is clear
- SimulateVerifyExecuteFlow diagram is helpful

**What confuses:**
- Hero "Run This First" CTA links to doctor (step 3), not trade (step 1)
- Golden path shows `atf` short form, but doctor/burner/Helius sections use npx long form
- 11+ sections make the page very long
- The page title is "ATF Developer Platform" but feels like it is trying to be both a landing page and a docs page
- Footer CTA contradicts the golden path by using npx form
- "Dev Quickstart" section at the bottom duplicates content from earlier sections

**Command clarity:** 4/5 (golden path section is great, but contradictions elsewhere)
**Visual clarity:** 3/5 (too many sections, mixed messaging)
**Recommended action:** Change hero CTA to link to golden path or trade. Standardize all commands to short form after install section. Remove or consolidate redundant bottom sections.

---

### /docs/quickstart

**Role:** Docs-level quickstart, policy-oriented
**What works:**
- SafeToTryBanner present
- Install section is prominent and well-styled
- Links to deeper resources (architecture, first protected trade)

**What confuses:**
- Title says "Quickstart" but content is actually a policy architecture primer (define policy, issue permit, validate transaction, record receipt). This is not a quickstart.
- The four-step flow here is the conceptual architecture flow, NOT the CLI golden path. A developer expecting to run commands will be confused.
- Some code examples show pseudo-code (`createPolicy()`, `issuePermit()`) without language specification
- The page competes with /quickstart and /docs/5-minute-quickstart for the same user

**Command clarity:** 3/5 - Install is clear, but the "flow" is architecture, not commands
**Visual clarity:** 3/5 - Sections are well-structured but content is mismatched with title
**Recommended action:** Rename to "Architecture Overview" or "Policy Quickstart". Add a prominent banner redirecting to /quickstart for CLI users. Or redirect this URL to /quickstart.

---

### /docs/first-protected-trade

**Role:** Deep-dive golden path walkthrough with multiple integration paths
**What works:**
- SafeToTryBanner, DemoVsRealBlock, and WhatHappensBlock all present
- Install section with "Recommended" and "Alternative" labels
- Four golden path CLI commands shown clearly
- HTTP, Python, TypeScript, CLI, and OpenClaw integration paths
- Response format documented with allowed/denied examples
- Verification section covers CLI, HTTP, and web methods
- Success markers table is excellent
- Troubleshooting for wrong package name

**What confuses:**
- Very long page. Could benefit from a table of contents at the top.
- Some users may be overwhelmed by seeing 5 integration paths at once

**Command clarity:** 5/5
**Visual clarity:** 4/5 (comprehensive but long)
**Recommended action:** Add a quick-nav / table of contents. Mark the CLI path as "Fastest" or "Try first". Minor improvement only, this page is excellent.

---

### /docs/5-minute-quickstart

**Role:** Quick developer onboarding
**What works:**
- SingleCommandQuickstart component provides tabbed install options
- Mentions golden path commands in the header text

**What confuses:**
- After the SingleCommandQuickstart component, immediately pivots to API key + curl workflow
- No SafeToTryBanner, DemoVsRealBlock, or WhatHappensBlock
- The curl example targets localhost (`http://127.0.0.1:3000`), which is confusing for a first-time user
- Page title "5-Minute Developer Quickstart" competes with /quickstart ("Try ATF in Four Commands")
- Uses `"use client"` directive (client-side rendering) unlike other docs pages
- Does not show the standalone `atf trade` command as a clear first step

**Command clarity:** 2/5
**Visual clarity:** 2/5
**Recommended action:** Either redirect to /quickstart or rewrite to match the CLI-first approach. Remove or update the curl/localhost example. Add SafeToTryBanner.

---

### /docs/cli

**Role:** CLI reference hub
**What works:**
- Install section with both options, well-styled
- SafeToTryBanner present
- Quick nav for page sections
- Command reference table is comprehensive
- Deep dive subpages grid is helpful
- Guides section links to walkthroughs

**What confuses:**
- "Run This First: Doctor" uses npx and positions doctor as the first command. This contradicts the golden path where trade is step 1.
- All four dev flow cards use npx form despite global install being shown above
- No DemoVsRealBlock or WhatHappensBlock

**Command clarity:** 3/5 (table is great, but flow commands use wrong form)
**Visual clarity:** 4/5
**Recommended action:** Change "Run This First" to show `atf trade` and link to doctor as a follow-up. Change dev flow commands to short form.

---

### /docs/cli/commands

**Role:** Detailed ATF command reference
**What works:**
- Install section with "Recommended" badge is excellent
- Golden path section is detailed with step descriptions
- Dual-surface output explanation is clear
- Advanced command groups are well-organized

**What confuses:**
- No SafeToTryBanner
- No WhatHappensBlock for the trade command

**Command clarity:** 5/5
**Visual clarity:** 4/5
**Recommended action:** Add SafeToTryBanner. Minor improvement only.

---

### /docs/dex-guardrails

**Role:** DEX enforcement reference
**What works:**
- Clear, focused content on slippage caps, allowlists, mint controls
- Example policy YAML is practical
- CLI quickstart section with install

**What confuses:**
- Uses `cliTag` for simulate commands but `cliVersion` for install
- CLI quickstart section feels bolted on, not integrated with the page narrative

**Command clarity:** 3/5 (version inconsistency)
**Visual clarity:** 4/5
**Recommended action:** Standardize version usage. Ensure simulate commands use same version source as install.

---

### /docs/perps

**Role:** Perps enforcement reference
**What works:**
- Feature gating explanation is thorough
- Venue table is clear
- Fail-closed behavior well-documented
- Example policy YAML is practical

**What confuses:**
- Same `cliTag` vs `cliVersion` inconsistency as dex-guardrails
- Perps CLI commands use piped npx form which is very long and hard to read

**Command clarity:** 3/5
**Visual clarity:** 4/5
**Recommended action:** Same as dex-guardrails. Simplify perps command examples.

---

### /docs/live-demo

**Role:** ATF execution example walkthrough
**What works:**
- Clean structure: protect, receipt fields, verify
- Install note is concise and correctly positioned
- Receipt field table is well-formatted
- Uses short `atf` form after explaining global install

**What confuses:**
- Page title is "ATF Execution Example" but the URL path is `/docs/live-demo`. Mismatch between title and URL.
- No SafeToTryBanner

**Command clarity:** 4/5
**Visual clarity:** 4/5
**Recommended action:** Consider renaming URL or title to match. Add SafeToTryBanner.

---

### /launch

**Role:** Launch announcement page
**What works:**
- Clean, focused messaging
- SingleCommandQuickstart component provides tabbed install
- Design partner CTA is prominent

**What confuses:**
- No golden path commands shown on the page itself
- "Apply as Design Partner" is the primary CTA, which may not be relevant to most visitors
- No SafeToTryBanner

**Command clarity:** 2/5
**Visual clarity:** 3/5
**Recommended action:** Add golden path commands or redirect to /quickstart. Add SafeToTryBanner.

---

### /receipts

**Role:** Public receipts explorer
**What works:**
- Clear purpose: inspect demo receipts
- Explains these are demo receipts, not partner data

**What confuses:**
- No mention of `atf verify` anywhere on the page
- No install prompt or CLI context
- CTA goes to /demo (live demo stream), not to CLI verification

**Command clarity:** 1/5
**Visual clarity:** 4/5
**Recommended action:** Add a section explaining `atf verify` for CLI-based verification. Link to /quickstart for install.

---

### /try

**Role:** Web sandbox for trying ATF without installing
**What works:**
- Three-step guided flow (sample, protect, results)
- Shows real API responses with policy breakdown
- Receipt display is clear

**What confuses:**
- No SafeToTryBanner (though the sandbox itself is safe)
- After completing the flow, the CTA is "Create Account" with no mention of the CLI
- Does not bridge users from the web experience to the CLI golden path
- No mention of `atf trade` or global install

**Command clarity:** 1/5 (web-only, no CLI commands shown)
**Visual clarity:** 4/5
**Recommended action:** Add a bridge CTA after results: "Want to run this from your terminal? Install the CLI." Add SafeToTryBanner.

---

## 4. Component Consistency Review

### SafeToTryBanner

**Component quality:** Excellent. Clean, compact, consistent wording.
**Usage:**
- Present: /quickstart, /atf, /docs/quickstart, /docs/first-protected-trade, /docs/cli
- Missing: / (homepage), /docs/5-minute-quickstart, /docs/cli/commands, /docs/live-demo, /launch, /try, /receipts

**Recommendation:** Add to homepage golden path section and /try page at minimum.

### DemoVsRealBlock

**Component quality:** Excellent. Clear side-by-side comparison.
**Usage:**
- Present: /quickstart (step 2), /docs/first-protected-trade
- Missing: All other pages

**Recommendation:** Add to /atf golden path section and /docs/cli.

### WhatHappensBlock

**Component quality:** Good. Short, effective.
**Usage:**
- Present: /quickstart (step 1), /docs/first-protected-trade
- Missing: All other pages that show `atf trade`

**Recommendation:** Show immediately after every first occurrence of `atf trade` on a page.

### SingleCommandQuickstart

**Component quality:** Good. Tabs for global/npx/curl are clear. "Recommended" badge on global tab.
**Usage:**
- Present: /docs/5-minute-quickstart, /launch
- Not needed elsewhere because other pages have inline install + command blocks

**Consistency issue:** The component inlines a "Safe to try" message but does not use the SafeToTryBanner component. This creates slightly different wording and styling compared to pages using SafeToTryBanner directly.

**Recommendation:** Either refactor to use SafeToTryBanner internally, or accept the slight divergence since the component appears on few pages.

### AtfCopyCommand

**Component quality:** Excellent. Clipboard copy with visual feedback.
**Usage:** Consistent across all pages that show CLI commands. Well-implemented.
**No issues.**

### CopyBlock

**Component quality:** Good. Used for multi-line code blocks.
**Usage:** /quickstart, /docs/first-protected-trade, /docs/5-minute-quickstart
**No issues.**

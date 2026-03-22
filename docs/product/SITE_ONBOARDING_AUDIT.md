# ATF Site Onboarding Audit

**Date:** 2026-03-21
**Branch:** `audit/site-onboarding-command-alignment`
**Scope:** All public-facing ATF onboarding pages, command surfaces, and key docs

---

## 1. Executive Summary

The ATF site onboarding experience is **mostly coherent** and significantly improved from earlier iterations. The golden path (trade, setup, doctor, verify) is now communicated on multiple pages and the key reusable components (SafeToTryBanner, DemoVsRealBlock, WhatHappensBlock) have been deployed to the highest-traffic pages.

### Biggest Strengths

1. **Golden path is extremely clear on /quickstart and /docs/first-protected-trade.** Both pages present the four commands in order with SafeToTryBanner and supporting explanations. These are the two best onboarding pages on the site.
2. **The "safe to try" message is strong.** SafeToTryBanner appears on /quickstart, /docs/quickstart, /docs/first-protected-trade, /docs/cli, and /atf. The wording is consistent: "No wallet. No on-chain execution. Takes ~5 seconds."
3. **Global install is now the recommended path** on all key pages. npx is clearly positioned as the alternative.
4. **Dual-surface output is a genuine differentiator** and is consistently mentioned across pages. The human + bot messaging is well-handled.
5. **CLI version pinning is consistent.** Every command block pulls from `getAtfCliVersion()`, preventing version drift across pages.

### Biggest Blockers

1. **Too many entry points compete for attention.** The homepage links to /try, /atf/simulator, /docs/first-protected-trade, /docs/5-minute-quickstart, /quickstart, and /receipts. A new user cannot tell which one to click first.
2. **The /atf page (the main product page) does not lead with install.** It leads with "Run This First" linking to doctor, which is step 3 of the golden path. This creates confusion about the correct starting point.
3. **Three separate "quickstart" pages exist** (/quickstart, /docs/quickstart, /docs/5-minute-quickstart). Each has a different structure, different depth, and different entry assumptions. This fragments the onboarding funnel.
4. **The /docs/5-minute-quickstart page is outdated.** It uses SingleCommandQuickstart and curl/API-first patterns, while the rest of the site has moved to CLI-first with `atf trade`. It also lacks SafeToTryBanner, DemoVsRealBlock, and WhatHappensBlock.
5. **The homepage golden path section shows commands as cards without copy buttons.** Users see `atf trade` but cannot copy it. This creates friction at the most important conversion point.

---

## 2. First-Time User Journey

### What a brand-new user likely experiences

1. **Lands on homepage (/)**. Sees "Guardrails for automated finance" and the hero CTA "Try ATF". The micro-nav has 7+ links. The user is unsure what to click.
2. **If they click "Try ATF"**, they go to /try, which is a guided sandbox flow hitting the API. This is good for zero-install evaluation but does not teach them the CLI golden path.
3. **If they scroll down** on the homepage, they see the golden path cards (trade, setup, doctor, verify). These show the commands but are not copyable. No install instruction is shown in this section.
4. **If they find /quickstart**, they get the best onboarding experience: install, trade, setup, doctor, verify in sequence with SafeToTryBanner and copy buttons. But discovering this page requires navigating through the micro-nav or finding it in the docs.
5. **If they find /docs/first-protected-trade**, they get a comprehensive walkthrough that also shows HTTP, Python, and TypeScript paths. Very good for developers who want depth.

### Where They Succeed

- /quickstart is an excellent page. If users land here, they know exactly what to do.
- /docs/first-protected-trade is the best deep-dive page on the site.
- SafeToTryBanner effectively removes fear before the first command.

### Where They Hesitate

- The homepage hero has two CTAs ("Try ATF" and "Try sandbox") that go to different experiences. Neither says "install and run a command."
- The homepage golden path section mentions commands but has no install block and no copy buttons. A user who wants to try immediately cannot.
- The /atf page leads with "Run This First: Doctor" which is step 3, not step 1.
- Three quickstart pages create decision paralysis. Users cannot tell which is the "real" one.

---

## 3. Golden Path Analysis

### How clearly the site communicates trade, setup, doctor, verify

| Page | Golden path shown? | Order correct? | Install block present? | Rating |
|---|---|---|---|---|
| / (homepage) | Yes (card grid) | Yes | No | **3/5** |
| /quickstart | Yes (full flow) | Yes | Yes (prominent) | **5/5** |
| /atf | Yes (section) | Yes | Yes (inline text) | **4/5** |
| /docs/quickstart | Partial (redirects to architecture) | No (goes to policy flow) | Yes | **3/5** |
| /docs/first-protected-trade | Yes (full flow) | Yes | Yes (prominent) | **5/5** |
| /docs/5-minute-quickstart | Mentioned in header text | Mostly | Via SingleCommandQuickstart | **3/5** |
| /docs/cli | Partial (doctor first) | No (doctor-first framing) | Yes | **3/5** |
| /docs/cli/commands | Yes (detailed) | Yes | Yes (prominent) | **5/5** |
| /launch | Not shown (just SingleCommandQuickstart) | N/A | Via component | **2/5** |

### Best pages for golden path

1. **/quickstart** - perfect four-step flow with install, SafeToTryBanner, and copy buttons
2. **/docs/first-protected-trade** - comprehensive with multiple integration paths
3. **/docs/cli/commands** - detailed command reference with golden path as first section

### Worst pages for golden path

1. **/docs/5-minute-quickstart** - mentions golden path in text but immediately pivots to API-key + curl flow
2. **/launch** - no golden path visibility, just SingleCommandQuickstart component
3. **/docs/cli** - leads with doctor (step 3) as "Run This First" instead of trade (step 1)

---

## 4. Simplicity Findings

### Where the site is easy

- **SafeToTryBanner** makes trying risk-free and immediately clear
- **`atf trade`** as the single first command is brilliantly simple
- **/quickstart** is genuinely a 60-second experience
- **DemoVsRealBlock** on /quickstart and /docs/first-protected-trade makes the mode distinction crystal clear
- **Copy buttons** on AtfCopyCommand work well and provide instant feedback

### Where it is still too complex

- **Homepage "Explore" grid has 12 cards.** That is too many choices for a first-time visitor. Decision paralysis.
- **/atf page has 11 major sections** (hero, golden path, doctor, burner quickstart, Helius setup, simulate-verify-execute, performance, toolbox, designed for, roadmap, get started, dev quickstart, updates). A new user scrolling this page will feel overwhelmed before reaching the action.
- **/docs/quickstart** teaches the policy model (define policy, issue permit, validate transaction, record receipt) as code snippets. This is the conceptual architecture, not the quickstart. The page title says "Quickstart" but the content is an architecture primer.
- **/docs/5-minute-quickstart** switches between CLI golden path (header text) and API/curl workflow (body content). Readers cannot tell which approach is primary.
- **/docs/dex-guardrails** and **/docs/perps** are deep reference pages that correctly stay in their lane, but their CLI quickstart sections use both global install and npx/cliTag interchangeably.

---

## 5. Trust / Safety Findings

### How well "safe to try" and demo-vs-real are communicated

**SafeToTryBanner adoption:**

| Page | SafeToTryBanner? | DemoVsRealBlock? | WhatHappensBlock? |
|---|---|---|---|
| / (homepage) | No | No | No |
| /quickstart | Yes | Yes | Yes |
| /atf | Yes (hero) | No | No |
| /docs/quickstart | Yes | No | No |
| /docs/first-protected-trade | Yes | Yes | Yes |
| /docs/cli | Yes | No | No |
| /docs/5-minute-quickstart | No | No | No |
| /docs/cli/commands | No | No | No |
| /launch | No (inlined in SingleCommandQuickstart) | No | No |
| /try | No | No | No (but sandbox messaging exists) |

### Remaining hesitation triggers

1. **Homepage has no SafeToTryBanner.** The most visited page does not reassure the user that trying is safe.
2. **WhatHappensBlock is only on 2 pages.** Most pages show commands without explaining what will actually happen when the user runs them.
3. **The word "firewall" in "Agent Transaction Firewall" can trigger hesitation.** New users may associate a firewall with complexity or blocking. The site does not address this concern early enough.
4. **/try page does not have SafeToTryBanner** even though it is the guided sandbox experience. The sandbox environment context is shown after the user clicks, not before.
5. **Several pages mention "mainnet" and "real wallet"** before adequately establishing that demo mode is the default and safe.

---

## 6. Top 5 Friction Points (Ranked by Impact on Conversion)

### 1. Too many competing entry points from the homepage
**Impact:** High. Users bounce because they cannot decide where to start.
**Pages affected:** / (homepage)
**Fix category:** Layout + Content

### 2. Homepage golden path section has no install block and no copy buttons
**Impact:** High. The most visible golden path display cannot be acted upon.
**Pages affected:** / (homepage)
**Fix category:** Design + Content

### 3. Three quickstart pages with different structures create confusion
**Impact:** Medium-High. Users who find one quickstart may later find another and lose confidence that they are following the canonical path.
**Pages affected:** /quickstart, /docs/quickstart, /docs/5-minute-quickstart
**Fix category:** Content + Information Architecture

### 4. /atf product page leads with doctor (step 3) instead of trade (step 1)
**Impact:** Medium. Users who land on /atf and follow the hero CTA will skip steps 1-2.
**Pages affected:** /atf
**Fix category:** Content + Layout

### 5. /docs/5-minute-quickstart is outdated and misaligned with CLI-first approach
**Impact:** Medium. Users arriving from homepage "5-min quickstart" link encounter an API-first flow that contradicts the rest of the site's CLI-first messaging.
**Pages affected:** /docs/5-minute-quickstart, / (homepage hero links to it)
**Fix category:** Content

---

## Appendix: Pages Audited

- `/` (homepage)
- `/atf`
- `/quickstart`
- `/try`
- `/launch`
- `/receipts`
- `/docs` (index)
- `/docs/quickstart`
- `/docs/first-protected-trade`
- `/docs/5-minute-quickstart`
- `/docs/cli`
- `/docs/cli/commands`
- `/docs/cli/guides/simulate-verify-execute`
- `/docs/dex-guardrails`
- `/docs/perps`
- `/docs/live-demo`

**Components reviewed:** SafeToTryBanner, DemoVsRealBlock, WhatHappensBlock, SingleCommandQuickstart, AtfCopyCommand, CopyBlock, TryAtfFlow, SimulateVerifyExecuteFlow

# ATF Site Page Scorecard

**Date:** 2026-03-21
**Branch:** `audit/site-onboarding-command-alignment`
**Scoring:** 1 (poor) to 5 (excellent)

---

## Scorecard

| Page | Install Clarity | Command Clarity | Safety / Trust Clarity | Golden Path Clarity | Visual Simplicity | Conversion Readiness | Overall |
|---|---|---|---|---|---|---|---|
| **/ (homepage)** | 1 | 3 | 2 | 3 | 2 | 3 | **2.3** |
| **/quickstart** | 5 | 5 | 5 | 5 | 5 | 5 | **5.0** |
| **/atf** | 4 | 4 | 4 | 4 | 3 | 3 | **3.7** |
| **/try** | 1 | 1 | 2 | 1 | 4 | 2 | **1.8** |
| **/launch** | 3 | 2 | 1 | 1 | 3 | 3 | **2.2** |
| **/receipts** | 1 | 1 | 3 | 1 | 4 | 2 | **2.0** |
| **/docs/quickstart** | 4 | 3 | 4 | 2 | 3 | 3 | **3.2** |
| **/docs/first-protected-trade** | 5 | 5 | 5 | 5 | 4 | 4 | **4.7** |
| **/docs/5-min-quickstart** | 3 | 2 | 1 | 2 | 2 | 2 | **2.0** |
| **/docs/cli** | 4 | 3 | 4 | 3 | 4 | 3 | **3.5** |
| **/docs/cli/commands** | 5 | 5 | 2 | 5 | 4 | 3 | **4.0** |
| **/docs/dex-guardrails** | 3 | 3 | 3 | 3 | 4 | 3 | **3.2** |
| **/docs/perps** | 3 | 3 | 3 | 3 | 4 | 3 | **3.2** |
| **/docs/live-demo** | 4 | 4 | 2 | 3 | 4 | 3 | **3.3** |

---

## Column Definitions

| Dimension | What it measures |
|---|---|
| **Install Clarity** | Is there a clear, prominent install command? Is global install recommended? Is the install always the same? |
| **Command Clarity** | Are commands consistent (short form after install), copyable, and unambiguous? |
| **Safety / Trust Clarity** | Is SafeToTryBanner present? DemoVsRealBlock? WhatHappensBlock? Other trust signals? |
| **Golden Path Clarity** | Is the four-step flow (trade, setup, doctor, verify) shown and clearly ordered? |
| **Visual Simplicity** | Is the page scannable? Is the section count reasonable? Is the layout focused? |
| **Conversion Readiness** | Does the page drive the user toward a clear next action? Is the CTA singular and obvious? |

---

## Rankings

### Best Pages (top 3)
1. **/quickstart** (5.0) - The canonical gold standard. Every page should aspire to this structure.
2. **/docs/first-protected-trade** (4.7) - Comprehensive, well-structured, all trust components present.
3. **/docs/cli/commands** (4.0) - Excellent reference with clear golden path and install.

### Worst Pages (bottom 3)
1. **/try** (1.8) - Web sandbox with no CLI bridge, no trust components, dead-end CTA.
2. **/docs/5-minute-quickstart** (2.0) - Outdated, API-first, missing trust components, wrong approach.
3. **/receipts** (2.0) - No commands, no install, no golden path, no CLI context.

### Biggest Score Gaps Within a Single Page
- **/try**: Visual Simplicity 4 vs Command Clarity 1 (gap of 3). Looks great but teaches nothing about the CLI.
- **/ (homepage)**: Install Clarity 1 vs Command Clarity 3 (gap of 2). Users see commands they cannot install.
- **/docs/cli/commands**: Command Clarity 5 vs Safety/Trust Clarity 2 (gap of 3). Excellent commands, no trust banner.

---

## Site-Wide Averages

| Dimension | Average |
|---|---|
| Install Clarity | 3.3 |
| Command Clarity | 3.1 |
| Safety / Trust Clarity | 2.9 |
| Golden Path Clarity | 2.9 |
| Visual Simplicity | 3.6 |
| Conversion Readiness | 2.9 |
| **Overall** | **3.1** |

**Interpretation:** The site has good-to-strong visual quality (3.6) but lags on safety/trust clarity and golden path clarity (both 2.9). The site looks polished but does not consistently guide first-time users to success. Conversion readiness is the weakest structural dimension, meaning most pages do not end with a clear, actionable CTA.

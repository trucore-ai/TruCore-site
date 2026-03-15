# ATF Outbound Communication Kit — Early User Acquisition

> **Internal use only.** Do not publish this file to the public site.
> Last updated: 2026-03-15

---

## 1. Positioning Anchor

**Canonical one-liner:**
TruCore ATF is policy-enforced transaction protection for AI trading agents on Solana.

**What ATF is:**
A non-custodial security layer that evaluates every bot or agent transaction against deterministic policies (spend caps, slippage bounds, protocol allowlists) before signing or execution. Every decision produces a tamper-evident cryptographic receipt.

**Who it is for right now:**
- Trading bot developers running swaps on Jupiter, Raydium, or Orca
- Autonomous agent builders (LangGraph, custom frameworks) making on-chain decisions
- Small algo/quant teams executing automated strategies on Solana
- DeFi integrators embedding swap, lending, or perps flows into products

**What concrete problem it solves:**
Bots and agents move fast. Without guardrails, a misconfigured strategy, a bad API response, or an agent hallucination can drain a wallet in a single transaction. ATF enforces hard policy boundaries before every transaction and produces a verifiable receipt proving enforcement happened. No custody. No new signing flow. Fail-closed by default.

**Why the current angle is trading bots / autonomous agents / integrators:**
These users already have execution risk they manage manually (or don't manage at all). They understand the value of deterministic policy checks. They need proof of enforcement for their own records and for stakeholders. The golden path (submit intent → receive receipt → verify independently) maps directly to how they already work.

---

## 2. Audience-Specific Message Variants

### Solana Bot Developers

**Hook:**
Your bot executes swaps — ATF enforces spend caps, slippage bounds, and protocol allowlists on every one, with a cryptographic receipt.

**Short paragraph:**
ATF sits between your bot logic and the chain. Before any swap hits Jupiter, Raydium, or Orca, ATF evaluates the intent against configurable policies — max spend per transaction, slippage bounds, protocol allowlists. If the intent violates policy, it gets denied. Every decision (allow or deny) produces a SHA-256 receipt you can verify independently. Non-custodial, no signing flow changes, works with your existing setup.

**CTA:**
Run your first protected trade in 5 minutes → trucore.dev/docs/first-protected-trade

---

### Agent Framework / Bot Platform Builders

**Hook:**
If your agents make autonomous on-chain decisions, ATF gives you a fail-closed policy layer with receipts for every action.

**Short paragraph:**
Agent frameworks let agents reason and act. ATF provides the missing enforcement boundary. Every agent intent is evaluated against deterministic policy before execution — no LLM in the approval loop. Each decision generates a tamper-evident receipt with a content_hash you can re-derive. If your platform manages multiple agents or strategies, ATF separates concerns with named profiles and isolated policy configs.

**CTA:**
Apply as a design partner for early API access → trucore.dev/atf/apply

---

### Crypto Algo Traders / Small Quant Teams

**Hook:**
ATF enforces hard limits on every trade your system executes and receipts every decision — protection your backtester can't give you in production.

**Short paragraph:**
You backtest and validate strategies carefully, but production execution is where risk lives. ATF wraps your execution path with deterministic policy checks — max SOL per trade, slippage caps, venue restrictions — and produces an auditable receipt for every single transaction. Nothing changes in your signing flow. If a strategy misbehaves or an API returns garbage, ATF denies the transaction before it reaches the chain. Fail-closed. Non-custodial.

**CTA:**
See how it works in 5 minutes → trucore.dev/docs/first-protected-trade

---

### DeFi Integrators / Execution Infra Teams

**Hook:**
ATF gives you deterministic guardrails and verifiable receipts for every swap, lend, or perps transaction flowing through your product.

**Short paragraph:**
You embed DeFi protocol interactions into your product. Your users expect safety. ATF enforces configurable policy (spend caps, slippage bounds, protocol allowlists) on every transaction before it hits the chain — without custodying keys or changing the signing path. Every enforcement decision produces a cryptographic receipt your system or your users can verify independently. Works today with Jupiter, Orca, Raydium swaps. Lending and perps support scaffolded.

**CTA:**
Talk to us about integration → trucore.dev/atf/apply

---

## 3. Channel-Specific Templates

### X Post (standalone)

```
Your trading bot runs 24/7 — what enforces limits when you're not watching?

ATF checks every transaction against policy (spend caps, slippage bounds, protocol allowlists) before signing.

Every decision gets a SHA-256 receipt you can verify independently.

Non-custodial. Solana-native. Fail-closed.

→ trucore.dev/docs/first-protected-trade
```

### X Reply (to bot dev / agent discussion)

```
We built ATF for exactly this — policy-enforced protection for trading bots and agents on Solana.

Every intent gets evaluated before execution. Every decision gets a verifiable receipt.

Non-custodial, no signing flow changes.

5-min golden path: trucore.dev/docs/first-protected-trade
```

### X DM

```
Hey — saw your work on [specific bot/agent/project]. We're building ATF at TruCore: deterministic policy enforcement for trading bots and agents on Solana.

It checks every transaction against configurable rules (spend caps, slippage, protocol allowlists) before signing and receipts every decision with a verifiable hash.

Non-custodial, no new dependencies, works with existing signing flows.

If you're interested, the golden path takes ~5 min:
trucore.dev/docs/first-protected-trade

Or if you want early API access and direct integration support:
trucore.dev/atf/apply

Happy to answer anything.
```

### Discord / Telegram Intro Message

```
Hey all — we're building ATF (Agent Transaction Firewall) at TruCore.

Quick summary: ATF is a non-custodial policy layer for trading bots and agents on Solana. It evaluates every transaction against deterministic rules (spend caps, slippage bounds, protocol allowlists) before signing, and produces a SHA-256 receipt for every decision.

It's built for bot devs, agent builders, and quant teams who want hard limits on what their systems can do in production.

Golden path (5 min): trucore.dev/docs/first-protected-trade
For builders: trucore.dev/builders
Design partner program: trucore.dev/atf/apply
```

### Founder Cold Email

```
Subject: Policy enforcement for trading bots — TruCore ATF

Hi [Name],

I'm [Sender] from TruCore. We build ATF — a non-custodial policy enforcement layer for trading bots and autonomous agents on Solana.

ATF evaluates every transaction against deterministic rules (spend caps, slippage bounds, protocol allowlists) before signing. Every decision produces a cryptographic receipt that can be verified independently. Fail-closed by default.

I reached out because [specific reason — e.g., "your team runs automated strategies on Jupiter" / "your agent framework executes swaps autonomously" / "you mentioned execution risk in a recent post"].

If this is relevant, two options:
1. Try the golden path yourself (~5 min): trucore.dev/docs/first-protected-trade
2. Apply for the design partner program (early API access + direct integration support): trucore.dev/atf/apply

Happy to answer any questions or hop on a 15-minute call if useful.

[Sender]
TruCore
```

### Short Follow-Up Email

```
Subject: Re: Policy enforcement for trading bots — TruCore ATF

Hi [Name],

Following up briefly. If you want to see what ATF does in practice, the fastest path is:

trucore.dev/docs/first-protected-trade

Takes about 5 minutes. Submit a swap intent, receive a receipt, verify it independently.

Happy to help with anything if you give it a try.

[Sender]
```

---

## 4. Why Try It Now?

| Reason | Detail |
|---|---|
| **Early access / design partner path** | Design partners get early API access, direct integration support from TruCore engineers, and input into features and roadmap. Apply at /atf/apply. |
| **First protected trade in 5 minutes** | The golden path is live. Submit a swap intent, receive a policy decision and receipt, verify it independently. Works with HTTP, Python, TypeScript, or CLI. |
| **Receipts have real value** | Every decision produces a SHA-256 content_hash from stable JSON serialization. Re-hash locally and the digest matches. This is auditable proof of enforcement — useful for your own records, stakeholders, or compliance. |
| **Bot-friendly integration** | Non-custodial. No signing flow changes. No new dependencies. Works with existing Jupiter/Raydium/Orca swap flows. Integration is a single HTTP call. |
| **Solana-native** | ATF is built for Solana from day one. Helius-first RPC. Jupiter, Orca, Raydium supported. Lending venues (Solend, Marginfi, Kamino) scaffolded. Not a chain-agnostic product bolted onto Solana. |
| **Fail-closed defaults** | If policy evaluation fails or encounters an error, the transaction is denied. Safe defaults are always on. This is the behavior quant teams and agent builders need. |

---

## 5. Objection Handling

**"We already validate transactions ourselves."**
ATF doesn't replace your validation. It adds a deterministic enforcement boundary that produces independently verifiable receipts. Your internal checks might catch the same issues, but can you prove to a third party that enforcement happened? ATF receipts are tamper-evident — the content_hash is derivable from the payload. That's the difference between checking and proving.

**"This looks like more middleware."**
ATF is one HTTP call before signing. It evaluates the intent, returns allow/deny with reason codes, and produces a receipt. If that's middleware, it's the smallest possible kind. No SDK lock-in, no new dependencies, no process changes. Remove it and your bot works exactly as before.

**"We don't want friction in our execution path."**
ATF adds a single network call. Policy evaluation is deterministic — no LLM, no external lookups, no variable latency. The alternative to this "friction" is an unconstrained execution path where a bug, bad data, or agent error drains a wallet in one transaction.

**"We're not using autonomous agents yet."**
ATF works for any automated execution — trading bots, scripts, cron jobs, anything that submits transactions programmatically. Agents are the highest-risk case, but spend caps and slippage bounds are useful for any bot that executes without human confirmation.

**"How is this different from policy checks in the bot?"**
Three differences: (1) ATF enforces policy outside the bot, so a bug in bot logic can't bypass the check. (2) Policy is configured separately from bot code — change limits without redeploying. (3) Every decision produces a cryptographic receipt that anyone can verify. In-bot checks give you none of these.

---

## 6. Link Strategy — CTA Destination Matrix

| Context | Best CTA | URL |
|---|---|---|
| Cold outreach (email, DM) | First protected trade | /docs/first-protected-trade |
| Technical reply (X, Discord) | First protected trade | /docs/first-protected-trade |
| Builders page reference | For builders | /builders |
| Demo / proof ask | First protected trade | /docs/first-protected-trade |
| Design partner ask | Apply | /atf/apply |
| Receipt verification question | Verify | /verify |
| General "what is this" | ATF overview | /atf |
| Sandbox / interactive | Simulator | /atf/simulator |

**Guidance:**
- Default CTA for outreach is **/docs/first-protected-trade** — it's the proof path.
- Use **/atf/apply** only when the person has expressed interest or is clearly a fit for the design partner program.
- Use **/builders** when the context is "I build bots" or "I'm a developer" without a specific ask.
- Use **/verify** only when someone asks about receipt integrity or verification specifically.
- Do not link to portal in cold outreach. Portal is post-activation.

---

## 7. Soft Rules — Outreach Do / Don't

### Do

- Lead with **practical protection** — spend caps, slippage bounds, protocol allowlists.
- Lead with **receipts** — tamper-evident, independently verifiable, SHA-256.
- Keep claims **precise and provable**. If it's not live, don't claim it.
- Use **infrastructure-grade language** — deterministic, fail-closed, non-custodial.
- Make the CTA **a concrete action** — "run your first protected trade" not "learn more."
- Mention **Solana-native** positioning — Jupiter, Raydium, Orca by name.
- Personalize outreach when possible — reference their specific bot, protocol, or public work.

### Don't

- Don't lead with **control plane** or managed platform features.
- Don't surface **pricing** — there is no public pricing.
- Don't mention **premium analytics** — internal only.
- Don't sound like **generic compliance software** — this is for bot devs, not enterprise risk teams.
- Don't use **hype language** — no "revolutionary AI security" or "next-gen protection."
- Don't use **vague AI-security framing** — be specific about what ATF does.
- Don't bury the CTA — every message needs a clear next step.
- Don't promise features that aren't live (lending and perps are scaffolded, not shipped).
- Don't use "blockchain security" as a category — ATF is transaction-level policy enforcement.

---

## 8. Site Alignment Audit

**Pages reviewed for outreach support:**

| Page | Status | Notes |
|---|---|---|
| **/builders** | ✅ Strong | Clear audience targeting, three-step path, correct CTAs. Well-aligned with outreach messaging. |
| **/atf/apply** | ✅ Strong | Design partner program clearly scoped. "Who this is for" matches outreach audiences. |
| **/docs/first-protected-trade** | ✅ Strong | Golden path is detailed, multi-language, and receipt-focused. Best proof artifact for outreach. |
| **/verify** | ✅ Adequate | Functional verification utility. Next steps link back to golden path and builders. |

**Recommended small improvement:**

The **/builders** page hero says *"Protect your bot before it hits the chain."* — this is good. However, the page does not include a one-line anchor sentence that matches the canonical positioning used in outreach: *"Policy-enforced transaction protection for AI trading agents."*

**Proposed fix:** Add the canonical positioning line as a subtitle or lead sentence on /builders, directly below the hero. This ensures that anyone arriving from outreach sees consistent language immediately.

This is a low-risk, one-line copy addition. It can be implemented in a follow-on commit if desired — not included in this prompt to keep scope clean.

---

## 9. Glossary of Terms (for outreach consistency)

Use these terms consistently across all channels:

| Term | Use |
|---|---|
| Policy enforcement | Preferred over "security checks," "validation," or "guardrails" in technical contexts |
| Receipt | The cryptographic proof artifact. Always "receipt," never "certificate" or "attestation" |
| Content hash | The SHA-256 hash in the receipt. Use `content_hash` in technical contexts |
| Fail-closed | ATF denies by default on error. Use this term — it's precise and familiar to the audience |
| Non-custodial | ATF never holds keys. Always mention this early |
| Golden path | The first-protected-trade flow. Use "golden path" internally, "first protected trade" externally |
| Design partner | The early access program. Not "beta tester" or "early adopter" |
| Intent | The transaction request before evaluation. Not "request" or "order" |
| Decision | The allow/deny result. Not "response" or "verdict" |

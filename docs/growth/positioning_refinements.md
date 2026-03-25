# Positioning Refinements

> Three versions of ATF positioning - each clearer, simpler, and grounded in proof.
> Replaces jargon-first messaging with outcome-first language.

---

## Version 1 - One-Liner

### Before (current)

> "ATF now issues canonical tamper-evident receipts for real trades."

### Problems

- "Canonical tamper-evident receipts" is jargon
- No problem statement - just a feature announcement
- No human benefit

### After (v2)

> **ATF checks your trade before it executes and gives you a verifiable receipt after it settles.**

### Why it's better

- States what it does in one breath
- Two clear actions: checks before, receipt after
- "Verifiable" is understood; "canonical tamper-evident" is not

### Alternate one-liners (test these)

> **A. "Policy before execution. Proof after settlement. One command."**

> **B. "ATF is a checkpoint for agent trades - approve first, receipt after."**

> **C. "Stop trusting logs. Get proof your trade was authorized before it ran."**

---

## Version 2 - Two-Sentence Explanation

### Before (current)

> "ATF evaluates policy before execution and issues canonical tamper-evident
> receipts after settlement. Receipts use SHA-256 content hashes over
> JCS-canonicalized data."

### Problems

- Second sentence is implementation detail, not value
- "JCS-canonicalized" means nothing to 99% of readers
- Doesn't answer "why should I care?"

### After (v2)

> **ATF checks every trade against your policy rules before anything touches the chain.
> After the trade settles, you get a receipt that proves what was authorized and what happened - and anyone can verify it wasn't tampered with.**

### Why it's better

- "Your policy rules" - makes it personal
- "Before anything touches the chain" - clear timing
- "Anyone can verify" - benefit without implementation detail

### Alternate two-sentence versions

> **A. "Your agent submits a trade. ATF approves or denies it before execution, then issues a receipt after settlement - verifiable by anyone, fabricated by no one."**

> **B. "ATF sits between your bot and the blockchain. It enforces your rules before the trade runs and gives you a tamper-proof receipt after it settles."**

---

## Version 3 - Ten-Second Explanation

### Before (current)

> "ATF sits between your agent/bot and on-chain execution:
> 1. Before execution: ATF evaluates policy (approve/deny/flag)
> 2. During execution: Trade executes on-chain (currently Jupiter swaps on Solana)
> 3. After execution: ATF issues a canonical tamper-evident receipt"

### Problems

- Reads like a spec, not an explanation
- Numbered steps feel like documentation
- "Canonical tamper-evident receipt" again

### After (v2)

> **Your bot or agent wants to trade. Before it can, ATF checks the trade
> against your rules - token limits, slippage, allowlists. If it passes,
> the trade runs on-chain through Jupiter. After it settles, ATF issues
> a receipt: what was authorized, what happened, and a hash anyone can
> verify. One command to try it: `npx @trucore/atf@latest trade`.**

### Why it's better

- Starts with what the user has (a bot/agent that trades)
- Names specific policy examples (limits, slippage, allowlists)
- Ends with CTA, not a feature list
- "A hash anyone can verify" replaces "SHA-256 over JCS-canonicalized data"

### Alternate ten-second versions

> **A. "Think of ATF as a guard for your trading bot. Submit a trade →
> ATF checks it against your rules → if approved, it executes on Solana
> via Jupiter → then you get a receipt proving what happened. The receipt
> is verifiable - if anyone changes a field, the hash breaks. Try it:
> `npx @trucore/atf@latest trade` - no wallet needed to see the format."**

> **B. "Right now, when your agent trades, you only know what your logs
> say happened. ATF adds two things: a policy check before the trade runs,
> and a receipt after it settles. The receipt is issued by ATF's backend,
> not your agent - so it can't be faked. Run one trade and see:
> `npx @trucore/atf@latest trade`."**

---

## Positioning Principles (going forward)

| Principle | Example |
|-----------|---------|
| Lead with the problem, not the feature | "Your agent trades with no proof" → not "We issue receipts" |
| Name the outcome, not the mechanism | "Verifiable receipt" → not "SHA-256 over JCS" |
| One CTA, stated once | `npx @trucore/atf@latest trade` at the end, not repeated |
| Address trust before asking for action | "No wallet needed" before "try this command" |
| Use words a builder scans in 2 seconds | "checks before, receipt after" → not "pre-execution policy enforcement and post-execution canonical receipt issuance" |

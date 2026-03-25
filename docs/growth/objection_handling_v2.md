# Objection Handling v2

> Upgraded from reply_bank.md - sharper answers, shorter responses, stronger proof anchoring.
> Each answer: max 3 sentences for DMs, expanded version for threads/docs.

---

## "How is this different from logs?"

### v1 (reply_bank - 7 lines)

Long explanation of three differences, ends with abstract distinction.

### v2 (DM-length)

```text
Logs record what your system says happened.
ATF checks the trade before it runs and issues a receipt after it settles.
The receipt is issued by ATF's backend - your agent can't fabricate it.
```

### v2 (expanded - for threads/docs)

```text
Logs and ATF receipts answer different questions:

Logs: "What did my system do?"
ATF receipt: "Was this trade authorized, and what actually happened?"

The key difference is timing and trust:
- Policy is checked BEFORE execution, not logged after
- The receipt is issued by ATF's backend, not by your agent
- Anyone can verify the receipt hash - if a field changes, the hash breaks

You keep your logs. ATF adds proof.
```

---

## "Is this just simulation?"

### v1 (not in reply_bank - gap)

Not previously addressed.

### v2 (DM-length)

```text
No. The default mode runs without a wallet so you can see the receipt format.
Add your wallet with `npx @trucore/atf@latest setup` and it executes
real Jupiter swaps on Solana mainnet.
```

### v2 (expanded)

```text
Two modes:

1. Safe mode (default) - no wallet, no API calls, shows you the full
   receipt format with real hash computation. Good for evaluating the
   output before committing.

2. Live mode - after `setup`, ATF executes real Jupiter swaps on Solana
   mainnet through your wallet. Real tokens, real on-chain transactions,
   real receipts.

Safe mode exists so you can evaluate without risk.
Live mode is one command away when you're ready.
```

---

## "Do I need a wallet?"

### v1 (not in reply_bank - gap)

Not previously addressed.

### v2 (DM-length)

```text
Not to try it. Run `npx @trucore/atf@latest trade` with no wallet  - 
you'll see the full receipt format. Wallet only needed for real trades.
```

---

## "Is this safe to run?"

### v1 (not in reply_bank - gap)

Not previously addressed.

### v2 (DM-length)

```text
Yes. Default mode doesn't touch your wallet or funds.
Your private key is never sent to ATF - it stays local for signing.
The CLI is open source: github.com/trucore-ai/agent-transaction-firewall
```

---

## "What is a receipt actually proving?"

### v1 (not in reply_bank - gap)

Not previously addressed.

### v2 (DM-length)

```text
Three things: (1) the trade was checked against policy before it ran,
(2) the execution result after it settled, (3) a hash that breaks if
anyone changes the data. It's proof of authorization and outcome.
```

### v2 (expanded)

```text
A receipt proves:

1. Authorization - policy rules were evaluated before execution.
   If denied, nothing touches the chain.
2. Outcome - what actually happened: route, amounts, tx signature.
3. Integrity - SHA-256 hash over the receipt fields. Change any
   field and the hash doesn't match.

The receipt is issued by ATF's backend, not your agent.
Your agent can prove it was authorized without anyone trusting
your agent's own logs.
```

---

## "Are these receipts signed?"

### v1 (reply_bank - 6 lines)

Honest but long. Buries the key point.

### v2 (DM-length)

```text
Not yet - currently tamper-evident via content hashing (SHA-256).
The receipt is backend-issued, so it can't be fabricated client-side.
Cryptographic signing is on the roadmap.
```

---

## "Can bots parse this?"

### v1 (reply_bank - 7 lines)

Accurate but starts with "Yes" then lists formats.

### v2 (DM-length)

```text
Yes - every receipt includes structured JSON and a bot_line field:
ATF|APPROVED|Jupiter|SAFE|tx=...
One line, pipe-delimited, built for log parsing.
```

---

## "Does this work with real swaps?"

### v1 (reply_bank - 7 lines)

Accurate but verbose.

### v2 (DM-length)

```text
Yes - real Jupiter swaps on Solana mainnet.
Run `npx @trucore/atf@latest setup` to connect your wallet,
then `trade` to execute. Receipt includes the on-chain tx signature.
```

---

## "Is this just a CLI wrapper?"

### v1 (reply_bank - 8 lines)

Good content but too long for DMs.

### v2 (DM-length)

```text
The CLI is the entry point. Under the hood it's an API:
/v1/intents/protect (policy check) → your agent executes →
/v1/executions/finalize (receipt). For bots, you call the API
directly - ~20 lines of code.
```

---

## "Why should I trust ATF's policy decisions?"

### v1 (reply_bank - 6 lines)

Reasonable but doesn't address the core fear.

### v2 (DM-length)

```text
You don't have to trust blindly - every approval shows which rules
were checked and why. You configure the rules (token limits, slippage,
allowlists). If ATF denies, nothing touches the chain.
```

---

## "Is anyone else using this?"

### v1 (not in reply_bank - gap)

Not previously addressed.

### v2 (DM-length)

```text
We're onboarding the first external users now. [Update with real
number as soon as data exists.] The spec and CLI are public  - 
you can evaluate it independently.
```

**Note:** Update this answer weekly. Replace bracket text with real numbers from `conversion_tracker.md` as they come in.

---

## "What chains do you support?"

### v1 (reply_bank - 3 lines)

Fine but could be sharper.

### v2 (DM-length)

```text
Solana only right now - Jupiter swaps. The receipt format is
chain-agnostic, but we shipped where the agent and bot activity is.
```

---

## Quick Reference - DM Reply Length Guide

| Objection | Max reply length |
|-----------|-----------------|
| "How is this different from logs?" | 3 sentences |
| "Is this just simulation?" | 3 sentences |
| "Do I need a wallet?" | 2 sentences |
| "Is this safe?" | 3 sentences |
| "What is a receipt proving?" | 3 sentences |
| "Are receipts signed?" | 3 sentences |
| "Can bots parse this?" | 3 sentences |
| "Is anyone else using this?" | 2 sentences |
| Everything else | 3 sentences max, then offer to expand |

---

## Reply Principles (v2)

| v1 pattern | v2 upgrade |
|------------|------------|
| Lead with "Yes" then explain | Lead with the answer, then one proof point |
| 5–8 line replies | 2–3 sentence replies |
| Technical mechanism first | Outcome first, mechanism if asked |
| No preemptive trust signals | "No wallet needed" / "open source" before CTA |
| Abstract proof (hash values) | Concrete proof (run this command, see this output) |

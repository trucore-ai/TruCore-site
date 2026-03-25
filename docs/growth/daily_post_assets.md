# Daily Post Assets

> Ready-to-copy posts for each day of the 7-day campaign.
> All examples are technically accurate. Representative output is labeled.

---

## DAY 1 - FIRST PROOF DROP

**Platform:** X  
**Proof asset:** Receipt A (redacted real - mainnet 2026-03-19)  
**Format:** Single post

### Post

```text
ATF now issues canonical tamper-evident receipts for real trades.

One command:
  npx @trucore/atf@latest trade

One result:
  ✓ Policy approved before execution
  ✓ Jupiter swap executed on Solana
  ✓ Canonical receipt issued by ATF backend

Receipt hash: 996f95ed83d4c5da
Verify: npx @trucore/atf@latest verify <receipt-id>

Real mainnet execution. No simulation.
```

### CTA

"Try it - one command, one protected trade, one canonical receipt."

---

## DAY 2 - THREAD (HOW IT WORKS)

**Platform:** X thread  
**Proof asset:** Receipt B (redacted real - full flow walkthrough)  
**Format:** 5-post thread

### Post 1/5

```text
We just shipped canonical receipts for ATF.

Here's what that means - a thread on the first real tamper-evident
execution receipts for agent-driven trades.
```

### Post 2/5

```text
Step 1: Intent

The agent sends a trade intent to ATF.
ATF evaluates it against policy - token limits, slippage, allowlists.

If policy passes → APPROVED.
If not → DENIED. No execution happens.

This approval happens before any on-chain transaction.
```

### Post 3/5

```text
Step 2: Execution

The agent executes the approved swap through Jupiter on Solana.
Real tokens. Real routing. Real on-chain transaction.

TX: 26Raeks...Cy877a (mainnet)

ATF doesn't execute - it approves. The agent executes.
```

### Post 4/5

```text
Step 3: Canonical Receipt

After execution, the agent calls ATF's finalize endpoint.
ATF issues a canonical receipt:

  receipt_id:   rcpt-...
  receipt_hash: 996f95ed83d4c5da
  receipt_url:  https://verify.trucore.xyz/tx/rcpt-...

The hash is deterministic SHA-256 over canonical fields.
If any field changes, the hash changes. That's tamper evidence.
```

### Post 5/5

```text
Why this matters:

Most agent infra has no post-execution proof.
ATF provides:
  → Pre-execution policy enforcement
  → Post-execution canonical receipt
  → Deterministic verification

Readable for humans. Structured for agents.

Try it: npx @trucore/atf@latest trade
Docs: https://trucore.xyz/atf
```

### CTA

"Try it: `npx @trucore/atf@latest trade`"

---

## DAY 3 - BUILDER ANGLE

**Platform:** X / Discord / developer communities  
**Proof asset:** Dry-run output (Example B) + bot_line format  
**Format:** Single post

### Post

```text
For bot builders:

ATF canonical receipts = structured post-execution proof.

receipt_id  → index it
receipt_hash → verify it
receipt_url  → inspect it

Bot line (one-liner for log parsing):
  ATF|APPROVED|Jupiter|SAFE|tx=req-7f3a9c2e...

Machine summary:
  → action_required: false
  → suggested_action: verify
  → suggested_command: atf verify <id>

Approved before execution. Finalized after.
Backend-issued. Deterministic. Tamper-evident.

If finalize fails, no receipt is fabricated.
The system is honest under failure.

npx @trucore/atf@latest trade
```

### CTA

"If you're building a Solana bot, I can send the integration example - ~20 lines of Python."

---

## DAY 4 - FAILURE HONESTY

**Platform:** X  
**Proof asset:** Failure case (Example C from canonical_proof_examples.md)  
**Format:** Single post

### Post

```text
What happens when ATF finalization fails?

Real scenario:
  ✓ Policy approved the trade
  ✓ Jupiter swap succeeded on-chain
  ✗ ATF finalize call failed (503)

Result:
  receipt_id:   (none - finalize failed)
  receipt_url:  (none - finalize failed)
  receipt_hash: (none - finalize failed)

  ⚠ The swap succeeded but no canonical receipt was issued.
  Execution flagged for reconciliation.

ATF did NOT fabricate a receipt.
ATF did NOT pretend finalization succeeded.

This is how an honest system handles failure.
The trade happened - but without backend confirmation,
no receipt is generated. Period.

Most infra hides failures. We surface them.
```

### CTA

"If you want to see how we handle failure, run one trade: `npx @trucore/atf@latest trade`"

---

## DAY 5 - REPEAT PROOF

**Platform:** X  
**Proof asset:** Receipt C (fresh execution - new token pair or amount)  
**Format:** Single post

### Post

```text
Another canonical ATF receipt - day 5.

  Route:    Jupiter
  Decision: APPROVED
  Status:   success
  Receipt:  backend-issued, tamper-evident

Different day. Different trade. Same flow:
  1. ATF approves before execution
  2. Swap executes on Jupiter / Solana
  3. ATF finalizes and issues canonical receipt

Consistency is the proof.

npx @trucore/atf@latest trade
```

### CTA

"First 3 external users are running protected trades. You can be next."

_Update the external user count with real numbers as they come in._

---

## DAY 6 - USE CASE

**Platform:** X / Discord  
**Proof asset:** Integration snippet from canonical_bot_integration_examples.md  
**Format:** Single post with code

### Post

```text
How a bot uses ATF in production - 6 steps:

1. Send intent to ATF       → POST /v1/intents/protect
2. Check if approved         → decision == "approved"
3. Execute the swap          → Jupiter / Solana
4. Call finalize             → POST /v1/executions/finalize
5. Get canonical receipt     → receipt_id, receipt_hash, receipt_url
6. If finalize fails         → mark for reconciliation, don't fabricate

Python integration: ~20 lines
Node.js integration: ~15 lines

No SDK dependency. Standard HTTP.
The CLI is for trying it. The API is for integrating it.

Try the CLI first:
  npx @trucore/atf@latest trade

Then integrate:
  https://trucore.xyz/atf
```

### CTA

"Building agent infra? I can walk you through the integration in 15 minutes."

---

## DAY 7 - SUMMARY / MOMENTUM

**Platform:** X  
**Proof asset:** Multiple receipt hashes from the week  
**Format:** Single post (recap)

### Post

```text
7 days of canonical ATF receipts.

What we showed:
  → Real mainnet swaps through Jupiter
  → Policy approved before every execution
  → Canonical receipts issued after settlement
  → Honest failure handling (no fabrication)
  → Machine-readable format for bots and agents

What's real:
  - Receipt hash: 996f95ed83d4c5da (day 1)
  - [X] external users ran protected trades
  - [X] conversations with builders

Approved before execution.
Finalized after settlement.
Canonical tamper-evident receipts.

This is agent transaction infrastructure.

npx @trucore/atf@latest trade
https://trucore.xyz/atf
```

_Update [X] placeholders with real numbers from the week._

### CTA

"If you've been watching - now's the time to try one protected trade."

---

## Post Guidelines

1. **Keep it short** - under 280 characters for the hook, expand in thread or follow-up only
2. **Include proof** - every post has a receipt hash, CLI command, or output example
3. **No hype words** - no "revolutionary," "game-changing," "first-ever"
4. **Label clearly** - real output is real, representative is labeled
5. **One CTA per post** - don't split attention
6. **Cross-post selectively** - X is primary, Discord/Farcaster for Days 3 and 6

---

## Platform Notes

| Platform | Formatting | Notes |
|----------|-----------|-------|
| X | Code blocks render as images or plain text | Test formatting before posting |
| Discord | Supports markdown code blocks | Post in appropriate channel (dev, general) |
| Farcaster | Limited formatting | Keep posts shorter, link to docs for detail |
| Telegram | Markdown supported | Use for dev community channels |

---

_All posts reuse content from canonical_social_posts.md, canonical_proof_examples.md,
and shareable_proof_examples.md. No new content invented - only sequenced and adapted._

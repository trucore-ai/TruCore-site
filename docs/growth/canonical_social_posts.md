# Canonical Social Posts

Ready-to-publish post sets using canonical receipt language.
All examples are technically accurate. Representative output is labeled.

---

## POST SET 1 - Simple Proof Post

**Platform:** X / Discord / Farcaster  
**Goal:** One command, one execution, one canonical receipt.

```text
ATF now issues canonical tamper-evident receipts.

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

**Alt (shorter):**

```text
First canonical ATF receipts are live.

Approved before execution → traded on Jupiter → receipt issued after.

Deterministic hash. Backend-issued. Tamper-evident.

npx @trucore/atf@latest trade
```

---

## POST SET 2 - Thread

**Platform:** X thread / blog  
**Goal:** Walk through the full canonical receipt flow.

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

---

## POST SET 3 - Builder / Bot Angle

**Platform:** X / Discord / developer communities  
**Goal:** Machine-readable receipt structure for bot operators.

```text
If you're building Solana bots or agent workflows,
ATF canonical receipts give you structured post-execution proof.

After finalization, you get:

{
  "receipt_id": "rcpt-a1b2c3d4e5f6",
  "receipt_url": "https://verify.trucore.xyz/tx/rcpt-a1b2c3d4e5f6",
  "receipt_hash": "a1b2c3d4e5f6789..."
}

↑ representative example

Machine summary:
  → receipt_id for indexing
  → receipt_hash for tamper detection
  → receipt_url for human verification

Bot integration:
  1. Send intent → ATF approves
  2. Execute swap → Jupiter / Solana
  3. Call finalize → get canonical receipt
  4. If finalize fails → mark for reconciliation

No client-side receipt fabrication.
Backend-issued only.

npx @trucore/atf@latest trade
```

**Alt (compact):**

```text
For bot builders:

ATF canonical receipts = structured post-execution proof.

receipt_id  → index it
receipt_hash → verify it
receipt_url  → inspect it

Approved before execution. Finalized after.
Backend-issued. Deterministic. Tamper-evident.

If finalize fails, no receipt is fabricated.
The system is honest under failure.

Docs: https://trucore.xyz/atf
```

---

## Labeling Guide

| Label | Meaning |
|---|---|
| _(real)_ | Actual output from a live mainnet or devnet execution |
| _(representative)_ | Structurally accurate example, not from a specific execution |
| _(redacted real)_ | Real execution with sensitive fields shortened or masked |

In the posts above:
- `receipt_hash: 996f95ed83d4c5da` - **redacted real** (from mainnet execution 2026-03-19)
- `TX: 26Raeks...Cy877a` - **redacted real** (Solana mainnet)
- JSON block in Post Set 3 - **representative** (marked in post)
- All flow descriptions - **real** (reflect shipped ATF behavior)

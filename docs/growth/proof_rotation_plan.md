# Proof Rotation Plan

> Avoid repeating the same proof. Each day uses a different asset.

---

## 7-Day Rotation

| Day | Proof Type | Source | Label |
|-----|-----------|--------|-------|
| 1 | **Receipt A** - Real mainnet success | canonical_proof_examples.md Example A | Redacted real |
| 2 | **Receipt B** - Full flow walkthrough | canonical_social_posts.md Post Set 2 (thread) | Redacted real |
| 3 | **Dry-run** - bot_line + machine_summary | canonical_proof_examples.md Example B + shareable_proof_examples.md | Representative |
| 4 | **Failure case** - finalize failure | canonical_proof_examples.md Example C | Representative |
| 5 | **Receipt C** - Fresh execution | New real run (see Generation below) | Real or redacted real |
| 6 | **Bot example** - integration snippet | canonical_bot_integration_examples.md (Python) | Representative |
| 7 | **Summary** - multiple receipt hashes | Compilation from Days 1–6 | Mixed |

---

## Proof Details

### Receipt A (Day 1)

```
Classification : swap
Decision       : APPROVED
Status         : success
TX Signature   : 26Raeks...Cy877a (Solana mainnet)
Receipt Hash   : 996f95ed83d4c5da
```

Source: Real mainnet execution 2026-03-19 via OpenClaw atf-agent.

---

### Receipt B (Day 2)

Same execution as Receipt A, but presented as a 5-part thread
walking through intent → approval → execution → finalize → receipt.

Reuses the same TX signature and receipt hash but surfaces different
details in each thread post (policy reasons, execution route, receipt fields).

---

### Dry-Run (Day 3)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ ATF DRY RUN
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Decision       : APPROVED
Policy         : All policies passed
DRY RUN - no execution performed.

Receipt:
  id   : (none - dry run)
  hash : (none - dry run)
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Plus bot_line:
```
ATF|APPROVED|Jupiter|SAFE|tx=req-7f3a9c2e...
```

Source: Representative output based on real dry-run flow.

---

### Failure Case (Day 4)

```
⚠ WARNING: Finalization failed
  Error  : ATF finalize request failed: 503 Service Unavailable
  Action : Receipt was NOT issued

Receipt:
  id   : (none - finalize failed)
  url  : (none - finalize failed)
  hash : (none - finalize failed)
```

Source: Representative output based on real error handling code.

---

### Receipt C (Day 5)

A fresh execution run - different from Receipt A.

Options:
- Different amount (e.g., 0.005 SOL instead of 0.001 SOL)
- Different token pair (if supported)
- Executed on a different date (campaign Day 5)

Must be generated before Day 5 using the methods below.

---

### Bot Example (Day 6)

Python integration snippet showing the 6-step flow:

```python
# 1. Send intent to ATF
# 2. Check if approved
# 3. Execute the swap
# 4. Call finalize
# 5. Trust only backend fields
# 6. Handle finalize failure
```

Source: canonical_bot_integration_examples.md - no new code invented.

---

### Summary (Day 7)

Compilation of receipt hashes and stats from the week:

```
Day 1: 996f95ed83d4c5da (real mainnet)
Day 5: [new hash from Receipt C]
External users: [X]
Conversations: [X]
```

---

## How to Generate New Receipts

### Option 1: Real CLI Execution

```bash
# Run a real protected trade
npx @trucore/atf@latest trade

# The output includes receipt_id, receipt_hash, receipt_url
# Capture the output for use in posts
```

- Requires: API key configured, wallet funded, mainnet RPC
- Produces: Real receipt with unique hash
- Label: **real** or **redacted real** (if fields are shortened)

### Option 2: Demo Mode

```bash
# Run without API key - produces demo receipt
npx @trucore/atf@latest trade
```

- Requires: Nothing (no API key needed)
- Produces: Demo receipt with demo_ prefix
- Label: **representative** - clearly mark as demo in posts

### Option 3: OpenClaw atf-agent

```bash
cd ~/repo/openclaw-atf-agent
python -m commands.trade --amount 0.001
```

- Requires: Full agent setup, .env configured
- Produces: Real receipt through the full agent → ATF → Jupiter → finalize flow
- Label: **real**

---

## Refresh Schedule

| When | Action |
|------|--------|
| Before Day 1 | Verify Receipt A is still valid and output matches |
| Before Day 5 | Generate Receipt C (fresh execution) |
| Before Day 7 | Compile all receipt hashes from the week |
| Weekly (if campaign extends) | Generate 1–2 new receipts per week |

---

## Labeling Rules

Every proof example in a post or DM must be labeled:

| Label | When to Use | Example |
|-------|-------------|---------|
| **(real)** | Actual output from a live mainnet execution | `Receipt hash: 996f95ed83d4c5da` |
| **(redacted real)** | Real execution with sensitive fields shortened | `TX: 26Raeks...Cy877a` |
| **(representative)** | Structurally accurate, not from a specific execution | JSON block in bot integration post |
| **(demo)** | Output from demo mode (no API key) | `receipt_id: demo_20260320...` |

### Labeling in Posts

- For X posts: add `↑ representative example` below code blocks when applicable
- For DMs: mention "(this is from a real mainnet trade)" or "(representative example)"
- For threads: label once in the first post, don't repeat every post

### What NOT to do

- Never present demo output as real without labeling
- Never present representative examples as specific executions
- Never invent receipt hashes - use real hashes or clearly label as representative

---

## Anti-Repetition Checks

Before posting each day, verify:

1. **Different proof type** - not the same format as yesterday
2. **Different angle** - success vs. failure vs. integration vs. dry-run
3. **Different audience focus** - bot builders vs. agent devs vs. infra teams
4. **Fresh data** - Day 5 must use a new receipt, not Receipt A again

If you notice repetition:
- Swap the order (e.g., move failure to Day 3 instead of Day 4)
- Generate a new receipt to replace a stale one
- Change the angle (show JSON instead of CLI output, or vice versa)

---

## References

- [canonical_proof_examples.md](canonical_proof_examples.md) - Examples A, B, C
- [shareable_proof_examples.md](shareable_proof_examples.md) - Demo, real-mode, fallback examples
- [canonical_social_posts.md](canonical_social_posts.md) - Post sets with labeled proof
- [canonical_receipt_launch_pack.md](canonical_receipt_launch_pack.md) - Golden path CLI commands

---

_All proof must be real or clearly labeled. No fabrication. No ambiguity._

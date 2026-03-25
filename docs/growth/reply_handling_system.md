# Reply Handling System

> Every reply should move toward: "run one protected trade."

---

## Core Principle

Respond within 2 hours during campaign days. Every interaction is a chance
to move someone from awareness → understanding → first CLI run.

The funnel:
```
saw post → replied → got answer → tried CLI → ran trade → design partner
```

---

## Category 1: Interested

**Signal:** "This looks cool," "How do I try this?", "Shipping this to prod?"

### Response Template

```text
Thanks - easiest way to try it:

  npx @trucore/atf@latest trade

That runs a protected trade through ATF → Jupiter → Solana.
You get a canonical receipt at the end.

Takes about 30 seconds. Let me know what you think of the output.
```

### Next Action

- If they reply with output → move to Category 4 (Technical deep dive)
- If they go quiet → follow up in 48 hours with a receipt example

### Follow-Up (48 hours, no reply)

```text
Hey - did you get a chance to try the CLI? Here's what the output looks like:

⚡ ATF Protected Trade
Route: Jupiter (SAFE (142k CU))
Decision: APPROVED
Receipt: https://verify.trucore.xyz/tx/...

Happy to walk through anything if you hit a snag.
```

---

## Category 2: Curious

**Signal:** "What does this actually do?", "How is this different from X?", "What's a canonical receipt?"

### Response Template

```text
Quick version:

1. ATF evaluates policy BEFORE execution (approve or deny)
2. Your agent/bot executes the trade (Jupiter swap on Solana)
3. ATF issues a canonical receipt AFTER settlement

The receipt is backend-issued (not client-generated), with a deterministic
SHA-256 hash. Any field change breaks the hash - that's tamper evidence.

Most agent infra has no post-execution proof. This adds one.

One command to see it:
  npx @trucore/atf@latest trade
```

### Next Action

- If they ask how it's different from logs → use reply_bank.md "How is this different from logs?"
- If they ask about signing → use reply_bank.md "Are these receipts signed?"
- If they ask about chains → use reply_bank.md "What chains do you support?"

### Follow-Up (72 hours, no reply)

```text
Hey - following up. If you want to see the receipt format without running
anything, here's a real output example:

  Classification: swap
  Decision:       APPROVED
  Receipt hash:   996f95ed83d4c5da

Real mainnet execution, not a simulation. The hash is deterministic
over the canonical receipt fields.

Happy to answer any questions.
```

---

## Category 3: Skeptical

**Signal:** "This is just a wrapper," "How do I know it's real?", "What's the actual trust model?"

### Response Template

```text
Fair question. Here's the trust model:

- Receipts are backend-issued - the client can't fabricate them
- The receipt hash is SHA-256 over JCS-canonicalized data
- If finalization fails, no receipt is generated (we showed this on Day 4)
- Signing is not shipped yet - we're not claiming it until it's real

The CLI is the simplest entry point, but ATF is API-first:
  POST /v1/intents/protect → policy evaluation
  POST /v1/executions/finalize → canonical receipt

You can verify any receipt:
  npx @trucore/atf@latest verify <receipt-id>

I'd rather you run one trade and evaluate the output than take my word for it.
```

### Next Action

- Don't argue - share proof once, let them evaluate
- If they push back again → acknowledge their concern, share the failure case example, move on
- If they run the CLI → they'll self-convert based on output quality

### Follow-Up (5 days - only if they engaged)

```text
Hey - no pressure on ATF. If you're evaluating trust models for execution
infra, the failure handling example might be the most relevant part:

When finalize fails, ATF surfaces the failure - no fake receipt is generated.
The swap happened on-chain, but without backend confirmation, we don't
pretend it has a canonical receipt. That's the design choice.

Spec is open: https://github.com/trucore-ai/agent-transaction-firewall
```

---

## Category 4: Technical Deep Dive

**Signal:** "How does the hash work?", "Can I integrate this via API?", "Show me the finalize payload"

### Response Template

```text
Happy to go deep.

The finalize flow:

  POST /v1/executions/finalize
  {
    "intent_id": "...",
    "tx_signature": "...",
    "output_amount": 0.15,
    "execution_status": "success",
    "timestamps": {
      "submitted_at": 1711000000,
      "confirmed_at": 1711000002
    }
  }

Response:
  {
    "receipt_id": "rcpt-...",
    "receipt_url": "https://verify.trucore.xyz/tx/rcpt-...",
    "receipt_hash": "a1b2c3d4..."
  }

The hash is SHA-256 over JCS-canonicalized receipt fields.
Any party can recompute it from the receipt data.

Integration examples (Python + Node.js):
  [link to canonical_bot_integration_examples.md]

Want me to send the full integration guide? Or jump on a 15-min call
to walk through the API?
```

### Next Action

- Send canonical_bot_integration_examples.md
- Offer a technical walkthrough call
- If they start integrating → offer design partner status
- Update target_account_list.md status to `conversation` or `integration-interest`

### Follow-Up (48 hours)

```text
Hey - did the integration example make sense? The Python version is ~20 lines,
Node.js is ~15 lines. No SDK dependency - just standard HTTP calls.

Let me know if you want to try a real execution or if you have questions
about the finalize payload format.
```

---

## Category 5: No Response

**Signal:** DM sent, no reply after 72+ hours

### Response Template (First Follow-Up - Day 4–5)

```text
Hey - following up on my message about ATF canonical receipts.

Quick reminder: policy approves before execution, canonical receipt
issued after settlement. Backend-issued, tamper-evident.

One command to try it:
  npx @trucore/atf@latest trade

Either way, no pressure. Thought it might be relevant to what you're building.
```

### Response Template (Final Follow-Up - Day 7)

```text
Last follow-up on ATF. During this week:
  - [X] external users ran protected trades
  - [X] canonical receipts issued

If the timing isn't right now, no worries. The CLI is always available:
  npx @trucore/atf@latest trade

Good luck with what you're building.
```

### Next Action

- After 2 follow-ups with no response → mark as `no-response` in target_account_list.md
- Do not send more messages
- Move on to new targets

---

## Reply Routing Decision Tree

```
Incoming reply
  │
  ├── Contains question? ──→ Category 2 (Curious) or 4 (Technical)
  │
  ├── Contains positive signal? ──→ Category 1 (Interested)
  │     └── Push to CLI command immediately
  │
  ├── Contains pushback? ──→ Category 3 (Skeptical)
  │     └── Share proof once, don't argue
  │
  └── No reply after 72h? ──→ Category 5 (No Response)
        └── One follow-up, then move on
```

---

## Timing Rules

| Trigger | Response Window | Max Follow-Ups |
|---------|-----------------|----------------|
| Reply to post | Within 2 hours | N/A (reply as they engage) |
| Reply to DM | Within 4 hours | N/A |
| No reply to DM | 72 hours | 2 total (Day 4–5, Day 7) |
| Technical question | Within 4 hours | Continue until resolved |
| Design partner interest | Within 1 hour | Schedule call within 48 hours |

---

## What NOT to Do

| Don't | Why | Do Instead |
|-------|-----|------------|
| Argue with skeptics | Wastes energy, doesn't convert | Share proof once, move on |
| Over-explain | Loses attention | Give the CLI command, let output speak |
| Send walls of text | DMs should be short | 3–5 sentences max |
| Use hype language | Breaks trust | Show real output |
| Follow up more than twice | Becomes spam | Mark as no-response, move on |
| Promise features not shipped | Signing, on-chain anchoring not ready | Be honest about current state |

---

## Conversion Goal

Every reply chain should converge to one of:

1. **They ran the CLI** - `npx @trucore/atf@latest trade`
2. **They want the integration guide** - send canonical_bot_integration_examples.md
3. **They want a walkthrough** - schedule 15-min call
4. **They're not interested** - mark and move on

Don't force it. Let the proof do the work.

---

_Response templates are adapted from reply_bank.md and outreach_messages.md.
No new claims - only sequenced responses based on signal type._

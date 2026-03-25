# New Message Variants

> Rewritten Day 1 post, Cold DM, and Builder DM.
> Optimized for "just try it now" - shorter, clearer, trust-first.

---

## Day 1 Post (v2)

### Before (current - 10 lines)

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

### Problems

- Opens with jargon ("canonical tamper-evident receipts")
- Receipt hash shown before reader understands what it means
- No problem statement - why should I care?
- "Real mainnet execution" contradicts demo mode messaging

### After (v2)

```text
Your bot trades. What proves it was authorized?

ATF checks every trade before it executes.
After it settles, you get a receipt - verifiable, not fabricated.

One command to see it:
  npx @trucore/atf@latest trade

No wallet needed. Takes 5 seconds.
```

### Why it's better

- Opens with a question the target audience already has
- Explains the value in 2 lines, no jargon
- "No wallet needed" removes the #1 friction
- "5 seconds" makes the cost of trying feel trivial

### Alt Day 1 (action-forward)

```text
Run a protected trade in 5 seconds:

  npx @trucore/atf@latest trade

What you get:
→ Policy check before execution
→ Trade routed through Jupiter
→ Verifiable receipt after settlement

No wallet. No setup. One command.

Building a bot or agent? Tell me if the receipt is useful.
```

---

## Cold DM (v2)

### Before (current - 15 lines)

```text
Hi - I'm building ATF, a transaction firewall for Solana agents and bots.

We just shipped something I think is relevant to what you're building:
canonical tamper-evident receipts.

How it works:
1. ATF evaluates policy before execution
2. Trade executes on-chain (Jupiter swap, Solana mainnet)
3. ATF issues a canonical receipt after settlement

The receipt is structured for machines (JSON + bot_line field)
and readable for humans.

One command to try it:
  npx @trucore/atf@1.4.2 trade

Can I send you one canonical receipt example so you can see the format?
```

### Problems

- Too long - cold DMs that convert are 2–4 sentences
- Numbered steps read like docs
- "Canonical tamper-evident receipts" means nothing cold
- CTA asks permission to send more info (weak)

### After (v2)

```text
Hey - built a trade firewall for Solana bots.

It checks the trade before execution, then gives you a
verifiable receipt after settlement. Structured JSON output
your bot can parse.

Try it: npx @trucore/atf@latest trade
No wallet needed - just shows the format.
```

### Why it's better

- 5 lines, not 15
- "Trade firewall" is immediately understood
- CTA is the action itself, not "can I send you something"
- "No wallet needed" kills the trust objection preemptively

### Alt Cold DM (problem-first)

```text
Hey - if your bot executes trades, you probably have no proof
it was authorized before it ran.

We built something that adds that - policy check before,
receipt after. One command to see it:

npx @trucore/atf@latest trade

No setup. Would the receipt format be useful for your workflow?
```

---

## Builder DM (v2)

### Before (current - 12 lines)

```text
Hey - we just shipped canonical tamper-evident receipts for ATF.

Quick version: policy approves before execution, Jupiter swap runs on-chain,
then ATF issues a canonical receipt after settlement.

Here's what the output looks like:

  ✓ Policy: approved before execution
  ✓ Swap: Jupiter route on Solana mainnet
  ✓ Receipt: tamper-evident, backend-issued
  ✓ Receipt hash: 996f95ed83d4c5da

You can try it in one command:
  npx @trucore/atf@1.4.2 trade

Would you try one protected trade and tell me if the receipt format
is useful for your setup?
```

### Problems

- Still leads with "canonical tamper-evident receipts"
- Shows receipt hash before they've tried it
- Checkbox output isn't a real conversation - it's a feature list
- Too formal for a warm contact

### After (v2)

```text
Hey - remember ATF? Just shipped something worth 5 seconds of your time.

Run this:
  npx @trucore/atf@latest trade

You'll see a policy check before the trade and a receipt after.
No wallet needed - just shows the format.

Would the receipt output be useful for what you're building?
```

### Why it's better

- Casual tone for warm contacts
- "5 seconds of your time" - low ask
- CTA is the command itself, shown before asking for anything
- Ends with one clear question, not a feature list

### Alt Builder DM (proof-forward)

```text
Hey - quick one. ATF now checks trades before they run and
gives you a receipt after they settle.

I'd grab your take on whether the receipt format works for
your setup. Try it?

  npx @trucore/atf@latest trade

No wallet, no config. Takes a few seconds.
```

---

## Message Testing Plan

| Variant | Test Against | Metric | Channel |
|---------|-------------|--------|---------|
| Day 1 v2 vs. alt | Current Day 1 post | Engagement rate | X |
| Cold DM v2 vs. alt | Current cold DM | Reply rate | DMs |
| Builder DM v2 vs. alt | Current builder DM | CLI run rate | DMs |

Track results in `outreach_tracker.md` using variant labels: `D1-v2`, `D1-alt`, `CDM-v2`, `CDM-alt`, `BDM-v2`, `BDM-alt`.

# Community Post Variants

Platform-adapted posts. Each has: hook, proof statement, command/link, CTA.

---

## Discord

### Variant 1 — General Dev Channel

```text
🔥 ATF now issues canonical tamper-evident receipts for Solana trades.

Proof:
→ Policy approved before execution
→ Jupiter swap executed on mainnet
→ Canonical receipt issued after settlement
→ Receipt hash: 996f95ed83d4c5da

Try it:
  npx @trucore/atf@1.4.2 trade

Anyone building bots or agents that execute trades?
Would love to hear if this receipt format is useful for your setup.
```

### Variant 2 — Bot-Specific Channel

```text
Built a structured receipt format for trading bots on Solana.

What it gives you:
- machine-readable bot_line: ATF|APPROVED|Jupiter|SAFE|tx=...
- JSON receipt with receipt_id, receipt_url, status
- policy check runs before your bot executes

One command:
  npx @trucore/atf@1.4.2 trade

Want the bot integration snippet? It's ~20 lines of Node.js.
```

### Variant 3 — Agent Dev Channel

```text
If your agent executes financial transactions, this might matter:

ATF evaluates policy BEFORE execution and issues a canonical receipt AFTER settlement.

The agent can prove:
1. It was authorized to execute
2. What actually happened on-chain
3. The receipt is tamper-evident and backend-issued

Try: npx @trucore/atf@1.4.2 trade

Would this be useful as a trust boundary for your agent?
```

---

## Telegram

### Variant 1 — Short Proof Post

```text
ATF canonical receipts are live.

→ Approved before execution
→ Jupiter swap on Solana mainnet
→ Tamper-evident receipt after settlement

npx @trucore/atf@1.4.2 trade

Receipt is structured JSON + machine-readable bot_line.
DM me if you want the integration snippet.
```

### Variant 2 — Bot-Focused

```text
Solana bot devs — ATF now gives you:

✓ Policy check before your bot executes
✓ Canonical receipt after settlement
✓ Structured output: JSON + bot_line for automation

One command to try: npx @trucore/atf@1.4.2 trade

Want the 20-line Node.js integration? DM me.
```

---

## GitHub Discussion / Forum

### Technical Post

```text
Title: Canonical tamper-evident receipts for Solana agent/bot execution

We shipped canonical receipt issuance for ATF (Agent Transaction Firewall).

## What it does

ATF sits between your agent/bot and on-chain execution:

1. **Before execution:** ATF evaluates policy (approve/deny/flag)
2. **During execution:** Trade executes on-chain (currently Jupiter swaps on Solana)
3. **After execution:** ATF issues a canonical tamper-evident receipt

## Receipt format

The receipt includes:
- `receipt_id` — unique identifier
- `receipt_hash` — SHA-256 content hash over JCS-canonicalized data
- `receipt_url` — verification endpoint
- `bot_line` — single-line machine-readable summary
- Full JSON with intent, decision, execution result, and timing

## Try it

```bash
npx @trucore/atf@1.4.2 trade
```

This runs a real Jupiter swap on Solana mainnet through ATF policy.

## Why this matters

- **For bot developers:** Structured, parseable execution proof
- **For agent developers:** Trust boundary — approval before autonomous execution
- **For infra teams:** Auditable execution trail with deterministic verification

## What we're looking for

Feedback from anyone building bots, agents, or execution infrastructure:
- Is the receipt format useful for your use case?
- What fields would you need that aren't there?
- Would you try one protected trade?

Repo: https://github.com/trucore-ai/agent-transaction-firewall
```

---

## Reddit-Style Technical Post

### r/solana or r/solanadev

```text
Title: We built a transaction firewall that issues tamper-evident receipts for Solana trades — looking for feedback from bot/agent builders

I've been building ATF (Agent Transaction Firewall) — a policy and receipt layer
for Solana execution. Here's what we just shipped:

**The flow:**
1. Submit a trade intent (e.g., swap SOL→USDC via Jupiter)
2. ATF evaluates policy before execution (approve/deny/flag)
3. Trade executes on-chain
4. ATF issues a canonical tamper-evident receipt after settlement

**What the receipt gives you:**
- Receipt hash (SHA-256 over canonicalized data)
- Structured JSON with intent, decision, execution result
- Machine-readable bot_line for automation
- Verification URL

**Real example from mainnet:**
- Receipt hash: 996f95ed83d4c5da
- Route: SOL → USDC via Jupiter
- Policy: approved before execution
- Receipt: issued after settlement

**Try it:**
```
npx @trucore/atf@1.4.2 trade
```

**What I'm looking for:**
- Bot builders: is the structured output format useful?
- Agent developers: would approval-before-execution help your trust model?
- Anyone: what's missing from the receipt format?

Not trying to sell anything — genuinely looking for feedback on whether
this receipt primitive is useful. Happy to share the spec or walk through
the integration path.
```

---

## Posting Checklist

Before posting any variant:

- [ ] Replace `996f95ed83d4c5da` with latest real receipt hash if newer one exists
- [ ] Verify `npx @trucore/atf@1.4.2 trade` still works (update version if needed)
- [ ] Check that claims match shipped reality (no "on-chain anchored", no "cryptographically signed")
- [ ] Include link to repo or docs if platform allows
- [ ] Adapt tone to the specific channel culture

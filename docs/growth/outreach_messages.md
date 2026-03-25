# Outreach Messages

Audience-specific message variants. Each anchored to real proof with a concrete CTA.

---

## A. Warm DM to Builder

Use for: someone you've interacted with before, who builds bots or agents on Solana.

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

---

## B. Cold DM to Bot/Project Founder

Use for: someone you haven't talked to, who runs a trading bot or Solana project.

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

---

## C. Partner-Style Note to Infra/Protocol Team

Use for: teams building execution infrastructure, DEX protocols, or wallet tooling.

```text
Hi [name] - I'm working on ATF (Agent Transaction Firewall), a policy
and receipt layer for Solana execution.

We recently shipped canonical tamper-evident receipts. The flow:

  1. Policy evaluation before execution (approve/deny/flag)
  2. On-chain execution (currently Jupiter swaps on Solana mainnet)
  3. Canonical receipt issued by ATF backend after settlement

The receipts use SHA-256 content hashes over canonicalized data.
Any party can verify integrity without needing secrets.

We're looking for a few infra teams to try this as a design partner.

What we'd ask:
- Review the receipt format
- Try one protected trade through the CLI
- Tell us if the policy + receipt model is relevant to your execution path

Would a 15-minute technical walkthrough be useful?
Or I can send the receipt spec and a real example first.
```

---

## D. Short Email Version

Use for: more formal outreach where DM isn't appropriate.

```text
Subject: Canonical receipts for Solana execution - would this be useful?

Hi [name],

We built ATF - a transaction firewall that evaluates policy before
execution and issues canonical tamper-evident receipts after settlement.

Current state:
- Real Jupiter swaps on Solana mainnet
- Policy approved before execution
- Canonical receipt issued after finalization
- Receipt hash from latest mainnet trade: 996f95ed83d4c5da

The receipt format is structured for automation (JSON + machine-readable
bot_line) and readable for humans.

You can try it now:
  npx @trucore/atf@1.4.2 trade

Would this be useful for [their product/use case]?

Happy to send a receipt example or walk through the integration path.

Best,
[your name]
```

---

## E. Follow-Up Message (No Response After 3–5 Days)

Use for: anyone who didn't reply to variants A–D.

```text
Hey - following up on my message about ATF canonical receipts.

Since I reached out, we've had [X] external users run their first
protected trade. (Update this number as it grows.)

Quick reminder of what it does:
- Approves before execution
- Finalizes after settlement
- Issues a tamper-evident receipt

If the receipt format would be useful for [their specific use case],
I can send a real example - takes 30 seconds to see if it's relevant.

Either way, no pressure. Just thought it might save you some
execution trust plumbing.
```

---

## Message Customization Notes

**For bot builders:** Emphasize `bot_line` field, structured JSON output, and machine-parseable format. Mention the `--stdin` flag for piping intents.

**For agent developers:** Emphasize trust boundary - approval before execution means the agent can prove it was authorized. Receipt proves what actually happened.

**For infra teams:** Emphasize deterministic verification, canonicalized data, and the fact that receipts are backend-issued (not client-fabricated).

**For protocol teams:** Emphasize ecosystem trust - agents using ATF can prove they followed policy before touching the protocol.

---

## What NOT to Say

| Don't say | Why | Say instead |
|-----------|-----|------------|
| "Cryptographically signed receipts" | Not yet implemented | "Tamper-evident receipts" |
| "On-chain anchored" | Not yet shipped | "Backend-issued canonical receipts" |
| "Fully trustless" | Trust model is backend-issued | "Deterministic verification" |
| "We'd love to connect" | Generic, no CTA | "Would you try one protected trade?" |
| "Revolutionary" / "game-changing" | Hype without proof | "Here's what the receipt looks like" |
| "We're the first to..." | Unverifiable claim | Show real output instead |

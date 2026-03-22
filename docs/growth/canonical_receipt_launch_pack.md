# Canonical Receipt Launch Pack

> Run a protected trade through ATF and get a canonical tamper-evident receipt.

---

## Golden Path

```bash
# 1. Check environment readiness
npx @trucore/atf@latest doctor

# 2. Configure wallet and API keys
npx @trucore/atf@latest setup

# 3. Execute a protected trade
npx @trucore/atf@latest trade

# 4. Verify any receipt
npx @trucore/atf@latest verify <receipt-id>
```

---

## What Happened (Real Execution)

OpenClaw's atf-agent executed a real Jupiter swap on Solana mainnet through ATF:

1. **ATF approved the intent** — policy checks passed before any on-chain transaction  
2. **OpenClaw executed the swap** — the trade went through Jupiter's routing  
3. **ATF finalized the execution** — the backend issued a canonical tamper-evident receipt with a deterministic `receipt_id`, `receipt_url`, and `receipt_hash`

This is not a simulation. The canonical receipt was issued by the ATF backend after real execution.

---

## Real Execution Evidence

**Mainnet trade — 2026-03-19**

```
Classification : swap
Decision       : APPROVED
Status         : success
TX Signature   : 26Raeks...Cy877a (Solana mainnet)
Receipt Hash   : 996f95ed83d4c5da
```

> This is a real execution log from OpenClaw's atf-agent running a Jupiter swap
> through ATF on Solana mainnet with live funds.

---

## Copy / Paste Outreach Block

Use this block for X posts, Discord, README snippets, or direct outreach:

```text
ATF now issues canonical tamper-evident receipts for real trades.

What that means:
→ ATF approves the intent before execution
→ The agent executes the swap (Jupiter, Solana)
→ ATF finalizes and issues a canonical receipt with a deterministic hash

Try it:
  npx @trucore/atf@latest trade
  npx @trucore/atf@latest verify <receipt-id>

First real mainnet receipts are live.
No fabrication. No client-side receipts. Backend-issued only.

https://trucore.xyz/atf
```

---

## Short Pitch (DM / Intro)

```text
We just shipped canonical receipts for ATF.

Every protected trade now gets a backend-issued tamper-evident receipt
with a deterministic hash — approved before execution, finalized after.

Real Jupiter swaps on Solana mainnet are already producing these.

Happy to walk through the flow if you're building agent infra or bots.
```

---

## What Makes This Different

| Property | ATF Canonical Receipts |
|---|---|
| Issued by | ATF backend (not client-side) |
| Timing | After execution finalization |
| Hash | Deterministic SHA-256 over canonical fields |
| Tamper evidence | Content hash changes if any field is modified |
| Verification | `npx @trucore/atf@latest verify <receipt-id>` |
| Fabrication | Impossible — only backend can issue |
| Failure honesty | No receipt issued if finalization fails |

---

## Verification URL Format

Every canonical receipt gets a verification URL:

```
https://verify.trucore.xyz/tx/<receipt-id>
```

Example:
```
https://verify.trucore.xyz/tx/rcpt-a1b2c3d4e5f6
```

---

## Audiences

| Audience | Key message |
|---|---|
| **Bot builders** | Structured receipt with `receipt_id`, `receipt_hash` — machine-readable, deterministic |
| **Agent developers** | Pre-execution approval + post-execution receipt = full audit trail |
| **DeFi teams** | Policy enforcement before trades, tamper-evident proof after |
| **Partners** | Real mainnet receipts exist today — not vaporware |

---

_All examples labeled "real" reflect actual execution output. Representative examples are clearly marked._

# Reply Bank

Sharp, technically honest answers to common questions and objections.

---

## "How is this different from logs?"

```text
Logs are written by the system that executed the trade — they record
what that system says happened.

ATF receipts are different in three ways:
1. Policy is evaluated BEFORE execution, not logged after
2. Receipts are issued by the ATF backend, not by the executing agent
3. Receipt hash is computed over canonicalized data (SHA-256 over JCS) —
   any party can verify the receipt wasn't modified

Logs tell you what happened. Receipts prove what was authorized
and what the backend observed.
```

---

## "Are these receipts signed?"

```text
Not yet. Currently, receipts are tamper-evident — the receipt hash
is a SHA-256 content hash over JCS-canonicalized data. Any party
can recompute the hash and verify integrity.

Receipts are issued by the ATF backend — they can't be fabricated
by the client.

Cryptographic signing is on the roadmap but not shipped yet.
We're not going to claim it until it's real.
```

---

## "Can bots parse this?"

```text
Yes — receipts are designed for machine consumption.

Two formats in every response:
1. Full JSON with receipt_id, receipt_hash, intent, decision,
   execution result, and timing
2. bot_line — a single pipe-delimited line for log parsing:
   ATF|APPROVED|Jupiter|SAFE|tx=...

You can also pipe intents via stdin:
  echo '{"chain_id":"solana",...}' | atf bot protect --stdin
```

---

## "Does this work with real swaps?"

```text
Yes. The current implementation executes real Jupiter swaps on
Solana mainnet.

Example from a real mainnet trade:
- Route: SOL → USDC via Jupiter
- Receipt hash: 996f95ed83d4c5da
- Transaction settled on Solana mainnet

You can try it:
  npx @trucore/atf@1.4.2 trade

This runs a real trade, not a simulation.
```

---

## "What happens if finalization fails?"

```text
If finalize_execution fails (e.g., the trade didn't settle,
or the RPC is unreachable), ATF still records the outcome.

Possible states:
- approved_not_executed — policy approved but execution didn't complete
- execution_failed — trade attempted but failed on-chain
- finalization_error — trade may have succeeded but receipt couldn't
  be issued (e.g., backend unavailable)

In every case, the approval decision is already recorded.
The receipt captures the failure reason, not just successes.
We don't hide failures — they're part of the canonical record.
```

---

## "Is this just a CLI wrapper?"

```text
The CLI is the simplest entry point, but ATF is an API-first system.

Under the hood:
1. /v1/intents/protect — policy evaluation before execution
2. Your agent/bot executes the trade
3. /v1/executions/finalize — canonical receipt after settlement

The CLI wraps this flow for convenience. For production bots,
you call the API directly. There are integration examples in
Python (~20 lines) and Node.js (~15 lines).

The CLI is for trying it. The API is for integrating it.
```

---

## "Why should I trust ATF's policy decisions?"

```text
You don't have to trust them blindly — you can inspect them.

Every approval includes the policy rules that were evaluated
and why the intent was approved or denied.

You can also configure your own policies: max trade amount,
allowed tokens, slippage limits, etc.

The policy evaluation happens before execution — so if ATF denies,
nothing touches the chain. You can review the denial and decide
whether to override or adjust.
```

---

## "What chains do you support?"

```text
Currently Solana only, with Jupiter as the execution router.

The receipt format and policy model are chain-agnostic by design,
but we shipped Solana first because that's where the most
agent and bot activity is.
```

---

## "How do I verify a receipt?"

```text
Two ways:

1. CLI:
   npx @trucore/atf@latest verify <receipt-id>

2. Programmatic:
   - Fetch the receipt JSON
   - JCS-canonicalize it (removing the hash field)
   - Compute SHA-256 over the canonical form
   - Compare with the receipt_hash

The receipt_url field also provides a backend verification endpoint.
```

---

## "Is this open source?"

```text
The spec is open (atf-spec repo). The CLI and SDK are published
on npm. The backend is not open source — receipts are backend-issued
to prevent client-side fabrication.

Repo: https://github.com/trucore-ai/agent-transaction-firewall
```

---

## Guidelines for Using This Reply Bank

1. **Be honest about what's shipped vs. planned** — don't claim signing when only hashing is implemented
2. **Keep answers short** — 3–5 sentences max for DMs, expand only where technically necessary
3. **Point to real proof** — include receipt hash, CLI command, or JSON example where relevant
4. **Don't argue with skeptics** — share the proof once, let them evaluate, move on

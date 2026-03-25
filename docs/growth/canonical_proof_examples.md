# Canonical Proof Examples

Three polished examples showing ATF canonical receipt behavior in success,
dry-run, and failure scenarios. Each example distinguishes real from representative output.

---

## Example A - Real Canonical Execution Success

**Source:** Real mainnet execution via OpenClaw atf-agent (2026-03-19)  
**Label:** Redacted real

### Approval

```
Classification : swap
Decision       : APPROVED
Policy         : All policies passed
Reasons        : swap_size_ok, slippage_within_limits
```

### Execution Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ ATF REAL EXECUTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Route          : Jupiter
Classification : swap
Decision       : APPROVED
Policy         : All policies passed
  - swap_size_ok
  - slippage_within_limits

Execution:
  tx     : 26Raeks...Cy877a
  status : success
  in     : 0.001000 SOL
  out    : (USDC)
  route  : jupiter_dex_bridge

Receipt:
  hash   : 996f95ed83d4c5da
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Backend-Issued Receipt (representative structure)

```json
{
  "status": "ok",
  "message": "Execution finalized - canonical receipt issued",
  "result": {
    "receipt_id": "rcpt-a1b2c3d4e5f6",
    "receipt_url": "https://verify.trucore.xyz/tx/rcpt-a1b2c3d4e5f6",
    "receipt_hash": "a1b2c3d4e5f6789abcdef1234567890abcdef1234567890abcdef1234567890"
  }
}
```

> The JSON structure above is representative. The field names and format
> match the real finalize response. The `receipt_hash` in the CLI output
> (`996f95ed83d4c5da`) is from a real mainnet execution.

### Why This Matters

ATF approved the trade **before** any on-chain transaction happened.
After the swap executed on Jupiter, ATF finalized the execution and issued
a canonical receipt with a deterministic hash. The receipt was not generated
client-side - it was issued by the ATF backend.

**Bot/operator takeaway:** Only trust `receipt_id`, `receipt_url`, and
`receipt_hash` values returned by the ATF `/v1/executions/finalize` endpoint.
These are the canonical fields.

---

## Example B - Dry-Run Approval (No Execution)

**Source:** Devnet dry-run via OpenClaw atf-agent  
**Label:** Representative (based on real dry-run flow)

### Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ ATF DRY RUN
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Route          : Jupiter
Classification : swap (12345 CU)
Decision       : APPROVED
Policy         : All policies passed
  - swap_size_ok
  - slippage_within_limits

DRY RUN - no execution performed.
Content Hash   : c9a0310ba2a8a48d62cc0336b7d2beb27f9e31565162ef9daba4fe280f9295a4

Receipt:
  id   : (none - dry run)
  url  : (none - dry run)
  hash : (none - dry run)
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### What Happened

- ATF evaluated the intent and **approved** it
- No on-chain transaction was submitted
- No finalize call was made
- No canonical receipt was issued

This is the safe testing path. Developers can validate that their intent
passes ATF policy without spending gas or executing a trade.

### Why This Matters

Dry runs prove that ATF policy evaluation works independently of execution.
The `content_hash` confirms the exact policy decision that would apply, but
no receipt is issued because no execution happened.

**Bot/operator takeaway:** Use dry runs (`confirm_live: false`) to test
policy compliance before committing to real execution. No receipt will be
generated - this is correct behavior.

---

## Example C - Finalize Failure (Honest Failure)

**Source:** Representative (based on real error handling code)  
**Label:** Representative

### Scenario

The agent's Jupiter swap **succeeded on-chain** - tokens moved, the transaction
confirmed on Solana. But the subsequent call to ATF's `/v1/executions/finalize`
**failed** (e.g., network error, ATF service temporarily unavailable).

### Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ ATF REAL EXECUTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Route          : Jupiter
Classification : swap
Decision       : APPROVED

Execution:
  tx     : 4xyzSig...def789
  status : success
  in     : 0.001000 SOL
  out    : 0.150000 USDC
  route  : jupiter_dex_bridge

⚠ WARNING: Finalization failed
  Error  : ATF finalize request failed: 503 Service Unavailable
  Action : Receipt was NOT issued

Receipt:
  id   : (none - finalize failed)
  url  : (none - finalize failed)
  hash : (none - finalize failed)
━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠ The on-chain swap succeeded but ATF could not issue a canonical receipt.
  This execution should be flagged for manual reconciliation.
```

### What Happened

1. ATF approved the intent ✓
2. The agent executed the swap - it succeeded on-chain ✓
3. The agent called `/v1/executions/finalize` - it **failed** ✗
4. ATF did **not** issue a canonical receipt
5. The agent surfaced a warning - it did **not** fabricate a receipt

### Why This Matters

This is how an honest system behaves under failure. The swap happened,
but the canonical proof step failed. Rather than generating a fake receipt
client-side, the system:

- Warns the operator
- Reports no receipt fields
- Leaves the execution in a reconciliation state

This is a key trust property: **ATF never fabricates receipts when
finalization fails.**

**Bot/operator takeaway:** If `finalize_execution` fails, do not invent
receipt values. Mark the execution as needing reconciliation. The on-chain
transaction can still be verified via its Solana signature, but there is
no ATF-issued canonical receipt for it.

---

## Example Label Reference

| Label | Meaning |
|---|---|
| **Real** | Actual output from a live execution |
| **Redacted real** | Real execution with sensitive fields shortened |
| **Representative** | Structurally accurate example, not from a specific run |

# Canonical Bot Integration Examples

Developer guidance for integrating ATF canonical receipts into bots, agents,
and automated workflows. This document is canonical developer guidance.

---

## Core Principle

> **Do not fabricate canonical receipts client-side.**
>
> Only the ATF backend can issue canonical receipts. The `receipt_id`,
> `receipt_url`, and `receipt_hash` fields returned by `/v1/executions/finalize`
> are the only source of truth.

---

## Integration Flow

```
1. Send intent to ATF        →  POST /v1/intents/protect
2. Only execute if approved   →  check decision == "approved"
3. Execute the swap           →  Jupiter / on-chain
4. Call finalize_execution    →  POST /v1/executions/finalize
5. Trust only backend fields  →  receipt_id, receipt_url, receipt_hash
6. If finalize fails          →  mark for reconciliation, do NOT invent receipt
```

---

## Python Example

No extra dependencies required - uses `requests` (standard HTTP client).

```python
import time
import requests

ATF_API_URL = "https://api.trucore.xyz"
ATF_API_KEY = "your-api-key"  # from ATF dashboard

headers = {
    "X-API-Key": ATF_API_KEY,
    "Content-Type": "application/json",
}


def protected_trade(from_token: str, to_token: str, amount: str):
    """Execute a protected trade through ATF with canonical receipt."""

    # ── Step 1: Send intent to ATF for approval ──
    intent_resp = requests.post(
        f"{ATF_API_URL}/v1/intents/protect",
        headers=headers,
        json={
            "type": "swap",
            "venue": "jupiter",
            "from_token": from_token,
            "to_token": to_token,
            "amount": amount,
            "slippage_bps": 50,
        },
    )
    intent_resp.raise_for_status()
    intent = intent_resp.json()

    # ── Step 2: Only execute if approved ──
    if intent["decision"] != "approved":
        print(f"ATF denied: {intent.get('reasons', [])}")
        return None

    intent_id = intent["audit_id"]
    print(f"ATF approved - intent_id: {intent_id}")

    # ── Step 3: Execute the swap ──
    # (Your swap execution logic here - Jupiter, Raydium, etc.)
    tx_signature = execute_swap(from_token, to_token, amount)
    submitted_at = time.time()

    if not tx_signature:
        print("Swap execution failed - no finalize call")
        return None

    # ── Step 4: Call finalize_execution ──
    # This is where ATF issues the canonical receipt.
    try:
        finalize_resp = requests.post(
            f"{ATF_API_URL}/v1/executions/finalize",
            headers=headers,
            json={
                "intent_id": intent_id,
                "tx_signature": tx_signature,
                "output_amount": get_output_amount(tx_signature),
                "execution_status": "success",
                "timestamps": {
                    "submitted_at": int(submitted_at),
                    "confirmed_at": int(time.time()),
                },
            },
        )
        finalize_resp.raise_for_status()
        result = finalize_resp.json()["result"]

        # ── Step 5: Trust only backend-issued fields ──
        receipt_id = result["receipt_id"]
        receipt_url = result["receipt_url"]
        receipt_hash = result["receipt_hash"]

        print(f"Canonical receipt issued:")
        print(f"  receipt_id:   {receipt_id}")
        print(f"  receipt_url:  {receipt_url}")
        print(f"  receipt_hash: {receipt_hash}")

        return {
            "status": "success",
            "tx_signature": tx_signature,
            "receipt_id": receipt_id,
            "receipt_url": receipt_url,
            "receipt_hash": receipt_hash,
        }

    except Exception as exc:
        # ── Step 6: Finalize failed - do NOT fabricate a receipt ──
        print(f"⚠ Finalization failed: {exc}")
        print(f"  The on-chain swap succeeded (tx: {tx_signature})")
        print(f"  but no canonical receipt was issued.")
        print(f"  Mark this execution for reconciliation.")

        return {
            "status": "needs_reconciliation",
            "tx_signature": tx_signature,
            "receipt_id": None,
            "receipt_url": None,
            "receipt_hash": None,
            "finalize_error": str(exc),
        }


def execute_swap(from_token: str, to_token: str, amount: str) -> str | None:
    """Placeholder - your actual swap execution logic."""
    # Execute via Jupiter, Raydium, etc.
    # Return the Solana transaction signature or None on failure.
    raise NotImplementedError("Replace with your swap logic")


def get_output_amount(tx_signature: str) -> float:
    """Placeholder - parse output amount from confirmed transaction."""
    raise NotImplementedError("Replace with your output parsing logic")
```

---

## Node.js Example

No extra dependencies required - uses built-in `fetch`.

```javascript
const ATF_API_URL = "https://api.trucore.xyz";
const ATF_API_KEY = "your-api-key"; // from ATF dashboard

async function protectedTrade(fromToken, toToken, amount) {
  const headers = {
    "X-API-Key": ATF_API_KEY,
    "Content-Type": "application/json",
  };

  // Step 1: Send intent to ATF
  const intentResp = await fetch(`${ATF_API_URL}/v1/intents/protect`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      type: "swap",
      venue: "jupiter",
      from_token: fromToken,
      to_token: toToken,
      amount,
      slippage_bps: 50,
    }),
  });
  const intent = await intentResp.json();

  // Step 2: Only execute if approved
  if (intent.decision !== "approved") {
    console.log(`ATF denied: ${intent.reasons}`);
    return null;
  }

  const intentId = intent.audit_id;
  console.log(`ATF approved - intent_id: ${intentId}`);

  // Step 3: Execute the swap
  const submittedAt = Math.floor(Date.now() / 1000);
  const txSignature = await executeSwap(fromToken, toToken, amount);

  if (!txSignature) {
    console.log("Swap execution failed - no finalize call");
    return null;
  }

  // Step 4: Call finalize_execution
  try {
    const finalizeResp = await fetch(
      `${ATF_API_URL}/v1/executions/finalize`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          intent_id: intentId,
          tx_signature: txSignature,
          output_amount: await getOutputAmount(txSignature),
          execution_status: "success",
          timestamps: {
            submitted_at: submittedAt,
            confirmed_at: Math.floor(Date.now() / 1000),
          },
        }),
      }
    );
    const { result } = await finalizeResp.json();

    // Step 5: Trust only backend-issued fields
    console.log("Canonical receipt issued:");
    console.log(`  receipt_id:   ${result.receipt_id}`);
    console.log(`  receipt_url:  ${result.receipt_url}`);
    console.log(`  receipt_hash: ${result.receipt_hash}`);

    return {
      status: "success",
      txSignature,
      receiptId: result.receipt_id,
      receiptUrl: result.receipt_url,
      receiptHash: result.receipt_hash,
    };
  } catch (err) {
    // Step 6: Finalize failed - do NOT fabricate a receipt
    console.warn(`⚠ Finalization failed: ${err.message}`);
    console.warn(`  Swap succeeded on-chain (tx: ${txSignature})`);
    console.warn(`  No canonical receipt issued. Mark for reconciliation.`);

    return {
      status: "needs_reconciliation",
      txSignature,
      receiptId: null,
      receiptUrl: null,
      receiptHash: null,
      finalizeError: err.message,
    };
  }
}
```

---

## Key Developer Rules

### 1. Approval is not enough

Getting `decision: "approved"` from ATF means the intent passed policy.
It does not mean a receipt exists. You must still execute and finalize.

### 2. Execution is not enough

A successful on-chain swap does not produce a canonical receipt.
The receipt is created only when you call `/v1/executions/finalize`
and the ATF backend processes it.

### 3. Canonical receipt comes only after finalize_execution

```
protect_intent  →  gives you approval
execute_swap    →  gives you a tx_signature
finalize        →  gives you receipt_id, receipt_url, receipt_hash
```

All three steps must succeed for a canonical receipt to exist.

### 4. If finalize fails, do not invent receipt truth

The swap may have succeeded on-chain, but without finalization
there is no ATF-issued receipt. The correct behavior is:

- Surface the warning to the operator
- Store the `tx_signature` for manual review
- Mark the execution as `needs_reconciliation`
- Do **not** generate a `receipt_id` or `receipt_hash` locally

### 5. Receipt hash is deterministic

The `receipt_hash` is a SHA-256 digest over the canonical receipt fields
(sorted JSON). Any change to any field produces a different hash.
This is how tamper evidence works - you can recompute the hash from
the receipt fields to verify integrity.

---

## Response Reference

### Successful Finalize (200 OK)

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

### Intent Not Found (404)

```json
{
  "status": "error",
  "message": "Intent not found: <intent_id>",
  "result": { "error": "intent_not_found" }
}
```

### Intent Not Approved (403)

```json
{
  "status": "error",
  "message": "Intent <intent_id> was not approved (decision=denied)",
  "result": { "error": "intent_not_approved", "decision": "denied" }
}
```

---

_This document is canonical developer guidance for ATF receipt integration.
All response formats reflect the shipped ATF API. Representative field values
are used in examples - actual values will differ per execution._

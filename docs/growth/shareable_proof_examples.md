# Shareable Proof Examples

> Three realistic ATF CLI output examples for distribution.
> All formats match actual CLI output (v1.4.2).

---

## Example A - Demo Trade (No API Key)

**Scenario:** First-time user runs `npx @trucore/atf@1.4.2 trade` with no config.

### Pretty Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ Protected Trade Result
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Mode:           DEMO (no API key configured)

Route:          Jupiter
Classification:  SAFE (142k CU)

Policy:
  ✓ Slippage within bounds
  ✓ Protocol allowed
  ✓ Route risk acceptable

Decision:       ✅ APPROVED

Execution:
  ✓ Trade executed successfully (demo)

Receipt Summary:
  Type:         Demo
  Receipt ID:   demo_20260320145458
  Verified At:  verify.trucore.xyz
  Status:       Ready to verify

Receipt:
  https://verify.trucore.xyz/tx/a3ed8521084c

Share:
  atf verify demo_20260320145458

Share snippet:
  ⚡ ATF Protected Trade
  Route: Jupiter (SAFE (142k CU))
  Decision: APPROVED
  Receipt: https://verify.trucore.xyz/tx/a3ed8521084c

Replay:
  atf trade --in SOL --out USDC --amount-in 0.01

Bot:
  ATF|APPROVED|Jupiter|SAFE|tx=demo_20260320145458
```

### Share Snippet (Copy-Paste Ready)

```
⚡ ATF Protected Trade
Route: Jupiter (SAFE (142k CU))
Decision: APPROVED
Receipt: https://verify.trucore.xyz/tx/a3ed8521084c
```

### Bot Line

```
ATF|APPROVED|Jupiter|SAFE|tx=demo_20260320145458
```

### Replay Command

```bash
atf trade --in SOL --out USDC --amount-in 0.01
```

---

## Example B - Real-Mode Trade (With API Key)

**Scenario:** Configured user runs `atf trade` with valid API key.

### JSON Output

```json
{
  "ok": true,
  "command": "trade",
  "mode": "real",
  "machine_mode": "real",
  "first_run": false,
  "api_fell_back": false,
  "route": "Jupiter",
  "classification": "SAFE (142k CU)",
  "policy_checks": [
    "Slippage within bounds",
    "Protocol allowed",
    "Route risk acceptable"
  ],
  "decision": "APPROVED",
  "machine_decision": "approved",
  "execution": "Trade executed successfully",
  "receipt_id": "req-7f3a9c2e-41d8-4b5a-9e1f-2c8d6a0b3e5f",
  "receipt_url": "https://verify.trucore.xyz/tx/b8f42e1a7c03",
  "receipt_type": "real",
  "verification_host": "verify.trucore.xyz",
  "verification_status": "Ready to verify",
  "share_text": "⚡ ATF Protected Trade\nRoute: Jupiter (SAFE (142k CU))\nDecision: APPROVED\nReceipt: https://verify.trucore.xyz/tx/b8f42e1a7c03",
  "bot_line": "ATF|APPROVED|Jupiter|SAFE|tx=req-7f3a9c2e-41d8-4b5a-9e1f-2c8d6a0b3e5f",
  "replay_command": "atf trade --in SOL --out USDC --amount-in 0.01",
  "machine_summary": {
    "command": "trade",
    "mode": "real",
    "outcome": "approved",
    "action_required": false,
    "suggested_action": "verify",
    "suggested_command": "atf verify req-7f3a9c2e-41d8-4b5a-9e1f-2c8d6a0b3e5f"
  }
}
```

### Share Snippet

```
⚡ ATF Protected Trade
Route: Jupiter (SAFE (142k CU))
Decision: APPROVED
Receipt: https://verify.trucore.xyz/tx/b8f42e1a7c03
```

### Bot Line

```
ATF|APPROVED|Jupiter|SAFE|tx=req-7f3a9c2e-41d8-4b5a-9e1f-2c8d6a0b3e5f
```

---

## Example C - Edge Case: API Fallback to Demo

**Scenario:** User has API key configured but the API is unreachable. CLI falls back to demo mode gracefully.

### JSON Output

```json
{
  "ok": true,
  "command": "trade",
  "mode": "demo",
  "machine_mode": "demo",
  "first_run": false,
  "api_fell_back": true,
  "route": "Jupiter",
  "classification": "SAFE (142k CU)",
  "policy_checks": [
    "Slippage within bounds",
    "Protocol allowed",
    "Route risk acceptable"
  ],
  "decision": "APPROVED",
  "machine_decision": "approved",
  "execution": "Trade executed successfully",
  "receipt_id": "demo_20260320160032",
  "receipt_url": "https://verify.trucore.xyz/tx/d4a1f8e92b76",
  "receipt_type": "demo",
  "verification_host": "verify.trucore.xyz",
  "verification_status": "Ready to verify",
  "share_text": "⚡ ATF Protected Trade\nRoute: Jupiter (SAFE (142k CU))\nDecision: APPROVED\nReceipt: https://verify.trucore.xyz/tx/d4a1f8e92b76",
  "bot_line": "ATF|APPROVED|Jupiter|SAFE|tx=demo_20260320160032",
  "replay_command": "atf trade --in SOL --out USDC --amount-in 0.01",
  "machine_summary": {
    "command": "trade",
    "mode": "demo",
    "outcome": "approved",
    "action_required": true,
    "suggested_action": "setup",
    "suggested_command": "atf setup"
  }
}
```

### Key Difference

`api_fell_back: true` - the CLI detected a network issue and fell back to demo mode automatically. No crash. No user intervention. The receipt is still valid and verifiable.

### Share Snippet

```
⚡ ATF Protected Trade
Route: Jupiter (SAFE (142k CU))
Decision: APPROVED
Receipt: https://verify.trucore.xyz/tx/d4a1f8e92b76
```

### Bot Line

```
ATF|APPROVED|Jupiter|SAFE|tx=demo_20260320160032
```

---

## Verification Output (Any Example)

Running `atf verify <receipt-id>`:

```json
{
  "ok": true,
  "command": "verify",
  "receipt_id": "demo_20260320145458",
  "verify_url": "https://verify.trucore.xyz/tx/demo_20260320145458",
  "receipt_type": "demo",
  "status": "Verification link ready",
  "machine_status": "ready_to_verify",
  "suggested_action": "setup",
  "suggested_command": "atf setup",
  "machine_summary": {
    "command": "verify",
    "mode": "demo",
    "outcome": "ready_to_verify",
    "action_required": true,
    "suggested_action": "setup",
    "suggested_command": "atf setup"
  }
}
```

# ATF Social Posts (X / Twitter)

> Three ready-to-post threads. No hype. Real output. Technical.

---

## Post 1 — Simple Hook

```
Run a protected trade in one command.

npx @trucore/atf@1.4.2 trade

⚡ ATF Protected Trade
Route: Jupiter (SAFE (142k CU))
Decision: APPROVED
Receipt: https://verify.trucore.xyz/tx/a3ed8521084c

No setup. No API key. Just run it.
```

---

## Post 2 — Proof Thread (4 tweets)

**Tweet 1:**
```
How ATF protects agent trades — in 4 steps.

Step 1: Run a trade.

npx @trucore/atf@1.4.2 trade
```

**Tweet 2:**
```
Step 2: Get a receipt.

Receipt ID: demo_20260320145458
Receipt: https://verify.trucore.xyz/tx/a3ed8521084c

Every trade produces a verifiable, SHA-256 hashed receipt.
```

**Tweet 3:**
```
Step 3: Verify it.

npx @trucore/atf@1.4.2 verify demo_20260320145458

Status: Verification link ready
URL: https://verify.trucore.xyz/tx/demo_20260320145458

Anyone can verify. No login required.
```

**Tweet 4:**
```
Step 4: Replay it.

atf trade --in SOL --out USDC --amount-in 0.01

Same route, same policy checks, same receipt format.
Deterministic protection, every time.

Try it: npx @trucore/atf@1.4.2 trade
```

---

## Post 3 — Builder Angle

```
ATF output is readable for humans, structured for agents.

Human sees:
  ⚡ ATF Protected Trade
  Route: Jupiter (SAFE (142k CU))
  Decision: APPROVED

Bot reads:
  ATF|APPROVED|Jupiter|SAFE|tx=demo_20260320145458

machine_summary tells your bot what to do next:
  outcome: "approved"
  suggested_action: "verify"
  suggested_command: "atf verify demo_20260320145458"

One CLI. Two audiences. Zero ambiguity.

npx @trucore/atf@1.4.2 trade --format json
```

---

## Usage Notes

- All outputs are from real CLI runs (v1.4.2, demo mode)
- Receipt URLs are live format: `https://verify.trucore.xyz/tx/<hash>`
- Replace receipt IDs with fresh ones from your own runs for authenticity
- Use `scripts/generate-proof.sh` to batch-generate fresh receipts before posting

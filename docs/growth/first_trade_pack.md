# ATF First Trade Pack

> Copy-paste onboarding block for first-time users.
> Works in demo mode - no API key, no config, no setup required.

---

## Run Your First Protected Trade

```bash
# 1. Run a protected trade (demo mode - works instantly)
npx @trucore/atf@1.4.2 trade

# 2. Verify your receipt
npx @trucore/atf@1.4.2 verify <receipt-id>

# 3. Enable real trades (optional - interactive setup)
npx @trucore/atf@1.4.2 setup

# 4. Diagnose your setup
npx @trucore/atf@1.4.2 doctor
```

---

## What You Get

Running `npx @trucore/atf@1.4.2 trade` produces:

```
⚡ ATF Protected Trade
Route: Jupiter (SAFE (142k CU))
Decision: APPROVED
Receipt: https://verify.trucore.xyz/tx/a3ed8521084c
```

- **Route** - the DEX route evaluated (Jupiter)
- **Decision** - APPROVED or DENIED based on policy checks
- **Receipt** - verifiable proof link

---

## Demo Mode (Default)

No API key? No problem. Demo mode runs:

- 100% deterministic
- Zero API calls
- Generates real receipt hashes (SHA-256)
- Full output including `share_text`, `bot_line`, `replay_command`

Once ready for real trades: `npx @trucore/atf@1.4.2 setup`

---

## One-Liner for README / Discord / Twitter

```
npx @trucore/atf@1.4.2 trade
```

That's it. One command. Protected trade. Verifiable receipt.

---

## JSON Output (for bots)

Add `--format json` for structured output:

```bash
npx @trucore/atf@1.4.2 trade --format json
```

Returns `machine_summary`, `bot_line`, `receipt_id`, `receipt_url`, and `replay_command`.

---

## Requirements

- Node.js >= 18
- No dependencies to install
- No config required (demo mode)
- Works on Linux, macOS, Windows (WSL)

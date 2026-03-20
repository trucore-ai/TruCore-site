# ATF Bot Integration Snippet

> Minimal Node.js example showing how a bot integrates ATF.
> No dependencies beyond Node.js + `child_process`.

---

## Quick Integration (Node.js)

```js
// atf-bot-example.mjs
// Minimal ATF integration — evaluate a trade, parse the result, act on it.
// Requires: Node.js >= 18, npx available in PATH

import { execFile } from "node:child_process";

function runATF(args) {
  return new Promise((resolve, reject) => {
    execFile("npx", ["@trucore/atf@1.4.2", ...args, "--format", "json"], {
      timeout: 30_000,
    }, (err, stdout, stderr) => {
      if (err && !stdout) return reject(new Error(stderr || err.message));
      try {
        // stdout may include a preamble line before JSON — find the JSON block
        const jsonStart = stdout.indexOf("{");
        const json = stdout.slice(jsonStart);
        resolve(JSON.parse(json));
      } catch (e) {
        reject(new Error(`Failed to parse ATF output: ${e.message}`));
      }
    });
  });
}

// --- Run a protected trade ---
const result = await runATF(["trade"]);

// Key fields for bot logic:
console.log("Decision:", result.machine_decision);    // "approved" | "denied"
console.log("Bot line:", result.bot_line);             // ATF|APPROVED|Jupiter|SAFE|tx=...
console.log("Receipt:", result.receipt_url);           // https://verify.trucore.xyz/tx/...

// Structured summary for orchestration:
const { outcome, suggested_action, suggested_command } = result.machine_summary;
console.log("Outcome:", outcome);                      // "approved"
console.log("Next action:", suggested_action);         // "setup" | "verify"
console.log("Next command:", suggested_command);       // "atf setup" | "atf verify <id>"

// --- Decide what to do ---
if (result.machine_decision === "approved") {
  console.log("Trade approved. Proceeding with execution.");
  console.log("Receipt ID:", result.receipt_id);
  // Bot can now: execute the swap, log the receipt, verify later
} else {
  console.log("Trade denied. Halting.");
  console.log("Reason:", result.execution);
}
```

---

## Example Output

```json
{
  "machine_decision": "approved",
  "bot_line": "ATF|APPROVED|Jupiter|SAFE|tx=demo_20260320145458",
  "receipt_url": "https://verify.trucore.xyz/tx/a3ed8521084c",
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

---

## Verify a Receipt Programmatically

```js
const receiptId = result.receipt_id;
const verification = await runATF(["verify", receiptId]);

console.log("Verify status:", verification.machine_status);  // "ready_to_verify"
console.log("Verify URL:", verification.verify_url);
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0    | Approved / healthy |
| 1    | Denied or user error |
| 2    | Network / server error |

Bots can check `process.exitCode` or parse `result.ok` for control flow.

---

## Log-Friendly `bot_line`

Single-line, pipe-delimited format for dashboards and log parsers:

```
ATF|APPROVED|Jupiter|SAFE|tx=demo_20260320145458
```

Fields: `ATF | DECISION | ROUTE | CLASSIFICATION | tx=RECEIPT_ID`

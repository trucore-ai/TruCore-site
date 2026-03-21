import { getAtfCliTag } from "@/lib/version";

export type OneLineMethod = "global" | "npx" | "curl";

export const ONE_LINE_GLOBAL_INSTALL = `npm install -g @trucore/atf@${getAtfCliTag()}`;
export const ONE_LINE_GLOBAL_COMMAND = `atf trade`;

export const ONE_LINE_NPX_COMMAND = `npx @trucore/atf@${getAtfCliTag()} simulate --preset swap_small --verify`;

export const ONE_LINE_CURL_COMMAND = `curl -sS https://trucore.xyz/api/simulate \\
  -H "content-type: application/json" \\
  -d '{"action":"swap","token_in":"SOL","token_out":"USDC","amount":10,"max_slippage_bps":100,"ttl_seconds":60}' | jq '.result | {status, reason, receipt_hash}'`;

export const ONE_LINE_EXPECTED_OUTPUT = `{
  "ok": true,
  "result": {
    "status": "allowed",
    "reason": "Request satisfies demo policy limits.",
    "receipt_hash": "3f8a...",
    "invariant_checks": [
      "amount <= 1000: pass",
      "max_slippage_bps <= 300: pass",
      "ttl_seconds <= 300: pass"
    ]
  }
}

# denied responses exit with code 2 (CLI)`;

export function oneLineCommandFor(method: OneLineMethod): string {
  if (method === "global") return `${ONE_LINE_GLOBAL_INSTALL}\n${ONE_LINE_GLOBAL_COMMAND}`;
  return method === "npx" ? ONE_LINE_NPX_COMMAND : ONE_LINE_CURL_COMMAND;
}

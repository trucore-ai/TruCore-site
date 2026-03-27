#!/usr/bin/env bash
# generate-proof.sh — ATF proof content engine
# Generates multiple trade receipts with verification for distribution.
#
# Usage:
#   ./scripts/generate-proof.sh              # 5 receipts (default)
#   ./scripts/generate-proof.sh 10           # 10 receipts
#   ATF_API_KEY=xxx ./scripts/generate-proof.sh  # real mode
#
# Output: prints share snippets and bot lines to stdout,
#         saves full JSON outputs to docs/growth/proof-output/

set -euo pipefail

COUNT="${1:-5}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ATF_CLI_DIR="${ATF_CLI_DIR:-$REPO_ROOT/agent-transaction-firewall/packages/atf-cli}"
OUTPUT_DIR="$SCRIPT_DIR/../docs/growth/proof-output"

mkdir -p "$OUTPUT_DIR"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ATF Proof Generator — generating $COUNT receipts"
echo "CLI: $ATF_CLI_DIR"
echo "Output: $OUTPUT_DIR"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

for i in $(seq 1 "$COUNT"); do
  echo "--- Receipt $i / $COUNT ---"

  # Run trade and capture JSON
  TRADE_JSON=$(node "$ATF_CLI_DIR/dist/index.js" trade --format json 2>/dev/null | grep -Pzo '\{[\s\S]*\}' | tr -d '\0' || true)

  if [ -z "$TRADE_JSON" ]; then
    echo "  ERROR: trade command produced no output"
    continue
  fi

  # Extract fields
  RECEIPT_ID=$(echo "$TRADE_JSON" | node -e "process.stdin.setEncoding('utf8');let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).receipt_id))")
  RECEIPT_URL=$(echo "$TRADE_JSON" | node -e "process.stdin.setEncoding('utf8');let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).receipt_url))")
  BOT_LINE=$(echo "$TRADE_JSON" | node -e "process.stdin.setEncoding('utf8');let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).bot_line))")
  SHARE_TEXT=$(echo "$TRADE_JSON" | node -e "process.stdin.setEncoding('utf8');let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).share_text))")
  MODE=$(echo "$TRADE_JSON" | node -e "process.stdin.setEncoding('utf8');let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).mode))")

  # Save full JSON
  echo "$TRADE_JSON" > "$OUTPUT_DIR/trade_${i}.json"

  # Run verify
  VERIFY_JSON=$(node "$ATF_CLI_DIR/dist/index.js" verify "$RECEIPT_ID" --format json 2>/dev/null || true)
  echo "$VERIFY_JSON" > "$OUTPUT_DIR/verify_${i}.json"

  # Print summary
  echo "  Mode:       $MODE"
  echo "  Receipt ID: $RECEIPT_ID"
  echo "  Receipt:    $RECEIPT_URL"
  echo "  Bot line:   $BOT_LINE"
  echo ""
  echo "  Share snippet:"
  echo "  $SHARE_TEXT" | head -4
  echo ""

  # Small delay to get different timestamps in demo mode
  sleep 1
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Done. $COUNT receipts saved to $OUTPUT_DIR"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

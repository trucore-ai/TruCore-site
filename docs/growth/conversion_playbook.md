# Conversion Playbook

What to do when someone shows interest. Reduce decision friction, move toward a real CLI run.

---

## Case 1 — Curious Builder

**Signal:** "This looks interesting" / "How does it work?" / likes/retweets proof post

**Goal:** Get them to run one command.

**Steps:**

1. **Send first trade pack**
   > "Here's the zero-config version — one command, no API key needed for demo mode:"
   > `npx @trucore/atf@1.4.2 trade`

2. **Send canonical proof example**
   > Share `canonical_proof_examples.md` or a screenshot of receipt output
   > Point out: receipt_id, receipt_hash, bot_line

3. **Ask them to run one command**
   > "Would you try this and tell me if the receipt format is useful for what you're building?"

4. **If they run it:**
   - Ask what they're building
   - Ask if the receipt fields make sense for their use case
   - Offer the golden path: `npx @trucore/atf@latest doctor` → `setup` → `trade` → `verify`

5. **If they don't run it:**
   - Don't push — share the receipt format as JSON and let them evaluate on their own terms
   - Follow up in 3–5 days with the follow-up message template

---

## Case 2 — Bot Developer

**Signal:** "I run a trading bot" / "Can bots parse this?" / "How does the bot_line work?"

**Goal:** Get them to integrate ATF into their bot execution path.

**Steps:**

1. **Send bot integration example**
   > Share the Node.js snippet from `bot_integration_snippet.md`
   > Or the Python example from `canonical_bot_integration_examples.md`
   > Emphasize: ~20 lines to wrap their existing execution

2. **Explain the finalize_execution flow**
   > "After your bot executes the trade, call `finalize_execution` to get the canonical receipt."
   > "The receipt includes a `bot_line` field — single-line, pipe-delimited, designed for log parsing."

3. **Offer help on first integration**
   > "Want me to walk through how to add this to your current execution flow?"
   > "I can pair on the first integration if that's faster."

4. **After first integration:**
   - Ask them to share feedback on the receipt format
   - Ask what fields would make it more useful
   - Ask if policy rules (max amount, allowed tokens, etc.) would be useful

---

## Case 3 — Infra / Protocol Team

**Signal:** "We build execution infrastructure" / "How does this fit with our router?" / "Interesting for our protocol"

**Goal:** Start a design partner conversation.

**Steps:**

1. **Send proof-oriented summary**
   > Share `canonical_receipt_launch_pack.md` — the golden path with full flow
   > Include the receipt spec highlights: SHA-256 content hash, JCS-canonicalized, deterministic verification

2. **Show canonical receipt story**
   > Walk through one real execution:
   > Intent submitted → policy approved → Jupiter swap → receipt issued
   > Point to real receipt hash: `996f95ed83d4c5da`

3. **Ask if they want a short technical walkthrough**
   > "Would a 15-minute call be useful? I can walk through the receipt format and policy model."
   > "Or I can send the spec and you can review async."

4. **If they agree to a call:**
   - Prepare: receipt spec, one live demo (run `npx @trucore/atf@latest trade` live), policy examples
   - Ask: "What execution flows do you support? Where would a policy + receipt layer fit?"
   - Outcome: agree on one concrete integration experiment or pass

5. **If they prefer async:**
   - Send receipt spec + one real receipt JSON
   - Follow up in 5 days: "Did the receipt format make sense for your use case?"

---

## Case 4 — Skeptic

**Signal:** "How is this different from logs?" / "Sounds like a wrapper" / "What's the point?"

**Goal:** Earn credibility with honesty, not overcome objections with hype.

**Steps:**

1. **Send real canonical receipt example**
   > Show actual JSON output — receipt_id, receipt_hash, intent, decision, execution result
   > "This is a real receipt from a mainnet Jupiter swap. The hash is computed over canonicalized data."

2. **Point to honest failure handling**
   > "If the trade fails, ATF still issues a receipt with the failure reason."
   > "If policy denies, you get a denial receipt before anything executes."
   > "We don't hide failures — they're part of the canonical record."

3. **Avoid over-selling**
   > Don't claim: "This replaces your logging" or "This is trustless"
   > Do say: "Receipts are backend-issued and tamper-evident. They complement your existing logs with a structured, verifiable format."

4. **Let them evaluate**
   > "Try `npx @trucore/atf@1.4.2 trade` and see if the output is useful. If not, no problem."
   > Don't follow up more than once on a skeptic — let the proof speak.

---

## Case 5 — "Send Me More Info"

**Signal:** Polite interest but no specific engagement.

**Goal:** Convert vague interest into a specific action.

**Steps:**

1. **Send one specific asset** (not a dump of everything)
   - If they build bots → `bot_integration_snippet.md`
   - If they build agents → `canonical_proof_examples.md`
   - If they build infra → `canonical_receipt_launch_pack.md`
   - If unclear → `first_trade_pack.md` (lowest friction)

2. **Include one concrete CTA**
   > "If you try `npx @trucore/atf@1.4.2 trade`, I'd love to hear if the receipt format works for you."

3. **Follow up once in 5 days if no response**
   > Use the follow-up message template from `outreach_messages.md`

4. **If still no response after follow-up:**
   > Mark as `no-response` in target list — don't pursue further

---

## General Rules

| Do | Don't |
|----|-------|
| Send one proof asset, not five | Dump all documentation at once |
| Ask one specific question | Ask "what do you think?" (too open-ended) |
| Offer to pair on first integration | Say "let me know if you need help" (passive) |
| Acknowledge when something isn't built yet | Claim features that aren't shipped |
| Follow up once, then let it go | Send 3+ follow-ups to the same person |
| Track status in target_account_list.md | Lose track of conversations |

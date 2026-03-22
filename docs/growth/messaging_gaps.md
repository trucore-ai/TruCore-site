# Messaging Gaps

> Top confusions identified from reply_bank patterns, conversion_playbook friction points,
> outreach message structure, and "What NOT to Say" guardrails.
>
> Source: analysis of existing growth assets (insights_log empty — gaps inferred from
> reply_bank topics, conversion_playbook cases, and messaging structure).

---

## Gap 1 — "Canonical tamper-evident receipts" is jargon

**What users likely say:** "What does that actually do?"  
**What they mean:** I don't know what "canonical" or "tamper-evident" means in plain English.  
**Why it happens:** Every post, DM, and thread leads with this phrase. It optimizes for technical precision over comprehension. A builder scanning Discord sees "canonical tamper-evident receipts" and moves on because it sounds like an academic paper, not a tool they need.

**Fix:** Lead with the outcome, not the mechanism. "Proof your trade was checked before it ran and recorded after it settled" says the same thing in words anyone understands.

---

## Gap 2 — Demo mode vs. real trades confusion

**What users likely say:** "Is this just simulation?"  
**What they mean:** Will this actually do something, or is it a sandbox?  
**Why it happens:** `first_trade_pack.md` says "100% deterministic, zero API calls" for demo mode, but social posts say "Real mainnet execution. No simulation." The reader sees `npx ... trade` and doesn't know which version they're getting. The word "demo" signals fake.

**Fix:** Drop "demo mode" from all first-touch messaging. Say: "Runs in safe mode by default — no wallet needed, real receipt format. Add your wallet to trade real tokens." One sentence kills the ambiguity.

---

## Gap 3 — "Why do I need this vs. logs?"

**What users likely say:** "How is this different from logs?"  
**What they mean:** I already log my trades. What does this add?  
**Why it happens:** The reply_bank has a long answer for this, which means people ask it often enough to need a canned reply. The core messaging never preempts it — no post or DM explains the difference before the question arises.

**Fix:** Add the distinction to the first touch: "Logs record what your system says happened. ATF checks the trade before execution and issues a receipt after — so you have proof of what was authorized, not just what was logged."

---

## Gap 4 — npx command requires comfort + trust

**What users likely say:** "Do I need a wallet?" / "Is this safe?"  
**What they mean:** I'm not going to run a random npm package that touches my money.  
**Why it happens:** The CTA is "run this command" but the messaging never addresses: (a) you need Node.js 18+, (b) no wallet is needed for safe mode, (c) your keys are never sent to ATF. Builder DMs skip straight to the command without answering the trust question first.

**Fix:** Before the command, add one line: "No wallet required. Nothing touches your funds. Just shows you the receipt format." After they try it, then explain real-trade setup.

---

## Gap 5 — Receipt hash shown before context

**What users likely say:** "What is a receipt actually proving?"  
**What they mean:** You showed me a hex string. I don't know what that means.  
**Why it happens:** Every social post includes `Receipt hash: 996f95ed83d4c5da` as proof. To someone who hasn't used ATF, a hash is noise. There's no before/after context — no "here's what would have happened WITHOUT ATF, here's what happened WITH it."

**Fix:** Replace bare hash with a mini-story: "Trade submitted → policy checked → approved → executed on Jupiter → receipt issued with verifiable hash." The hash is the punchline, not the opening line.

---

## Gap 6 — Cold DMs are too long

**What users likely say:** _(no reply)_  
**What they mean:** I didn't read past line 3.  
**Why it happens:** The cold DM template (Variant B) is ~15 lines with numbered steps and code blocks. Cold DMs that convert are 2–4 sentences. The current format reads like documentation, not a message.

**Fix:** Cut cold DMs to 3 sentences max: problem, proof, CTA. Move technical detail to a follow-up sent only if they reply.

---

## Gap 7 — "ATF doesn't execute — it approves" is confusing

**What users likely say:** "So what actually does the trade?"  
**What they mean:** If ATF doesn't trade, what's the point?  
**Why it happens:** The thread posts say "ATF doesn't execute — it approves. The agent executes." This is technically correct but confusing on first read. Users think ATF is the thing that trades.

**Fix:** Frame it as a checkpoint: "ATF checks your trade before it runs. If it passes policy, your agent executes. After the trade settles, ATF issues a receipt. Think of it as a guard, not an executor."

---

## Gap 8 — No answer for "Who else uses this?"

**What users likely say:** "Is anyone else using this?"  
**What they mean:** I don't want to be the first. Show me social proof.  
**Why it happens:** All messaging focuses on what ATF does, never on who uses it. The conversion_playbook mentions tracking first users but the messaging never references them. Without any social proof signal, skeptics default to "not yet."

**Fix:** As soon as there is one external user, add: "X external users have run their first protected trade." The follow-up template already has a placeholder for this — fill it as soon as data exists.

---

## Gap Summary

| # | Gap | Root Cause | Impact |
|---|-----|------------|--------|
| 1 | Jargon-first messaging | Precision over clarity | Readers skip the post |
| 2 | Demo vs. real confusion | Contradictory language | "Is this fake?" |
| 3 | No preemptive logs distinction | Reactive only (in reply_bank) | Most common objection not addressed |
| 4 | Trust/safety not addressed up front | CTA before context | Users won't run unknown CLI |
| 5 | Hash without context | Proof shown before story | "What does this prove?" |
| 6 | DMs too long | Documentation format in a DM | No reply |
| 7 | Approval vs. execution unclear | Technical nuance first | "What does this even do?" |
| 8 | No social proof | No external users referenced | Skeptics stay skeptical |

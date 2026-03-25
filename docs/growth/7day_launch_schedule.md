# 7-Day Canonical Receipt Launch Campaign

> Goal: Make ATF feel like it is already happening.
> Strategy: CONSISTENCY > PROOF > VISIBILITY > RESPONSE

---

## Campaign Objective

Publish real ATF proof (canonical receipts) every day for 7 days to:
- Drive first external users
- Create visible momentum in the Solana + agent ecosystem
- Convert builders into CLI users and design partners

---

## DAY 1 - FIRST PROOF DROP

**Theme:** One command, one receipt. Simple.

**Post:**
- Simple proof post - 1 command → 1 canonical receipt
- Attach: Receipt A (real mainnet, receipt hash `996f95ed83d4c5da`)
- See: [daily_post_assets.md](daily_post_assets.md) - Day 1

**DM Block:**
- Send warm DM (outreach_messages.md variant A) to 5–10 targeted builders
- Focus: Solana bot builders and agent developers from target_account_list.md categories 1–2
- CTA: "Would you try one protected trade?"

**Target Audience:** Solana bot builders, agent developers

**CTA:** `npx @trucore/atf@latest trade`

**Goal:** First reactions - likes, replies, DM responses

---

## DAY 2 - THREAD (HOW IT WORKS)

**Theme:** Walk through the full flow: approval → execution → receipt

**Post:**
- 5-part thread explaining the canonical receipt flow
- Attach: Receipt B (redacted real execution with full flow walkthrough)
- See: [daily_post_assets.md](daily_post_assets.md) - Day 2

**DM Block:**
- Follow up with Day 1 DM recipients who haven't replied
- Send cold DM (outreach_messages.md variant B) to 5 new targets
- Focus: Bot/project founders from target_account_list.md categories 1, 4

**Target Audience:** Technical builders who want to understand the mechanism

**CTA:** "Try it: `npx @trucore/atf@latest trade`"

**Goal:** Understanding - people grasp the 3-step flow

---

## DAY 3 - BUILDER ANGLE

**Theme:** Machine-readable receipts for bots and agents

**Post:**
- Highlight `bot_line` field and `machine_summary` JSON
- Attach: Dry-run output (Example B from canonical_proof_examples.md)
- See: [daily_post_assets.md](daily_post_assets.md) - Day 3

**DM Block:**
- DM bot developers specifically (target_account_list.md category 1)
- Use canonical_bot_integration_examples.md as follow-up material
- CTA: "Can I send you the integration example? It's ~20 lines of Python."

**Target Audience:** Bot operators, MEV teams, copy-trade tools

**CTA:** Point to canonical_bot_integration_examples.md

**Goal:** Integration interest - someone asks for the API docs

---

## DAY 4 - FAILURE HONESTY

**Theme:** What happens when finalization fails (the trust post)

**Post:**
- Show the finalize failure example (Example C from canonical_proof_examples.md)
- Key message: ATF never fabricates receipts when finalization fails
- Attach: Failure case output
- See: [daily_post_assets.md](daily_post_assets.md) - Day 4

**DM Block:**
- DM skeptics and infra teams (target_account_list.md category 3)
- Use reply_bank.md "What happens if finalization fails?" as talking point
- CTA: "If you want to see how we handle failure, run one trade."

**Target Audience:** Skeptics, infra builders, security-focused teams

**CTA:** Honest failure handling as a trust signal

**Goal:** Trust - this is the post that converts skeptics

---

## DAY 5 - REPEAT PROOF

**Theme:** Fresh receipt - consistency signal

**Post:**
- New receipt from a fresh execution (Receipt C)
- Different token pair or amount to show variety
- Attach: Receipt C (new real or representative receipt)
- See: [daily_post_assets.md](daily_post_assets.md) - Day 5

**DM Block:**
- Second wave outreach - 5 new targets from categories 2, 4, 6
- Follow up with all open conversations from Days 1–4
- Use outreach_messages.md variant E for follow-ups

**Target Audience:** Broader Solana ecosystem - aggregators, routing layers

**CTA:** `npx @trucore/atf@latest trade`

**Goal:** Consistency - showing up every day builds credibility

---

## DAY 6 - USE CASE

**Theme:** How a bot would actually use this

**Post:**
- Concrete integration walkthrough (Python or Node.js snippet)
- Show the 6-step flow from canonical_bot_integration_examples.md
- Attach: Bot integration example output
- See: [daily_post_assets.md](daily_post_assets.md) - Day 6

**DM Block:**
- DM agent framework teams (target_account_list.md category 2)
- Send partner-style note (outreach_messages.md variant C) to infra leads
- CTA: "Would a 15-minute technical walkthrough be useful?"

**Target Audience:** Agent frameworks, execution infra teams

**CTA:** Offer walkthrough or send receipt spec

**Goal:** Relevance - someone sees how it fits their stack

---

## DAY 7 - SUMMARY / MOMENTUM

**Theme:** Recap the week - multiple receipts, real usage

**Post:**
- Summary post: recap receipts generated, flow demonstrated, interest received
- Reference posts from Days 1–6
- Attach: Multiple receipt hashes from the week
- See: [daily_post_assets.md](daily_post_assets.md) - Day 7

**DM Block:**
- DM strongest leads for conversion (anyone who replied, ran CLI, or asked questions)
- Use conversion_playbook.md for closing tactics
- CTA: "Ready to set up as a design partner?"

**Target Audience:** All engaged contacts from the week

**CTA:** Design partner signup or scheduled walkthrough

**Goal:** Close conversations - convert interest into active users

---

## Daily Execution Checklist

Every day, execute all four:

| Action | Time | Notes |
|--------|------|-------|
| **Post** | Morning (9–11 AM UTC) | Publish on X, cross-post to Discord/Farcaster as relevant |
| **DM** | After posting (within 2 hrs) | Send DMs while post is fresh |
| **Reply** | Throughout the day | Use reply_handling_system.md for response templates |
| **Follow-up** | End of day | Check open conversations, update target_account_list.md status |

---

## Campaign Calendar

| Day | Date | Theme | Post Type | DM Target |
|-----|------|-------|-----------|-----------|
| 1 | TBD | First proof drop | Single post | 5–10 builders |
| 2 | TBD+1 | How it works | Thread (5 parts) | Follow-up + 5 new |
| 3 | TBD+2 | Builder angle | Single post | Bot developers |
| 4 | TBD+3 | Failure honesty | Single post | Skeptics / infra |
| 5 | TBD+4 | Repeat proof | Single post | Second wave |
| 6 | TBD+5 | Use case | Single post | Agent frameworks |
| 7 | TBD+6 | Summary | Recap post | Strongest leads |

Fill in dates when campaign start is confirmed.

---

## Success Metrics (End of Week)

| Metric | Target |
|--------|--------|
| Posts published | 7/7 |
| DMs sent | 30+ |
| Replies received | 5+ |
| CLI runs by external users | 3+ |
| Design partner conversations | 1+ |
| Follow-ups completed | All open threads |

---

## References

- [canonical_receipt_launch_pack.md](canonical_receipt_launch_pack.md)
- [canonical_social_posts.md](canonical_social_posts.md)
- [canonical_proof_examples.md](canonical_proof_examples.md)
- [outreach_messages.md](outreach_messages.md)
- [canonical_bot_integration_examples.md](canonical_bot_integration_examples.md)
- [reply_bank.md](reply_bank.md)
- [shareable_proof_examples.md](shareable_proof_examples.md)
- [target_account_list.md](target_account_list.md)
- [daily_post_assets.md](daily_post_assets.md)
- [reply_handling_system.md](reply_handling_system.md)
- [proof_rotation_plan.md](proof_rotation_plan.md)

---

_All messaging must stay technically accurate. No hype. No fake proof. No exaggerated claims._

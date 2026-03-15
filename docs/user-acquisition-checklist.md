# TruCore Early User Acquisition -- Operator Checklist

**Companion to:** `agent-transaction-firewall/docs/growth/EARLY_USER_ACQUISITION_PLAN.md`
**Owner:** Jeremy
**Created:** 2026-03-14

Use this checklist after code/docs changes are ready. Work top to bottom.

---

## Foundation (Days 1-15)

- [ ] **ATF-01** Run full golden path on fresh env, document friction points
  - `cd /home/kontractkoder/repo/agent-transaction-firewall`
  - `python examples/bot_quickstart/python/protect.py --mode http`
  - `node examples/bot_quickstart/node/protect.js --mode http`
  - Write friction report in docs/growth/ or as GitHub issue

- [ ] **ATF-02** Verify golden path produces receipt end-to-end
  - install -> configure -> protect Jupiter swap -> get receipt -> verify
  - Save output receipt JSON as evidence

- [ ] **ATF-04** Confirm sample_intent.json + sample_receipt.json exist in docs/agent/examples/
  - `ls docs/agent/examples/sample_intent.json docs/agent/examples/sample_receipt.json`

- [ ] **ATF-03** Confirm curl example in examples/bot_quickstart/README.md
  - `grep -c 'curl' examples/bot_quickstart/README.md`

- [ ] **ATF-05** Run all 4 adapter quickstarts, confirm valid receipts
  - OpenClaw, HTTP, Python, TypeScript
  - Save receipt hashes as evidence

- [ ] **SITE-01** Review 5-minute quickstart page in browser
  - `cd /home/kontractkoder/repo/TruCore-site && npm run dev`
  - Visit http://localhost:3000/docs/5-minute-quickstart
  - Confirm: clear steps, working code blocks, visible CTA

- [ ] **SITE-02** Confirm "who this is for" section visible on site
  - Visit /agent-transaction-firewall or /docs
  - Matches positioning from plan Section 3

- [ ] **ATF-06** Test default policy allows Jupiter swap without YAML editing
  - `cat config/policies/default.yaml` (or starter template)
  - Submit a basic Jupiter swap intent, confirm ALLOW

---

## Proof (Days 16-30)

- [ ] **ATF-07** Complete OpenClaw dogfood run
  - `cd /home/kontractkoder/repo/agent-transaction-firewall/packages/openclaw-atf`
  - Install, configure, run atf_protect_intent, capture receipt
  - Save proof artifact to docs/proofs/

- [ ] **ATF-08** Create compatibility matrix
  - `cd /home/kontractkoder/repo/agent-transaction-firewall/docs`
  - Markdown table: adapters x flows x chains
  - Link from INDEX.md

- [ ] **SITE-03** Proof/demo page live on site
  - Visit /docs/live-demo or equivalent
  - Confirm real enforcement flow shown

- [ ] **DIST-01** Publish first X proof thread
  - Include: real receipt, screenshot, quickstart link, verify link
  - Tone: technical, not promotional

- [ ] **DIST-02** Publish technical article
  - "How we protect AI trading agent transactions"
  - Blog or external venue

---

## Distribution (Days 31-60)

- [ ] **ATF-09** GitHub topics and description set on ATF repo
  - Topics: ai-agent, trading-bot, solana, defi, transaction-firewall
  - Description: "Policy-enforced transaction protection for AI trading agents."

- [ ] **DIST-03** Submit to Solana ecosystem listings
  - solana.com/ecosystem, awesome-solana

- [ ] **DIST-04** Submit to AI agent directories
  - awesome-ai-agents, agent tool indexes

- [ ] **DIST-05** Post in Jupiter community Discord

- [ ] **DIST-06** Post in Solana developer Discord

- [ ] **DIST-07** Write 2-3 more X threads (receipts, deny flow, dogfooding)

- [ ] **SITE-04** Per-adapter integration pattern pages live on site

---

## Conversion and Retention (Days 61-90)

- [ ] **SITE-05** CTA ("Try your first protected trade") on all docs pages

- [ ] **SITE-06** Landing path tested: discover -> quickstart -> protect -> receipt -> verify

- [ ] **ATF-11** Self-serve onboarding audit: can a new user complete golden path without help?

- [ ] **SITE-08** Verify /api/bot-feedback accepts structured friction JSON

- [ ] **ATF-12** Fix top 3 friction points from early user feedback

- [ ] **DIST-08** Direct outreach to 5 known bot developers

- [ ] **DIST-09** Collect 2+ usage stories

---

## Weekly Review (ongoing)

- [ ] Review ATF server logs for error patterns (15 min)
- [ ] Check /api/bot-feedback for new submissions
- [ ] Scan X mentions of TruCore/ATF
- [ ] Review any new GitHub issues from external users
- [ ] Update KPI tracking (quickstart completions, receipt verifications, unique agents)
- [ ] Note top friction point for next fix cycle

---

## Validation Commands

```bash
# Confirm plan file exists in ATF repo
cd /home/kontractkoder/repo/agent-transaction-firewall
test -f docs/growth/EARLY_USER_ACQUISITION_PLAN.md && echo "Plan exists" || echo "MISSING"

# Confirm checklist exists in site repo
cd /home/kontractkoder/repo/TruCore-site
test -f docs/user-acquisition-checklist.md && echo "Checklist exists" || echo "MISSING"

# Grep for key terms in ATF docs
cd /home/kontractkoder/repo/agent-transaction-firewall
grep -R "early user acquisition\|bot\|OpenClaw\|receipt" docs/growth/ | head -20

# Grep for key terms in site docs
cd /home/kontractkoder/repo/TruCore-site
grep -R "quickstart\|receipt\|OpenClaw\|Jupiter\|bot" docs/ | head -20
```

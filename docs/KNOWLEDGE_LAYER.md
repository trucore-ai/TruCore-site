# ATF Knowledge Layer — Site Planning Reference

> Internal planning document — not a public route.
> Maps the TruCore-site docs surface to the three-layer knowledge
> architecture defined in the private repo.

**Status:** Active planning reference
**Created:** 2026-04-11

---

## Layer mapping for this repo

TruCore-site serves two layers of the ATF knowledge system:

### Layer A — Public docs (current)

All pages under `/docs/*` are currently public. The navigation source of
truth is `lib/docs-nav.ts` (4 sections, 46 items).

Public docs cover: getting started, tutorials, CLI reference, API reference,
integration patterns, concepts, and agent-facing discovery.

### Layer B — Authenticated docs (future)

No authenticated docs section exists yet. The site has auth infrastructure
(signup, login, API keys, customer dashboard) but docs are all public.

**Design intent for Layer B:**

- Route pattern: `/docs/guide/*` or `/docs/customer/*`
- Auth: same middleware as `/customer/*` routes
- Content types: webhook debugging, key lifecycle, rate-limit recovery,
  production bot configuration, account-scoped examples
- Gating: any authenticated user (free tier included) sees Layer B content

**Implementation approach (proposed):**

1. Create a new docs-nav section: "Customer Guides" (or similar)
2. Add auth check to the docs shell when rendering that section
3. Unauthenticated users see a "Sign in to view" prompt
4. Content pages are standard TSX in `app/docs/guide/*/page.tsx`
5. Sitemap excludes authenticated pages (or marks them appropriately)

---

## Content alignment with atf-spec

The following TruCore-site pages correspond to atf-spec documents.
When updating these pages, check the spec version for normative accuracy.

| Site page | atf-spec source | Relationship |
|-----------|----------------|-------------|
| /docs/receipts-and-trust | spec/receipt.md | Tutorial form of spec |
| /docs/verify | spec/verification.md | Tutorial form of spec |
| /docs/mcp | docs/mcp-integration.md | Product-contextualized |
| /docs/hello-world-bot | docs/hello-world-bot.md | Product-contextualized |
| /docs/atf-architecture | spec/architecture.md | Expanded with product context |
| /docs/receipt-specification-v1 | spec/receipt.md | Detailed spec presentation |
| /docs/permit-schema-v1 | (internal: universal_agent_permit_protocol.md) | Public subset |

**Rule:** If the atf-spec version says X and the site page says Y, fix the
site page. The spec is normative.

---

## Content alignment with internal canon

The internal repo (agent-transaction-firewall) is the engineering source
of truth. These site pages derive from internal docs:

| Site page | Internal source | Notes |
|-----------|----------------|-------|
| /docs/first-protected-trade | docs/quickstart/GOLDEN_PATH.md | Must match implementation |
| /docs/cli/* | docs/product/CLI_*.md | CLI behavior is internal truth |
| /docs/api | docs/specs/http_reference_adapter.md | Adapter spec is canonical |
| /docs/policy-model | docs/specs/policy_engine_and_enforcement_model.md | Public subset |
| /docs/perps | docs/dev/perps_enforcement_quickstart.md | Public subset |
| /docs/dex-guardrails | docs/dev/dex_enforcement_quickstart.md | Public subset |

---

## Agent-facing assets

| Asset | Path | Purpose |
|-------|------|---------|
| llms.txt | public/llms.txt | Machine-readable product manifest |
| robots.txt | app/robots.ts | Search engine access |
| sitemap.xml | app/sitemap.ts | Auto-generated from docs-nav.ts |
| Tool card | /docs/agent/atf_toolcard.json | Agent tool specification |
| Agent discovery | /docs/agent-discovery (page) | Human+agent discovery entry point |

---

## Layer B Audit — Authenticated Knowledge Boundary (Prompt 116)

**Audit date:** 2026-04-12

### Current authenticated/proto-authenticated surfaces

| Surface | Route | Auth type | Doc content |
|---------|-------|-----------|-------------|
| Customer dashboard | /customer/dashboard | API-key session | Plan/usage meters, onboarding stepper, quick-trade flow, receipt preview, error classification |
| Customer keys | /customer/keys | API-key session | Key create/rotate/revoke with one-time-secret warning, MCP endpoint config, scope reference, env setup snippets |
| Customer receipts | /customer/receipts | API-key session | Receipt list, decision badge, verification button, content_hash display, policy breakdown |
| Partner portal | /portal | Partner session cookie | Tenant-scoped keys, usage snapshots, simulator examples, activation guide, rate-limit headers, premium analytics placeholder |
| Operator dashboard | /dashboard | Admin session cookie | KPI strip, health status, enforcement posture, tenant overview, adoption funnel (internal-only) |
| Admin routes | /admin/* | Admin session cookie | Audit log, user search, feature flags, latency, monetization, usage, metrics, waitlist, acquisition (internal-only) |
| Feedback | /feedback | GitHub OAuth (optional) | Feature voting, roadmap visibility (semi-public) |

### Embedded doc-like content in components

| Component | Purpose | doc-like content |
|-----------|---------|-----------------|
| portal-activation-guide.tsx | State-aware next-step guidance | Links to public docs based on zero/early/active usage |
| portal-first-protected-trade.tsx | In-portal first-trade flow | Overlaps with /docs/first-protected-trade |
| portal-create-key-guide.tsx | Key creation walkthrough | Overlaps with /docs/auth |
| portal-verify-panel.tsx | In-portal receipt verification | Overlaps with /docs/verify |
| section-explainer.tsx | Dashboard "About..." disclosure panels | Operator-only metric explanations |
| enforcement-overview.tsx | Enforcement posture interpretation | Auth failure, rate-limit, quota taxonomy |
| adoption-funnel.tsx | Tenant adoption stage display | Funnel stages with source attribution |

### Overlap map: authenticated vs public layer

| Authenticated surface | Public equivalent | Relationship |
|-----------------------|-------------------|-------------|
| /customer/keys: key create/rotate/revoke UI | /docs/auth: curl-based key lifecycle | **Valid deepening** — UI is operational form of the same concept |
| /customer/keys: MCP endpoint config + scope ref | /docs/mcp: MCP integration overview | **Valid deepening** — keys page adds account-specific config |
| /customer/dashboard: quick-trade flow | /docs/first-protected-trade | **Partial duplicate** — dashboard embeds a simplified version |
| /customer/dashboard: plan/usage meters | /docs/plans: tier comparison table | **Valid deepening** — dashboard shows live account state |
| /customer/receipts: verification UI | /docs/verify + /docs/receipts-and-trust | **Valid deepening** — UI adds per-receipt action |
| /portal: activation guide | /docs/getting-started + /docs/5-minute-quickstart | **Partial duplicate** — portal links to public pages but restates guidance |
| /portal: simulator examples | /docs/api + /docs/5-minute-quickstart | **Duplicate** — same curl patterns in both places |
| /portal: rate-limit headers text | (not documented in public layer) | **Authenticated-only** — rate-limit header names not in public docs |
| /dashboard: enforcement posture | (no public equivalent) | **Internal-only** — operator metrics, not customer-facing |
| /dashboard: adoption funnel | (no public equivalent) | **Internal-only** — operator growth metrics |
| /admin/*: all admin routes | (no public equivalent) | **Internal-only** — platform operations |

### Contradictions and boundary problems found

**C1 — Decision terminology inconsistency across authenticated surfaces**
- Customer dashboard checks: `decision === "ALLOW"` (line 550, 825, 1171)
- Customer receipts page accepts THREE variants defensively:
  `decision === "ALLOW" || decision === "allowed" || decision === "approved"` (lines 60-62)
- Public glossary (/docs/terminology-and-endpoints) maps these as distinct layers:
  - `ALLOW` = internal/dashboard term (not in glossary as a surface)
  - `ALLOWED/DENIED` = UI badge term
  - `approved/denied` = API response term
  - `allow/deny` = spec term
- **Problem:** The customer receipts page silently normalizes inconsistent backend
  responses. The dashboard uses `"ALLOW"` which doesn't match any public glossary
  surface exactly. Public glossary says UI should show `ALLOWED/DENIED/UNKNOWN`.
- **Fix:** Customer-facing surfaces should display `ALLOWED/DENIED` (UI surface
  per glossary) even if the API returns `"ALLOW"` or `"approved"` internally.

**C2 — "BLOCKED" vs "DENIED" in customer dashboard**
- Dashboard quick-trade error: `"Trade was blocked by protection policies"` (line 551)
- Public glossary uses: `DENIED` (UI), `denied` (API/spec)
- CLI uses: `BLOCKED` in some places, `DENIED` in others
- **Problem:** Customer sees "blocked" in dashboard but public docs say "DENIED".
- **Fix:** Standardize customer-facing copy to use "denied" (matching API/glossary).

**C3 — Portal rate-limit documentation is isolated**
- Partner portal page hardcodes: `"Rate-limit headers: X-RateLimit-Limit/Remaining/Reset."`
- This information does NOT appear in public /docs/api or /docs/auth.
- **Problem:** Rate-limit header names are only documented in an authenticated surface.
  A customer reading public docs has no way to discover these headers.
- **Fix:** Add rate-limit header reference to public /docs/api page OR create an
  authenticated rate-limit guide that links to public API docs.

**C4 — Portal tier label vs plans page**
- Portal hardcodes: `"Partner Sandbox (120 req/min)"`
- Plans page (/docs/plans) lists: Free (100 protect/day), Pro (5,000/day), Enterprise (1M/day)
- **Problem:** Portal uses per-minute language while plans page uses per-day language.
  "Partner Sandbox" tier name doesn't appear in public plans page.
- **Fix:** Either align portal text with public tier names OR document Partner Sandbox
  as a distinct tier in the plans page.

**C5 — No webhook documentation exists anywhere**
- agent-transaction-firewall has webhook UI components and tests (web_console)
- TruCore-site has zero webhook documentation (public or authenticated)
- KNOWLEDGE_LAYER.md backlog mentions "webhook debugging" as a planned topic
- **Problem:** Webhooks exist in the product but are undocumented at every layer.
- **Fix:** Phase B topic for authenticated docs layer.

**C6 — No reconcile/readiness customer documentation**
- "readiness" appears only in marketing copy (enterprise page, homepage, details page)
  and CLI doctor command reference
- "reconcile" appears in zero customer-facing content
- **Problem:** These are operational concepts with no customer-facing explanation.
  Customers hitting readiness failures have no troubleshooting path.
- **Fix:** Phase B topic for authenticated docs layer.

### Topics that should remain at each layer

**Public only (no authenticated duplicate needed):**
- Concepts: receipts, trust, verification theory
- Spec references: receipt spec v1, permit schema v1
- Discovery: when to use ATF, architecture overview, integration pattern
- Tutorials: quickstart, 5-minute quickstart, hello-world bot
- CLI reference: commands, deep dives (doctor, profiles, etc.)
- Terminology glossary

**Authenticated (operational deepening of public topics):**
- Key lifecycle: create → rotate → revoke with live account state
- Receipt operations: browse, verify, export your receipts
- Usage/quota: live meters, approaching-limit warnings, upgrade path
- Rate limits: header reference, backoff strategy, recovery
- Webhook setup: configuration, delivery verification, DLQ debugging
- Production bot config: profile separation, env setup, scope management
- Readiness/health: what "ready" means for your integration, doctor output
- Troubleshooting: classified error states, common failure patterns
- First-use guidance: activation stepper (already exists in dashboard/portal)

**Internal only (must NOT leak to authenticated docs):**
- Operator dashboard metrics and enforcement posture
- Tenant-wide adoption funnel data
- Admin routes and admin-scoped operations
- Platform monetization and acquisition tracking
- Internal runbooks (docs/ops/*)
- Product planning docs (docs/product/*)

### Recommended authenticated layer content model

**Route namespace:** `/docs/guide/*`
**Auth:** Same middleware as `/customer/*` (API-key session via customer-auth.ts)
**Nav:** New "Customer Guides" section in docs-nav.ts (gated)
**Sitemap:** Excluded from public sitemap.xml

**Proposed initial pages:**

| Route | Title | Priority | Source |
|-------|-------|----------|--------|
| /docs/guide | Customer Guides Overview | Phase A | New |
| /docs/guide/key-lifecycle | API Key Lifecycle | Phase B ✅ | Extract from /customer/keys UI copy + /docs/auth |
| /docs/guide/rate-limits | Rate Limits & Recovery | Phase B ✅ | Portal rate-limit text + new content |
| /docs/guide/webhooks | Webhook Setup & Debugging | Phase B ✅ | agent-transaction-firewall webhook module |
| /docs/guide/readiness | Readiness & Health Checks | Phase B ✅ | CLI doctor + new operational content |
| /docs/guide/receipts-ops | Receipt Operations | Phase B ✅ | Extract from /customer/receipts UI copy |
| /docs/guide/troubleshooting | Troubleshooting | Phase C ✅ | Classified error states from dashboard |
| /docs/guide/production-bot | Production Bot Configuration | Phase C | Expand /docs/cli/guides/production-bot-basics |
| /docs/guide/reconcile | Reconcile & State Recovery | Phase D | New (depends on backend feature maturity) |

**Linking pattern:**
- Each authenticated guide links back to its public equivalent:
  "For concepts, see [public page]. This guide covers operational details."
- Public pages do NOT link forward to authenticated guides (avoids dead-end
  for unauthenticated visitors).

### Gap analysis

**Already exists and reusable:**
- Customer dashboard onboarding stepper (activation state tracking)
- Customer keys page (complete key lifecycle UI with guidance text)
- Customer receipts page (verification UI)
- Portal activation guide (state-aware next-step blocks)
- Portal simulator examples (curl patterns)
- Plans page (tier comparison with limits)

**Exists but needs correction/alignment:**
- C1: Decision badge terminology (ALLOW → ALLOWED, BLOCKED → DENIED)
- C2: Dashboard "blocked" copy → "denied"
- C3: Rate-limit headers (move to public or create authenticated guide)
- C4: Portal tier naming vs plans page

**Missing — build first (Phase B):**
- Dedicated rate-limit & backoff guide
- Webhook setup documentation
- Readiness/health check customer guide
- Key lifecycle as standalone guide (not just UI)
- Receipt operations guide (not just UI)

**Missing — build later (Phase C-D):**
- Troubleshooting & failure state documentation
- Production bot configuration guide (expand existing CLI guide)
- Reconcile & state recovery guide
- Account-scoped examples with live data references

**Should remain internal only:**
- Operator enforcement posture explanations
- Admin audit log documentation
- Adoption funnel metrics
- Internal runbooks and ops checklists

### Phased backlog

**Phase A — Scaffold (this prompt or next)**
- [x] Decide route pattern: `/docs/guide/*` (confirmed)
- [x] Plan docs-nav.ts update: add "Customer Guides" section (items gated by auth)
- [x] Plan auth middleware extension for `/docs/guide/*` routes
- [x] Plan sitemap exclusion for guide routes
- [x] Document the above in this file (done)

**Phase A — Implementation (Prompt 118)**
- [x] Route: `app/docs/guide/page.tsx` with full overview landing page
- [x] Layout: `app/docs/guide/layout.tsx` wraps DocsShell + GuideAuthGate
- [x] Auth: `components/docs/guide-auth-gate.tsx` — client-side isLoggedIn() check
      (same pattern as /customer/* routes). Unauthenticated users see sign-in prompt.
- [x] Nav: "Customer Guides" section added to docs-nav.ts with `authenticated: true`
      flag. DocsNavSidebar filters authenticated sections for unauthenticated users.
- [x] Sitemap: authenticated sections excluded from sitemap generation
- [x] Robots: `/docs/guide/` added to disallow rules
- [x] Public docs hub: authenticated sections excluded from card grid
- [x] llms.txt: no changes needed (static file, no guide references)
- [x] Metadata: guide overview page has `robots: { index: false, follow: false }`

**Phase B — Initial customer guides**
- [x] /docs/guide (overview page with section links) — done in Prompt 118
- [x] /docs/guide/key-lifecycle (extract + expand from UI copy) — done in Prompt 119
- [x] /docs/guide/rate-limits (rate-limit headers, backoff, recovery) — done in Prompt 120
- [x] /docs/guide/webhooks (setup, delivery verification, DLQ)
- [x] /docs/guide/readiness (health checks, integration readiness)
- [x] /docs/guide/receipts-ops (browse, verify, export operations) — done in Prompt 123
- [x] Fix C1–C4 terminology issues in customer-facing surfaces — done in Prompt 124

**Phase C — Troubleshooting & advanced**
- [x] /docs/guide/troubleshooting (top error patterns, classified recovery) — done in Prompt 125
- [ ] /docs/guide/production-bot (expand CLI guide into authenticated context)
- [ ] Support-deflection content (common failures → self-serve resolution)

**Phase D — Account-scoped operational references**
- [ ] /docs/guide/reconcile (state reconciliation when available)
- [ ] Account-scoped examples (live data references)
- [ ] Extended history documentation (30d+ data windows)

---

## Backlog for this repo (non-authenticated)

### Phase 5 — Agent optimization
- [ ] Add structured frontmatter to all docs pages
- [ ] Add /docs/sitemap.json for programmatic discovery
- [ ] Verify llms.txt references match live routes
- [ ] Test agent retrieval quality with sample queries

---

## Related

- Internal: agent-transaction-firewall/docs/KNOWLEDGE_LAYER_ARCHITECTURE.md
- Public: atf-spec/docs/CONTENT_MAP.md

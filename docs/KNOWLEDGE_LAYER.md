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

## Backlog for this repo

### Phase 2 — Authenticated docs scaffold
- [ ] Define route pattern and auth middleware for gated docs
- [ ] Create first placeholder pages (webhook debugging, key lifecycle)
- [ ] Update docs-nav.ts with a "Customer Guides" section
- [ ] Exclude authenticated pages from public sitemap

### Phase 3 — Content expansion
- [ ] Add troubleshooting pages (top support scenarios)
- [ ] Add production bot configuration guide
- [ ] Add rate-limit recovery guide
- [ ] Expand webhook setup guide with debugging section

### Phase 5 — Agent optimization
- [ ] Add structured frontmatter to all docs pages
- [ ] Add /docs/sitemap.json for programmatic discovery
- [ ] Verify llms.txt references match live routes
- [ ] Test agent retrieval quality with sample queries

---

## Related

- Internal: agent-transaction-firewall/docs/KNOWLEDGE_LAYER_ARCHITECTURE.md
- Public: atf-spec/docs/CONTENT_MAP.md

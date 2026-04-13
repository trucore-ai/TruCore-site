# Contributing to TruCore Docs

Short reference for anyone adding or editing documentation pages.

## Adding a New Docs Page

1. **Create the page** under `app/docs/<slug>/page.tsx`.
2. **Add a nav entry** in `lib/docs-nav.ts` — pick the correct section.
3. **Add a metadata entry** in `lib/docs-metadata.ts` with all required fields.
4. **Export Next.js Metadata** from the page (or from `layout.tsx` if the page is a client component).

## Metadata Conventions

The canonical schema reference lives in the atf-spec repo:

- **[metadata-schema.md](https://github.com/trucore-ai/atf-spec/blob/main/docs/metadata-schema.md)**

### Required fields per docs-metadata.ts entry

| Field | Type | Notes |
| --- | --- | --- |
| `href` | string | Must match docs-nav.ts href |
| `title` | string | Page title |
| `summary` | string | One-sentence machine-readable summary |
| `layer` | `"public"` \| `"authenticated"` | |
| `audience` | `"human"` \| `"agent"` \| `"both"` | |
| `status` | `"canonical"` \| `"guide"` \| `"reference"` \| `"tutorial"` \| `"spec"` | |
| `product_area` | string[] | One or more from the `ProductArea` union |
| `auth_required` | boolean | `true` for customer guides |

Optional: `spec_ref` (link to atf-spec), `related` (related page paths).

### Next.js Metadata export

Every page should export a `Metadata` object with at minimum:

- `title` (with `| TruCore` or `| TruCore ATF` suffix)
- `description`
- `keywords` (5–10 terms)
- `openGraph` (title, description, url, images)
- `twitter` (card: `summary_large_image`, title, description, images)
- `alternates.canonical` (`https://trucore.xyz/docs/<slug>`)

## Public vs Authenticated Docs

- **Public pages** go in any non-authenticated section of docs-nav.ts.
- **Authenticated pages** go in the `Customer Guides` section (`authenticated: true`).
- Authenticated pages must have `auth_required: true` in docs-metadata.ts.
- Authenticated pages must **not** be referenced in `public/llms.txt`, `app/sitemap.ts`, or any public discovery surface.

## Discovery Surfaces

Changes to docs pages may affect these surfaces:

| Surface | Source | Auto-updates? |
| --- | --- | --- |
| `/sitemap.xml` | `app/sitemap.ts` ← `docs-nav.ts` | Yes |
| `/api/docs/sitemap` (JSON) | `app/api/docs/sitemap/route.ts` ← `docs-metadata.ts` | Yes |
| `/.well-known/agent.json` | `public/.well-known/agent.json` | Manual |
| `/.well-known/atf.json` | `public/.well-known/atf.json` | Manual |
| `/llms.txt` | `public/llms.txt` | Manual |

When adding a high-value public page, consider whether it should also appear in `llms.txt`.

## Validation Checklist

- [ ] Page builds without TypeScript errors (`npx tsc --noEmit`)
- [ ] Entry exists in both `docs-nav.ts` and `docs-metadata.ts`
- [ ] Metadata export is a valid `Metadata` object
- [ ] Authenticated pages are not exposed in public discovery
- [ ] `LAST_UPDATED` in `docs-nav.ts` is current

# Proof Links

Proof links are the simplest way to share and embed TruCore verification. They provide direct URLs for human verification and social previews.

---

## Verify URL

The primary proof surface for human verification.

**Canonical format:**
```
https://www.trucore.xyz/verify?hash=<sha256-hash>&from=share
```

**Example:**
```
https://www.trucore.xyz/verify?hash=abc123def456789...&from=share
```

**What happens when clicked:**
1. User lands on the TruCore verify page
2. Receipt hash is pre-filled
3. Verification runs automatically
4. Result displayed with visual confirmation

**Usage:**
- Share in messages, emails, or documentation
- Embed in dashboards or admin panels
- Link from transaction logs or audit reports

---

## OG Preview URL

Visual proof card for social sharing. Returns a 1200×630 image optimized for Twitter, Discord, and other platforms.

**Canonical format:**
```
https://www.trucore.xyz/api/og/receipt?hash=<sha256-hash>
```

**Example:**
```
https://www.trucore.xyz/api/og/receipt?hash=abc123def456789...
```

**What it shows:**
- TruCore branding
- Receipt hash (truncated)
- Verification status
- Decision badge (`ALLOW` / `DENY`)

**Usage:**
- Set as `og:image` in meta tags
- Embed in tweets or posts
- Preview before sharing

---

## ProofLinksCard Component

The `ProofLinksCard` React component displays both URLs with copy buttons:

```tsx
import { ProofLinksCard } from "@/components/proof-links-card";

<ProofLinksCard hash="abc123def456789..." />
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `hash` | `string` | Receipt hash (required) |
| `compact` | `boolean` | Render in compact mode |

---

## When to Use Each Surface

| Need | Best Surface |
|------|--------------|
| Share with a person | **Verify URL** |
| Post on Twitter/Discord | **OG Preview** + **Verify URL** |
| Embed in app UI | **Proof Links** card |
| Archive for audit | **Proof Bundle** (see [proof-bundle.md](./proof-bundle.md)) |
| Integrate programmatically | **Proof Packet** (see [PROOF_PACKET.md](./PROOF_PACKET.md)) |
| Feed to bots/agents | **Distribution** (see [distribution.md](./distribution.md)) |

---

## Copy-Paste Examples

### Markdown link
```markdown
[Verify this trade](https://www.trucore.xyz/verify?hash=abc123...&from=share)
```

### HTML with OG preview
```html
<meta property="og:image" content="https://www.trucore.xyz/api/og/receipt?hash=abc123..." />
<meta property="og:url" content="https://www.trucore.xyz/verify?hash=abc123...&from=share" />
```

### Plain text
```
Protected trade verified via TruCore.
Verify: https://www.trucore.xyz/verify?hash=abc123...&from=share
```

---

## URL Structure

| Parameter | Required | Description |
|-----------|----------|-------------|
| `hash` | Yes | SHA-256 receipt hash (64 hex characters) |
| `from` | Recommended | Attribution parameter (`share`, `portal`, `verify`) |

**Note:** The `from` parameter helps track how users discover verification links. Always include `from=share` for externally shared links.

---

## Security

Proof links only expose:
- The receipt hash
- Verification status
- Decision outcome

They never expose:
- Wallet addresses
- Transaction amounts
- Policy details
- Any sensitive metadata

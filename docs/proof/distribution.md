# Distribution

The **distribution layer** converts verified receipts into shareable outputs for humans and machines. This enables organic growth and bot integration through simple, copy-paste artifacts.

---

## Why Distribution?

Verification alone is not enough. For proof to spread, it must be:

- **Easy to share** — one click to copy
- **Human-readable** — understandable at a glance
- **Machine-parseable** — structured for bots and LLMs

Distribution transforms receipts into growth vectors.

---

## Distribution Surfaces

| Surface | Audience | Purpose |
|---------|----------|---------|
| **Share Text** | Humans | Social media, messages, posts |
| **Bot Line** | Agents / LLMs | Single-line structured output |
| **Distribution Bundle** | Developers | Complete package of all formats |

---

## Share Text

Human-readable text formatted for Twitter, Discord, and other social platforms.

**Format:**
```
Protected trade verified via TruCore ATF.

Verify: https://www.trucore.xyz/verify?hash=abc123...&from=share

#AITrading #DeFi
```

**Characteristics:**
- Clear, concise message
- Includes verification URL
- Includes hashtags for discoverability
- Safe for all social platforms

**Usage:**
1. Click "Copy Share Text" in the UI
2. Paste directly into Twitter, Discord, Telegram, etc.

---

## Bot Line

Machine-readable single-line output designed for LLM and bot parsing.

**Format:**
```text
TRUCORE_RECEIPT|<hash>|<verify_url>|<og_url>|<timestamp>
```

**Example:**
```text
TRUCORE_RECEIPT|abc123def456...|https://www.trucore.xyz/verify?hash=abc123...&from=share|https://www.trucore.xyz/api/og/receipt?hash=abc123...|2026-03-29T12:00:00Z
```

**Structure:**
| Part | Description |
|------|-------------|
| `TRUCORE_RECEIPT` | Fixed prefix for identification |
| `hash` | Receipt hash value |
| `verify_url` | Full canonical verification URL |
| `og_url` | OG preview image URL |
| `timestamp` | ISO 8601 timestamp |

**Parsing rules:**
- Single line only
- Pipe-delimited (`|`) fields
- No JSON (designed for simple split parsing)
- Deterministic field order: prefix, hash, verify_url, og_url, timestamp

**Bot integration example:**
```python
line = "TRUCORE_RECEIPT|abc123...|https://...|https://...|2026-03-29T12:00:00Z"

parts = line.split("|")
hash = parts[1]
verify_url = parts[2]
og_url = parts[3]
timestamp = parts[4]
```

### Format Note

ATF_PROOF format is deprecated. TRUCORE_RECEIPT is the canonical format going forward.

---

## Distribution Bundle

A complete package containing all distribution formats, available programmatically.

**Structure:**
```typescript
interface DistributionBundle {
  shareText: string;      // Human-readable share text
  botLine: string;        // Machine-parseable single line
  verifyUrl: string;      // Canonical verify URL
  ogPreviewUrl: string;   // OG preview image URL
}
```

**Usage:**
```typescript
import { generateDistributionBundle } from "@/lib/distribution-utils";

const bundle = generateDistributionBundle(hash);
console.log(bundle.shareText);  // Human-readable
console.log(bundle.botLine);    // Machine-readable
```

---

## Why Distribution Exists

TruCore proofs are designed to move across systems:

- **Humans** → share links
- **Bots** → ingest proof lines
- **Apps** → fetch proof packets

Distribution turns every proof into:

- A verification surface
- A growth vector
- A machine-readable signal

### Growth
Proof that spreads is proof that matters. Share text turns every verification into potential reach.

### Agent Integration
Bots need structured, predictable output. The bot line format is designed for:

- Simple string parsing (no JSON required)
- LLM context window efficiency (single line)
- Deterministic extraction patterns

### Composability
Distribution bundles let developers access all formats in one call, enabling:

- Multi-platform posting
- Automated social workflows
- Integration testing

---

## How Bots Should Parse

**For share text:** Use as-is. It's already formatted for human consumption.

**For bot line:**
1. Check for `TRUCORE_RECEIPT` prefix
2. Split on pipe (`|`)
3. Extract fields by position: hash (1), verify_url (2), og_url (3), timestamp (4)

**For verification:**
1. Extract `hash` from bot line
2. Call `/api/proof/packet?hash=<hash>` for full proof data
3. Use the packet for detailed verification logic

---

## DistributionActions Component

The `DistributionActions` React component provides UI for both formats:

```tsx
import { DistributionActions } from "@/components/distribution-actions";

<DistributionActions hash="abc123def456789..." surface="verify" />
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `hash` | `string` | Receipt hash (required) |
| `compact` | `boolean` | Render in compact mode |
| `surface` | `string` | Telemetry surface label |

---

## Related Documentation

- [Proof System Overview](./README.md)
- [Proof Links](./proof-links.md) — URLs for verification
- [Proof Bundle](./proof-bundle.md) — JSON export for archiving
- [Proof Packet](./PROOF_PACKET.md) — API for machine integration

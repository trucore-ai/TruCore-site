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
```
ATF_PROOF hash=abc123def456... status=verified verify_url=https://www.trucore.xyz/verify?hash=abc123...&from=share
```

**Structure:**
| Part | Description |
|------|-------------|
| `ATF_PROOF` | Fixed prefix for identification |
| `hash=` | Receipt hash value |
| `status=` | Verification status (typically `verified`) |
| `verify_url=` | Full canonical verification URL |

**Parsing rules:**
- Single line only
- Space-separated key=value pairs
- No JSON (designed for simple regex/split parsing)
- Deterministic field order: hash, status, verify_url

**Bot integration example:**
```python
line = "ATF_PROOF hash=abc123... status=verified verify_url=https://..."

if line.startswith("ATF_PROOF"):
    parts = dict(p.split("=", 1) for p in line.split()[1:])
    hash = parts["hash"]
    status = parts["status"]
    verify_url = parts["verify_url"]
```

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

## Why This Exists

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
1. Check for `ATF_PROOF` prefix
2. Split on spaces
3. Parse key=value pairs
4. Extract `hash`, `status`, `verify_url`

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

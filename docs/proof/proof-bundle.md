# Proof Bundle

A **proof bundle** is a portable JSON file containing a complete proof artifact. Designed for export, archiving, and offline verification workflows.

---

## What is a Proof Bundle?

When you download a proof bundle, you get a self-contained JSON file with:

- Receipt hash and optional `receipt_id`
- Decision and verification status
- Canonical URLs for verification
- Export timestamp and source attribution

This is the **file-based** proof surface — ideal for auditing, debugging, and long-term storage.

---

## Bundle Structure

```json
{
  "version": 1,
  "type": "trucore_proof_bundle",
  "proof": {
    "hash": "abc123def456789...",
    "receipt_id": "rec_abc123",
    "decision": "ALLOW",
    "verified": true,
    "created_at": "2026-03-29T10:00:00.000Z",
    "exported_at": "2026-03-29T12:00:00.000Z",
    "source": "trucore"
  },
  "links": {
    "verify_url": "https://www.trucore.xyz/verify?hash=abc123...&from=share",
    "og_preview_url": "https://www.trucore.xyz/api/og/receipt?hash=abc123..."
  }
}
```

---

## Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `version` | `number` | Bundle schema version (currently `1`) |
| `type` | `string` | Always `"trucore_proof_bundle"` |
| `proof.hash` | `string` | SHA-256 receipt hash |
| `proof.receipt_id` | `string?` | Optional receipt identifier |
| `proof.decision` | `string?` | Firewall decision (`ALLOW` / `DENY`) |
| `proof.verified` | `boolean?` | Whether proof was verified |
| `proof.created_at` | `string?` | ISO 8601 creation timestamp |
| `proof.exported_at` | `string` | ISO 8601 export timestamp |
| `proof.source` | `string` | Always `"trucore"` |
| `links.verify_url` | `string` | Canonical verification URL |
| `links.og_preview_url` | `string` | OG preview image URL |

---

## How to Export

### From the UI

1. Navigate to the **Verify** page with a receipt hash
2. Click **Download Bundle** in the Proof Bundle section
3. A `.json` file downloads to your device

### From the Dashboard

1. Complete a protected trade
2. In the success state, click **Download Bundle**
3. File is named `trucore-proof-<hash>.json`

---

## Use Cases

| Use Case | Why Bundle? |
|----------|-------------|
| **Auditing** | Store proof alongside transaction records |
| **Debugging** | Share full proof context in bug reports |
| **Compliance** | Archive proofs for regulatory review |
| **Backup** | Keep offline copies of important proofs |
| **Handoff** | Transfer proof artifacts between systems |

---

## Bundle vs Packet

| Aspect | Proof Bundle | Proof Packet |
|--------|--------------|--------------|
| **Format** | Downloadable JSON file | API JSON response |
| **Access** | Export action (button click) | HTTP GET request |
| **Contains `receipt_id`** | Yes (when available) | No |
| **Wrapped in status envelope** | No | Yes (`status` + `data`) |
| **Best for** | Export, archive, share | Integration, automation |

**Key difference:** Bundles include `receipt_id` for full traceability; packets are hash-centric and designed for API consumption.

---

## Security

**Exposed in bundle:**
- Hash, receipt_id, decision, verification status
- Timestamps (created_at, exported_at)
- Canonical URLs

**Never included:**
- Wallet addresses
- Private keys or tokens
- Transaction amounts
- Policy internals
- Backend metadata

---

## Example: Storing for Audit

```javascript
// Download and store proof bundle
const bundle = await downloadProofBundle(hash);

// Store with your transaction records
await saveToAuditLog({
  transaction_id: "txn_123",
  proof_bundle: bundle,
  stored_at: new Date().toISOString(),
});
```

---

## ProofBundleActions Component

The `ProofBundleActions` React component provides download and copy functionality:

```tsx
import { ProofBundleActions } from "@/components/proof-bundle-actions";

<ProofBundleActions hash="abc123def456789..." surface="verify" />
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `hash` | `string` | Receipt hash (required) |
| `compact` | `boolean` | Render in compact mode |
| `surface` | `string` | Telemetry surface label |

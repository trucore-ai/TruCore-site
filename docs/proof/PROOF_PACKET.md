# Proof Packet

A **proof packet** is a machine-readable, versioned JSON artifact representing a TruCore transaction verification outcome. Designed for agents, integrations, and developer tooling.

---

## Designed for Autonomous Agents

The proof packet API is the primary integration surface for bots, LLMs, and autonomous agents:

- **No authentication required** — public read-only access
- **Deterministic** — same hash always returns the same packet structure
- **Status-wrapped** — clear success/error differentiation for parsing
- **Versioned** — schema version included for forward compatibility
- **Cached** — responses cached for 60 seconds to reduce load

**Agent usage pattern:**
```python
# Fetch proof packet
response = requests.get(f"https://www.trucore.xyz/api/proof/packet?hash={hash}")
data = response.json()

if data["status"] == "ok":
    proof = data["data"]["proof"]
    decision = proof["decision"]  # "ALLOW" or "DENY"
    verified = proof["verified"]  # boolean
    verify_url = data["data"]["links"]["verify_url"]
else:
    error = data["error"]
    # Handle missing_hash or invalid_hash
```

---

## Endpoint

```
GET /api/proof/packet?hash=<sha256-hash>
```

Public, read-only. No authentication required.

## Example Request

```bash
curl "https://www.trucore.xyz/api/proof/packet?hash=abc123def456..."
```

## Example Response

```json
{
  "status": "ok",
  "data": {
    "version": 1,
    "type": "trucore_proof_packet",
    "status": "success",
    "proof": {
      "hash": "abc123def456...",
      "decision": "ALLOW",
      "verified": true,
      "created_at": "2026-03-29T10:00:00.000Z"
    },
    "links": {
      "verify_url": "https://www.trucore.xyz/verify?hash=abc123def456...&from=share",
      "og_preview_url": "https://www.trucore.xyz/api/og/receipt?hash=abc123def456..."
    },
    "meta": {
      "exported_at": "2026-03-29T12:00:00.000Z",
      "source": "trucore-site"
    }
  }
}
```

## Error Response

```json
{
  "status": "error",
  "error": {
    "code": "missing_hash",
    "message": "The 'hash' query parameter is required."
  }
}
```

Error codes:
- `missing_hash` — no hash parameter provided
- `invalid_hash` — hash is not a valid 64-character hex string

## Field Reference

| Field | Description |
|-------|-------------|
| `version` | Packet schema version (currently `1`) |
| `type` | Always `"trucore_proof_packet"` |
| `status` | Packet status — always `"success"` for valid packets |
| `proof.hash` | The SHA-256 hash identifying the transaction |
| `proof.decision` | Firewall decision: `"ALLOW"`, `"DENY"`, or `"UNKNOWN"` |
| `proof.verified` | Whether the proof was verified by backend |
| `proof.created_at` | ISO 8601 timestamp when proof was created (if available) |
| `links.verify_url` | Canonical URL to verify this proof in browser |
| `links.og_preview_url` | OG image URL for social previews |
| `meta.exported_at` | ISO 8601 timestamp when packet was generated |
| `meta.source` | Always `"trucore-site"` |

## Proof Surfaces Comparison

| Surface | Format | Use case |
|---------|--------|----------|
| **Proof Links** | URLs | Sharing, social previews |
| **Proof Bundle** | JSON file | Export/archive with receipt ID |
| **Proof Packet** | JSON API | Machine-readable integration surface |

### Key differences

- **Proof links** — simple URLs for verify page and OG preview
- **Proof bundle** — downloadable JSON including `receipt_id`, for export/backup
- **Proof packet** — API response, hash-centric (no `receipt_id`), status-wrapped

## Security

This endpoint is intentionally **read-only** and **public**.

**Exposed fields:**
- Hash, decision, verification status
- Timestamps (created_at, exported_at)
- Canonical URLs

**Never exposed:**
- Wallet addresses
- Policy internals
- Secrets or tokens
- Transaction amounts
- Backend metadata

## Caching

Successful responses are cached (`Cache-Control: public, max-age=60`).
Error responses are not cached (`Cache-Control: no-store`).

---

## Deterministic Guarantees

Proof packets are deterministic:

1. **Same hash → same packet structure** — field layout is stable
2. **Timestamps vary** — `exported_at` reflects request time, `created_at` is fixed
3. **Version stability** — version `1` schema is frozen; breaking changes require version bump
4. **Idempotent** — multiple requests return equivalent data

This enables:
- Reliable caching
- Consistent bot parsing
- Predictable integration behavior

---

## Related Documentation

- [Proof System Overview](./README.md)
- [Proof Links](./proof-links.md) — URLs for human verification
- [Proof Bundle](./proof-bundle.md) — Downloadable JSON export
- [Distribution](./distribution.md) — Share text and bot line output

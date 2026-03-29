# TruCore Proof System

Every protected transaction produces a deterministic, cryptographically verifiable receipt. This is the core product primitive that enables trust, transparency, and automation in AI-driven trading.

**Proof is not a log — it is a portable, verifiable artifact.**

---

## What TruCore Provides

TruCore is proof infrastructure for AI transactions.

Every transaction produces:

- A deterministic receipt
- A verifiable proof
- A portable artifact usable across systems

---

## What is a Proof?

When TruCore ATF evaluates a transaction:

1. The intent is analyzed against policy rules
2. A decision is made (`ALLOW` / `DENY`)
3. A receipt is generated with a deterministic hash
4. That receipt becomes the proof — shareable, verifiable, automatable

---

## Proof Surfaces Overview

| Surface        | Purpose                 | Audience           | Format        |
|----------------|-------------------------|--------------------|---------------|
| **Verify URL** | Human verification      | Users              | Browser URL   |
| **OG Preview** | Visual proof card       | Social / sharing   | Image URL     |
| **Proof Links**| Raw URLs for embedding  | Power users        | Plain URLs    |
| **Proof Bundle**| Structured export      | Devs / tooling     | JSON file     |
| **Proof Packet**| Machine-readable JSON  | Agents / bots      | JSON API      |
| **Distribution**| Share + bot ingestion  | Growth / agents    | Text + line   |

Each surface serves a different integration need. Choose based on your use case:

- **Sharing with humans?** → Use Verify URL or OG Preview
- **Embedding in apps?** → Use Proof Links
- **Auditing or archiving?** → Use Proof Bundle
- **Building integrations?** → Use Proof Packet API
- **Posting to social or bots?** → Use Distribution

---

## Canonical URL Contract

All outbound TruCore proof URLs use the canonical format:

```
https://www.trucore.xyz/verify?hash=<sha256-hash>&from=share
https://www.trucore.xyz/api/og/receipt?hash=<sha256-hash>
```

**The hash is the only canonical identifier.**

- Always include `www.` subdomain
- Always use `https://`
- Hash is URL-encoded when embedded

---

## End-to-End Flow

```
trade → protect → receipt → verify → share → automate
```

1. **Trade**: User or agent initiates a transaction
2. **Protect**: ATF evaluates against policy rules
3. **Receipt**: Deterministic proof artifact is generated
4. **Verify**: Receipt hash can be independently validated
5. **Share**: Proof is distributed via links, bundles, or text
6. **Automate**: Bots and agents consume proof via API

---

## Key Principle

> "Proof is not a log — it is a portable, verifiable artifact."

Receipts are:

- **Deterministic**: Same inputs → same hash
- **Tamper-evident**: Any modification breaks verification
- **Portable**: Can be shared, stored, or transmitted
- **Verifiable**: Anyone can independently validate

---

## How It Fits Together

```
Receipt → Proof → Surfaces → Distribution → External Systems
```

- **Receipt**: Raw execution result
- **Proof**: Canonical hash + verification
- **Surfaces**: Links, bundle, packet
- **Distribution**: Share text + bot line
- **External systems**: Bots, dashboards, social

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [Proof Links](./proof-links.md) | Verify URL, OG preview, and raw URL usage |
| [Proof Bundle](./proof-bundle.md) | Structured JSON export for archiving |
| [Proof Packet](./PROOF_PACKET.md) | Machine-readable API for agents |
| [Distribution](./distribution.md) | Share text, bot line, social integration |

---

## Quick Start

### For humans
Copy the **Verify URL** and share it. Anyone can click it to verify.

### For developers
Call the **Proof Packet API**:
```bash
curl "https://www.trucore.xyz/api/proof/packet?hash=<your-hash>"
```

### For bots
Copy the **Bot Line** and embed it in output:
```
TRUCORE_RECEIPT|<hash>|<verify_url>|<og_url>|<timestamp>
```

---

## Quick Integration (30 seconds)

### Fetch a proof packet

```bash
curl "https://www.trucore.xyz/api/proof/packet?hash=<hash>"
```

### TypeScript example

```ts
const res = await fetch(`/api/proof/packet?hash=${hash}`);
const data = await res.json();
```

### Bot ingestion (single line)

```text
TRUCORE_RECEIPT|<hash>|<verify_url>|<og_url>|<timestamp>
```

---

## Security Notes

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

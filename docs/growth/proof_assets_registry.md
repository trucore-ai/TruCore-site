# Proof Assets Registry

> Every proof artifact stored here with clear labeling.
> Each entry must state whether it is real, demo, or representative.

---

## How to Register a Proof Asset

1. Save the artifact (screenshot, receipt JSON, terminal output, tweet URL, etc.).
2. Add a row to the registry with the required metadata.
3. Label it honestly: real, demo, or representative.
4. Store source files in `docs/growth/proof-output/` or link to the original URL.

---

## Asset Labels

| Label | Meaning | Can Use Publicly? |
| ----- | ------- | ----------------- |
| real | Produced by an actual external user during real usage | Yes (with permission) |
| demo | Generated internally for demonstration purposes | Yes (must disclose) |
| representative | Based on real capability but not from a specific user session | Yes (must disclose) |

---

## Asset Types

| Type | Description | Where to Store |
| ---- | ----------- | -------------- |
| terminal-screenshot | Screenshot of CLI output | `proof-output/screenshots/` |
| receipt-json | Raw JSON receipt output | `proof-output/receipts/` |
| verify-output | Output from `atf verify` command | `proof-output/verify/` |
| tweet-reply | Screenshot or URL of tweet interaction | `proof-output/social/` |
| dm-screenshot | Screenshot of DM (with explicit permission) | `proof-output/social/` |
| discord-message | Screenshot of Discord interaction | `proof-output/social/` |
| integration-code | Code snippet showing ATF integration | `proof-output/integrations/` |

---

## Registry

| # | Date | Asset Type | Label | Source User | Description | File / URL | Permission Obtained |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | | | | | | | |
| 2 | | | | | | | |
| 3 | | | | | | | |
| 4 | | | | | | | |
| 5 | | | | | | | |
| 6 | | | | | | | |
| 7 | | | | | | | |
| 8 | | | | | | | |
| 9 | | | | | | | |
| 10 | | | | | | | |

---

## Where Each Asset Type Can Be Used

| Destination | Acceptable Labels |
| ----------- | ----------------- |
| Landing page | real only |
| README | real, representative (with disclosure) |
| Tweet / social post | real, demo (with disclosure) |
| Pitch deck | real, representative (with disclosure) |
| Blog post | real, demo (with disclosure) |
| Internal docs | any |

---

## Storage Structure

```text
docs/growth/proof-output/
  screenshots/
  receipts/
  verify/
  social/
  integrations/
```

Create subdirectories as needed when the first artifact arrives.

---

## Verification Checklist

Before using any asset publicly:

- [ ] Label is accurate (real / demo / representative)
- [ ] Source user gave permission (if real)
- [ ] No sensitive data visible (API keys, wallet addresses with funds, etc.)
- [ ] Timestamp is correct
- [ ] Asset matches the claim being made

---

## Notes

_This registry is empty until real proof artifacts are collected. Prioritize "real" assets from external users. Demo assets can fill gaps but should be replaced with real ones as they become available._

# @trucore/atf

One-line CLI for TruCore Agent Transaction Firewall simulation.

## One-liner

```bash
npx @trucore/atf@v0.1.0 simulate --preset swap_small --format pretty --verify
```

## Commands

### Use a preset

```bash
atf simulate --preset swap_small
atf simulate --preset swap_too_large
atf simulate --preset ttl_too_high
```

```bash
atf simulate --preset swap_small --format pretty --verify
```

### Send raw JSON

```bash
atf simulate --json '{"action":"swap","token_in":"SOL","token_out":"USDC","amount":10,"max_slippage_bps":100,"ttl_seconds":60}'
```

## Output modes

- `--format json` (default), prints response JSON.
- `--format pretty`, prints status, reason, receipt hash, invariant checks, verification URL, and any rate-limit metadata.
- `--quiet`, forces JSON output only.

## Verify links

When `--verify` is enabled, the CLI prints:

```text
<baseUrl>/verify?hash=<receipt_hash>
```

If `--base-url` is localhost, the localhost verify URL is used. Otherwise `https://trucore.xyz` is used.

## Environment variables

- `ATF_BASE_URL` (default: `https://trucore.xyz`)
- `ATF_API_KEY` (optional, sends `x-api-key` for higher quota)

## Exit codes

- `0` allowed response
- `2` denied response
- `1` transport or HTTP error

## Error handling

- For non-200 responses, the CLI prints HTTP status plus `code` and `message` when available.
- For `429`, the CLI prints `Retry-After` when present.
- Rate-limit headers are surfaced when available.

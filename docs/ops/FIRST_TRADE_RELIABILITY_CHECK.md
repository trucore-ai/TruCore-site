# First Trade Reliability Check — Operator Runbook

## Overview

The first-trade reliability check validates the most important customer journey:

> **signup/verified user → dashboard → sample trade → protection → execution → receipt**

This check helps operators confirm whether the first protected trade path is healthy
without introducing fake success states or risky live execution behavior.

---

## What the Check Covers

| Stage | Route | What's Validated |
|-------|-------|------------------|
| dashboard_bootstrap | `/api/dashboard/me` | Dashboard entry point reachable |
| sample_intent | `/api/onboarding/sample-intent` | Sample trade generation available |
| protect_dry_run | `/api/onboarding/protect-dry-run` | ATF protection simulation working |
| execute_sample | `/api/onboarding/execute-sample` | Sample execution route (guarded) |
| receipts_entry | `/customer/receipts` | Receipt visibility available |

---

## How to Call

### Via curl

```bash
# Full check
curl -s -H "x-ops-key: $ATF_OPS_KEY" \
  https://your-site.com/api/ops/first-trade-check | jq

# Minimal format (status + summary only)
curl -s -H "x-ops-key: $ATF_OPS_KEY" \
  "https://your-site.com/api/ops/first-trade-check?format=minimal" | jq
```

### Via Status Page

Navigate to `/status?ops_key=YOUR_OPS_KEY` to see the check results in the UI.

---

## Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ATF_OPS_KEY` | Yes | Authentication key for ops endpoints |
| `ATF_ENABLE_FIRST_TRADE_OPS_CHECK_EXECUTE` | No | Set to `true` to run execute_sample stage (default: skipped) |

---

## Response Format

### Full Response

```json
{
  "status": "ok" | "degraded" | "error",
  "data": {
    "checked_at": "2024-01-15T10:30:00.000Z",
    "stages": [
      {
        "name": "dashboard_bootstrap",
        "status": "ok" | "error" | "skipped",
        "failure_class": null | "network_error" | "upstream_5xx" | "auth_required" | "...",
        "detail": "Route reachable (auth required as expected)"
      }
    ],
    "summary": {
      "passed": 4,
      "failed": 0,
      "skipped": 1
    }
  }
}
```

### Minimal Response

```json
{
  "status": "ok",
  "data": {
    "checked_at": "2024-01-15T10:30:00.000Z",
    "summary": {
      "passed": 4,
      "failed": 0,
      "skipped": 1
    }
  }
}
```

---

## Interpreting Results

### Overall Status

| Status | Meaning | HTTP Code |
|--------|---------|-----------|
| `ok` | All non-skipped stages passed | 200 |
| `degraded` | Some stages failed, but majority passed | 200 |
| `error` | Majority of stages failed | 503 |

### Stage Status

| Status | Meaning |
|--------|---------|
| `ok` | Stage completed successfully |
| `error` | Stage failed — see `failure_class` and `detail` |
| `skipped` | Stage intentionally not run (e.g., execute_sample when flag disabled) |

### Failure Classes

| Class | Meaning | Likely Cause |
|-------|---------|--------------|
| `network_error` | Could not reach the route | DNS, firewall, network partition |
| `upstream_5xx` | Route returned 5xx error | Backend service error |
| `upstream_4xx` | Route returned 4xx error (not auth) | Bad request or route misconfiguration |
| `auth_required` | 401/403 returned | Expected for routes requiring auth |
| `invalid_response` | Response not valid JSON | Route returning malformed data |
| `timeout` | Request timed out | Slow or unresponsive route |
| `config_error` | Configuration issue | Missing env vars or misconfigured URLs |

---

## Using During Deploy Verification

### Pre-deploy

```bash
# Save baseline
curl -s -H "x-ops-key: $ATF_OPS_KEY" \
  "https://your-site.com/api/ops/first-trade-check?format=minimal" > baseline.json
```

### Post-deploy

```bash
# Check after deploy
curl -s -H "x-ops-key: $ATF_OPS_KEY" \
  "https://your-site.com/api/ops/first-trade-check?format=minimal" > post-deploy.json

# Compare
diff baseline.json post-deploy.json
```

### In CI/CD

```bash
#!/bin/bash
RESULT=$(curl -s -H "x-ops-key: $ATF_OPS_KEY" \
  "https://your-site.com/api/ops/first-trade-check?format=minimal")

STATUS=$(echo "$RESULT" | jq -r '.status')

if [ "$STATUS" = "ok" ]; then
  echo "✓ First-trade check passed"
  exit 0
elif [ "$STATUS" = "degraded" ]; then
  echo "⚠ First-trade check degraded"
  echo "$RESULT" | jq
  exit 0  # or exit 1 if you want strict checks
else
  echo "✗ First-trade check failed"
  echo "$RESULT" | jq
  exit 1
fi
```

---

## What to Check If a Stage Fails

### dashboard_bootstrap fails

1. Check if ATF API is reachable: `curl -s https://api.trucore.xyz/health`
2. Verify `ATF_API_BASE_URL` or `NEXT_PUBLIC_ATF_API_URL` is set correctly
3. Check for network policies blocking outbound requests

### sample_intent fails

1. Verify onboarding endpoints are enabled in ATF backend
2. Check ATF API logs for errors on `/onboarding/sample-intent`
3. Confirm auth token flow is working

### protect_dry_run fails

1. Check if ATF policy evaluation is operational
2. Review `/onboarding/protect-dry-run` route configuration
3. Verify request body validation is not rejecting all inputs

### execute_sample fails

1. If skipped: This is expected when `ATF_ENABLE_FIRST_TRADE_OPS_CHECK_EXECUTE` is not set
2. If error: Check ATF execution layer and downstream dependencies
3. Verify no rate limiting is blocking the check

### receipts_entry fails

1. Check if Next.js is serving `/customer/receipts` route
2. Verify no middleware is blocking unauthenticated checks
3. Check for 500 errors in the receipts page rendering

---

## Safe Execution Policy

By default, the `execute_sample` stage is **skipped** to prevent any potential
side effects in production.

To enable it:

```bash
# In your environment
ATF_ENABLE_FIRST_TRADE_OPS_CHECK_EXECUTE=true
```

**Warning:** Only enable this in environments where sample trade execution
has no real-world consequences (e.g., staging with mock backends).

---

## Security Notes

- The endpoint requires `x-ops-key` header matching `ATF_OPS_KEY`
- Response is sanitized: no secrets, no raw stack traces, no user data
- Status page only shows the panel when `?ops_key=<key>` is present
- All responses have `Cache-Control: no-store` to prevent caching

---

## Troubleshooting

### "endpoint_not_configured" (503)

`ATF_OPS_KEY` environment variable is not set.

### "forbidden" (403)

Incorrect or missing `x-ops-key` header.

### "cannot_determine_origin" (500)

The request is missing `Host` header — this shouldn't happen in normal operation.

### All stages fail with network_error

- Check if the site can make outbound HTTP requests
- Verify no firewall rules blocking localhost/same-origin requests
- Check for DNS resolution issues

---

## Related Documentation

- [ATF API Health Check](/api/health)
- [Route Failure Monitoring](/api/ops/route-failures)
- [Deploy Verification Checklist](../DEPLOY_VERCEL.md)

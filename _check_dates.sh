#!/bin/bash
cd /home/kontractkoder/repo/TruCore-site
for b in feat/admin-monetization-ui feat/ci-fail-closed-deploy feat/fail-closed-deploy-wrapper feat/journey-telemetry-funnel feat/receipt-sharing-proof-loop feat/ui-pass1-foundation feat/ui-pass2-components safety/pre-merge-snapshot triage/site-ui-connectivity-audit; do
  echo "$b: $(git log -1 --format='%ci' $b)"
done

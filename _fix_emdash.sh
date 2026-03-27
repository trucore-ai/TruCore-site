#!/usr/bin/env bash
set -euo pipefail
cd /home/kontractkoder/repo/TruCore-site

# Phase 2: Replace standalone "—" with "-" (UI placeholder values)
grep -rl '—' app/ components/ docs/ \
  --include="*.ts" --include="*.tsx" --include="*.md" --include="*.mdx" \
  --include="*.js" --include="*.jsx" --include="*.json" --include="*.css" \
  | while IFS= read -r f; do
    sed -i 's/"—"/"-"/g' "$f"
  done

echo "Phase 2 done"

# Phase 3: Replace >—< in JSX spans (like <span>—</span>)
grep -rl '—' app/ components/ docs/ \
  --include="*.ts" --include="*.tsx" --include="*.md" --include="*.mdx" \
  --include="*.js" --include="*.jsx" --include="*.json" --include="*.css" \
  | while IFS= read -r f; do
    sed -i 's/>—</>-</g' "$f"
  done

echo "Phase 3 done"

# Phase 4: Replace remaining em-dashes that have a space on one side
grep -rl '—' app/ components/ docs/ \
  --include="*.ts" --include="*.tsx" --include="*.md" --include="*.mdx" \
  --include="*.js" --include="*.jsx" --include="*.json" --include="*.css" \
  | while IFS= read -r f; do
    # "—word" at start of line or after space → "- word"
    sed -i 's/—\([^ ]\)/ - \1/g' "$f"
    # "word—" at end → "word -"
    sed -i 's/\([^ ]\)—$/\1 -/g' "$f"
    # Standalone — remaining
    sed -i 's/—/ - /g' "$f"
  done

echo "Phase 4 done"

# Count remaining
remaining=$(grep -rn '—' app/ components/ docs/ \
  --include="*.ts" --include="*.tsx" --include="*.md" --include="*.mdx" \
  --include="*.js" --include="*.jsx" --include="*.json" --include="*.css" \
  2>/dev/null | wc -l)

echo "Remaining em dashes: $remaining"

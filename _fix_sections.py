"""Mass-replace border-t border-white/10 with gradient divider prop."""
import os
import re

ROOT = "."
SKIP = {"node_modules", "coverage", ".next", ".git", "test-results"}

# Pattern: className="border-t border-white/10 fade-in-up..."
# Replace with: divider className="fade-in-up..."
PATTERN = re.compile(r'className="border-t border-white/10 ')
REPLACEMENT = 'divider className="'

count = 0
for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames[:] = [d for d in dirnames if d not in SKIP]
    for fname in filenames:
        if not fname.endswith(".tsx"):
            continue
        fpath = os.path.join(dirpath, fname)
        with open(fpath, "r") as f:
            original = f.read()
        updated = PATTERN.sub(REPLACEMENT, original)
        if updated != original:
            with open(fpath, "w") as f:
                f.write(updated)
            n = original.count('border-t border-white/10 ') - updated.count('border-t border-white/10 ')
            print(f"  {fpath} ({n} replacements)")
            count += n

print(f"\nTotal: {count} replacements")

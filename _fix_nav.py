#!/usr/bin/env python3
"""Fix nav anchor links in app/layout.tsx."""
import os

path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app", "layout.tsx")

with open(path) as f:
    content = f.read()

replacements = {
    'href="/#why-trucore"': 'href="/atf#why-trucore"',
    'href="/#verify"': 'href="/atf#verify"',
    'href="/#integrations"': 'href="/atf#integrations"',
    'href="/#waitlist"': 'href="/#updates"',
}

for old, new in replacements.items():
    count = content.count(old)
    content = content.replace(old, new)
    print(f"  {old} → {new}  ({count} replacement(s))")

with open(path, "w") as f:
    f.write(content)

print("Done!")

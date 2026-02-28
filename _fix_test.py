#!/usr/bin/env python3
"""Update atf-anchors.test.ts with the new /atf section IDs."""
import os

path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tests", "atf-anchors.test.ts")

with open(path) as f:
    content = f.read()

old = '''const REQUIRED_ANCHORS = [
  "doctor",
  "burner",
  "helius",
  "flow",
  "toolbox",
  "designed-for",
  "roadmap",
  "get-started",
  "updates",
];'''

new = '''const REQUIRED_ANCHORS = [
  "hero",
  "integrations",
  "why-trucore",
  "verify",
  "waitlist",
];'''

assert old in content, "Could not find old REQUIRED_ANCHORS block"
content = content.replace(old, new)

with open(path, "w") as f:
    f.write(content)

print("atf-anchors.test.ts updated!")

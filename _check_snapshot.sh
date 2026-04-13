#!/bin/bash
cd /home/kontractkoder/repo/TruCore-site
git diff --name-only main...safety/pre-merge-snapshot | while read f; do
  if git cat-file -e "main:$f" 2>/dev/null; then
    echo "EXISTS: $f"
  else
    echo "NEW: $f"
  fi
done

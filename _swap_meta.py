"""Swap metadata blocks between app/page.tsx and app/atf/page.tsx."""
import re

with open("app/page.tsx", "r") as f:
    home = f.read()
with open("app/atf/page.tsx", "r") as f:
    atf = f.read()

meta_pattern = r"(export const metadata: Metadata = \{.*?\};)"

home_meta = re.search(meta_pattern, home, re.DOTALL).group(1)
atf_meta = re.search(meta_pattern, atf, re.DOTALL).group(1)

home_new = home.replace(home_meta, atf_meta)
atf_new = atf.replace(atf_meta, home_meta)

with open("app/page.tsx", "w") as f:
    f.write(home_new)
with open("app/atf/page.tsx", "w") as f:
    f.write(atf_new)

print("Metadata blocks swapped successfully")

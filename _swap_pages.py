#!/usr/bin/env python3
"""Swap app/page.tsx and app/atf/page.tsx content, keeping metadata
at its correct route, fixing function names."""

import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

with open("app/page.tsx") as f:
    home_file = f.read()
with open("app/atf/page.tsx") as f:
    atf_file = f.read()


def extract_metadata(content):
    start = content.index("export const metadata: Metadata = {")
    brace_count = 0
    i = content.index("{", start)
    while i < len(content):
        if content[i] == "{":
            brace_count += 1
        elif content[i] == "}":
            brace_count -= 1
            if brace_count == 0:
                end = content.index(";", i) + 1
                return content[start:end], start, end
        i += 1
    raise ValueError("Could not find closing brace for metadata block")


home_meta, hm_start, hm_end = extract_metadata(home_file)
atf_meta, am_start, am_end = extract_metadata(atf_file)

# New page.tsx = old atf content with home metadata, renamed to Home()
new_page = atf_file[:am_start] + home_meta + atf_file[am_end:]
new_page = new_page.replace(
    "export default function ATFPage()",
    "export default function Home()",
)

# New atf/page.tsx = old home content with atf metadata, renamed to ATFPage()
new_atf = home_file[:hm_start] + atf_meta + home_file[hm_end:]
new_atf = new_atf.replace(
    "export default function Home()",
    "export default function ATFPage()",
)

with open("app/page.tsx", "w") as f:
    f.write(new_page)
with open("app/atf/page.tsx", "w") as f:
    f.write(new_atf)

print(f"app/page.tsx:     {len(new_page.splitlines())} lines  (was {len(atf_file.splitlines())})")
print(f"app/atf/page.tsx: {len(new_atf.splitlines())} lines  (was {len(home_file.splitlines())})")
print(f"page.tsx   default export: {'Home' if 'function Home()' in new_page else '???'}")
print(f"atf.tsx    default export: {'ATFPage' if 'function ATFPage()' in new_atf else '???'}")
print("Done!")

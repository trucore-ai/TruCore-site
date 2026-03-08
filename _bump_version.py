"""Bump openclaw_plugin.version in atf.json to 0.2.3."""
import json, pathlib

p = pathlib.Path("public/.well-known/atf.json")
d = json.loads(p.read_text())
old = d["openclaw_plugin"]["version"]
d["openclaw_plugin"]["version"] = "0.2.3"
p.write_text(json.dumps(d, separators=(",", ":")))
print(f"atf.json: {old} -> 0.2.3")

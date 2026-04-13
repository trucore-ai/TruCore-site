import json

d = json.load(open("public/.well-known/atf.json"))

cb = d.get("customer_bootstrap", {})
print("=== customer_bootstrap block ===")
print(json.dumps(cb, indent=2))

print("\n=== Secret leakage check ===")
cb_str = json.dumps(cb).lower()
patterns = ["atf_live_", "atf_test_", "sk_live", "sk_test", "secret", "password", "bearer ", "token"]
found = [p for p in patterns if p in cb_str]
if found:
    print(f"WARNING: found secret-like patterns: {found}")
else:
    print("CLEAN: no secret-like patterns found")

print(f"\nmanifest_hash: {d.get('manifest_hash')}")
print(f"Total keys: {len(d)}")
print(f"customer_bootstrap present: {'customer_bootstrap' in d}")

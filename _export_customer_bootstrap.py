"""Add customer_bootstrap block to public/.well-known/atf.json and re-hash."""
import hashlib
import json
import pathlib

p = pathlib.Path("public/.well-known/atf.json")
d = json.loads(p.read_text())

# customer_bootstrap block — mirrors the backend manifest.py definition exactly.
d["customer_bootstrap"] = {
    "api_base_url": "https://api.trucore.xyz",
    "mcp_endpoint": "/mcp/v1",
    "auth": {
        "header": "X-API-Key",
        "credential_type": "customer_api_key",
        "note": (
            "Customer-created API keys work for REST, CLI, and MCP. "
            "Create keys via the authenticated customer flow at /customer/keys."
        ),
    },
    "recommended_scopes": {
        "api_cli_test": [
            "atf:probe", "atf:simulate", "atf:verify", "atf:explain",
        ],
        "mcp_test": [
            "atf:probe", "atf:simulate", "atf:verify", "atf:explain", "atf:mcp",
        ],
    },
    "rotation_guidance": (
        "Rotate or revoke exposed keys immediately. "
        "Rotation revokes the old key and issues a replacement."
    ),
}

# Re-compute manifest_hash (same algorithm as backend: sha256 of sorted compact JSON, first 16 hex chars).
# Remove old hash before computing new one.
d.pop("manifest_hash", None)
canonical = json.dumps(d, sort_keys=True, separators=(",", ":"))
d["manifest_hash"] = hashlib.sha256(canonical.encode("utf-8")).hexdigest()[:16]

p.write_text(json.dumps(d, separators=(",", ":")))
print("Updated atf.json successfully")
print(f"  customer_bootstrap present: {'customer_bootstrap' in d}")
print(f"  manifest_hash: {d['manifest_hash']}")
print(f"  file size: {p.stat().st_size} bytes")

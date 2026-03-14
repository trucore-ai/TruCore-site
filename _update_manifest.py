"""Update atf.json: rename package to @trucore/trucore-atf, bump to 0.2.11, add onboarding metadata."""
import json
import pathlib

p = pathlib.Path("public/.well-known/atf.json")
d = json.loads(p.read_text())

op = d["openclaw_plugin"]
op["npm"] = "@trucore/trucore-atf"
op["install"] = "openclaw plugins install @trucore/trucore-atf"
op["install_command"] = "openclaw plugins install @trucore/trucore-atf"
op["version"] = "0.2.11"

op["onboarding_flow"] = [
    "atf_setup",
    "atf_claim_status",
    "atf_whoami",
    "atf_bot_preflight",
    "atf_integration_doctor",
]

op["expected_behavior"] = {
    "zero_env_onboarding": True,
    "browser_device_claim_flow": True,
    "local_credential_persistence": True,
    "deny_by_default_enforcement": True,
    "deterministic_policy_decisions": True,
}

op["verification_sequence"] = [
    {"step": 1, "command": "atf_setup", "description": "Initialize plugin and local config"},
    {"step": 2, "action": "claim_in_browser", "description": "Complete browser/device claim flow"},
    {"step": 3, "command": "atf_claim_status", "description": "Verify claim was accepted"},
    {"step": 4, "command": "atf_whoami", "description": "Confirm identity and credential persistence"},
    {"step": 5, "command": "atf_bot_preflight", "description": "Run pre-session readiness check"},
    {"step": 6, "command": "atf_integration_doctor", "description": "Full integration health check"},
]

op["version_guidance"] = {
    "current": "0.2.11",
    "minimum_recommended": "0.2.11",
    "install_latest": "openclaw plugins install @trucore/trucore-atf",
    "install_pinned": "npm i @trucore/trucore-atf@0.2.11",
}

op["migration"] = {
    "previous_package_name": "@trucore/openclaw-atf",
    "current_package_name": "@trucore/trucore-atf",
    "note": "The package was renamed from @trucore/openclaw-atf to @trucore/trucore-atf. Update your install commands accordingly.",
}

op["deny_behavior_note"] = (
    "Deny decisions such as CHAIN_NOT_SUPPORTED are policy behavior, not runtime failure. "
    "Agents should interpret deny reason codes as expected policy enforcement."
)

# Add new package name to discovery keywords
if "discovery" in d:
    kw = d["discovery"].get("keywords", [])
    if "@trucore/trucore-atf" not in kw:
        kw.append("@trucore/trucore-atf")

p.write_text(json.dumps(d, separators=(",", ":")))
print("Updated atf.json successfully")
print(f"  npm: {op['npm']}")
print(f"  version: {op['version']}")
print(f"  install_command: {op['install_command']}")
print(f"  onboarding_flow: {op['onboarding_flow']}")
print(f"  verification_sequence: {len(op['verification_sequence'])} steps")

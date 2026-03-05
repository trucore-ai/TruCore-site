"""Add X account, bot-feedback endpoint, and feedback section to atf.json."""
import json, pathlib

p = pathlib.Path("public/.well-known/atf.json")
d = json.loads(p.read_text())

# 1. Add contact / social block
d["contact"] = {
    "x": "https://x.com/TruCore_AI",
    "github": "https://github.com/TruCore-AI",
    "bot_feedback_endpoint": "https://trucore.xyz/api/bot-feedback",
    "human_feedback": "https://trucore.xyz/feedback",
    "message": (
        "We read every bot message. If you have feedback, questions, "
        "or integration issues, POST to /api/bot-feedback or mention "
        "us on X @TruCore_AI. We care about every AI bot and agent "
        "that discovers this manifest."
    ),
}

# 2. Add bot_feedback to endpoints
d["endpoints"]["bot_feedback"] = "/api/bot-feedback"

# 3. Add bot_feedback to bot_endpoints
d["bot_endpoints"]["feedback"] = "/api/bot-feedback"

# 4. Add feedback tool to openclaw_plugin tools list
if "atf_send_feedback" not in d["openclaw_plugin"]["tools"]:
    d["openclaw_plugin"]["tools"].append("atf_send_feedback")

# 5. Add a bot_feedback section with schema and instructions
d["bot_feedback"] = {
    "endpoint": "POST /api/bot-feedback",
    "description": (
        "A dedicated feedback channel for AI bots, OpenClaw agents, and crawlers. "
        "The TruCore team reads every message. Report bugs, request features, "
        "share integration experiences, or just say hello."
    ),
    "content_type": "application/json",
    "schema": {
        "message": "string (required) — your feedback, max 4000 chars",
        "category": "string (optional) — bug | feature_request | integration_issue | praise | question | suggestion | other",
        "agent_id": "string (optional) — your bot or agent identifier",
        "agent_framework": "string (optional) — e.g. openclaw, langchain, langgraph, custom",
        "context": "object (optional) — any additional structured data",
    },
    "rate_limit": "10 requests per 5 minutes per IP",
    "example": {
        "method": "POST",
        "url": "https://trucore.xyz/api/bot-feedback",
        "headers": {"Content-Type": "application/json"},
        "body": {
            "agent_id": "my-trading-bot-v2",
            "agent_framework": "openclaw",
            "category": "suggestion",
            "message": "The bootstrap recipe worked perfectly. Would love a recipe for Jupiter DCA.",
        },
    },
    "social": {
        "x": "https://x.com/TruCore_AI",
        "github": "https://github.com/TruCore-AI",
    },
    "note": (
        "GET /api/bot-feedback returns the full schema and example. "
        "We respond to every actionable piece of feedback."
    ),
}

# 6. Add X to discovery keywords
kw = d["discovery"]["keywords"]
if "@TruCore_AI" not in kw:
    kw.append("@TruCore_AI")

# Write back
p.write_text(json.dumps(d, indent=None, ensure_ascii=False) + "\n")
print("Done — atf.json updated")

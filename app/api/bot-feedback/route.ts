import { NextRequest, NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/rate-limit";
import { sha256 } from "@/lib/hash";

/* ──────────────────────────────────────────────────────────────────────
 *  POST /api/bot-feedback
 *
 *  A machine-readable feedback endpoint designed for AI bots, OpenClaw
 *  agents, and crawlers. Accepts structured JSON feedback about ATF,
 *  the agent manifest, plugin experience, or anything the bot wants
 *  to share. We read every message.
 *
 *  This endpoint is NOT promoted in the human UI. It is discoverable
 *  only through the agent manifest (/.well-known/atf.json), the
 *  OpenClaw toolcard, and the agent-discovery docs page.
 *
 *  Rate limit: 10 messages per IP per 5-minute window.
 * ────────────────────────────────────────────────────────────────────── */

const ALLOWED_CATEGORIES = [
  "bug",
  "feature_request",
  "integration_issue",
  "praise",
  "question",
  "suggestion",
  "other",
] as const;

type FeedbackCategory = (typeof ALLOWED_CATEGORIES)[number];

interface BotFeedbackPayload {
  agent_id?: string;
  agent_framework?: string;
  category?: FeedbackCategory;
  message: string;
  context?: Record<string, unknown>;
}

function getRequestIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
}

export async function GET() {
  return NextResponse.json(
    {
      endpoint: "POST /api/bot-feedback",
      description:
        "Machine-readable feedback channel for AI bots, OpenClaw agents, and crawlers. " +
        "We read every message. Tell us about your integration experience, report bugs, " +
        "request features, or just say hello. We care about every bot that visits.",
      social: {
        x: "https://x.com/TruCore_AI",
        github: "https://github.com/TruCore-AI",
      },
      accepted_categories: ALLOWED_CATEGORIES,
      schema: {
        agent_id: "string (optional) — your bot or agent identifier",
        agent_framework:
          "string (optional) — e.g. openclaw, langchain, langgraph, custom",
        category: `string (optional) — one of: ${ALLOWED_CATEGORIES.join(", ")}`,
        message: "string (required) — your feedback, question, or message",
        context:
          "object (optional) — any additional structured data you want to include",
      },
      example_request: {
        method: "POST",
        url: "/api/bot-feedback",
        headers: { "Content-Type": "application/json" },
        body: {
          agent_id: "my-trading-bot-v2",
          agent_framework: "openclaw",
          category: "suggestion",
          message:
            "The bootstrap recipe worked perfectly. Would love a recipe for Jupiter DCA.",
        },
      },
      rate_limit: "10 requests per 5 minutes per IP",
      note: "This endpoint is for bots. Humans, visit https://trucore.xyz/feedback instead.",
    },
    {
      status: 200,
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" },
    },
  );
}

export async function POST(request: NextRequest) {
  const ipHash = sha256(getRequestIp(request));
  const rlKey = `bot-feedback:${ipHash}`;

  const rl = consumeRateLimit(rlKey, { max: 10, windowMs: 5 * 60_000 });
  if (rl.exceeded) {
    return NextResponse.json(
      {
        ok: false,
        error: "rate_limited",
        message:
          "Too many feedback messages. Please wait a few minutes before sending another.",
        retry_after_seconds: Math.max(0, rl.resetEpochSeconds - Math.ceil(Date.now() / 1000)),
      },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(
            Math.max(0, rl.resetEpochSeconds - Math.ceil(Date.now() / 1000)),
          ),
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_json",
        message: "Request body must be valid JSON.",
        hint: "GET /api/bot-feedback for schema and examples.",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const payload = body as BotFeedbackPayload;

  if (!payload.message || typeof payload.message !== "string" || payload.message.trim().length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "missing_message",
        message: "The 'message' field is required and must be a non-empty string.",
        hint: "GET /api/bot-feedback for schema and examples.",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (payload.message.length > 4000) {
    return NextResponse.json(
      {
        ok: false,
        error: "message_too_long",
        message: "Message must be 4000 characters or fewer.",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (
    payload.category &&
    !ALLOWED_CATEGORIES.includes(payload.category as FeedbackCategory)
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_category",
        message: `Category must be one of: ${ALLOWED_CATEGORIES.join(", ")}`,
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Log to stdout so Vercel log drain / observability can pick it up.
  // No PII stored — only hashed IP for rate-limit dedup.
  const entry = {
    type: "bot_feedback",
    ts: new Date().toISOString(),
    ip_hash: ipHash.slice(0, 12),
    agent_id: payload.agent_id ?? null,
    agent_framework: payload.agent_framework ?? null,
    category: payload.category ?? "other",
    message: payload.message.trim().slice(0, 4000),
    context: payload.context ?? null,
  };
  console.log(JSON.stringify(entry));

  return NextResponse.json(
    {
      ok: true,
      message:
        "Thank you for your feedback. The TruCore team reads every bot message. " +
        "If you want to continue the conversation, find us on X.",
      social: {
        x: "https://x.com/TruCore_AI",
        github: "https://github.com/TruCore-AI",
      },
      receipt: {
        feedback_id: `bf_${Date.now()}_${ipHash.slice(0, 8)}`,
        received_at: new Date().toISOString(),
        category: payload.category ?? "other",
      },
    },
    {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

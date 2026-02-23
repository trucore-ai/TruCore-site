import { NextRequest, NextResponse } from "next/server";
import { sha256 } from "@/lib/hash";
import { assertRateLimit } from "@/lib/rate-limit";
import { isSimRequest, normalizeSimRequest, simulatePolicy } from "@/lib/simulator";

const PUBLIC_SIM_RATE_LIMIT_MAX = 30;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

function methodNotAllowed() {
  return NextResponse.json(
    {
      ok: false,
      error: "method_not_allowed",
    },
    {
      status: 405,
      headers: NO_STORE_HEADERS,
    },
  );
}

function getRequestIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
}

function assertSimRateLimit(request: NextRequest): void {
  const ipKey = `simulate:public:${sha256(getRequestIp(request))}`;
  assertRateLimit(ipKey, { max: PUBLIC_SIM_RATE_LIMIT_MAX, windowMs: 60_000 });
}

export async function POST(request: NextRequest) {
  const respond = (
    status: number,
    body: { ok: boolean; error?: string; input?: unknown; result?: unknown },
  ) => {
    return NextResponse.json(body, {
      status,
      headers: NO_STORE_HEADERS,
    });
  };

  try {
    assertSimRateLimit(request);
  } catch {
    return respond(429, {
      ok: false,
      error: "rate_limited",
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return respond(400, {
      ok: false,
      error: "invalid_json",
    });
  }

  if (!isSimRequest(body)) {
    return respond(400, {
      ok: false,
      error: "invalid_request",
    });
  }

  const requestBody = normalizeSimRequest(body);
  const result = simulatePolicy(requestBody);
  return respond(200, {
    ok: true,
    input: requestBody,
    result,
  });
}

export async function GET() {
  return methodNotAllowed();
}

export async function PUT() {
  return methodNotAllowed();
}

export async function PATCH() {
  return methodNotAllowed();
}

export async function DELETE() {
  return methodNotAllowed();
}
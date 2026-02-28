import {
  buildVerificationUrl,
  formatPrettyResponse,
  formatRateLimitMetadata,
  getRateLimitMetadata,
  parseErrorPayload,
  resolveVerificationBaseUrl,
} from "./format.js";

const PRESETS = {
  swap_small: {
    action: "swap",
    token_in: "SOL",
    token_out: "USDC",
    amount: 10,
    max_slippage_bps: 100,
    ttl_seconds: 60,
  },
  swap_too_large: {
    action: "swap",
    token_in: "SOL",
    token_out: "USDC",
    amount: 5000,
    max_slippage_bps: 100,
    ttl_seconds: 60,
  },
  ttl_too_high: {
    action: "swap",
    token_in: "SOL",
    token_out: "USDC",
    amount: 10,
    max_slippage_bps: 100,
    ttl_seconds: 999,
  },
};

export function printHelp() {
  console.error("Usage:");
  console.error("  atf simulate --preset <swap_small|swap_too_large|ttl_too_high>");
  console.error("  atf simulate --json '<payload_json>'");
  console.error("\nOptions:");
  console.error("  --base-url <url>   Override base URL (default: ATF_BASE_URL or https://trucore.xyz)");
  console.error("  --format <json|pretty>  Output format (default: json)");
  console.error("  --verify           Print a verification URL using the receipt hash");
  console.error("  --quiet            Force JSON-only output and suppress pretty metadata");
  console.error("  --help             Show this help text");
}

export function parseArgs(argv) {
  const result = {
    command: argv[0],
    preset: undefined,
    json: undefined,
    baseUrl: undefined,
    format: "json",
    verify: false,
    quiet: false,
    help: false,
  };

  for (let index = 1; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      result.help = true;
      continue;
    }

    if (arg === "--preset") {
      result.preset = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--json") {
      result.json = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--base-url") {
      result.baseUrl = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--format") {
      result.format = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--verify") {
      result.verify = true;
      continue;
    }

    if (arg === "--quiet") {
      result.quiet = true;
    }
  }

  return result;
}

function resolvePayload(args) {
  if (args.json) {
    try {
      return JSON.parse(args.json);
    } catch {
      throw new Error("Invalid value for --json. Provide a valid JSON object string.");
    }
  }

  if (!args.preset) {
    throw new Error("Provide either --preset or --json.");
  }

  const payload = PRESETS[args.preset];
  if (!payload) {
    throw new Error(`Unknown preset: ${args.preset}. Supported presets: ${Object.keys(PRESETS).join(", ")}`);
  }

  return payload;
}

function resolveOutputMode(args) {
  if (args.quiet) {
    return "json";
  }

  if (args.format === "json" || args.format === "pretty") {
    return args.format;
  }

  throw new Error("Invalid value for --format. Use json or pretty.");
}

function normalizeBaseUrl(baseUrlArg) {
  const value = baseUrlArg ?? process.env.ATF_BASE_URL ?? "https://trucore.xyz";
  return value.replace(/\/$/, "");
}

export async function runSimulate(args) {
  return runSimulateWithIo(args, {
    fetchImpl: fetch,
    stdout: process.stdout,
    stderr: process.stderr,
  });
}

export async function runSimulateWithIo(args, io) {
  const { fetchImpl, stdout, stderr } = io;

  let payload;
  let outputMode;

  try {
    payload = resolvePayload(args);
    outputMode = resolveOutputMode(args);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid arguments.";
    stderr.write(`${message}\n`);
    if (message.startsWith("Provide either") || message.startsWith("Unknown preset") || message.startsWith("Invalid value for --format")) {
      printHelp();
    }
    return 1;
  }

  const baseUrl = normalizeBaseUrl(args.baseUrl);
  const url = `${baseUrl}/api/simulate`;

  const headers = {
    "content-type": "application/json",
  };

  if (process.env.ATF_API_KEY) {
    headers["x-api-key"] = process.env.ATF_API_KEY;
  }

  let response;
  try {
    response = await fetchImpl(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown network error";
    stderr.write(`ATF request failed: ${message}\n`);
    return 1;
  }

  if (!response.ok) {
    let errorBody = "";

    try {
      errorBody = await response.text();
    } catch {
      errorBody = "";
    }

    const parsedError = parseErrorPayload(errorBody);
    const rateLimit = getRateLimitMetadata(response.headers);

    stderr.write(`ATF simulate failed with HTTP ${response.status}.\n`);
    if (parsedError.code) {
      stderr.write(`Code: ${parsedError.code}\n`);
    }
    if (parsedError.message) {
      stderr.write(`Message: ${parsedError.message}\n`);
    }

    for (const line of formatRateLimitMetadata(rateLimit)) {
      stderr.write(`${line}\n`);
    }

    if (!parsedError.code && !parsedError.message && parsedError.raw) {
      stderr.write(`${parsedError.raw}\n`);
    }

    return 1;
  }

  let body;

  try {
    body = await response.json();
  } catch {
    stderr.write("ATF simulate returned an invalid JSON response.\n");
    return 1;
  }

  if (outputMode === "pretty") {
    const verifyBaseUrl = resolveVerificationBaseUrl(baseUrl);
    const verificationUrl = args.verify
      ? buildVerificationUrl(verifyBaseUrl, body?.result?.receipt_hash)
      : undefined;
    const rateLimit = getRateLimitMetadata(response.headers);
    stdout.write(`${formatPrettyResponse(body, { verificationUrl, rateLimit })}\n`);
  } else {
    stdout.write(`${JSON.stringify(body, null, 2)}\n`);
  }

  if (body?.result?.status === "denied") {
    return 2;
  }

  return 0;
}

export async function run(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);

  if (args.help || !args.command) {
    printHelp();
    return args.help ? 0 : 1;
  }

  if (args.command !== "simulate") {
    console.error(`Unknown command: ${args.command}`);
    printHelp();
    return 1;
  }

  return runSimulate(args);
}

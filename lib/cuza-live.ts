import { ANCHOR_PREVIEW_STATUS, type AnchorPreviewStatus } from "@/lib/anchor-preview";
import { normalizeSimRequest, simulatePolicy, type SimRequest, type SimResult } from "@/lib/simulator";

export type CuzaLiveReceipt = {
  id: string;
  input: SimRequest;
  result: SimResult;
  created_at: string;
  anchor_status: AnchorPreviewStatus;
};

type CuzaSeed = {
  id: string;
  input: SimRequest;
};

const STREAM_WINDOW_SIZE = 12;
const BUCKET_MS = 5 * 60_000;

const CUZA_SEEDS: CuzaSeed[] = [
  { id: "cuza-001", input: { action: "swap", token_in: "SOL", token_out: "USDC", amount: 10, max_slippage_bps: 100, ttl_seconds: 60 } },
  { id: "cuza-002", input: { action: "swap", token_in: "SOL", token_out: "USDC", amount: 150, max_slippage_bps: 120, ttl_seconds: 90 } },
  { id: "cuza-003", input: { action: "swap", token_in: "SOL", token_out: "USDC", amount: 1200, max_slippage_bps: 100, ttl_seconds: 90 } },
  { id: "cuza-004", input: { action: "swap", token_in: "SOL", token_out: "USDC", amount: 200, max_slippage_bps: 350, ttl_seconds: 90 } },
  { id: "cuza-005", input: { action: "swap", token_in: "SOL", token_out: "USDC", amount: 220, max_slippage_bps: 200, ttl_seconds: 360 } },
  { id: "cuza-006", input: { action: "swap", token_in: "BONK", token_out: "USDC", amount: 300, max_slippage_bps: 180, ttl_seconds: 120 } },
  { id: "cuza-007", input: { action: "swap", token_in: "JUP", token_out: "USDC", amount: 80, max_slippage_bps: 80, ttl_seconds: 60 } },
  { id: "cuza-008", input: { action: "swap", token_in: "PYTH", token_out: "USDC", amount: 900, max_slippage_bps: 200, ttl_seconds: 120 } },
  { id: "cuza-009", input: { action: "swap", token_in: "SOL", token_out: "JUP", amount: 60, max_slippage_bps: 140, ttl_seconds: 90 } },
  { id: "cuza-010", input: { action: "swap", token_in: "SOL", token_out: "USDC", amount: 999, max_slippage_bps: 250, ttl_seconds: 120 } },
  { id: "cuza-011", input: { action: "swap", token_in: "BONK", token_out: "USDC", amount: 1100, max_slippage_bps: 100, ttl_seconds: 120 } },
  { id: "cuza-012", input: { action: "swap", token_in: "PYTH", token_out: "USDC", amount: 450, max_slippage_bps: 320, ttl_seconds: 120 } },
  { id: "cuza-013", input: { action: "swap", token_in: "JUP", token_out: "USDC", amount: 340, max_slippage_bps: 150, ttl_seconds: 450 } },
  { id: "cuza-014", input: { action: "swap", token_in: "SOL", token_out: "USDC", amount: 35, max_slippage_bps: 70, ttl_seconds: 50 } },
  { id: "cuza-015", input: { action: "swap", token_in: "SOL", token_out: "USDT", amount: 420, max_slippage_bps: 200, ttl_seconds: 120 } },
  { id: "cuza-016", input: { action: "swap", token_in: "USDC", token_out: "SOL", amount: 650, max_slippage_bps: 220, ttl_seconds: 180 } },
];

const RECEIPT_POOL: CuzaLiveReceipt[] = CUZA_SEEDS.map((seed) => ({
  id: seed.id,
  input: normalizeSimRequest(seed.input),
  result: simulatePolicy(seed.input),
  created_at: "",
  anchor_status: ANCHOR_PREVIEW_STATUS,
}));

export function getCuzaLiveBucket(now = Date.now()): number {
  return Math.floor(now / BUCKET_MS);
}

function pickBucketSubset(bucket: number): CuzaLiveReceipt[] {
  const offset = bucket % RECEIPT_POOL.length;
  return Array.from({ length: STREAM_WINDOW_SIZE }, (_, index) => {
    const seed = RECEIPT_POOL[(offset + index) % RECEIPT_POOL.length];
    return {
      ...seed,
      input: { ...seed.input },
      result: {
        ...seed.result,
        invariant_checks: [...seed.result.invariant_checks],
      },
      anchor_status: { ...seed.anchor_status },
    };
  });
}

export function getCuzaLiveReceipts(now = Date.now()): CuzaLiveReceipt[] {
  const bucket = getCuzaLiveBucket(now);
  const bucketStart = bucket * BUCKET_MS;

  return pickBucketSubset(bucket).map((receipt, index) => ({
    ...receipt,
    created_at: new Date(bucketStart - index * 90_000).toISOString(),
  }));
}

export function buildCuzaLivePayload(now = Date.now()): {
  generated_at: string;
  receipts: CuzaLiveReceipt[];
} {
  return {
    generated_at: new Date(now).toISOString(),
    receipts: getCuzaLiveReceipts(now),
  };
}

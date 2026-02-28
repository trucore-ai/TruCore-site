import type { SimRequest, SimResult } from "@/lib/simulator";
import { simulatePolicy } from "@/lib/simulator";

export type DemoReceipt = {
  id: string;
  input: SimRequest;
  result: SimResult;
  created_at: string;
};

const RECEIPT_SEEDS: Array<Pick<DemoReceipt, "id" | "input" | "created_at">> = [
  {
    id: "demo-1",
    input: {
      action: "swap",
      token_in: "SOL",
      token_out: "USDC",
      amount: 10,
      max_slippage_bps: 100,
      ttl_seconds: 60,
    },
    created_at: "2026-02-20T10:00:00.000Z",
  },
  {
    id: "demo-2",
    input: {
      action: "swap",
      token_in: "SOL",
      token_out: "USDC",
      amount: 5000,
      max_slippage_bps: 100,
      ttl_seconds: 60,
    },
    created_at: "2026-02-20T10:02:00.000Z",
  },
  {
    id: "demo-3",
    input: {
      action: "swap",
      token_in: "SOL",
      token_out: "USDC",
      amount: 10,
      max_slippage_bps: 500,
      ttl_seconds: 60,
    },
    created_at: "2026-02-20T10:04:00.000Z",
  },
  {
    id: "demo-4",
    input: {
      action: "swap",
      token_in: "SOL",
      token_out: "USDC",
      amount: 10,
      max_slippage_bps: 100,
      ttl_seconds: 600,
    },
    created_at: "2026-02-20T10:06:00.000Z",
  },
];

export const demoReceipts: DemoReceipt[] = RECEIPT_SEEDS.map((seed) => ({
  ...seed,
  result: simulatePolicy(seed.input),
}));

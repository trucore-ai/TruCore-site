import { describe, expect, it } from "vitest";
import { getCuzaLiveBucket, getCuzaLiveReceipts } from "@/lib/cuza-live";

describe("cuza live stream", () => {
  it("returns deterministic subset for the same 5-minute bucket", () => {
    const nowA = Date.parse("2026-02-24T10:01:12.000Z");
    const nowB = Date.parse("2026-02-24T10:04:59.000Z");

    const receiptsA = getCuzaLiveReceipts(nowA);
    const receiptsB = getCuzaLiveReceipts(nowB);

    expect(getCuzaLiveBucket(nowA)).toBe(getCuzaLiveBucket(nowB));
    expect(receiptsA.map((receipt) => receipt.id)).toEqual(receiptsB.map((receipt) => receipt.id));
    expect(receiptsA.map((receipt) => receipt.result.receipt_hash)).toEqual(
      receiptsB.map((receipt) => receipt.result.receipt_hash),
    );
  });

  it("keeps stable receipt hashes for known deterministic inputs", () => {
    const receipts = getCuzaLiveReceipts(0);
    const known = receipts.find((receipt) => receipt.id === "cuza-001");

    expect(known).toBeTruthy();
    expect(known?.result.receipt_hash).toBe("1616e0f2347f68f8d2f189b6365456fde56a607d66fc897817946f34fb5a81b8");
  });
});

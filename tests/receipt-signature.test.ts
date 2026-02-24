import { afterEach, describe, expect, it } from "vitest";
import {
  getReceiptSigningKeypairFromEnv,
  getReceiptSigningPublicKeyB64,
  signReceiptHash,
  verifyReceiptHashSignature,
} from "@/lib/receipt-signature";

const FIXED_KEY_B64 = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";
const RECEIPT_HASH = "a".repeat(64);

describe("receipt signature", () => {
  afterEach(() => {
    delete process.env.RECEIPT_SIGNING_KEY;
  });

  it("derives keypair from env seed", () => {
    process.env.RECEIPT_SIGNING_KEY = FIXED_KEY_B64;

    const keypair = getReceiptSigningKeypairFromEnv();
    const publicKeyB64 = getReceiptSigningPublicKeyB64();

    expect(keypair).not.toBeNull();
    expect(publicKeyB64).toBeTruthy();
  });

  it("accepts 64-byte secret form and produces the same public key", () => {
    process.env.RECEIPT_SIGNING_KEY = FIXED_KEY_B64;
    const fromSeed = getReceiptSigningPublicKeyB64();

    const expanded = Buffer.concat([Buffer.from(FIXED_KEY_B64, "base64"), Buffer.alloc(32, 7)]).toString("base64");
    process.env.RECEIPT_SIGNING_KEY = expanded;
    const fromSecret = getReceiptSigningPublicKeyB64();

    expect(fromSeed).toBeTruthy();
    expect(fromSecret).toBe(fromSeed);
  });

  it("signs deterministically for a known hash and verifies", () => {
    process.env.RECEIPT_SIGNING_KEY = FIXED_KEY_B64;

    const signedA = signReceiptHash(RECEIPT_HASH);
    const signedB = signReceiptHash(RECEIPT_HASH);

    expect(signedA.signatureB64).toBe(signedB.signatureB64);
    expect(signedA.publicKeyB64).toBe(signedB.publicKeyB64);
    expect(verifyReceiptHashSignature(RECEIPT_HASH, signedA.signatureB64, signedA.publicKeyB64)).toBe(true);
  });

  it("returns false for tampered hash or signature", () => {
    process.env.RECEIPT_SIGNING_KEY = FIXED_KEY_B64;

    const signed = signReceiptHash(RECEIPT_HASH);
    const tamperedSig = `${signed.signatureB64.slice(0, -2)}ab`;
    const tamperedHash = `b${RECEIPT_HASH.slice(1)}`;

    expect(verifyReceiptHashSignature(tamperedHash, signed.signatureB64, signed.publicKeyB64)).toBe(false);
    expect(verifyReceiptHashSignature(RECEIPT_HASH, tamperedSig, signed.publicKeyB64)).toBe(false);
  });
});

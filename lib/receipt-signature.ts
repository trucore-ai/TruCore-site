import { createPrivateKey, createPublicKey, sign, verify } from "node:crypto";

if (typeof window !== "undefined" && !process.env.VITEST) {
  throw new Error("receipt_signature_server_only");
}

const ED25519_PKCS8_SEED_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");
const ED25519_SPKI_PUBLIC_KEY_PREFIX = Buffer.from("302a300506032b6570032100", "hex");
const RECEIPT_HASH_HEX_PATTERN = /^[a-f0-9]{64}$/i;

type ReceiptSigningKeypair = {
  publicKey: ReturnType<typeof createPublicKey>;
  secretKey: ReturnType<typeof createPrivateKey>;
};

function toHashBytes(hashHex: string): Buffer {
  if (!RECEIPT_HASH_HEX_PATTERN.test(hashHex)) {
    throw new Error("invalid_receipt_hash");
  }

  return Buffer.from(hashHex.toLowerCase(), "hex");
}

function toEd25519PrivateKey(seed: Buffer) {
  const der = Buffer.concat([ED25519_PKCS8_SEED_PREFIX, seed]);
  return createPrivateKey({
    key: der,
    format: "der",
    type: "pkcs8",
  });
}

function toEd25519PublicKey(publicKeyBytes: Buffer) {
  const der = Buffer.concat([ED25519_SPKI_PUBLIC_KEY_PREFIX, publicKeyBytes]);
  return createPublicKey({
    key: der,
    format: "der",
    type: "spki",
  });
}

function extractRawPublicKeyBytes(publicKey: ReturnType<typeof createPublicKey>): Buffer {
  const der = publicKey.export({
    format: "der",
    type: "spki",
  }) as Buffer;

  return der.subarray(-32);
}

function parseSigningSeedFromEnv(value: string): Buffer | null {
  try {
    const decoded = Buffer.from(value, "base64");

    if (decoded.length === 32) {
      return decoded;
    }

    if (decoded.length === 64) {
      return decoded.subarray(0, 32);
    }

    return null;
  } catch {
    return null;
  }
}

export function getReceiptSigningKeypairFromEnv(): ReceiptSigningKeypair | null {
  const configured = process.env.RECEIPT_SIGNING_KEY?.trim();
  if (!configured) {
    return null;
  }

  const seed = parseSigningSeedFromEnv(configured);
  if (!seed) {
    return null;
  }

  const secretKey = toEd25519PrivateKey(seed);
  const publicKey = createPublicKey(secretKey);

  return {
    publicKey,
    secretKey,
  };
}

export function getReceiptSigningPublicKeyB64(): string | null {
  const keypair = getReceiptSigningKeypairFromEnv();
  if (!keypair) {
    return null;
  }

  return extractRawPublicKeyBytes(keypair.publicKey).toString("base64");
}

export function signReceiptHash(hashHex: string): { signatureB64: string; publicKeyB64: string } {
  const keypair = getReceiptSigningKeypairFromEnv();
  if (!keypair) {
    throw new Error("receipt_signing_key_unavailable");
  }

  const signature = sign(null, toHashBytes(hashHex), keypair.secretKey);
  const publicKeyB64 = extractRawPublicKeyBytes(keypair.publicKey).toString("base64");

  return {
    signatureB64: signature.toString("base64"),
    publicKeyB64,
  };
}

export function verifyReceiptHashSignature(hashHex: string, signatureB64: string, publicKeyB64: string): boolean {
  if (!signatureB64 || !publicKeyB64) {
    return false;
  }

  try {
    const signature = Buffer.from(signatureB64, "base64");
    const publicKeyBytes = Buffer.from(publicKeyB64, "base64");
    if (publicKeyBytes.length !== 32) {
      return false;
    }

    const publicKey = toEd25519PublicKey(publicKeyBytes);

    return verify(null, toHashBytes(hashHex), publicKey, signature);
  } catch {
    return false;
  }
}

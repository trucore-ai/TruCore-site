export type VerificationKitOs = "mac" | "linux" | "windows";

type BuildVerifyUrlArgs = {
  hash: string;
  from?: "receipts" | "portal";
  autofetchSig?: boolean;
};

const NODE_ED25519_VERIFY_SNIPPET =
  "const { createPublicKey, verify } = require('node:crypto'); const prefix = Buffer.from('302a300506032b6570032100', 'hex'); const hash = Buffer.from(process.env.RECEIPT_HASH, 'hex'); const signature = Buffer.from(process.env.RECEIPT_SIG, 'base64'); const publicKey = createPublicKey({ key: Buffer.concat([prefix, Buffer.from(process.env.RECEIPT_PUB, 'base64')]), format: 'der', type: 'spki' }); console.log(verify(null, hash, publicKey, signature) ? 'verified' : 'invalid');";

export function buildVerifyUrl({ hash, from, autofetchSig = false }: BuildVerifyUrlArgs): string {
  const normalizedHash = hash.trim().toLowerCase();
  const params = new URLSearchParams();

  if (normalizedHash) {
    params.set("hash", normalizedHash);
  }

  if (from) {
    params.set("from", from);
  }

  if (autofetchSig) {
    params.set("autofetchSig", "1");
  }

  const query = params.toString();
  return query ? `/verify?${query}` : "/verify";
}

export function buildSignatureVerifyCommand(
  os: VerificationKitOs,
  receiptHash: string,
  publicKey: string,
  signature: string,
): string {
  const safeHash = receiptHash.trim().toLowerCase();
  const safeKey = publicKey.trim();
  const safeSignature = signature.trim();

  if (os === "windows") {
    return `$env:RECEIPT_HASH='${safeHash}'; $env:RECEIPT_PUB='${safeKey}'; $env:RECEIPT_SIG='${safeSignature}'; node -e \"${NODE_ED25519_VERIFY_SNIPPET}\"`;
  }

  return `RECEIPT_HASH='${safeHash}' RECEIPT_PUB='${safeKey}' RECEIPT_SIG='${safeSignature}' node -e \"${NODE_ED25519_VERIFY_SNIPPET}\"`;
}

export function buildSignatureVerifyScript(receiptHash: string, publicKey: string, signature: string): string {
  const safeHash = receiptHash.trim().toLowerCase();
  const safeKey = publicKey.trim();
  const safeSignature = signature.trim();

  return `import { createPublicKey, verify } from "node:crypto";

const receiptHash = "${safeHash}";
const publicKeyB64 = "${safeKey}";
const signatureB64 = "${safeSignature}";

const spkiPrefix = Buffer.from("302a300506032b6570032100", "hex");
const publicKey = createPublicKey({
  key: Buffer.concat([spkiPrefix, Buffer.from(publicKeyB64, "base64")]),
  format: "der",
  type: "spki",
});

const verified = verify(
  null,
  Buffer.from(receiptHash, "hex"),
  publicKey,
  Buffer.from(signatureB64, "base64"),
);

console.log(verified ? "verified" : "invalid");`;
}

export function buildHashRecomputeCommand(os: VerificationKitOs, receiptHash: string, receiptJson: string): string {
  const safeHash = receiptHash.trim().toLowerCase();
  const payload = JSON.stringify({
    receipt_hash: safeHash,
    receipt: JSON.parse(receiptJson),
  });

  if (os === "windows") {
    return `$body = @'\n${payload}\n'@; Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/verify-receipt' -ContentType 'application/json' -Body $body`;
  }

  return `cat <<'JSON' | curl -sS http://localhost:3000/api/verify-receipt -H 'content-type: application/json' --data-binary @-\n${payload}\nJSON`;
}
import { createHmac } from "node:crypto";
import { sha256Hex } from "@/lib/sha256";
import { generateWhitepaperPdfBytes } from "@/lib/whitepaper-pdf";

export type WhitepaperIntegrityProof = {
  sha256: string;
  signature: string;
};

function resolveSigningKey(): string | null {
  const configured = process.env.WHITEPAPER_SIGNING_KEY?.trim();
  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV !== "production") {
    return "trucore-dev-whitepaper-signing-key";
  }

  return null;
}

export async function getWhitepaperIntegrityProof(): Promise<WhitepaperIntegrityProof> {
  const pdfBytes = await generateWhitepaperPdfBytes();
  const sha256 = sha256Hex(pdfBytes);
  const signingKey = resolveSigningKey();

  if (!signingKey) {
    throw new Error("WHITEPAPER_SIGNING_KEY is required in production");
  }

  const signature = createHmac("sha256", signingKey).update(sha256).digest("hex");

  return {
    sha256,
    signature,
  };
}
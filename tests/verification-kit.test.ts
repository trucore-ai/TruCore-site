import { describe, expect, it } from "vitest";
import {
  buildHashRecomputeCommand,
  buildSignatureVerifyCommand,
  buildSignatureVerifyScript,
  buildVerifyUrl,
} from "@/lib/verification-kit";

describe("verification kit helpers", () => {
  it("builds verify URL with optional params", () => {
    expect(buildVerifyUrl({ hash: "ABCD", from: "receipts", autofetchSig: true })).toBe(
      "/verify?hash=abcd&from=receipts&autofetchSig=1",
    );
    expect(buildVerifyUrl({ hash: "", from: "portal" })).toBe("/verify?from=portal");
  });

  it("builds signature verify command for unix and windows", () => {
    const unixCommand = buildSignatureVerifyCommand("linux", "A".repeat(64), "pub", "sig");
    expect(unixCommand).toContain("RECEIPT_HASH='aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'");
    expect(unixCommand).toContain("node -e");

    const windowsCommand = buildSignatureVerifyCommand("windows", "a".repeat(64), "pub", "sig");
    expect(windowsCommand).toContain("$env:RECEIPT_HASH='aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'");
    expect(windowsCommand).toContain("node -e");
  });

  it("builds copyable signature verification script", () => {
    const script = buildSignatureVerifyScript("b".repeat(64), "pubKeyBase64", "sigBase64");
    expect(script).toContain("createPublicKey");
    expect(script).toContain("console.log(verified ? \"verified\" : \"invalid\")");
  });

  it("builds recompute command with receipt payload", () => {
    const receiptJson = JSON.stringify({ version: "1", input: { action: "swap" } });

    const unixCommand = buildHashRecomputeCommand("mac", "c".repeat(64), receiptJson);
    expect(unixCommand).toContain("/api/verify-receipt");
    expect(unixCommand).toContain('"receipt_hash":"cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"');

    const windowsCommand = buildHashRecomputeCommand("windows", "d".repeat(64), receiptJson);
    expect(windowsCommand).toContain("Invoke-RestMethod");
  });
});
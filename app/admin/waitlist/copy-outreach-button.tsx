"use client";

import { useState } from "react";

function buildTemplate(name: string) {
  return [
    `Subject: TruCore ATF - Design Partner Follow-up`,
    ``,
    `Hi ${name},`,
    ``,
    `Thanks for applying to be a TruCore ATF design partner.`,
    ``,
    `A couple quick questions so we can qualify fit:`,
    `1) What agent stack are you running today (framework + signer)?`,
    `2) Which actions matter most in V1 (Jupiter swaps, Solend lending, both)?`,
    `3) What guardrails are you most concerned about (slippage, limits, allowlists, receipts, other)?`,
    ``,
    `If you're open to a short call, share 2-3 times that work this week.`,
    ``,
    `-- TruCore`,
  ].join("\n");
}

export function CopyOutreachButton({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const text = buildTemplate(name);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: prompt user
      window.prompt("Copy this template:", text);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="whitespace-nowrap rounded bg-amber-600/80 px-2 py-0.5 text-xs font-medium text-white hover:bg-amber-500 transition"
      title="Copy outreach email template"
    >
      {copied ? "Copied!" : "Copy email"}
    </button>
  );
}

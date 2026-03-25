import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import {
  FALLBACK_RESULT,
} from "@/lib/verify-demo-data";
import Link from "next/link";

export const metadata = {
  title: "Example Verified Receipt — TruCore ATF",
  description:
    "A canonical example of a verified ATF receipt — no live data, instant load.",
};

const result = FALLBACK_RESULT;
const decision = result.decision ?? "ALLOW";
const isAllow = decision.toLowerCase() === "allow";

export default function ExampleReceiptPage() {
  return (
    <Container>
      <Section className="fade-in-up">
        <div className="mx-auto max-w-lg py-12 text-center">
          <div className="space-y-6">
            {/* Header line */}
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Example verified receipt
            </p>

            {/* Verified badge */}
            <div className="flex items-center justify-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,.5)]" />
              <span className="text-sm font-semibold uppercase tracking-wider text-green-300">
                Verified by ATF
              </span>
            </div>

            {/* Decision */}
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary-200">
                Decision
              </p>
              <p
                className={`mt-2 text-5xl font-bold ${
                  isAllow ? "text-green-400" : "text-red-400"
                }`}
              >
                {decision.toUpperCase()}
              </p>
            </div>

            {/* Receipt hash */}
            {result.receipt_hash && (
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  Receipt Hash
                </p>
                <code className="mt-1 block break-all text-xs text-primary-200">
                  {result.receipt_hash}
                </code>
              </div>
            )}

            {/* Minimal policy summary */}
            {Array.isArray(result.policy_breakdown) &&
              result.policy_breakdown.length > 0 && (
                <div className="text-left">
                  <p className="text-sm font-semibold uppercase tracking-wider text-primary-200">
                    Policy Summary
                  </p>
                  <ul className="mt-2 space-y-1">
                    {result.policy_breakdown.map((rule, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-sm text-slate-300"
                      >
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            (rule as Record<string, string>).result === "PASS"
                              ? "bg-green-400"
                              : "bg-red-400"
                          }`}
                        />
                        {(rule as Record<string, string>).policy ?? "—"}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Generate your own link */}
            <p className="pt-4 text-xs text-slate-500">
              <Link
                href="/verify-demo"
                className="text-primary-300 underline decoration-primary-300/30 underline-offset-2 transition-colors hover:text-primary-200"
              >
                Generate your own &rarr; /verify-demo
              </Link>
            </p>

            {/* Branding footer */}
            <p className="text-xs text-slate-500">trucore.ai/r/example</p>
          </div>
        </div>
      </Section>
    </Container>
  );
}

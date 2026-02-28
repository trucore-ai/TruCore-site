import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ATF Demo Policy",
  description:
    "Explicit deterministic policy constraints enforced by the public ATF simulator.",
};

export default function DemoPolicyPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight text-slate-100 sm:text-5xl">ATF Demo Policy</h1>
      </header>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">Scope</h2>
        <p className="text-slate-300">
          This page documents the deterministic policy enforced by the public simulator.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">Constraints</h2>
        <ul className="space-y-2 text-slate-300">
          <li>amount &lt;= 1000</li>
          <li>max_slippage_bps &lt;= 300</li>
          <li>ttl_seconds &lt;= 300</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">Determinism Note</h2>
        <ul className="space-y-2 text-slate-300">
          <li>Receipt hash derived from normalized input + decision output</li>
          <li>Same input always produces same receipt hash</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-100">Not Production Policy</h2>
        <p className="text-slate-300">
          Demo policy constraints are intentionally public and simplified. Demo policy is not the same as partner or
          production policy.
        </p>
      </section>

      <section className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="text-2xl font-semibold text-slate-100">Related links</h2>
        <ul className="space-y-2 text-slate-300">
          <li>
            <Link href="/atf/simulator" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
              /atf/simulator
            </Link>
          </li>
          <li>
            <Link href="/receipts" className="font-semibold text-primary-100 transition-colors hover:text-primary-200">
              /receipts
            </Link>
          </li>
          <li>
            <Link
              href="/docs/5-minute-quickstart"
              className="font-semibold text-primary-100 transition-colors hover:text-primary-200"
            >
              /docs/5-minute-quickstart
            </Link>
          </li>
        </ul>
      </section>
    </article>
  );
}

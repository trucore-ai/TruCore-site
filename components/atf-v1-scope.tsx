import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";

/* ── Status dot helper ── */

type DotStatus = "active" | "feature-gated" | "coming-soon";

const dotColor: Record<DotStatus, string> = {
  active: "bg-primary-400",
  "feature-gated": "bg-amber-400",
  "coming-soon": "bg-slate-500",
};

function VenueDot({ status }: { status: DotStatus }) {
  return (
    <span
      className={`mt-1 block h-1.5 w-1.5 shrink-0 rounded-full ${dotColor[status]}`}
    />
  );
}

export function AtfV1Scope() {
  return (
    <Section divider className="fade-in-up">
      <div className="mb-8 max-w-2xl">
        <p className="section-label mb-3">Scope</p>
        <h2 className="text-4xl font-bold tracking-tight text-accent-300">
          ATF V1 Scope
        </h2>
        <p className="mt-4 text-2xl leading-[1.4] text-slate-200">
          V1 is intentionally focused. Production-grade enforcement across a
          well-defined surface area, with real adapters for every supported venue
          and chain. Expansion happens only after each layer is proven.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Supported Chains */}
        <Card className="border-primary-300/25 bg-primary-500/10">
          <h3 className="text-xl font-bold text-accent-300">Chains</h3>
          <ul className="mt-3 space-y-2">
            <li className="flex items-start gap-2 text-lg leading-[1.5] text-slate-200">
              <VenueDot status="active" />
              Solana <span className="text-xs text-slate-400">(primary)</span>
            </li>
            <li className="flex items-start gap-2 text-lg leading-[1.5] text-slate-200">
              <VenueDot status="feature-gated" />
              <span>Hyperliquid <span className="text-xs text-amber-300">feature-gated</span></span>
            </li>
            <li className="flex items-start gap-2 text-lg leading-[1.5] text-slate-200">
              <VenueDot status="coming-soon" />
              <span>Base <span className="text-xs text-slate-400">coming soon</span></span>
            </li>
          </ul>
        </Card>

        {/* Enforced Controls */}
        <Card className="border-primary-300/25 bg-primary-500/10">
          <h3 className="text-xl font-bold text-accent-300">Enforced Controls</h3>
          <ul className="mt-3 space-y-2">
            {[
              "Slippage bounds",
              "Protocol allowlist",
              "Max exposure caps",
              "Transaction TTL",
              "Nonce-based replay protection",
            ].map((c) => (
              <li key={c} className="flex items-start gap-2 text-lg leading-[1.5] text-slate-200">
                <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
                {c}
              </li>
            ))}
          </ul>
        </Card>

        {/* Platform Surface */}
        <Card className="border-primary-300/25 bg-primary-500/10">
          <h3 className="text-xl font-bold text-accent-300">Platform Surface</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            ATF is enforcement infrastructure, not just a CLI. Agents connect
            through multiple integration points.
          </p>
          <ul className="mt-3 space-y-2">
            {[
              "52+ CLI commands across 14 groups",
              "Public API with deterministic simulation",
              "13 native agent tools across 6 contract families",
              "8 production-ready example projects",
              "6 deployable services",
              "4 on-chain Solana programs (devnet)",
            ].map((c) => (
              <li key={c} className="flex items-start gap-2 text-base leading-[1.5] text-slate-200">
                <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
                {c}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Section>
  );
}

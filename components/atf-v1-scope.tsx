import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";

export function AtfV1Scope() {
  return (
    <Section className="border-t border-white/10 fade-in-up">
      <div className="mb-8 max-w-2xl">
        <h2 className="text-4xl font-bold tracking-tight text-[#f0a050]">
          ATF V1 Scope
        </h2>
        <p className="mt-4 text-2xl leading-[1.4] text-slate-200">
          V1 is intentionally narrow by design. A focused scope lets us ship
          production-grade enforcement for a well-defined surface area, validate
          every invariant in real conditions, and expand only after each layer
          is proven.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Supported Chain */}
        <Card className="border-primary-300/25 bg-primary-500/10">
          <h3 className="text-xl font-bold text-[#e8944a]">Supported Chain (v1)</h3>
          <ul className="mt-3 space-y-2">
            <li className="flex items-start gap-2 text-lg leading-[1.5] text-slate-200">
              <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
              Solana
            </li>
          </ul>
          <p className="mt-3 text-sm text-slate-400">Solana-first. Multi-chain expansion next.</p>
        </Card>

        {/* Protocol Integrations */}
        <Card className="border-primary-300/25 bg-primary-500/10">
          <h3 className="text-xl font-bold text-[#e8944a]">Protocol Integrations</h3>
          <ul className="mt-3 space-y-2">
            <li className="flex items-start gap-2 text-lg leading-[1.5] text-slate-200">
              <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
              Jupiter (swaps)
            </li>
            <li className="flex items-start gap-2 text-lg leading-[1.5] text-slate-200">
              <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
              Solend (lending)
            </li>
            <li className="flex items-start gap-2 text-lg leading-[1.5] text-slate-200">
              <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
              <span>Drift v2 (perps) <span className="text-xs text-amber-300">feature-gated / off by default</span></span>
            </li>
            <li className="flex items-start gap-2 text-lg leading-[1.5] text-slate-200">
              <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
              <span>Mango v4 (perps) <span className="text-xs text-amber-300">feature-gated / off by default</span></span>
            </li>
            <li className="flex items-start gap-2 text-lg leading-[1.5] text-slate-200">
              <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
              <span>Hyperliquid (perps) <span className="text-xs text-amber-300">feature-gated / off by default</span></span>
            </li>
          </ul>
        </Card>

        {/* Enforced Controls */}
        <Card className="border-primary-300/25 bg-primary-500/10">
          <h3 className="text-xl font-bold text-[#e8944a]">Enforced Controls</h3>
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
      </div>
    </Section>
  );
}

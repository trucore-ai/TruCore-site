import { TrackedLink } from "@/components/tracked-link";

/* ── Production-readiness credibility signals ── */

const SIGNALS = [
  {
    label: "CLI + API Interface",
    href: "/docs/cli",
    target: "cli_api",
  },
  {
    label: "Tamper-Evident Receipts",
    href: "/receipts",
    target: "receipts",
  },
  {
    label: "6 Deployable Services",
    href: "/build-with-atf",
    target: "deployable_services",
  },
  {
    label: "4 Devnet Programs",
    href: "/docs/agent-discovery",
    target: "devnet_programs",
  },
  {
    label: "Live System Status",
    href: "/status",
    target: "dashboard_status",
  },
  {
    label: "Deterministic Policy Enforcement",
    href: "/agent-transaction-firewall",
    target: "policy_enforcement",
  },
] as const;

export function ProductionReadinessStrip() {
  return (
    <div className="py-6 sm:py-8">
      <p className="section-label mb-4 text-center">Production Readiness</p>
      <div className="rounded-xl border border-white/[0.07] bg-neutral-950/40">
        <ul className="grid divide-y divide-white/[0.06] text-sm sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-3 lg:divide-x lg:divide-white/[0.06]">
          {SIGNALS.map((signal) => (
            <li key={signal.label} className="px-5 py-3.5">
              <TrackedLink
                href={signal.href}
                eventName="prod_readiness_strip_click"
                eventProps={{
                  location: "home_prod_readiness",
                  target: signal.target,
                }}
                className="group flex items-center gap-2.5 text-slate-300 transition-colors hover:text-primary-100"
              >
                <span
                  className="block h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400 shadow-[0_0_4px_1px_rgba(92,188,251,0.45)] transition-shadow group-hover:shadow-[0_0_6px_2px_rgba(92,188,251,0.6)]"
                  aria-hidden="true"
                />
                <span className="font-medium">{signal.label}</span>
              </TrackedLink>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-3 text-center text-sm text-slate-400/80">
        Deterministic policy enforcement infrastructure for autonomous agents operating across Solana venues.
      </p>
    </div>
  );
}

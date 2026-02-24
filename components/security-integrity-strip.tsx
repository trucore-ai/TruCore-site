import { TrackedLink } from "@/components/tracked-link";

const SECURITY_SIGNALS = [
  {
    label: "Permit-based authorization",
    href: "/docs/permits",
    target: "permits",
  },
  {
    label: "Deterministic invariant checks",
    href: "/docs/quickstart",
    target: "invariants",
  },
  {
    label: "Tamper-evident receipts",
    href: "/docs/quickstart#deterministic-enforcement-proof",
    target: "receipts",
  },
  {
    label: "Signed whitepaper integrity",
    href: "/atf/whitepaper",
    target: "whitepaper_integrity",
  },
] as const;

export function SecurityIntegrityStrip() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02]">
      <ul className="grid divide-y divide-white/10 text-sm text-slate-200 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x lg:divide-white/10">
        {SECURITY_SIGNALS.map((signal) => (
          <li key={signal.label} className="px-4 py-3">
            <TrackedLink
              href={signal.href}
              eventName="hero_security_strip_click"
              eventProps={{ location: "atf_hero_strip", target: signal.target }}
              className="inline-flex text-slate-200 transition-colors hover:text-primary-100"
            >
              {signal.label}
            </TrackedLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

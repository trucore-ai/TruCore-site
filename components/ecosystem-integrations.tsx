import { Section } from "@/components/ui/section";

/* ── Venue integration data (canonical source) ── */

type VenueStatus = "active" | "feature-gated";

type Venue = { name: string; status: VenueStatus };

type VenueCategory = { label: string; venues: Venue[] };

const venueCategories: VenueCategory[] = [
  {
    label: "DEX",
    venues: [
      { name: "Jupiter", status: "active" },
      { name: "Orca", status: "active" },
      { name: "Raydium", status: "active" },
    ],
  },
  {
    label: "Lending",
    venues: [
      { name: "Solend", status: "active" },
      { name: "Marginfi", status: "active" },
      { name: "Kamino", status: "feature-gated" },
    ],
  },
  {
    label: "Perps",
    venues: [
      { name: "Drift v2", status: "feature-gated" },
      { name: "Mango v4", status: "feature-gated" },
      { name: "Hyperliquid", status: "feature-gated" },
    ],
  },
];

const statusDot: Record<VenueStatus, string> = {
  active: "bg-primary-400",
  "feature-gated": "bg-amber-400",
};

/* ── Component ── */

export function EcosystemIntegrations() {
  return (
    <Section id="ecosystem" divider className="fade-in-up">
      {/* ── Section header ── */}
      <div className="mb-10 max-w-2xl">
        <p className="section-label mb-3">Ecosystem</p>
        <h2 className="text-4xl font-bold tracking-tight text-accent-300">
          Integrated with the Solana ecosystem
        </h2>
        <p className="mt-4 text-xl leading-[1.5] text-slate-200">
          ATF connects to the venues where autonomous agents operate,
          enforcing policy before every transaction reaches the chain.
        </p>
      </div>

      {/* ── Architecture flow: Agent → ATF → Venue ── */}
      <div className="mb-10 flex items-center justify-center">
        <div className="inline-flex items-center gap-3 rounded-xl border border-white/[0.07] bg-neutral-950/50 px-6 py-3 sm:gap-4 sm:px-8 sm:py-4">
          <span className="text-sm font-semibold uppercase tracking-wider text-slate-300 sm:text-base">
            Agent
          </span>

          <FlowArrow />

          <span className="rounded-md border border-primary-400/30 bg-primary-500/10 px-3 py-1 text-sm font-bold uppercase tracking-wider text-primary-200 sm:text-base">
            ATF
          </span>

          <FlowArrow />

          <span className="text-sm font-semibold uppercase tracking-wider text-slate-300 sm:text-base">
            Venue
          </span>
        </div>
      </div>

      {/* ── Integration grid ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {venueCategories.map((category) => (
          <div
            key={category.label}
            className="rounded-xl border border-white/[0.07] bg-neutral-950/40 p-6"
          >
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              {category.label}
            </p>
            <div className="flex flex-col gap-2.5">
              {category.venues.map((venue) => (
                <div
                  key={venue.name}
                  className="flex items-center gap-2.5 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3.5 py-2.5 transition-colors hover:border-white/[0.10]"
                >
                  <span
                    className={`block h-2 w-2 shrink-0 rounded-full ${statusDot[venue.status]}`}
                  />
                  <span className="text-sm font-medium text-slate-200 sm:text-base">
                    {venue.name}
                  </span>
                  {venue.status === "feature-gated" && (
                    <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-amber-400/70">
                      gated
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Infrastructure caption ── */}
      <p className="mt-8 text-center text-base leading-relaxed text-slate-400">
        ATF enforces execution policies across decentralized exchanges,
        lending markets, and perpetual venues where autonomous agents operate.
      </p>

      {/* ── Legend ── */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="block h-1.5 w-1.5 rounded-full bg-primary-400" />
          Active
        </span>
        <span className="flex items-center gap-1.5">
          <span className="block h-1.5 w-1.5 rounded-full bg-amber-400" />
          Feature-gated
        </span>
      </div>
    </Section>
  );
}

/* ── Small arrow between flow nodes ── */
function FlowArrow() {
  return (
    <svg
      className="h-4 w-6 shrink-0 text-slate-500"
      viewBox="0 0 24 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M0 8h20m0 0l-5-5m5 5l-5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

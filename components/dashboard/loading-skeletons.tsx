/* ────────────────────────────────────────────────────────────────
 *  Loading Skeletons - premium shimmer placeholders
 *
 *  CSS-only skeleton system using a gradient sweep animation
 *  for a premium, directional shimmer effect. Each component
 *  exports a skeleton variant sized to match its loaded
 *  counterpart so the layout never shifts.
 * ──────────────────────────────────────────────────────────── */

function Shimmer({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-white/[0.04] ${className}`.trim()}
      style={style}
    >
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_2s_ease-in-out_infinite]"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 40%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 60%, transparent 100%)",
        }}
      />
    </div>
  );
}

/* ── KPI card skeleton ──────────────────────────────────────── */

export function KpiCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 shadow-sm shadow-black/10 space-y-3">
      <Shimmer className="h-3 w-20" />
      <Shimmer className="h-8 w-28" />
      <Shimmer className="h-3 w-16" />
    </div>
  );
}

export function KpiGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <KpiCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ── Health strip skeleton ──────────────────────────────────── */

export function HealthStripSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 shadow-sm shadow-black/10 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Shimmer className="h-4 w-32" />
        <Shimmer className="h-5 w-20 rounded-full" />
      </div>
      <div className="h-px bg-white/[0.04]" />
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-white/[0.04] bg-white/[0.015] p-3.5">
            <Shimmer className="h-3 w-24" />
            <Shimmer className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Enforcement overview skeleton ──────────────────────────── */

export function EnforcementSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 shadow-sm shadow-black/10 sm:p-6 space-y-4">
      <Shimmer className="h-4 w-40" />
      <div className="grid gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-2">
            <Shimmer className="h-3 w-16" />
            <Shimmer className="h-7 w-20" />
          </div>
        ))}
      </div>
      <div className="space-y-2 pt-2">
        {Array.from({ length: 3 }, (_, i) => (
          <Shimmer key={i} className="h-8 w-full" />
        ))}
      </div>
    </div>
  );
}

/* ── Activity chart skeleton ────────────────────────────────── */

export function ActivityChartSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 shadow-sm shadow-black/10 sm:p-6 space-y-4">
      <Shimmer className="h-4 w-36" />
      <div className="flex items-end gap-1 h-40">
        {[35, 55, 28, 68, 42, 75, 50, 30, 62, 45, 72, 38, 58, 25, 65, 48, 70, 33, 60, 40, 55, 78, 44, 52].map(
          (h, i) => (
            <Shimmer
              key={i}
              className="flex-1 rounded-t"
              style={{ height: `${h}%` }}
            />
          ),
        )}
      </div>
    </div>
  );
}

/* ── Tenant table skeleton ──────────────────────────────────── */

export function TenantTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 shadow-sm shadow-black/10 sm:p-6 space-y-3">
      <Shimmer className="h-4 w-32" />
      <div className="space-y-2">
        {Array.from({ length: rows }, (_, i) => (
          <Shimmer key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/* ── Tenant detail hero skeleton ────────────────────────────── */

export function TenantDetailHeroSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 shadow-sm shadow-black/10 sm:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Shimmer className="h-8 w-56" />
          <Shimmer className="h-3 w-40" />
        </div>
        <Shimmer className="h-6 w-20 rounded-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-2">
            <Shimmer className="h-3 w-16" />
            <Shimmer className="h-5 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Quota breakdown skeleton ───────────────────────────────── */

export function QuotaBreakdownSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 shadow-sm shadow-black/10 sm:p-6 space-y-4">
      <Shimmer className="h-4 w-36" />
      <div className="space-y-2">
        {Array.from({ length: rows }, (_, i) => (
          <Shimmer key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/* ── Usage summary skeleton ─────────────────────────────────── */

export function UsageSummarySkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 shadow-sm shadow-black/10 sm:p-6 space-y-4">
      <Shimmer className="h-4 w-32" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="rounded-lg border border-white/[0.04] bg-white/[0.015] p-4 space-y-3">
            <Shimmer className="h-3 w-24" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }, (_, j) => (
                <div key={j} className="space-y-1">
                  <Shimmer className="h-2.5 w-14" />
                  <Shimmer className="h-6 w-20" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Posture panel skeleton ─────────────────────────────────── */

export function PosturePanelSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 shadow-sm shadow-black/10 sm:p-6 space-y-4">
      <Shimmer className="h-4 w-40" />
      <div className="flex items-center gap-4">
        <Shimmer className="h-16 w-16 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Shimmer className="h-4 w-24" />
          <Shimmer className="h-3 w-48" />
        </div>
      </div>
      <Shimmer className="h-1.5 w-full rounded-full" />
      <div className="space-y-2 pt-2">
        <Shimmer className="h-3 w-28" />
        {Array.from({ length: 2 }, (_, i) => (
          <Shimmer key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

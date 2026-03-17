/* ────────────────────────────────────────────────────────────────
 *  TenantGrowthContext — operator growth drill-down panels
 *
 *  Composite component for the tenant detail page that renders:
 *  - Activation progress (lifecycle stage visualization)
 *  - Usage snapshot (protect / receipt / verify counts)
 *  - Source insight (dominant source, source mix)
 *  - Operator interpretation (next milestone, friction, priority)
 *
 *  All data derived from TenantActivationSnapshot fields.
 *  Operator-only, deterministic, no external dependencies.
 * ──────────────────────────────────────────────────────────── */

import Link from "next/link";
import type { TenantActivationSnapshot } from "@/lib/dashboard-client";
import type { TriageResult } from "@/lib/growth-triage";
import { triageTenant, SEGMENT_CONFIG, PRIORITY_CONFIG } from "@/lib/growth-triage";
import {
  interpretTenant,
  type TenantInterpretation,
  type ActivationProgress,
} from "@/lib/tenant-interpretation";
import { SectionExplainer } from "@/components/dashboard/section-explainer";

/* ── Helpers ──────────────────────────────────────────────── */

function compactNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "Never";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return iso ?? "Unknown";
  }
}

/* ── Activation Progress Bar ──────────────────────────────── */

const STAGES: { key: keyof ActivationProgress; label: string }[] = [
  { key: "onboarded", label: "Onboarded" },
  { key: "first_protect", label: "First Protect" },
  { key: "first_receipt", label: "First Receipt" },
  { key: "first_verify", label: "First Verify" },
  { key: "repeat_active", label: "Repeat Active" },
];

function ActivationProgressBar({ progress }: { progress: ActivationProgress }) {
  return (
    <div className="flex items-center gap-1">
      {STAGES.map((stage, i) => {
        const reached = progress[stage.key] as boolean;
        const isCurrent =
          reached &&
          (i === STAGES.length - 1 ||
            !(progress[STAGES[i + 1].key] as boolean));
        return (
          <div key={stage.key} className="flex items-center gap-1">
            {i > 0 && (
              <div
                className={`h-px w-4 sm:w-6 ${
                  reached ? "bg-primary-400/60" : "bg-white/10"
                }`}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold ${
                  isCurrent
                    ? "bg-primary-500/30 text-primary-300 ring-2 ring-primary-400/40"
                    : reached
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-white/5 text-slate-600"
                }`}
              >
                {reached ? "✓" : i + 1}
              </div>
              <span
                className={`text-[9px] font-medium leading-tight text-center max-w-[60px] ${
                  isCurrent
                    ? "text-primary-300"
                    : reached
                      ? "text-emerald-400/80"
                      : "text-slate-600"
                }`}
              >
                {stage.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Source Mix Bar ────────────────────────────────────────── */

const sourceColors: Record<string, string> = {
  cli: "bg-cyan-400",
  http: "bg-blue-400",
  python: "bg-yellow-400",
  typescript: "bg-indigo-400",
  openclaw: "bg-purple-400",
  unknown: "bg-slate-500",
};

function SourceMixBar({ mix }: { mix: Record<string, number> }) {
  const total = Object.values(mix).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const entries = Object.entries(mix)
    .sort(([, a], [, b]) => b - a)
    .map(([source, count]) => ({
      source,
      count,
      pct: Math.round((count / total) * 100),
    }));

  return (
    <div className="space-y-2">
      <div className="flex h-2 overflow-hidden rounded-full bg-white/5">
        {entries.map((e) => (
          <div
            key={e.source}
            className={`${sourceColors[e.source] ?? sourceColors.unknown} transition-all`}
            style={{ width: `${Math.max(e.pct, 2)}%` }}
            title={`${e.source}: ${e.pct}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {entries.map((e) => (
          <span key={e.source} className="flex items-center gap-1.5 text-[10px]">
            <span
              className={`inline-block h-2 w-2 rounded-full ${sourceColors[e.source] ?? sourceColors.unknown}`}
            />
            <span className="text-slate-400">{e.source}</span>
            <span className="font-mono text-slate-500">{e.pct}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Priority Dot ─────────────────────────────────────────── */

function PriorityDot({ priority }: { priority: "high" | "medium" | "low" }) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-block h-2 w-2 rounded-full ${cfg.dot}`}
        aria-hidden="true"
      />
      <span
        className={`text-[11px] font-semibold uppercase tracking-wider ${cfg.color}`}
      >
        {cfg.label}
      </span>
    </span>
  );
}

/* ── Segment Badge ────────────────────────────────────────── */

function SegmentBadge({ segment }: { segment: string }) {
  const cfg =
    SEGMENT_CONFIG[segment as keyof typeof SEGMENT_CONFIG] ?? {
      label: segment,
      color: "bg-white/5 text-slate-500",
      description: "",
    };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${cfg.color}`}
      title={cfg.description}
    >
      {cfg.label}
    </span>
  );
}

/* ── Interpretation Item ──────────────────────────────────── */

function InterpretationItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="dashboard-sub-panel px-4 py-3.5">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 text-base" aria-hidden="true">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-300">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────── */

type Props = {
  snapshot: TenantActivationSnapshot;
};

export function TenantGrowthContext({ snapshot }: Props) {
  const triage: TriageResult = triageTenant(snapshot);
  const interp: TenantInterpretation = interpretTenant(snapshot);
  const progress = interp.activation_progress;

  const protects = snapshot.protect_count ?? snapshot.requests_total;
  const receipts = snapshot.receipt_count ?? snapshot.receipts_written_total;
  const verifies = snapshot.verify_count ?? snapshot.receipts_verified_total;
  const dormant = snapshot.dormant_days ?? 0;
  const source = snapshot.dominant_source ?? "unknown";
  const mix = snapshot.source_mix ?? {};

  return (
    <div className="space-y-5">
      {/* ── Overview strip ─────────────────────────────────── */}
      <section aria-label="Growth overview">
        <div className="dashboard-panel p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-slate-100">
              Growth &amp; Follow-Up Context
            </h2>
            <div className="flex items-center gap-3">
              <PriorityDot priority={triage.priority} />
              <SegmentBadge segment={triage.segment} />
            </div>
          </div>
          <div className="gradient-divider mt-3.5" />

          {/* Current state summary */}
          <p className="mt-3.5 text-[12px] leading-relaxed text-slate-400">
            {interp.likely_current_state}
          </p>
        </div>
      </section>

      {/* ── Activation progress ────────────────────────────── */}
      <section aria-label="Activation progress">
        <div className="dashboard-panel p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-slate-100">
            Activation Progress
          </h2>
          <div className="gradient-divider mt-3.5" />
          <div className="mt-4 flex justify-center">
            <ActivationProgressBar progress={progress} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="dashboard-sub-panel px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Protects
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-slate-200">
                {compactNum(protects)}
              </p>
            </div>
            <div className="dashboard-sub-panel px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Receipts
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-slate-200">
                {compactNum(receipts)}
              </p>
            </div>
            <div className="dashboard-sub-panel px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Verifies
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-slate-200">
                {compactNum(verifies)}
              </p>
            </div>
            <div className="dashboard-sub-panel px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Last Seen
              </p>
              <p className="mt-1 text-sm font-medium text-slate-300">
                {relativeTime(snapshot.last_seen_at ?? snapshot.last_activity_ts)}
              </p>
            </div>
          </div>

          {/* Dormant / stalled indicators */}
          {(dormant > 0 || (snapshot.stalled_stage && snapshot.stalled_stage.length > 0)) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {dormant >= 14 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[10px] font-medium text-rose-400">
                  Dormant {dormant}d
                </span>
              )}
              {dormant >= 7 && dormant < 14 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-medium text-amber-400">
                  Inactive {dormant}d
                </span>
              )}
              {snapshot.stalled_stage && snapshot.stalled_stage.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-[10px] font-medium text-red-400">
                  Stalled at {snapshot.stalled_stage.replace(/_/g, " ")}
                </span>
              )}
              {snapshot.repeat_active_7d && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
                  Repeat Active (7d)
                </span>
              )}
            </div>
          )}
        </div>
        <SectionExplainer label="About activation progress">
          <p>
            Shows where this tenant is in the adoption lifecycle:
            onboarded → first protect → first receipt → first verify → repeat active.
          </p>
          <p>
            Dormant and stalled indicators appear when the tenant has not
            progressed or been active for extended periods.
          </p>
        </SectionExplainer>
      </section>

      {/* ── Source insight ──────────────────────────────────── */}
      <section aria-label="Source insight">
        <div className="dashboard-panel p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-slate-100">
            Source &amp; Attribution
          </h2>
          <div className="gradient-divider mt-3.5" />
          <div className="mt-3.5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Dominant Source
              </p>
              <span
                className={`mt-1.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  source === "unknown"
                    ? "bg-white/5 text-slate-500"
                    : "bg-primary-500/15 text-primary-300"
                }`}
              >
                {source}
              </span>
            </div>
            {Object.keys(mix).length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-2">
                  Source Mix
                </p>
                <SourceMixBar mix={mix} />
              </div>
            )}
          </div>
          {source === "unknown" && (
            <p className="mt-3 text-[10px] leading-relaxed text-amber-500/80">
              Attribution is best-effort. Unknown source means the integration
              path could not be identified from request metadata.
            </p>
          )}
        </div>
        <SectionExplainer label="About source attribution">
          <p>
            Source is inferred from request metadata (user-agent, endpoint
            patterns, SDK headers). Attribution is best-effort and may not
            reflect all integration paths.
          </p>
        </SectionExplainer>
      </section>

      {/* ── Operator interpretation ────────────────────────── */}
      <section aria-label="Operator interpretation">
        <div className="dashboard-panel p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-slate-100">
            Operator Interpretation
          </h2>
          <div className="gradient-divider mt-3.5" />
          <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
            <InterpretationItem
              icon="🎯"
              label="Likely Next Milestone"
              value={interp.likely_next_milestone}
            />
            <InterpretationItem
              icon="⚠️"
              label="Likely Friction Point"
              value={interp.likely_friction_point}
            />
            <InterpretationItem
              icon="📋"
              label="Why Prioritized"
              value={interp.why_prioritized}
            />
            <InterpretationItem
              icon="📊"
              label="Triage Segment"
              value={
                SEGMENT_CONFIG[triage.segment as keyof typeof SEGMENT_CONFIG]
                  ?.description ?? triage.segment
              }
            />
          </div>
        </div>
        <SectionExplainer label="About operator interpretation">
          <p>
            All interpretations are deterministic and rule-based — derived from
            activation stage, stall duration, receipt/verify completion, and
            source attribution. No AI or statistical models are used.
          </p>
          <p>
            These are operational hints to help focus follow-up. They indicate
            what is likely happening, not what is guaranteed.
          </p>
        </SectionExplainer>
      </section>

      {/* ── Navigation ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-slate-300"
        >
          ← Dashboard Overview
        </Link>
        <Link
          href="/dashboard#growth-triage"
          className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-slate-300"
        >
          ← Back to Triage Queue
        </Link>
      </div>

      {/* ── Disclaimer ─────────────────────────────────────── */}
      <p className="text-[9px] leading-relaxed text-slate-600">
        Growth context is derived from deterministic rules using adoption
        snapshot data. All interpretations are operator-facing guidance,
        not tenant commitments. Source attribution is best-effort.
      </p>
    </div>
  );
}

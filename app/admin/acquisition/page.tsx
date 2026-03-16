import {
  getAcquisitionFunnelSnapshot,
  type AcquisitionRecentRow,
} from "@/lib/db";
import {
  enrichWithGuidance,
  computeActionSummary,
  computePrioritySummary,
  ACTION_CONFIG,
  PRIORITY_CONFIG,
  type AcquisitionRowWithGuidance,
  type FollowUpAction,
  type FollowUpPriority,
} from "@/lib/acquisition-followup";
import {
  PLAYBOOK_MAP,
  type PlaybookEntry,
} from "@/lib/acquisition-playbook";
import {
  enrichWithProgress,
  computeProgressStateSummary,
  computeProgressSignalSummary,
  PROGRESS_STATE_CONFIG,
  PROGRESS_SIGNAL_CONFIG,
  type ProgressState,
  type ProgressSignal,
} from "@/lib/acquisition-progress";
import { AdminDegradedState } from "@/components/dashboard/admin-degraded-state";
import { logSecurityEvent } from "@/lib/security-log";

/* ────────────────────────────────────────────────────────────────
 *  /admin/acquisition — Operator Acquisition Funnel
 *
 *  Internal-only view of top-of-funnel builder acquisition signals.
 *  Shows signup volume, time-windowed trends, source/UTM breakdowns,
 *  pipeline progression, recent submissions with activation badges,
 *  lead quality distribution, stall-state funnel, and source→activation
 *  cross-tabulations.
 *
 *  Gated behind admin session. Never shown to public users.
 * ──────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminAcquisitionPage() {
  let degraded = false;
  let data: Awaited<ReturnType<typeof getAcquisitionFunnelSnapshot>> | null = null;
  try {
    data = await getAcquisitionFunnelSnapshot();
  } catch {
    logSecurityEvent("admin_page_degraded", {
      meta: { page: "acquisition", reason: "db_unavailable" },
    });
    degraded = true;
  }

  /* ── Derive follow-up guidance for each recent lead ──── */
  const guidedRows = data ? enrichWithGuidance(data.recent) : [];
  const actionSummary = computeActionSummary(guidedRows);
  const prioritySummary = computePrioritySummary(guidedRows);

  /* ── Derive progress states for each recent lead ──── */
  const progressRows = data ? enrichWithProgress(data.recent) : [];
  const progressStateSummary = computeProgressStateSummary(progressRows);
  const progressSignalSummary = computeProgressSignalSummary(progressRows);

  /* Build a progress lookup by email for table rendering */
  const progressByEmail = new Map(
    progressRows.map((r) => [r.email, r.progress]),
  );

  return (
    <div className="min-h-screen bg-neutral-950 p-6 text-slate-100 md:p-10">
      {/* ── Header + nav ──────────────────────────────────── */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Acquisition Funnel
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Top-of-funnel builder interest, lead quality, activation linkage
            &amp; stall-state visibility — operator only
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NavLink href="/admin/waitlist" label="Waitlist" />
          <NavLink href="/admin/metrics" label="Metrics" />
          <NavLink href="/admin/keys" label="API Keys" />
          <NavLink href="/dashboard" label="Dashboard" />
          <form method="POST" action="/admin/logout">
            <button
              type="submit"
              className="rounded border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
            >
              Logout
            </button>
          </form>
        </div>
      </div>

      {degraded || !data ? (
        <AdminDegradedState
          title="Acquisition Funnel"
          description="Acquisition data could not be loaded right now."
        />
      ) : (
        <>
      {/* ── KPI cards ─────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Total signups" value={data.total_signups} />
        <KpiCard label="Last 7d" value={data.signups_7d} accent />
        <KpiCard label="Last 30d" value={data.signups_30d} />
        <KpiCard
          label="Design partners"
          value={data.design_partner_count}
        />
        <KpiCard label="DPs (7d)" value={data.design_partners_7d} accent />
        <KpiCard label="DPs (30d)" value={data.design_partners_30d} />
      </div>

      {/* ── Pipeline funnel ───────────────────────────────── */}
      <div className="mb-8">
        <SectionHeading>Pipeline Progression</SectionHeading>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <FunnelStep label="New" value={data.by_status.new} color="bg-emerald-500/20 text-emerald-300" />
          <FunnelStep label="Contacted" value={data.by_status.contacted} color="bg-sky-500/20 text-sky-300" />
          <FunnelStep label="Qualified" value={data.by_status.qualified} color="bg-violet-500/20 text-violet-300" />
          <FunnelStep label="Closed" value={data.by_status.closed} color="bg-neutral-500/20 text-neutral-400" />
        </div>
      </div>

      {/* ── Stall-state funnel ────────────────────────────── */}
      <div className="mb-8">
        <SectionHeading>Stall-State Funnel</SectionHeading>
        <p className="mt-1 text-[10px] text-slate-600">
          Where leads stall between signup and product activation.
          Email-based linkage — partial but directional.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StallCard
            label="No API key yet"
            value={data.stalled_before_api_key}
            total={data.total_signups}
            color="text-red-400"
          />
          <StallCard
            label="API key, no portal"
            value={data.stalled_before_portal}
            total={data.total_signups}
            color="text-amber-400"
          />
          <StallCard
            label="Have API key"
            value={data.signups_with_api_key}
            total={data.total_signups}
            color="text-emerald-400"
          />
          <StallCard
            label="Portal active"
            value={data.signups_with_portal_token}
            total={data.total_signups}
            color="text-cyan-400"
          />
        </div>
      </div>

      {/* ── Progress state summary ─────────────────────────── */}
      {progressRows.length > 0 && (
        <div className="mb-8">
          <SectionHeading>Progress Visibility</SectionHeading>
          <p className="mt-1 text-[10px] text-slate-600">
            Current progress state of recent leads. Derived from API key and
            portal token status. Stall detection uses signup age (&gt;7 days
            without advancing). Limitation: no timestamps for when keys/portal
            were acquired — &quot;progressing&quot; reflects current state, not recency.
          </p>

          {/* Progress state breakdown (milestone-based) */}
          <div className="mt-3 grid grid-cols-3 gap-3">
            {progressStateSummary.map((ps) => (
              <div
                key={ps.state}
                className="rounded-lg border border-white/10 bg-neutral-900/60 px-4 py-3 text-center"
              >
                <span className="text-lg">{ps.icon}</span>
                <p className="mt-1 text-xl font-semibold text-slate-100">{ps.count}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                  {ps.label}
                </p>
              </div>
            ))}
          </div>

          {/* Progress signal breakdown (temporal context) */}
          <div className="mt-3 flex flex-wrap gap-2">
            {progressSignalSummary.map((ps) => (
              <span
                key={ps.signal}
                className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-xs ${ps.color}`}
              >
                <span className="font-semibold">{ps.count}</span>
                <span className="text-slate-400">{ps.label}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Follow-up guidance summary ────────────────────── */}
      {guidedRows.length > 0 && (
        <div className="mb-8">
          <SectionHeading>Operator Follow-Up Guidance</SectionHeading>
          <p className="mt-1 text-[10px] text-slate-600">
            Deterministic next-action recommendations for recent leads.
            Based on API key status, portal status, build stage, and intent.
          </p>

          {/* Priority breakdown */}
          <div className="mt-3 flex flex-wrap gap-2">
            {prioritySummary.map((ps) => (
              <span
                key={ps.priority}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs"
              >
                <span className={`inline-block h-2 w-2 rounded-full ${ps.color}`} />
                <span className="font-semibold text-slate-200">{ps.count}</span>
                <span className="text-slate-400">{ps.label}</span>
              </span>
            ))}
          </div>

          {/* Action breakdown */}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {actionSummary.map((as) => (
              <div
                key={as.action}
                className="rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2"
              >
                <div className="flex items-center gap-1.5">
                  <span className={`inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${as.color}`}>
                    {as.label}
                  </span>
                </div>
                <p className="mt-1 text-lg font-semibold text-slate-100">{as.count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Operator playbook reference ───────────────────── */}
      <div className="mb-8">
        <SectionHeading>Operator Follow-Up Playbook</SectionHeading>
        <p className="mt-1 text-[10px] text-slate-600">
          Quick reference: each next action mapped to the recommended resource(s) to send.
          Internal-only — not shown to leads.
        </p>
        <div className="mt-3 overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Next Action</th>
                <th className="px-4 py-3">What It Means</th>
                <th className="px-4 py-3">Primary Link</th>
                <th className="px-4 py-3">Secondary Link</th>
                <th className="px-4 py-3">Note</th>
              </tr>
            </thead>
            <tbody>
              {(Object.entries(PLAYBOOK_MAP) as [FollowUpAction, PlaybookEntry][]).map(
                ([action, entry]) => (
                  <tr
                    key={action}
                    className="border-b border-white/5 last:border-b-0"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${ACTION_CONFIG[action].color}`}
                      >
                        {ACTION_CONFIG[action].icon} {ACTION_CONFIG[action].label}
                      </span>
                    </td>
                    <td className="max-w-[200px] px-4 py-3 text-xs text-slate-400">
                      {entry.description}
                    </td>
                    <td className="px-4 py-3">
                      {entry.primary ? (
                        <a
                          href={entry.primary.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded bg-primary-500/10 px-2 py-0.5 text-xs font-medium text-primary-300 transition hover:bg-primary-500/20"
                        >
                          {entry.primary.label}
                          <span className="text-[9px] text-slate-500">{entry.primary.href}</span>
                        </a>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {entry.secondary ? (
                        <a
                          href={entry.secondary.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
                        >
                          {entry.secondary.label}
                          <span className="text-[9px] text-slate-500">{entry.secondary.href}</span>
                        </a>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {entry.note ?? "—"}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Activation linkage ────────────────────────────── */}
      <div className="mb-8">
        <SectionHeading>Acquisition → Activation Linkage</SectionHeading>
        <p className="mt-1 text-[10px] text-slate-600">
          Signups whose email matches an issued API key or active portal
          token. Identity linkage is email-based and partial — not all
          ATF tenants enter via the waitlist.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <LinkageCard
            label="Total signups"
            value={data.total_signups}
          />
          <LinkageCard
            label="Have API key"
            value={data.signups_with_api_key}
            pct={pct(data.signups_with_api_key, data.total_signups)}
          />
          <LinkageCard
            label="Active portal token"
            value={data.signups_with_portal_token}
            pct={pct(data.signups_with_portal_token, data.total_signups)}
          />
          <LinkageCard
            label="Qualified in pipeline"
            value={data.by_status.qualified}
            pct={pct(data.by_status.qualified, data.total_signups)}
          />
        </div>
      </div>

      {/* ── Lead quality distribution ─────────────────────── */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Build stage distribution */}
        {data.by_build_stage.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-white/10">
            <div className="border-b border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200">
              Build Stage Distribution
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3 text-right">Count</th>
                  <th className="px-4 py-3 text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {data.by_build_stage.map((row) => (
                  <tr key={row.stage} className="border-b border-white/5 last:border-b-0">
                    <td className="px-4 py-3 text-slate-200">
                      <BuildStageBadge stage={row.stage} />
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-100">{row.count}</td>
                    <td className="px-4 py-3 text-right text-slate-400">{pct(row.count, data.total_signups) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Integration interest distribution */}
        {data.by_integration_interest.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-white/10">
            <div className="border-b border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200">
              Integration Interests
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">Integration</th>
                  <th className="px-4 py-3 text-right">Count</th>
                </tr>
              </thead>
              <tbody>
                {data.by_integration_interest.map((row) => (
                  <tr key={row.interest} className="border-b border-white/5 last:border-b-0">
                    <td className="px-4 py-3 text-slate-200">{row.interest}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-100">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Build stage → activation cross-tab ────────────── */}
      {data.build_stage_activation.length > 0 && (
        <div className="mb-8">
          <SectionHeading>Build Stage → Activation</SectionHeading>
          <p className="mt-1 text-[10px] text-slate-600">
            Are in-production builders converting better than idea-stage builders?
          </p>
          <div className="mt-3 overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">Build Stage</th>
                  <th className="px-4 py-3 text-right">Signups</th>
                  <th className="px-4 py-3 text-right">With API Key</th>
                  <th className="px-4 py-3 text-right">With Portal</th>
                  <th className="px-4 py-3 text-right">API Key %</th>
                </tr>
              </thead>
              <tbody>
                {data.build_stage_activation.map((row) => (
                  <tr key={row.stage} className="border-b border-white/5 last:border-b-0">
                    <td className="px-4 py-3 text-slate-200">
                      <BuildStageBadge stage={row.stage} />
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-100">{row.total}</td>
                    <td className="px-4 py-3 text-right text-slate-200">{row.with_api_key}</td>
                    <td className="px-4 py-3 text-right text-slate-200">{row.with_portal}</td>
                    <td className="px-4 py-3 text-right text-slate-400">{pct(row.with_api_key, row.total) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Source → activation cross-tab ─────────────────── */}
      {data.source_activation.length > 0 && (
        <div className="mb-8">
          <SectionHeading>Source → Activation</SectionHeading>
          <p className="mt-1 text-[10px] text-slate-600">
            Which signup sources produce the best downstream activation?
          </p>
          <div className="mt-3 overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3 text-right">Signups</th>
                  <th className="px-4 py-3 text-right">With API Key</th>
                  <th className="px-4 py-3 text-right">With Portal</th>
                  <th className="px-4 py-3 text-right">API Key %</th>
                </tr>
              </thead>
              <tbody>
                {data.source_activation.map((row) => (
                  <tr key={row.source} className="border-b border-white/5 last:border-b-0">
                    <td className="px-4 py-3 text-slate-200">{row.source}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-100">{row.total}</td>
                    <td className="px-4 py-3 text-right text-slate-200">{row.with_api_key}</td>
                    <td className="px-4 py-3 text-right text-slate-200">{row.with_portal}</td>
                    <td className="px-4 py-3 text-right text-slate-400">{pct(row.with_api_key, row.total) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Source breakdowns (3-col) ─────────────────────── */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <RankTable
          title="Entry Path (source)"
          emptyLabel="No source data yet."
          rows={data.top_sources.map((r) => ({
            key: r.source,
            count: r.count,
          }))}
        />
        <RankTable
          title="UTM Source"
          emptyLabel="No UTM source data yet."
          rows={data.top_utm_sources.map((r) => ({
            key: r.source,
            count: r.count,
          }))}
        />
        <RankTable
          title="UTM Campaign"
          emptyLabel="No campaign data yet."
          rows={data.top_campaigns.map((r) => ({
            key: r.campaign,
            count: r.count,
          }))}
        />
      </div>

      {/* ── Recent submissions (enriched with follow-up guidance) ── */}
      <div className="mb-8">
        <SectionHeading>Recent Submissions — With Follow-Up Guidance</SectionHeading>
        <p className="mt-1 text-[10px] text-slate-600">
          Last 30 signups sorted by follow-up priority. Each row shows a
          deterministic recommended next action based on API key status,
          portal access, build stage, and intent.
        </p>
        <RecentTable rows={guidedRows} progressByEmail={progressByEmail} />
      </div>

      {/* ── Interpretation note ───────────────────────────── */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 text-[10px] leading-relaxed text-slate-600">
        <strong className="text-slate-500">Interpretation notes:</strong>{" "}
        Activation linkage is email-based. Builders who sign up on the
        site and later register an ATF API key with the same email are
        counted as linked. Not all ATF tenants enter via the waitlist,
        and not all waitlist entries result in ATF activation. Stall-state
        counts are derived from the same email-based linkage. Build stage
        and integration interest are self-reported by the applicant.
        Source → activation cross-tabs help identify which channels produce
        the best downstream outcomes, but sample sizes may be small.
        Vercel Analytics events (builder page views, tracked link clicks)
        are not joined here — they live in the Vercel dashboard.
      </div>
        </>
      )}
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────── */

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="rounded border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
    >
      {label}
    </a>
  );
}

function KpiCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 ${
        accent
          ? "border-primary-300/20 bg-primary-500/[0.06]"
          : "border-white/10 bg-white/5"
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function FunnelStep({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-neutral-900/60 px-4 py-3 text-center">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-100">{value}</p>
      <span
        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${color}`}
      >
        {label}
      </span>
    </div>
  );
}

function StallCard({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-neutral-900/60 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className={`text-xl font-semibold ${color}`}>{value}</span>
        {total > 0 && (
          <span className="text-xs text-slate-500">
            {((value / total) * 100).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

function LinkageCard({
  label,
  value,
  pct: pctVal,
}: {
  label: string;
  value: number;
  pct?: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-neutral-900/60 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-xl font-semibold text-slate-100">{value}</span>
        {pctVal && (
          <span className="text-xs text-slate-500">{pctVal}</span>
        )}
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
      {children}
    </h2>
  );
}

const BUILD_STAGE_COLORS: Record<string, string> = {
  idea: "bg-slate-500/20 text-slate-400",
  prototype: "bg-blue-500/20 text-blue-400",
  in_production: "bg-emerald-500/20 text-emerald-300",
  unknown: "bg-white/5 text-slate-500",
};

function BuildStageBadge({ stage }: { stage: string }) {
  const color = BUILD_STAGE_COLORS[stage] ?? BUILD_STAGE_COLORS.unknown;
  const display = stage === "in_production" ? "production" : stage;
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${color}`}>
      {display}
    </span>
  );
}

function RankTable({
  title,
  rows,
  emptyLabel,
}: {
  title: string;
  rows: Array<{ key: string; count: number }>;
  emptyLabel: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      <div className="border-b border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200">
        {title}
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-5 text-sm text-slate-400">{emptyLabel}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3 text-right">Count</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.key}
                className="border-b border-white/5 last:border-b-0"
              >
                <td className="px-4 py-3 text-slate-200">{row.key}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-100">
                  {row.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ActivationBadges({ row }: { row: AcquisitionRecentRow }) {
  return (
    <div className="flex flex-wrap gap-1">
      {row.has_api_key && (
        <span className="inline-block rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300">
          API key
        </span>
      )}
      {row.has_portal_token && (
        <span className="inline-block rounded-full bg-cyan-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-300">
          Portal
        </span>
      )}
      {!row.has_api_key && !row.has_portal_token && (
        <span className="inline-block rounded-full bg-red-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-red-400/70">
          Pre-activation
        </span>
      )}
    </div>
  );
}

function RecentTable({
  rows,
  progressByEmail,
}: {
  rows: AcquisitionRowWithGuidance[];
  progressByEmail: Map<string, { state: ProgressState; signal: ProgressSignal }>;
}) {
  if (rows.length === 0) {
    return <p className="mt-2 text-sm text-slate-400">No submissions yet.</p>;
  }

  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
            <th className="px-4 py-3">Progress</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Next Action</th>
            <th className="px-4 py-3">Recommended Links</th>
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Intent</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Build Stage</th>
            <th className="px-4 py-3">Activation</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-white/5 last:border-b-0"
            >
              <td className="px-4 py-3">
                <ProgressBadge email={row.email} progressByEmail={progressByEmail} />
              </td>
              <td className="px-4 py-3">
                <PriorityChip priority={row.guidance.priority} />
              </td>
              <td className="px-4 py-3">
                <NextActionBadge action={row.guidance.action} reason={row.guidance.reason} />
              </td>
              <td className="px-4 py-3">
                <PlaybookLinks action={row.guidance.action} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                {fmtDate(row.created_at)}
              </td>
              <td className="px-4 py-3 text-slate-200">
                {maskEmail(row.email)}
              </td>
              <td className="px-4 py-3">
                {row.intent === "design_partner" ? (
                  <span className="inline-block rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300">
                    DP
                  </span>
                ) : (
                  <span className="inline-block rounded-full bg-sky-500/20 px-2 py-0.5 text-xs font-semibold text-sky-300">
                    Std
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-slate-400">
                {row.source ?? "—"}
                {row.utm_source && (
                  <span className="ml-1 text-[9px] text-slate-600">
                    ({row.utm_source})
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                {row.build_stage ? (
                  <BuildStageBadge stage={row.build_stage} />
                ) : (
                  <span className="text-slate-600">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <ActivationBadges row={row} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProgressBadge({
  email,
  progressByEmail,
}: {
  email: string;
  progressByEmail: Map<string, { state: ProgressState; signal: ProgressSignal }>;
}) {
  const info = progressByEmail.get(email);
  if (!info) {
    return <span className="text-slate-600">—</span>;
  }
  const stateCfg = PROGRESS_STATE_CONFIG[info.state];
  const signalCfg = PROGRESS_SIGNAL_CONFIG[info.signal];
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={`inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${stateCfg.color}`}
      >
        {stateCfg.icon} {stateCfg.label}
      </span>
      <span
        className={`inline-block rounded-full px-1.5 py-0.5 text-[9px] ${signalCfg.color}`}
      >
        {signalCfg.shortLabel}
      </span>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-emerald-500/20 text-emerald-300",
  contacted: "bg-sky-500/20 text-sky-300",
  qualified: "bg-violet-500/20 text-violet-300",
  closed: "bg-neutral-500/20 text-neutral-400",
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? STATUS_COLORS.new;
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}
    >
      {status}
    </span>
  );
}

function PriorityChip({ priority }: { priority: FollowUpPriority }) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-block h-2 w-2 rounded-full ${cfg.dot}`} />
      <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
    </span>
  );
}

function NextActionBadge({
  action,
  reason,
}: {
  action: FollowUpAction;
  reason: string;
}) {
  const cfg = ACTION_CONFIG[action];
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.color}`}
      title={reason}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
}

function PlaybookLinks({ action }: { action: FollowUpAction }) {
  const entry = PLAYBOOK_MAP[action];
  if (!entry.primary && !entry.secondary) {
    return <span className="text-[10px] text-slate-600">{entry.note ?? "—"}</span>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1">
      {entry.primary && (
        <a
          href={entry.primary.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 rounded bg-primary-500/10 px-1.5 py-0.5 text-[10px] font-medium text-primary-300 transition hover:bg-primary-500/20"
          title={entry.primary.href}
        >
          {entry.primary.label}
        </a>
      )}
      {entry.secondary && (
        <a
          href={entry.secondary.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 transition hover:bg-white/10"
          title={entry.secondary.href}
        >
          {entry.secondary.label}
        </a>
      )}
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────── */

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, 3);
  return `${visible}***@${domain}`;
}

function pct(numerator: number, denominator: number): string | undefined {
  if (denominator === 0) return undefined;
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

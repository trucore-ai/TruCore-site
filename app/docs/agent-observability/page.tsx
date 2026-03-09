import type { Metadata } from "next";
import { HeadingAnchor } from "@/components/heading-anchor";

export const metadata: Metadata = {
  title: "Agent Observability Endpoints | TruCore Docs",
  description:
    "Machine-readable JSON endpoints for AI agent consumption. Dashboard snapshot, tenant detail, schema versioning, freshness, and provenance semantics.",
  robots: { index: false, follow: false },
};

/* ── Inline code component (avoids extra dependency) ──────── */
function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[13px] text-slate-300">
      {children}
    </code>
  );
}

export default function AgentObservabilityPage() {
  return (
    <article className="prose-invert mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-0">
      <h1 className="text-2xl font-bold tracking-tight text-slate-100" id="agent-observability">
        Agent Observability Endpoints
      </h1>

      <p className="mt-4 text-sm leading-relaxed text-slate-400">
        TruCore exposes two machine-readable JSON endpoints derived from the
        same shared logic that powers the human-facing operator dashboard.
        These endpoints are designed for OpenClaw and other AI agents to
        consume directly, without scraping HTML or parsing React-rendered UI.
      </p>

      {/* ── Endpoints ──────────────────────────────────────── */}
      <HeadingAnchor id="endpoints" className="mt-10">
        Endpoints
      </HeadingAnchor>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead>
            <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
              <th className="pb-2 pr-4">Path</th>
              <th className="pb-2 pr-4">Method</th>
              <th className="pb-2">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <tr>
              <td className="py-2 pr-4"><Code>/api/agent/dashboard</Code></td>
              <td className="py-2 pr-4">GET</td>
              <td className="py-2">Full dashboard snapshot: summary, attention queue, top changes, health, enforcement, trends, KPIs, tenants overview.</td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><Code>/api/agent/tenant?id=TENANT_ID</Code></td>
              <td className="py-2 pr-4">GET</td>
              <td className="py-2">Single tenant detail: operator summary, usage, quotas, posture, warnings, metadata.</td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><Code>/api/agent/stream</Code></td>
              <td className="py-2 pr-4">GET</td>
              <td className="py-2">Server-Sent Events stream: real-time observability signals. Emits granular events when dashboard state changes.</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Schema versioning ──────────────────────────────── */}
      <HeadingAnchor id="schema-versioning" className="mt-10">
        Schema Versioning
      </HeadingAnchor>

      <p className="mt-3 text-sm text-slate-400">
        Every response includes a <Code>schema_version</Code> field (currently{" "}
        <Code>1.1.0</Code>). Additive fields are non-breaking. The version is
        bumped only for breaking changes to field names, types, or removal of
        existing fields.
      </p>

      {/* ── Dashboard snapshot ─────────────────────────────── */}
      <HeadingAnchor id="dashboard-snapshot" className="mt-10">
        Dashboard Snapshot Shape
      </HeadingAnchor>

      <p className="mt-3 text-sm text-slate-400">
        <Code>GET /api/agent/dashboard</Code> returns the following top-level
        structure:
      </p>

      <pre className="mt-4 overflow-x-auto rounded-lg bg-white/[0.03] p-4 text-xs leading-relaxed text-slate-300">
{`{
  "schema_version": "1.1.0",
  "generated_at": "ISO-8601 timestamp",
  "polling_interval_seconds": 5,
  "freshness": { ... },
  "summary": {
    "priority_level": "normal | informational | attention | critical",
    "priority_label": "All Clear | Informational | Review Recommended | Action Required",
    "signals": [ { "label", "value", "level", "hint?", "delta?", "evidence?" } ]
  },
  "attention_queue": [ { "title", "reason", "level", "note?", "basis?", "target?" } ],
  "top_changes": [ { "title", "direction", "detail", "target?" } ],
  "health": { "status", "panel_status", "checks_*", "version", ... } | { "available": false, "reason" },
  "enforcement": { "total", "intensity", "categories", ... } | { "available": false, "reason" },
  "trends": { "request_pace", "enforcement_presence", "receipt_pace", "counters", ... } | { "available": false, "reason" },
  "kpis": [ { "label", "value", "unit?", "trend?" } ] | { "available": false, "reason" },
  "tenants_overview": { "total", "active", "suspended", "requires_review", ... } | { "available": false, "reason" },
  "automation": {
    "requires_review": true | false,
    "is_idle": true | false,
    "is_degraded": true | false,
    "is_offline": true | false,
    "has_enforcement_activity": true | false,
    "has_recent_activity": true | false,
    "has_persistent_warning": true | false
  }
}`}
      </pre>

      {/* ── Tenant detail ──────────────────────────────────── */}
      <HeadingAnchor id="tenant-detail" className="mt-10">
        Tenant Detail Shape
      </HeadingAnchor>

      <p className="mt-3 text-sm text-slate-400">
        <Code>GET /api/agent/tenant?id=TENANT_ID</Code> returns:
      </p>

      <pre className="mt-4 overflow-x-auto rounded-lg bg-white/[0.03] p-4 text-xs leading-relaxed text-slate-300">
{`{
  "schema_version": "1.1.0",
  "generated_at": "ISO-8601",
  "freshness": { ... },
  "tenant": { "id", "name", "status", "plan_tier", "recency", "recency_label", ... },
  "operator_summary": { "priority_level", "priority_label", "signals": [...] },
  "usage": {
    "period_24h": { "requests", "enforcements", "blocks", "avg_latency_ms" },
    "period_7d": { ... },
    "request_delta": "increasing | decreasing | unchanged | ...",
    "enforcement_delta": "..."
  },
  "quotas": { "entries": [...], "any_pressure": true | false },
  "posture": { "score", "label", "panel_status", "warnings": [...], "evidence?" },
  "metadata": { ... } | null,
  "automation": {
    "requires_review": true | false,
    "is_suspended": true | false,
    "has_quota_pressure": true | false,
    "has_posture_warnings": true | false,
    "has_enforcement_activity": true | false,
    "is_idle": true | false
  }
}`}
      </pre>

      {/* ── Freshness semantics ────────────────────────────── */}
      <HeadingAnchor id="freshness" className="mt-10">
        Freshness Semantics
      </HeadingAnchor>

      <p className="mt-3 text-sm text-slate-400">
        Each section includes a <Code>freshness</Code> envelope describing
        signal currency and origin:
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead>
            <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
              <th className="pb-2 pr-4">Field</th>
              <th className="pb-2">Values</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <tr>
              <td className="py-2 pr-4"><Code>freshness</Code></td>
              <td className="py-2"><Code>fresh</Code>, <Code>delayed</Code>, <Code>stale</Code>, <Code>unavailable</Code></td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><Code>provenance</Code></td>
              <td className="py-2"><Code>direct</Code>, <Code>derived</Code>, <Code>capability-gated</Code>, <Code>not-emitted</Code></td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><Code>generated_at</Code></td>
              <td className="py-2">ISO-8601 timestamp of response generation</td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><Code>polling_interval_seconds</Code></td>
              <td className="py-2">5 (matches live UI polling cadence)</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Provenance ─────────────────────────────────────── */}
      <HeadingAnchor id="provenance" className="mt-10">
        Provenance Semantics
      </HeadingAnchor>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead>
            <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
              <th className="pb-2 pr-4">Value</th>
              <th className="pb-2">Meaning</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <tr>
              <td className="py-2 pr-4"><Code>direct</Code></td>
              <td className="py-2">Reported directly by the active service instance</td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><Code>derived</Code></td>
              <td className="py-2">Computed from current interval counters and service state</td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><Code>capability-gated</Code></td>
              <td className="py-2">Requires deployment configuration not present in current environment</td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><Code>not-emitted</Code></td>
              <td className="py-2">Endpoint exists but is not returning data in this deployment</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Capability boundaries ──────────────────────────── */}
      <HeadingAnchor id="capability-boundaries" className="mt-10">
        Capability Boundaries
      </HeadingAnchor>

      <p className="mt-3 text-sm text-slate-400">
        When a section is unavailable (endpoint unreachable, signal not emitted,
        or capability not configured), the response returns a structured
        boundary object instead of an ambiguous null:
      </p>

      <pre className="mt-4 overflow-x-auto rounded-lg bg-white/[0.03] p-4 text-xs leading-relaxed text-slate-300">
{`{ "available": false, "reason": "Not available in dashboard summary" }`}
      </pre>

      <p className="mt-3 text-sm text-slate-400">
        Bots should check for the <Code>available</Code> field to distinguish
        between a section with data and a capability boundary.
      </p>

      {/* ── Attention levels ───────────────────────────────── */}
      <HeadingAnchor id="attention-levels" className="mt-10">
        Attention Levels
      </HeadingAnchor>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead>
            <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
              <th className="pb-2 pr-4">Level</th>
              <th className="pb-2">Meaning</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <tr>
              <td className="py-2 pr-4"><Code>normal</Code></td>
              <td className="py-2">Healthy, no action needed</td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><Code>informational</Code></td>
              <td className="py-2">Ambient context, safely ignorable</td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><Code>attention</Code></td>
              <td className="py-2">Warrants review, non-blocking</td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><Code>critical</Code></td>
              <td className="py-2">Needs operator action now</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Trend directions ───────────────────────────────── */}
      <HeadingAnchor id="trend-directions" className="mt-10">
        Trend Directions
      </HeadingAnchor>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead>
            <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
              <th className="pb-2 pr-4">Direction</th>
              <th className="pb-2">Meaning</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <tr><td className="py-2 pr-4"><Code>increasing</Code></td><td className="py-2">Current greater than prior by meaningful margin</td></tr>
            <tr><td className="py-2 pr-4"><Code>decreasing</Code></td><td className="py-2">Current less than prior by meaningful margin</td></tr>
            <tr><td className="py-2 pr-4"><Code>unchanged</Code></td><td className="py-2">No material difference detected</td></tr>
            <tr><td className="py-2 pr-4"><Code>newly-active</Code></td><td className="py-2">Was zero or absent, now present</td></tr>
            <tr><td className="py-2 pr-4"><Code>persistent</Code></td><td className="py-2">Active across multiple intervals</td></tr>
            <tr><td className="py-2 pr-4"><Code>unavailable</Code></td><td className="py-2">Insufficient data for comparison</td></tr>
          </tbody>
        </table>
      </div>

      {/* ── Machine contract reference ─────────────────────── */}
      <HeadingAnchor id="machine-contract" className="mt-10">
        Machine Contract Reference
      </HeadingAnchor>

      <p className="mt-3 text-sm text-slate-400">
        The agent contract separates <strong>canonical machine fields</strong> (stable
        enums, booleans, and numeric values) from <strong>display convenience
        fields</strong> (human-readable labels that may change wording). Bots
        should always key decisions on canonical fields.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead>
            <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
              <th className="pb-2 pr-4">Canonical (machine-safe)</th>
              <th className="pb-2 pr-4">Display (convenience)</th>
              <th className="pb-2">Values</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <tr>
              <td className="py-2 pr-4"><Code>summary.priority_level</Code></td>
              <td className="py-2 pr-4"><Code>summary.priority_label</Code></td>
              <td className="py-2"><Code>normal</Code>, <Code>informational</Code>, <Code>attention</Code>, <Code>critical</Code></td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><Code>health.panel_status</Code></td>
              <td className="py-2 pr-4"><Code>health.status</Code> (upstream string)</td>
              <td className="py-2"><Code>stable</Code>, <Code>review</Code>, <Code>idle</Code>, <Code>reduced</Code>, <Code>degraded</Code>, <Code>offline</Code></td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><Code>enforcement.intensity</Code></td>
              <td className="py-2 pr-4"><Code>enforcement.intensity_label</Code></td>
              <td className="py-2"><Code>idle</Code>, <Code>background</Code>, <Code>elevated</Code>, <Code>concentrated</Code></td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><Code>trends.request_pace</Code></td>
              <td className="py-2 pr-4"><Code>trends.request_pace_label</Code></td>
              <td className="py-2">See Trend Directions above</td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><Code>tenant.recency</Code></td>
              <td className="py-2 pr-4"><Code>tenant.recency_label</Code></td>
              <td className="py-2"><Code>current</Code>, <Code>recent</Code>, <Code>stale</Code>, <Code>idle</Code></td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><Code>freshness.freshness</Code></td>
              <td className="py-2 pr-4"><Code>freshness.provenance_label</Code></td>
              <td className="py-2"><Code>fresh</Code>, <Code>delayed</Code>, <Code>stale</Code>, <Code>unavailable</Code></td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><Code>freshness.provenance</Code></td>
              <td className="py-2 pr-4"><Code>freshness.provenance_label</Code></td>
              <td className="py-2"><Code>direct</Code>, <Code>derived</Code>, <Code>capability-gated</Code>, <Code>not-emitted</Code></td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><Code>posture.panel_status</Code></td>
              <td className="py-2 pr-4"><Code>posture.label</Code></td>
              <td className="py-2"><Code>stable</Code>, <Code>review</Code>, <Code>degraded</Code></td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><Code>attention_queue[].target</Code></td>
              <td className="py-2 pr-4">(none)</td>
              <td className="py-2"><Code>health</Code>, <Code>enforcement</Code>, <Code>tenants</Code>, <Code>activity</Code></td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Display labels may change wording between releases. Enum values are
        guaranteed stable within a schema major version.
      </p>

      {/* ── Automation decision helpers ────────────────────── */}
      <HeadingAnchor id="automation-helpers" className="mt-10">
        Automation Decision Helpers
      </HeadingAnchor>

      <p className="mt-3 text-sm text-slate-400">
        Both the dashboard snapshot and tenant detail responses include an{" "}
        <Code>automation</Code> object with pre-computed boolean decision
        helpers. These eliminate the need for bots to parse display strings
        or re-derive logic.
      </p>

      <p className="mt-3 text-xs font-medium uppercase tracking-wider text-slate-500">
        Dashboard automation fields
      </p>

      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead>
            <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
              <th className="pb-2 pr-4">Field</th>
              <th className="pb-2">Derivation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <tr><td className="py-2 pr-4"><Code>requires_review</Code></td><td className="py-2">priority_level is attention or critical</td></tr>
            <tr><td className="py-2 pr-4"><Code>is_idle</Code></td><td className="py-2">All normal/informational and queue empty</td></tr>
            <tr><td className="py-2 pr-4"><Code>is_degraded</Code></td><td className="py-2">Health panel_status is degraded or reduced</td></tr>
            <tr><td className="py-2 pr-4"><Code>is_offline</Code></td><td className="py-2">Health panel_status is offline</td></tr>
            <tr><td className="py-2 pr-4"><Code>has_enforcement_activity</Code></td><td className="py-2">Enforcement total &gt; 0</td></tr>
            <tr><td className="py-2 pr-4"><Code>has_recent_activity</Code></td><td className="py-2">Requests in last hour &gt; 0</td></tr>
            <tr><td className="py-2 pr-4"><Code>has_persistent_warning</Code></td><td className="py-2">Any queue item at attention or critical</td></tr>
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs font-medium uppercase tracking-wider text-slate-500">
        Tenant automation fields
      </p>

      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead>
            <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
              <th className="pb-2 pr-4">Field</th>
              <th className="pb-2">Derivation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <tr><td className="py-2 pr-4"><Code>requires_review</Code></td><td className="py-2">priority_level is attention or critical</td></tr>
            <tr><td className="py-2 pr-4"><Code>is_suspended</Code></td><td className="py-2">Tenant status is suspended</td></tr>
            <tr><td className="py-2 pr-4"><Code>has_quota_pressure</Code></td><td className="py-2">Any quota pressure_pct &gt;= 80</td></tr>
            <tr><td className="py-2 pr-4"><Code>has_posture_warnings</Code></td><td className="py-2">Posture warnings array non-empty</td></tr>
            <tr><td className="py-2 pr-4"><Code>has_enforcement_activity</Code></td><td className="py-2">Enforcement events &gt; 0 in 24h</td></tr>
            <tr><td className="py-2 pr-4"><Code>is_idle</Code></td><td className="py-2">Zero requests in 24h</td></tr>
          </tbody>
        </table>
      </div>

      {/* ── Agent Event Stream ─────────────────────────── */}
      <HeadingAnchor id="agent-event-stream" className="mt-10">
        Agent Event Stream
      </HeadingAnchor>

      <p className="mt-3 text-sm text-slate-400">
        <Code>GET /api/agent/stream</Code> returns a persistent Server-Sent Events (SSE)
        connection. Instead of polling the dashboard endpoint, agents can open a
        single connection and receive structured events whenever the operational
        state changes.
      </p>

      <h3 id="stream-event-types" className="mt-6 text-base font-semibold tracking-tight text-slate-100">
        Event Types
      </h3>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead>
            <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
              <th className="pb-2 pr-4">Event</th>
              <th className="pb-2 pr-4">Trigger</th>
              <th className="pb-2">Payload</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <tr>
              <td className="py-2 pr-4"><Code>dashboard_snapshot</Code></td>
              <td className="py-2 pr-4">Initial connect, or <Code>priority_level</Code> changes</td>
              <td className="py-2">summary, attention_queue, top_changes, automation, freshness</td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><Code>attention_queue_update</Code></td>
              <td className="py-2 pr-4">Top queue items change</td>
              <td className="py-2">queue</td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><Code>top_changes_update</Code></td>
              <td className="py-2 pr-4">Top changes list changes</td>
              <td className="py-2">changes</td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><Code>tenant_review_required</Code></td>
              <td className="py-2 pr-4"><Code>requires_review</Code> flips to true</td>
              <td className="py-2">summary, tenants_overview</td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><Code>system_degraded</Code></td>
              <td className="py-2 pr-4"><Code>is_degraded</Code> or <Code>is_offline</Code> flips to true</td>
              <td className="py-2">health, automation (is_degraded, is_offline)</td>
            </tr>
            <tr>
              <td className="py-2 pr-4"><Code>receipt_pipeline_idle</Code></td>
              <td className="py-2 pr-4">Receipt throughput drops to zero</td>
              <td className="py-2">trends</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 id="stream-payload" className="mt-6 text-base font-semibold tracking-tight text-slate-100">
        Payload Schema
      </h3>

      <p className="mt-3 text-sm text-slate-400">
        Every event payload includes <Code>schema_version</Code> and <Code>generated_at</Code> at
        the top level. The remaining fields match the corresponding section of the
        dashboard snapshot. Payloads reuse the exact same serializer output as
        <Code>/api/agent/dashboard</Code>.
      </p>

      <pre className="mt-4 overflow-x-auto rounded-lg bg-white/[0.03] p-4 text-xs leading-relaxed text-slate-300">
{`event: attention_queue_update
data: {
  "schema_version": "1.1.0",
  "generated_at": "2026-03-09T12:34:56.789Z",
  "queue": [
    { "title": "...", "reason": "...", "level": "attention", ... }
  ]
}`}
      </pre>

      <h3 id="stream-reconnect" className="mt-6 text-base font-semibold tracking-tight text-slate-100">
        Reconnect Strategy
      </h3>

      <p className="mt-3 text-sm text-slate-400">
        The browser <Code>EventSource</Code> API automatically reconnects on
        disconnect. For custom clients, reconnect after a brief backoff (2 to 5
        seconds). On reconnect the server sends a fresh <Code>dashboard_snapshot</Code> event
        so the client does not need to track missed events.
      </p>

      <h3 id="stream-example" className="mt-6 text-base font-semibold tracking-tight text-slate-100">
        EventSource Usage
      </h3>

      <pre className="mt-4 overflow-x-auto rounded-lg bg-white/[0.03] p-4 text-xs leading-relaxed text-slate-300">
{`const es = new EventSource("/api/agent/stream");

es.addEventListener("dashboard_snapshot", (e) => {
  const data = JSON.parse(e.data);
  console.log("Priority:", data.summary.priority_level);
});

es.addEventListener("system_degraded", (e) => {
  const data = JSON.parse(e.data);
  if (data.automation.is_offline) {
    alert("ATF system offline. Immediate review needed.");
  }
});

es.addEventListener("attention_queue_update", (e) => {
  const data = JSON.parse(e.data);
  for (const item of data.queue) {
    log(item.level, item.title);
  }
});

es.onerror = () => {
  // EventSource reconnects automatically.
  // Custom clients should retry after 2-5 seconds.
};`}
      </pre>

      {/* ── OpenClaw consumption examples ──────────────────── */}
      <HeadingAnchor id="openclaw-examples" className="mt-10">
        OpenClaw Consumption Examples
      </HeadingAnchor>

      <p className="mt-3 text-sm text-slate-400">
        Concrete patterns for bot decision-making using the structured
        contract. These examples use the <Code>automation</Code> helpers and
        canonical enum fields.
      </p>

      <p className="mt-4 text-xs font-medium uppercase tracking-wider text-slate-500">
        1. Summarize current ATF state
      </p>
      <pre className="mt-2 overflow-x-auto rounded-lg bg-white/[0.03] p-4 text-xs leading-relaxed text-slate-300">
{`// Fetch dashboard snapshot
const res = await fetch("/api/agent/dashboard");
const snap = await res.json();

// Stable decision: use automation booleans, not display strings
if (snap.automation.is_offline) {
  report("ATF system is offline. Immediate attention needed.");
} else if (snap.automation.is_degraded) {
  report("ATF running in reduced mode. Core path stable.");
} else if (snap.automation.requires_review) {
  report(\`Review needed: \${snap.summary.priority_level} priority.\`);
} else {
  report("ATF operating normally. No action required.");
}`}
      </pre>

      <p className="mt-4 text-xs font-medium uppercase tracking-wider text-slate-500">
        2. Check whether any tenant requires review
      </p>
      <pre className="mt-2 overflow-x-auto rounded-lg bg-white/[0.03] p-4 text-xs leading-relaxed text-slate-300">
{`const snap = await fetch("/api/agent/dashboard").then(r => r.json());

// Use structured requires_review array (not display labels)
if (!("available" in snap.tenants_overview)) {
  const ids = snap.tenants_overview.requires_review;
  for (const id of ids) {
    const tenant = await fetch(\`/api/agent/tenant?id=\${id}\`).then(r => r.json());
    if (tenant.automation.is_suspended) {
      escalate(\`Tenant \${tenant.tenant.name} is suspended.\`);
    } else if (tenant.automation.has_posture_warnings) {
      flag(\`Tenant \${tenant.tenant.name} has posture warnings.\`);
    }
  }
}`}
      </pre>

      <p className="mt-4 text-xs font-medium uppercase tracking-wider text-slate-500">
        3. Detect whether receipt pipeline is idle
      </p>
      <pre className="mt-2 overflow-x-auto rounded-lg bg-white/[0.03] p-4 text-xs leading-relaxed text-slate-300">
{`const snap = await fetch("/api/agent/dashboard").then(r => r.json());

if (!("available" in snap.trends)) {
  const idle = snap.trends.counters.receipts_written_last_hour === 0;
  const paceDown = snap.trends.receipt_pace === "decreasing";
  if (idle && snap.automation.has_recent_activity) {
    warn("Requests active but receipt pipeline idle. May need review.");
  } else if (paceDown) {
    note("Receipt throughput declining vs daily average.");
  }
}`}
      </pre>

      <p className="mt-4 text-xs font-medium uppercase tracking-wider text-slate-500">
        4. List top 3 attention queue items
      </p>
      <pre className="mt-2 overflow-x-auto rounded-lg bg-white/[0.03] p-4 text-xs leading-relaxed text-slate-300">
{`const snap = await fetch("/api/agent/dashboard").then(r => r.json());

// Queue is pre-sorted by priority (critical first)
const top3 = snap.attention_queue.slice(0, 3);
for (const item of top3) {
  // Use item.level enum, not display text
  const badge = item.level === "critical" ? "URGENT" : "INFO";
  log(\`[\${badge}] \${item.title} -> \${item.target ?? "general"}\`);
}`}
      </pre>

      {/* ── Bot consumption guidance ───────────────────────── */}
      <HeadingAnchor id="bot-consumption" className="mt-10">
        Bot Consumption Guide
      </HeadingAnchor>

      <p className="mt-3 text-sm text-slate-400">
        Recommended consumption pattern for AI agents:
      </p>

      <ol className="mt-3 list-decimal list-inside space-y-2 text-sm text-slate-400">
        <li>
          Fetch <Code>/api/agent/dashboard</Code> to get the system-wide snapshot.
        </li>
        <li>
          Check <Code>automation</Code> booleans first for quick decisions (requires_review, is_idle, is_degraded, is_offline).
        </li>
        <li>
          If more detail is needed, read <Code>summary.priority_level</Code> and{" "}
          <Code>summary.signals</Code> for the top-line operational state.
        </li>
        <li>
          Scan <Code>attention_queue</Code> for the highest-priority actionable items.
        </li>
        <li>
          Check <Code>tenants_overview.requires_review</Code> for tenant IDs that warrant drill-down.
        </li>
        <li>
          Fetch <Code>/api/agent/tenant?id=ID</Code> for any tenant requiring review, and use its <Code>automation</Code> block for decisions.
        </li>
        <li>
          Always check for <Code>available: false</Code> before reading section data.
        </li>
        <li>
          Use <Code>schema_version</Code> to detect contract changes. Key decisions on canonical enum fields, not display labels.
        </li>
      </ol>

      <p className="mt-6 text-[11px] text-slate-600">
        These endpoints share the same data sources and derivation logic as the
        human-facing operator dashboard. No additional APIs are called.
      </p>
    </article>
  );
}

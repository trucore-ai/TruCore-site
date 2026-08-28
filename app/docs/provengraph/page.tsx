import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { TrackedLink } from "@/components/tracked-link";

export const metadata: Metadata = {
  title: "ProvenGraph Docs — Provenance Graph for the Agent Economy | TruCore",
  description:
    "ProvenGraph: the provenance graph for the agent economy. Three product lines — Trust, Knowledge, Memory — sharing a single graph core. MCP server trust scores, grounded knowledge claims, compliant episodic memory.",
  keywords: [
    "ProvenGraph",
    "provenance graph",
    "trust-graph",
    "MCP registry",
    "service discovery",
    "knowledge claims",
    "agent memory",
    "AI agents",
    "trust scoring",
  ],
  openGraph: {
    title: "ProvenGraph — Provence Graph for the Agent Economy | TruCore",
    description:
      "Three product lines sharing one graph core: Trust (server verification), Knowledge (grounded claims), Memory (episodic recall). MIT-licensed, single binary.",
    url: "https://trucore.xyz/docs/provengraph",
  },
  alternates: { canonical: "https://trucore.xyz/docs/provengraph" },
};

export default function ProvenGraphDocs() {
  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary-200">
          TruCore Product Docs
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          ProvenGraph
        </h1>
        <p className="mt-3 text-xl leading-relaxed text-slate-300">
          The provenance graph for the agent economy. A shared graph core powering
          three product lines — Trust, Knowledge, and Memory.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <TrackedLink
            href="https://provengraph.trucore.xyz"
            eventName="provengraph_docs_try"
            eventProps={{ location: "docs_provengraph_header" }}
            className="inline-flex items-center gap-2 rounded-xl bg-accent-500 px-5 py-2.5 text-sm font-semibold text-neutral-950 transition-colors hover:bg-accent-400"
          >
            Live Demo →
          </TrackedLink>
          <TrackedLink
            href="https://github.com/trucore-ai/provengraph"
            eventName="provengraph_docs_github"
            eventProps={{ location: "docs_provengraph_header" }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-neutral-900/60 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-white/[0.12]"
          >
            GitHub
          </TrackedLink>
        </div>
      </div>

      <HeadingAnchor id="what-is-provengraph">
        What is ProvenGraph?
      </HeadingAnchor>
      <p>
        ProvenGraph is a provenance graph — a shared, verifiable record of who
        said what, when, and whether it held up. Every node and every edge carry
        evidence: URLs, content hashes, timestamps, issuers, and freshness
        values that decay over time. Trust is computed <em>over</em> the graph,
        not from a flat table.
      </p>
      <p>
        Think of it as the credit bureau for the agent economy. Agents don't
        blindly trust a server they just discovered. They query ProvenGraph:
        "Has anyone attested to this server? Did it work for them? Is this
        knowledge claim still current?" The graph answers, weighted by the
        reputation of the reporters themselves — that's the anti-gaming moat.
      </p>
      <p>
        One binary, MIT-licensed, zero external dependencies. Deploy behind
        Caddy or nginx and you have a private trust graph in minutes.
      </p>

      <HeadingAnchor id="three-products">
        Three Product Lines, One Graph Core
      </HeadingAnchor>
      <p>
        ProvenGraph has three product lines, each built on the same provenance
        graph core. The graph nodes are Service, Agent, KnowledgeClaim,
        MemoryEntry, and Org — with edges like attests-to, depends-on, remembers,
        supersedes, contradicts, and observed-by.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Trust */}
        <div className="group relative overflow-hidden rounded-2xl border border-violet-500/[0.15] bg-gradient-to-b from-violet-950/30 to-neutral-950/80 p-6">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-500/[0.08] blur-2xl" aria-hidden="true" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-lg" aria-hidden="true">🛡️</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-300">Live</p>
                <p className="text-lg font-bold text-white">Trust</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Server trust scores with outcome-weighted reputation. Register your MCP server,
              get probed every 60s, accumulate reliability and latency data. Other agents
              report outcomes — and their own trust weight determines how much their
              report moves the score. The anti-gaming moat.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {["server-trust", "health-probes", "resolution", "reputation-weighted"].map((tag) => (
                <span key={tag} className="rounded-full border border-violet-500/[0.15] bg-violet-500/[0.06] px-2 py-0.5 text-[10px] font-medium text-violet-300">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Knowledge */}
        <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/[0.12] bg-gradient-to-b from-emerald-950/20 to-neutral-950/80 p-6">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/[0.05] blur-2xl" aria-hidden="true" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-lg" aria-hidden="true">📚</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-300">Planned</p>
                <p className="text-lg font-bold text-white">Knowledge</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Grounded, verifiable knowledge claims. Every claim carries a source URL,
              content hash, and attestation edges. Claims can be superseded and contradicted —
              the graph tracks which claims hold up and which were walked back. "What's already known."
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {["knowledge-claims", "grounded-citations", "supersedes", "verifiable"].map((tag) => (
                <span key={tag} className="rounded-full border border-emerald-500/[0.12] bg-emerald-500/[0.06] px-2 py-0.5 text-[10px] font-medium text-emerald-300">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Memory */}
        <div className="group relative overflow-hidden rounded-2xl border border-amber-500/[0.12] bg-gradient-to-b from-amber-950/20 to-neutral-950/80 p-6">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-500/[0.05] blur-2xl" aria-hidden="true" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-lg" aria-hidden="true">🧠</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-300">Planned</p>
                <p className="text-lg font-bold text-white">Memory</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Compliant episodic memory for agents. Every memory entry is a graph node
              with provenance — who remembered what, when, and under what policy.
              Memory entries can be scoped, expired, and audited. "What's remembered and compliant."
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {["memory-entries", "episodic", "compliant", "auditable"].map((tag) => (
                <span key={tag} className="rounded-full border border-amber-500/[0.12] bg-amber-500/[0.06] px-2 py-0.5 text-[10px] font-medium text-amber-300">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-6 text-sm text-slate-400">
        All three share the same graph core — same nodes table, same edges table,
        same trust-scoring engine. Register a server once and it's a first-class
        node in all three product lines. That's the power of a provenance graph:
        each product line is just a different query over the same data.
      </p>

      <HeadingAnchor id="trust-product">
        Trust — Server Verification (Live)
      </HeadingAnchor>
      <p>
        Trust is the first and currently live product line. It's what everyone
        knows as "MeshDNS" — the capability-based service registry for MCP
        servers. Servers register with capabilities, get health-checked every 60s,
        and agents resolve by capability at runtime. Never hardcode an MCP URL
        again.
      </p>
      <p>
        The trust scoring engine computes a 0-100 score from five signals:
        reliability (uptime from probe history), latency (avg response time),
        cost transparency (disclosed cost earns an honesty bonus), outcome-verified
        reputation (the moat — weighted by reporter trust), and schema integrity
        (hash-pinned manifests detect rug pulls).
      </p>

      <HeadingAnchor id="architecture">
        Architecture
      </HeadingAnchor>
      <p>Six components in one static Go binary:</p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="pb-2 pr-4 font-semibold text-slate-300">Component</th>
              <th className="pb-2 pr-4 font-semibold text-slate-300">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-primary-200">HTTP Server</td>
              <td className="py-2 text-slate-400">Go stdlib net/http — no frameworks. Serves REST API, landing page, and JSON export endpoint.</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-primary-200">Registry Store</td>
              <td className="py-2 text-slate-400">SQLite via modernc.org/sqlite — pure Go, no CGo. Server manifests, health history, resolution counters.</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-primary-200">ProvenGraph Core</td>
              <td className="py-2 text-slate-400">Shared nodes + edges tables (pg_nodes, pg_edges). Service/Agent/KnowledgeClaim/MemoryEntry/Org nodes with attests-to, depends-on, remembers, supersedes, contradicts, observed-by edges.</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-primary-200">Trust Engine</td>
              <td className="py-2 text-slate-400">Computes trust scores over the graph: attestations weighted by attester trust, outcomes weighted by reporter reputation (anti-gaming moat), freshness, and contradiction penalties.</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-primary-200">Health Check Pool</td>
              <td className="py-2 text-slate-400">Background worker pool probes every registered health_url on a configurable interval. GET by default, auto-detects POST-only with MCP initialize retry.</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-primary-200">Resolution Engine</td>
              <td className="py-2 text-slate-400">Matches capability queries against UP servers, ranks by 30-day uptime. Dead servers never appear in results.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <HeadingAnchor id="getting-started">
        Getting Started
      </HeadingAnchor>
      <p>Install, start, register, resolve — 60 seconds:</p>
      <pre className="my-4 overflow-x-auto rounded-xl border border-white/[0.06] bg-neutral-950 p-4 text-sm">
        <code className="text-green-400">
          {`$ go install github.com/trucore-ai/provengraph/cmd/meshdns@latest
$ meshdns serve
  ProvenGraph Trust starting on :8080

# Register a server
$ curl -s -X POST http://localhost:8080/v0/servers \\
  -H "Content-Type: application/json" \\
  -d '{"name":"weather-agent","description":"Weather data MCP server",
       "server_url":"https://weather.example.com",
       "health_url":"https://weather.example.com/health",
       "capabilities":["weather","forecast","alerts"],
       "owner_contact":"ops@example.com"}'
# → {"server_id":"...","write_key":"..."}

# Resolve by capability
$ curl -s "http://localhost:8080/v0/resolve?capability=weather"
# → [{"name":"weather-agent","server_url":"https://weather.example.com",...}]`}
        </code>
      </pre>

      <HeadingAnchor id="api-reference">
        API Reference
      </HeadingAnchor>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="pb-2 pr-4 font-semibold text-slate-300">Method</th>
              <th className="pb-2 pr-4 font-semibold text-slate-300">Path</th>
              <th className="pb-2 pr-4 font-semibold text-slate-300">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-green-400">POST</td>
              <td className="py-2 pr-4 font-mono text-xs text-primary-200">/v0/servers</td>
              <td className="py-2 text-slate-400">Register a new server. Returns <code>server_id</code> + <code>write_key</code>. Optional <code>probe_method</code> (GET | POST). Duplicate names → 409.</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-blue-400">GET</td>
              <td className="py-2 pr-4 font-mono text-xs text-primary-200">/v0/servers</td>
              <td className="py-2 text-slate-400">List servers with trust scores. Query params: <code>status</code>, <code>query</code>, <code>capability</code>, <code>cursor</code>, <code>limit</code>.</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-blue-400">GET</td>
              <td className="py-2 pr-4 font-mono text-xs text-primary-200">/v0/servers/{"{id}"}</td>
              <td className="py-2 text-slate-400">Get a single server with trust_score, trust_tier, provenance breakdown.</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-yellow-400">PUT</td>
              <td className="py-2 pr-4 font-mono text-xs text-primary-200">/v0/servers/{"{id}"}</td>
              <td className="py-2 text-slate-400">Update server manifest. Requires <code>X-Write-Key</code> or <code>Authorization: Bearer</code>.</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-red-400">DELETE</td>
              <td className="py-2 pr-4 font-mono text-xs text-primary-200">/v0/servers/{"{id}"}</td>
              <td className="py-2 text-slate-400">Delist (soft-delete). Stops health probes within one cycle.</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-green-400">POST</td>
              <td className="py-2 pr-4 font-mono text-xs text-primary-200">/v0/outcomes</td>
              <td className="py-2 text-slate-400">Report an outcome. <code>{"{server_id, success, rating, reporter}"}</code>. Feeds the reputation-weighted trust score.</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-blue-400">GET</td>
              <td className="py-2 pr-4 font-mono text-xs text-primary-200">/v0/resolve</td>
              <td className="py-2 text-slate-400">Resolve servers by capability. Query param: <code>capability</code> (required). Returns only UP servers, ranked by 30-day uptime.</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-blue-400">GET</td>
              <td className="py-2 pr-4 font-mono text-xs text-primary-200">/v0/stats</td>
              <td className="py-2 text-slate-400">Registry statistics: active/total servers, up count, resolutions and probes in the last 24h.</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-blue-400">GET</td>
              <td className="py-2 pr-4 font-mono text-xs text-primary-200">/v0/export</td>
              <td className="py-2 text-slate-400">Full registry JSON export. Open data — no auth required. Platform-risk hedge.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <HeadingAnchor id="trust-scoring">
        Trust Scoring Model
      </HeadingAnchor>
      <div className="my-4 grid gap-3 sm:grid-cols-2">
        {[
          { title: "Attestation Score (0-20)", desc: "Who vouches for this server? Each attestation weighted by attester's own trust × freshness. Saturates with ~3-4 strong attestations." },
          { title: "Outcome Score (0-25)", desc: "The moat. Did it work? Success rate weighted by reporter reputation — a low-trust reporter can't pump a score. Confidence ramps with sample size." },
          { title: "Freshness (0-10)", desc: "How recent are the attestations and outcomes? Edges decay over time. Fresh evidence carries more weight." },
          { title: "Contradiction Penalty (0-10)", desc: "Evidence of contradiction or supersession. Conflicting claims reduce trust." },
          { title: "Cost Transparency Bonus (+3)", desc: "Disclosing cost_per_call earns a small honesty bonus. Undisclosed = 0. Expensive ≠ untrustworthy — cost is surfaced for ranking, not scored." },
          { title: "Total (0-100)", desc: "Provenance trust (0-65) + reliability from probe history (0-30) + latency score (0-5) + cost bonus (0-3)." },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-white/[0.06] bg-neutral-900/60 p-4">
            <p className="font-semibold text-slate-200">{item.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">{item.desc}</p>
          </div>
        ))}
      </div>

      <HeadingAnchor id="how-health-works">
        How Health Checks Work
      </HeadingAnchor>
      <p>
        ProvenGraph probes every registered server's <code>health_url</code> every
        60s (configurable). GET by default, auto-detects POST-only endpoints
        (MCP streamable-HTTP servers that answer GET with 405). 5-second
        timeout. Non-2xx → DOWN. Resolution never returns DOWN servers.
      </p>

      <HeadingAnchor id="sdk-reference">
        SDK Reference
      </HeadingAnchor>
      <h3 className="mt-4 text-lg font-semibold text-slate-200">Python</h3>
      <pre className="my-4 overflow-x-auto rounded-xl border border-white/[0.06] bg-neutral-950 p-4 text-sm">
        <code className="text-green-400">
          {`$ pip install meshdns-client`}
        </code>
      </pre>
      <pre className="my-4 overflow-x-auto rounded-xl border border-white/[0.06] bg-neutral-950 p-4 text-sm">
        <code className="text-slate-300">
          {`from meshdns_client import MeshDNSClient

client = MeshDNSClient("https://provengraph.trucore.xyz")

# Resolve a capability
servers = client.resolve("weather")
# → [{"name":"weather-agent","server_url":"https://...","up":true}]

# Smart retry — skips recently-failed servers
next_server = client.resolve_next("weather")`}
        </code>
      </pre>

      <h3 className="mt-6 text-lg font-semibold text-slate-200">TypeScript</h3>
      <pre className="my-4 overflow-x-auto rounded-xl border border-white/[0.06] bg-neutral-950 p-4 text-sm">
        <code className="text-green-400">
          {`$ npm i @meshdns/client`}
        </code>
      </pre>
      <pre className="my-4 overflow-x-auto rounded-xl border border-white/[0.06] bg-neutral-950 p-4 text-sm">
        <code className="text-slate-300">
          {`import { MeshDNSClient } from "@meshdns/client";

const client = new MeshDNSClient("https://provengraph.trucore.xyz");

// Resolve a capability
const servers = await client.resolve("weather");

// Smart retry — skips recently-failed servers
const next = await client.resolveNext("weather");`}
        </code>
      </pre>

      <HeadingAnchor id="configuration">
        Configuration
      </HeadingAnchor>
      <p>All config via environment variables:</p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="pb-2 pr-4 font-semibold text-slate-300">Variable</th>
              <th className="pb-2 pr-4 font-semibold text-slate-300">Default</th>
              <th className="pb-2 pr-4 font-semibold text-slate-300">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            <tr><td className="py-2 pr-4 font-mono text-xs text-primary-200">MESHDNS_PORT</td><td className="py-2 pr-4 font-mono text-xs text-slate-400">:8080</td><td className="py-2 text-slate-400">Listen address</td></tr>
            <tr><td className="py-2 pr-4 font-mono text-xs text-primary-200">MESHDNS_DB</td><td className="py-2 pr-4 font-mono text-xs text-slate-400">meshdns.db</td><td className="py-2 text-slate-400">SQLite database path</td></tr>
            <tr><td className="py-2 pr-4 font-mono text-xs text-primary-200">MESHDNS_PROBE_INTERVAL</td><td className="py-2 pr-4 font-mono text-xs text-slate-400">60s</td><td className="py-2 text-slate-400">Seconds between health probes</td></tr>
            <tr><td className="py-2 pr-4 font-mono text-xs text-primary-200">MESHDNS_PROBE_TIMEOUT</td><td className="py-2 pr-4 font-mono text-xs text-slate-400">5s</td><td className="py-2 text-slate-400">Per-probe HTTP timeout</td></tr>
            <tr><td className="py-2 pr-4 font-mono text-xs text-primary-200">MESHDNS_WORKERS</td><td className="py-2 pr-4 font-mono text-xs text-slate-400">4</td><td className="py-2 text-slate-400">Health check goroutine pool size</td></tr>
          </tbody>
        </table>
      </div>

      <HeadingAnchor id="security-model">
        Security Model
      </HeadingAnchor>
      <div className="my-4 grid gap-3 sm:grid-cols-2">
        {[
          { title: "Read paths are public", desc: "List, resolve, stats, and export require no authentication. Registry data is open by design — the platform-risk hedge." },
          { title: "Write paths require bearer tokens", desc: "Registration returns a write_key. Updates and deletes require X-Write-Key or Authorization: Bearer." },
          { title: "Soft-delete, not hard-delete", desc: "Delisting stops health probes but preserves the record and its history." },
          { title: "No PII beyond owner contact", desc: "The only quasi-personal field is owner_contact (email). Source IPs hashed at ingestion, never stored raw." },
          { title: "Full data export", desc: "GET /v0/export returns the complete registry as JSON. Your data is never locked in." },
          { title: "Single binary, zero external deps", desc: "Go stdlib + pure-Go SQLite. No Redis, no Postgres, no message queue." },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-white/[0.06] bg-neutral-900/60 p-4">
            <p className="font-semibold text-slate-200">{item.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">{item.desc}</p>
          </div>
        ))}
      </div>

      <HeadingAnchor id="faq">
        FAQ
      </HeadingAnchor>

      <h3 className="mt-6 text-lg font-semibold text-slate-200">Why ProvenGraph instead of just MeshDNS?</h3>
      <p>
        MeshDNS is the Trust product line — the MCP server registry everyone
        already uses. ProvenGraph is the underlying provenance graph that powers
        Trust, and will power Knowledge and Memory when they launch. Same binary,
        same API, expanded scope. All 3,000+ existing servers, all existing
        API endpoints, all existing SDKs work unchanged.
      </p>

      <h3 className="mt-6 text-lg font-semibold text-slate-200">Can I run my own instance?</h3>
      <p>
        Yes. A single Go binary — MIT-licensed, self-contained, zero external
        dependencies. Deploy behind Caddy or nginx with auto-TLS and you have a
        private provenance graph in minutes. The public instance at{" "}
        provengraph.trucore.xyz is a convenience, not a requirement.
      </p>

      <h3 className="mt-6 text-lg font-semibold text-slate-200">What happens if ProvenGraph goes down?</h3>
      <p>
        Agents should cache the last resolve result and fall back to cached
        servers. <code>GET /v0/export</code> gives you the full registry as
        JSON — archive it periodically for disaster recovery.
      </p>

      <h3 className="mt-6 text-lg font-semibold text-slate-200">How fast is resolution?</h3>
      <p>
        p99 under 100ms with 3,000+ registered servers on MVP hardware.
        Resolution is a simple indexed SQLite query — no network hops, no
        external services.
      </p>

      <h3 className="mt-6 text-lg font-semibold text-slate-200">When will Knowledge and Memory launch?</h3>
      <p>
        Trust is live today with 3,000+ servers and the full trust-scoring engine.
        Knowledge and Memory are planned product lines on the same graph core.
        Register now and your server accumulates uptime and outcome history that
        transfers directly to future product lines.
      </p>

      <HeadingAnchor id="integrations">
        Integrations & Next Steps
      </HeadingAnchor>
      <div className="my-4 grid gap-3 sm:grid-cols-2">
        {[
          {
            title: "ATF (Agent Transaction Firewall)",
            desc: "Policy-enforced guardrails for on-chain transactions on Solana. Layer ATF protection over ProvenGraph-discovered services.",
            href: "/docs",
          },
          {
            title: "GitHub Repo",
            desc: "Source code, issue tracker, and discussions. MIT-licensed. One Go binary.",
            href: "https://github.com/trucore-ai/provengraph",
          },
          {
            title: "Live Registry",
            desc: "See the public registry live — server counts, trust scores, uptime data.",
            href: "https://provengraph.trucore.xyz",
          },
          {
            title: "LazyMCP",
            desc: "On-the-fly MCP server discovery. Zero pre-configuration — resolve any of 3,000+ servers at runtime.",
            href: "https://github.com/trucore-ai/provengraph/tree/main/scripts/lazymcp.py",
          },
        ].map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group rounded-xl border border-white/[0.06] bg-neutral-900/60 p-4 transition-colors hover:border-primary-300/20 hover:bg-neutral-900/80"
          >
            <p className="font-semibold text-slate-200 group-hover:text-primary-200">
              {item.title} →
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">
              {item.desc}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
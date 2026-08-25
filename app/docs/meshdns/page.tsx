import type { Metadata } from "next";
import Link from "next/link";
import { HeadingAnchor } from "@/components/heading-anchor";
import { TrackedLink } from "@/components/tracked-link";

export const metadata: Metadata = {
  title: "MeshDNS Docs — MCP Service Registry for AI Agents | TruCore",
  description:
    "Complete documentation for MeshDNS: capability-based service registry for MCP servers. Register, resolve, health-check — never hardcode an MCP URL again.",
  keywords: [
    "MeshDNS",
    "MCP registry",
    "service discovery",
    "AI agents",
    "capability resolution",
    "health checks",
    "server registry",
    "agent mesh",
    "MCP servers",
  ],
  openGraph: {
    title: "MeshDNS Docs — MCP Service Registry for AI Agents | TruCore",
    description:
      "Capability-based discovery for MCP servers. Register your server, query by capability, automatic health checks.",
    url: "https://trucore.xyz/docs/meshdns",
  },
  alternates: { canonical: "https://trucore.xyz/docs/meshdns" },
};

export default function MeshDNSDocs() {
  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary-200">
          TruCore Product Docs
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          MeshDNS
        </h1>
        <p className="mt-3 text-xl leading-relaxed text-slate-300">
          The service registry for AI agents. Never hardcode an MCP server again.
          Register capabilities, resolve by feature, automatic health checks.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <TrackedLink
            href="https://meshdns.trucore.xyz"
            eventName="meshdns_docs_try"
            eventProps={{ location: "docs_meshdns_header" }}
            className="inline-flex items-center gap-2 rounded-xl bg-accent-500 px-5 py-2.5 text-sm font-semibold text-neutral-950 transition-colors hover:bg-accent-400"
          >
            Live Demo →
          </TrackedLink>
          <TrackedLink
            href="https://github.com/trucore-ai/meshdns"
            eventName="meshdns_docs_github"
            eventProps={{ location: "docs_meshdns_header" }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-neutral-900/60 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-white/[0.12]"
          >
            GitHub
          </TrackedLink>
        </div>
      </div>

      <HeadingAnchor id="what-is-meshdns">
        What is MeshDNS?
      </HeadingAnchor>
      <p>
        MeshDNS is a capability-based service registry for MCP (Model Context
        Protocol) servers. Think DNS, but for your AI agent mesh. Instead of
        hardcoding server URLs into every agent config file, agents ask:{" "}
        <em>"who can do weather forecasting right now?"</em> — and MeshDNS returns
        the best available server.
      </p>
      <p>
        Every MCP agent today ships a hardcoded JSON server list. New server =
        config edit. Dead server = silent failure. No way to ask "who can do X?"
        MeshDNS fixes all three: dynamic registration, live health checks, and
        capability-based resolution in one MCP-native call.
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
              <td className="py-2 pr-4 font-mono text-xs text-primary-200">Health Check Pool</td>
              <td className="py-2 text-slate-400">Background worker pool probes every registered health_url on a configurable interval — GET by default, or POST with an MCP initialize request for POST-only endpoints (auto-detected on 405). Tracks 30-day uptime history.</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-primary-200">Resolution Engine</td>
              <td className="py-2 text-slate-400">Matches capability queries against UP servers, ranks by 30-day uptime. Dead servers never appear in results.</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-primary-200">Landing Page</td>
              <td className="py-2 text-slate-400">Public dashboard at the domain root — live server counts, resolutions/24h, per-server uptime.</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-primary-200">SDK Clients</td>
              <td className="py-2 text-slate-400">Python (pip) + TypeScript (npm). Thin resolve clients — one function call from agent to server.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <HeadingAnchor id="quickstart">
        Quickstart
      </HeadingAnchor>
      <p>Install, start, register, resolve — 60 seconds:</p>
      <pre className="my-4 overflow-x-auto rounded-xl border border-white/[0.06] bg-neutral-950 p-4 text-sm">
        <code className="text-green-400">
          {`$ go install github.com/trucore-ai/meshdns/cmd/meshdns@latest
$ meshdns --port=:8080
  MeshDNS listening on :8080

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
      <p className="text-slate-400">
        <strong className="text-slate-200">POST-only endpoint?</strong> MCP
        streamable-HTTP servers answer GET with 405. Add{" "}
        <code>probe_method: POST</code> to the registration body to probe with
        an MCP <code>initialize</code> request instead — or leave it out and
        MeshDNS auto-detects: a 405 GET answer triggers a POST probe and
        remembers the switch.
      </p>

      <HeadingAnchor id="cli">CLI Tool (meshdns-cli)</HeadingAnchor>
      <p>
        A single Go binary with <strong>zero dependencies</strong>. Every command
        speaks both <code className="text-cyan-400">--json</code> for agents and
        human-readable for developers. Errors include a{" "}
        <code className="text-cyan-400">suggested_command</code> field — copy-paste
        the fix directly.
      </p>
      <pre className="my-4 overflow-x-auto rounded-xl border border-white/[0.06] bg-neutral-950 p-4 text-sm">
        <code className="text-green-400">
          {`# Install alongside the server binary
$ go install github.com/trucore-ai/meshdns/cmd/meshdns-cli@latest

# Full surface discovery
$ meshdns-cli --help

# Live stats (human-readable)
$ meshdns-cli stats
  servers active:   3986
  servers total:    3986
  up count:         3914
  resolutions 24h:  17
  probes 24h:       697229

# Resolve a capability (agent-friendly)
$ meshdns-cli --json resolve weather
  {"data":[{...}],"ok":true}

# Health check — exit 0 if reachable
$ meshdns-cli doctor
  healthy`}
        </code>
      </pre>
      <p>
        Full command reference: register, list, resolve, stats, status,
        capabilities, delist, doctor. All support{" "}
        <code className="text-slate-300">--json</code> for machine-readable
        .
      </p>

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
              <td className="py-2 text-slate-400">Register a new server. Returns <code>server_id</code> + <code>write_key</code>. Optional <code>probe_method</code> (GET | POST) for POST-only endpoints. Duplicate names → 409.</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-blue-400">GET</td>
              <td className="py-2 pr-4 font-mono text-xs text-primary-200">/v0/servers</td>
              <td className="py-2 text-slate-400">List servers. Query params: <code>status</code> (active/delisted/all), <code>query</code>, <code>capability</code>, <code>cursor</code>, <code>limit</code>.</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-yellow-400">PUT</td>
              <td className="py-2 pr-4 font-mono text-xs text-primary-200">/v0/servers/{"{id}"}</td>
              <td className="py-2 text-slate-400">Update a server manifest. Requires <code>Authorization: Bearer write_key</code>.</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-xs text-red-400">DELETE</td>
              <td className="py-2 pr-4 font-mono text-xs text-primary-200">/v0/servers/{"{id}"}</td>
              <td className="py-2 text-slate-400">Delist (soft-delete) a server. Requires <code>Authorization: Bearer write_key</code>. Stops health probes within one cycle.</td>
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
              <td className="py-2 text-slate-400">Full registry JSON export. Open data — no auth required. Platform-risk hedge: your data is never locked in.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <HeadingAnchor id="how-health-works">
        How Health Checks Work
      </HeadingAnchor>
      <p>
        MeshDNS probes every registered server's <code>health_url</code> on a
        configurable interval (default: 60s). A probe is an{" "}
        <code>HTTP GET</code> by default, or an <code>HTTP POST</code> carrying
        an MCP <code>initialize</code> request when{" "}
        <code>probe_method: POST</code> is set — with a 5-second timeout either
        way. Non-2xx responses and timeouts both mark the server as DOWN. If a
        GET probe answers <code>405 Method Not Allowed</code>, MeshDNS retries
        with the POST initialize probe and persists the switch automatically.
      </p>
      <ol className="my-4 space-y-3">
        <li>
          <strong className="text-slate-200">Register with health_url.</strong>{" "}
          <span className="text-slate-400">
            When you register a server, provide the health endpoint URL. MeshDNS
            starts probing it immediately.
          </span>
        </li>
        <li>
          <strong className="text-slate-200">Probe every 60s.</strong>{" "}
          <span className="text-slate-400">
            Background goroutine pool sends GET probes (or POST initialize
            probes for POST-only servers). Configurable
            via <code>MESHDNS_PROBE_INTERVAL</code> and{" "}
            <code>MESHDNS_PROBE_TIMEOUT</code> env vars.
          </span>
        </li>
        <li>
          <strong className="text-slate-200">Mark UP/DOWN.</strong>{" "}
          <span className="text-slate-400">
            Server goes down → marked DOWN within one probe cycle. Server comes
            back → marked UP on the next successful probe. 30-day uptime
            history preserved.
          </span>
        </li>
        <li>
          <strong className="text-slate-200">Resolution excludes DOWN servers.</strong>{" "}
          <span className="text-slate-400">
            <code>/v0/resolve</code> never returns servers marked DOWN. Agents
            always get working endpoints. No silent failures.
          </span>
        </li>
      </ol>

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

client = MeshDNSClient("https://meshdns.trucore.xyz")

# Resolve a capability
servers = client.resolve("weather")
# → [{"name":"weather-agent","server_url":"https://...","up":true}]

# Smart retry — skips recently-failed servers
next_server = client.resolve_next("weather")
`}
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

const client = new MeshDNSClient("https://meshdns.trucore.xyz");

// Resolve a capability
const servers = await client.resolve("weather");

// Smart retry — skips recently-failed servers
const next = await client.resolveNext("weather");
`}
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
          { title: "Read paths are public", desc: "List, resolve, stats, and export endpoints require no authentication. Registry data is open by design — the platform-risk hedge." },
          { title: "Write paths require bearer tokens", desc: "Registration returns a write_key. Updates and deletes require Authorization: Bearer write_key. You control your server entry." },
          { title: "Soft-delete, not hard-delete", desc: "Deleting delists a server — it stops appearing in listings and health probes — but the record is preserved. No data destruction." },
          { title: "No PII beyond owner contact", desc: "The only quasi-personal field is owner_contact (email). Source IPs hashed at ingestion, never stored raw. No third-party trackers." },
          { title: "Full data export", desc: "GET /v0/export returns the complete registry as JSON. Your data is never locked in. This is the platform-risk hedge — if MeshDNS goes down, you have everything." },
          { title: "Single binary, zero external deps", desc: "Go stdlib + pure-Go SQLite. No Redis, no Postgres, no message queue. Deploy the binary, point at a volume, done." },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-white/[0.06] bg-neutral-900/60 p-4">
            <p className="font-semibold text-slate-200">{item.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">{item.desc}</p>
          </div>
        ))}
      </div>

      <HeadingAnchor id="agent-skills">
        <span className="inline-flex items-center gap-2">
          <svg className="h-5 w-5 text-violet-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L10 6.477V16h2a1 1 0 110 2H8a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.616a1 1 0 01.894-1.79l1.599.8L10 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Agent Skills
        </span>
      </HeadingAnchor>
      <p>
        MeshDNS ships with three Hermes Agent skills — pre-built AI knowledge packs
        that agents load on-demand. Any <strong className="text-slate-200">human developer</strong> or <strong className="text-slate-200">AI agent</strong> using
        Hermes can install and use these immediately.
      </p>
      <p className="text-sm text-slate-400">
        Skills are the agent equivalent of npm packages — self-contained knowledge
        modules with commands, patterns, and pitfalls. Agents load a skill and
        instantly gain expertise in that domain, without training data or prompts.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Card 1: Quickstart */}
        <div className="group relative overflow-hidden rounded-2xl border border-violet-500/[0.15] bg-gradient-to-b from-violet-950/30 to-neutral-950/80 p-6 transition-all duration-300 hover:border-violet-400/30 hover:from-violet-950/50">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-500/[0.08] blur-2xl group-hover:bg-violet-500/[0.15] transition-colors duration-500" aria-hidden="true" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-lg" aria-hidden="true">⚡</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-300">Entry Point</p>
                <p className="text-lg font-bold text-white">meshdns-quickstart</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              One-stop guide for agents and developers. What MeshDNS is, how to use it,
              how to register servers, and the Lazy MCP pattern — all in one load.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {["discover", "register", "lazy-mcp", "cheat-sheet"].map((tag) => (
                <span key={tag} className="rounded-full border border-violet-500/[0.15] bg-violet-500/[0.06] px-2 py-0.5 text-[10px] font-medium text-violet-300">{tag}</span>
              ))}
            </div>
            <p className="mt-4 font-mono text-xs text-violet-400/70">
              Agent loads: <code className="rounded bg-violet-500/[0.08] px-1.5 py-0.5 text-violet-300">skill_view(&apos;meshdns-quickstart&apos;)</code>
            </p>
          </div>
        </div>

        {/* Card 2: Full Docs */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-700/[0.2] bg-gradient-to-b from-slate-800/30 to-neutral-950/80 p-6 transition-all duration-300 hover:border-slate-500/30 hover:from-slate-800/50">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-slate-500/[0.06] blur-2xl group-hover:bg-slate-500/[0.12] transition-colors duration-500" aria-hidden="true" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-500/15 text-lg" aria-hidden="true">📖</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Reference</p>
                <p className="text-lg font-bold text-white">meshdns</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Complete API reference, architecture deep-dive, deployment patterns,
              health check system internals, and production ops guide.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {["api-ref", "deploy", "health-checks", "architecture"].map((tag) => (
                <span key={tag} className="rounded-full border border-slate-600/[0.2] bg-slate-500/[0.06] px-2 py-0.5 text-[10px] font-medium text-slate-400">{tag}</span>
              ))}
            </div>
            <p className="mt-4 font-mono text-xs text-slate-500">
              Agent loads: <code className="rounded bg-slate-500/[0.08] px-1.5 py-0.5 text-slate-400">skill_view(&apos;meshdns&apos;)</code>
            </p>
          </div>
        </div>

        {/* Card 3: Lazy MCP */}
        <div className="group relative overflow-hidden rounded-2xl border border-cyan-500/[0.15] bg-gradient-to-b from-cyan-950/20 to-neutral-950/80 p-6 transition-all duration-300 hover:border-cyan-400/30 hover:from-cyan-950/40">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-cyan-500/[0.06] blur-2xl group-hover:bg-cyan-500/[0.12] transition-colors duration-500" aria-hidden="true" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 text-lg" aria-hidden="true">🔌</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300">On-Demand</p>
                <p className="text-lg font-bold text-white">meshdns-lazy-mcp</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              On-the-fly MCP server discovery. Zero pre-configuration — resolve any
              of 750+ servers at runtime, call tools, tear down. No restart needed.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {["zero-config", "750+ servers", "on-demand", "workflow"].map((tag) => (
                <span key={tag} className="rounded-full border border-cyan-500/[0.15] bg-cyan-500/[0.06] px-2 py-0.5 text-[10px] font-medium text-cyan-300">{tag}</span>
              ))}
            </div>
            <p className="mt-4 font-mono text-xs text-cyan-400/70">
              Agent loads: <code className="rounded bg-cyan-500/[0.08] px-1.5 py-0.5 text-cyan-300">skill_view(&apos;meshdns-lazy-mcp&apos;)</code>
            </p>
          </div>
        </div>
      </div>

      {/* Getting Started CTA */}
      <div className="mt-6 rounded-2xl border border-violet-500/[0.12] bg-gradient-to-r from-violet-950/40 via-neutral-950/60 to-cyan-950/20 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-bold text-white">Ready to wire up your agent?</p>
            <p className="mt-1 text-sm text-slate-400">
              Install the skills in your Hermes profile and agents can discover 750+ MCP servers on demand — no config, no restart.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://github.com/trucore-ai/meshdns"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-400"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L10 6.477V16h2a1 1 0 110 2H8a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.616a1 1 0 01.894-1.79l1.599.8L10 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              GitHub & Skills
            </a>
            <a
              href="https://meshdns.trucore.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-neutral-900/60 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-white/[0.12]"
            >
              Live Registry →
            </a>
          </div>
        </div>
      </div>

      <HeadingAnchor id="faq">
        FAQ
      </HeadingAnchor>

      <h3 className="mt-6 text-lg font-semibold text-slate-200">How is this different from the MCP Registry?</h3>
      <p>
        The official MCP Registry is a flat list of servers with no capability
        search, no health checks, and no programmatic resolution. MeshDNS adds
        all three: ask "who can do weather?" and get back working servers sorted
        by uptime — automatically.
      </p>

      <h3 className="mt-6 text-lg font-semibold text-slate-200">Can I run my own instance?</h3>
      <p>
        Yes. MeshDNS is a single Go binary — MIT-licensed, self-contained,
        zero external dependencies. Deploy behind Caddy or nginx with auto-TLS
        and you have a private registry in minutes. The public instance at{" "}
        meshdns.trucore.xyz is a convenience, not a requirement.
      </p>

      <h3 className="mt-6 text-lg font-semibold text-slate-200">What happens if MeshDNS goes down?</h3>
      <p>
        Agents should cache the last resolve result and fall back to cached
        servers. Additionally, <code>GET /v0/export</code> gives you the full
        registry as JSON — archive it periodically for disaster recovery.
      </p>

      <h3 className="mt-6 text-lg font-semibold text-slate-200">How fast is resolution?</h3>
      <p>
        p99 under 100ms with 1,000 registered servers on MVP hardware.
        Resolution is a simple indexed SQLite query — no network hops, no
        external services, no cache warming.
      </p>

      <h3 className="mt-6 text-lg font-semibold text-slate-200">When will trust scores be added?</h3>
      <p>
        Trust scores and ratings are planned for phase 2. They need usage data
        to be meaningful — the current uptime-based ranking is the v1
        foundation that trust scores build on. Register now and your uptime
        history gives you a head start when scoring launches.
      </p>

      <HeadingAnchor id="integrations">
        Integrations & Next Steps
      </HeadingAnchor>
      <div className="my-4 grid gap-3 sm:grid-cols-2">
        {[
          {
            title: "x402Fuel",
            desc: "Combine MeshDNS discovery with x402Fuel payments. Agent resolves a paywalled API capability, then pays automatically via HTTP 402.",
            href: "/docs/x402fuel",
          },
          {
            title: "ATF (Agent Transaction Firewall)",
            desc: "Policy-enforced guardrails for on-chain transactions on Solana. Layer ATF protection over MeshDNS-discovered services.",
            href: "/docs",
          },
          {
            title: "GitHub Repo",
            desc: "Source code, issue tracker, and discussion board. MIT-licensed. Zero external dependencies — one Go binary.",
            href: "https://github.com/trucore-ai/meshdns",
          },
          {
            title: "Live Registry",
            desc: "See the public registry live — server counts, resolutions/24h, uptime data. All running on Render.",
            href: "https://meshdns.trucore.xyz",
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
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { listPartnerKeysAndUsage } from "@/lib/db";
import {
  PARTNER_PORTAL_COOKIE_NAME,
  resolvePartnerPortalSession,
} from "@/lib/partner-portal";
import { PortalVerifyPanel } from "@/components/portal-verify-panel";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

function fmtDate(iso: string | null) {
  if (!iso) return "-";
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

function getLast4(keyLast4: string | null, keyId: string) {
  if (keyLast4 && keyLast4.length >= 4) return keyLast4.slice(-4);
  return keyId.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || "----";
}

export default async function PartnerPortalPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(PARTNER_PORTAL_COOKIE_NAME)?.value;
  const session = await resolvePartnerPortalSession(sessionCookie);

  if (!session) {
    redirect("/portal/login");
  }

  const keyRows = await listPartnerKeysAndUsage(session.ownerEmail);
  const projectName = session.ownerProject || "Unspecified";

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-8 text-slate-100 md:px-10 md:py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Partner Portal</h1>
              <p className="text-sm text-slate-300">Use your API key with x-api-key to access /api/simulate.</p>
              <p className="text-sm text-slate-300">Your current tier: Partner Sandbox (120 req/min).</p>
              <p className="text-sm text-slate-300">Rate-limit headers: X-RateLimit-Limit/Remaining/Reset.</p>
            </div>

            <form method="POST" action="/portal/logout">
              <button
                type="submit"
                className="rounded border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/20"
              >
                Logout
              </button>
            </form>
          </div>

          <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
            <p>
              <span className="text-slate-400">Email:</span> {session.ownerEmail}
            </p>
            <p>
              <span className="text-slate-400">Project:</span> {projectName}
            </p>
          </div>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">API Keys</h2>
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">Label</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Revoked</th>
                  <th className="px-4 py-3">Last4</th>
                  <th className="px-4 py-3">Tier</th>
                </tr>
              </thead>
              <tbody>
                {keyRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-4 text-slate-400">
                      No API keys found for this partner profile.
                    </td>
                  </tr>
                ) : (
                  keyRows.map((row) => (
                    <tr key={row.id} className="border-b border-white/5 last:border-b-0">
                      <td className="px-4 py-3">{row.label ?? "Partner Sandbox Key"}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(row.created_at)}</td>
                      <td className="px-4 py-3 text-xs">
                        {row.revoked_at ? (
                          <span className="text-amber-300">Revoked</span>
                        ) : (
                          <span className="text-emerald-300">Active</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(row.revoked_at)}</td>
                      <td className="px-4 py-3 font-mono text-xs">••••{getLast4(row.key_last4, row.id)}</td>
                      <td className="px-4 py-3 text-xs text-slate-300">Partner Sandbox</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Usage Snapshots</h2>
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">Label</th>
                  <th className="px-4 py-3">Last Seen</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Last 24h</th>
                  <th className="px-4 py-3">Last 7d</th>
                </tr>
              </thead>
              <tbody>
                {keyRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-slate-400">
                      Usage data appears here after your API key is used.
                    </td>
                  </tr>
                ) : (
                  keyRows.map((row) => (
                    <tr key={`usage-${row.id}`} className="border-b border-white/5 last:border-b-0">
                      <td className="px-4 py-3">{row.label ?? "Partner Sandbox Key"}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(row.last_seen_at)}</td>
                      <td className="px-4 py-3">{row.total_requests}</td>
                      <td className="px-4 py-3">{row.last_24h}</td>
                      <td className="px-4 py-3">{row.last_7d}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <h2 className="text-xl font-semibold">Simulator request examples</h2>
          <p className="text-sm text-slate-300">
            Replace YOUR_API_KEY with your active key value. Keep x-api-key in the request header.
          </p>
          <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-xs text-slate-200">
{`curl -sS https://trucore.xyz/api/simulate \\
  -H "content-type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "action": "swap",
    "token_in": "SOL",
    "token_out": "USDC",
    "amount": 10,
    "max_slippage_bps": 100,
    "ttl_seconds": 60
  }'`}
          </pre>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-semibold text-emerald-300">Sample allowed payload</p>
              <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-xs text-slate-200">
{`{
  "action": "swap",
  "token_in": "SOL",
  "token_out": "USDC",
  "amount": 10,
  "max_slippage_bps": 100,
  "ttl_seconds": 60
}`}
              </pre>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-amber-300">Sample denied payload</p>
              <pre className="overflow-x-auto rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-xs text-slate-200">
{`{
  "action": "swap",
  "token_in": "SOL",
  "token_out": "USDC",
  "amount": 2000,
  "max_slippage_bps": 500,
  "ttl_seconds": 360
}`}
              </pre>
            </div>
          </div>
        </section>

        <PortalVerifyPanel />
      </div>
    </main>
  );
}

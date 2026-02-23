import { redirect } from "next/navigation";
import { AdminCreateKeyForm } from "@/components/admin-create-key-form";
import { PartnerPortalLinkButton } from "@/components/partner-portal-link-button";
import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import { listApiKeysWithUsageSummary, listLatestActivePortalTokensForOwners } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

export default async function AdminKeysPage() {
  const isValid = await getAdminSessionFromCookies();
  if (!isValid) redirect("/admin/login");

  const keys = await listApiKeysWithUsageSummary(200, { includeRevoked: true });
  const ownerEmails = Array.from(new Set(keys.map((key) => key.owner_email?.toLowerCase()).filter(Boolean) as string[]));
  const activePortalTokens = await listLatestActivePortalTokensForOwners(ownerEmails);
  const activePortalTokenByOwner = new Map(
    activePortalTokens.map((token) => [token.owner_email, token]),
  );

  return (
    <div className="min-h-screen bg-neutral-950 p-6 text-slate-100 md:p-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
        <div className="flex items-center gap-3">
          <a
            href="/admin/waitlist"
            className="rounded border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            Waitlist
          </a>
          <a
            href="/admin/audit"
            className="rounded border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            Audit Log
          </a>
          <a
            href="/admin/usage"
            className="rounded border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            Usage
          </a>
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

      <div className="mb-8">
        <AdminCreateKeyForm />
      </div>

      {keys.length === 0 ? (
        <p className="text-sm text-slate-400">No keys created yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Revoked</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Last 7d</th>
                <th className="px-4 py-3">Last Seen</th>
                <th className="px-4 py-3">Portal Access</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => {
                const revoked = Boolean(key.revoked_at);
                const ownerEmail = key.owner_email?.toLowerCase() ?? null;
                const portalToken = ownerEmail ? activePortalTokenByOwner.get(ownerEmail) ?? null : null;
                return (
                  <tr key={key.id} className="border-b border-white/5 last:border-b-0">
                    <td className="px-4 py-3 text-slate-200">{key.label ?? key.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{key.owner_email ?? "-"}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(key.created_at)}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {key.revoked_at ? fmtDate(key.revoked_at) : <span className="text-emerald-300">Active</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-200">{key.total_requests}</td>
                    <td className="px-4 py-3 text-slate-200">{key.last_7d}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{key.last_seen_at ? fmtDate(key.last_seen_at) : "-"}</td>
                    <td className="px-4 py-3">
                      {ownerEmail ? (
                        <PartnerPortalLinkButton
                          email={ownerEmail}
                          projectName={key.owner_project}
                          activeTokenId={portalToken?.id}
                          activeTokenExpiresAt={portalToken?.expires_at}
                        />
                      ) : (
                        <span className="text-xs text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <form method="POST" action="/api/keys/revoke">
                        <input type="hidden" name="id" value={key.id} />
                        <button
                          type="submit"
                          disabled={revoked}
                          className="rounded border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {revoked ? "Revoked" : "Revoke"}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

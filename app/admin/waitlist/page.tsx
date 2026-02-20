import { redirect } from "next/navigation";
import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import {
  listRecentWaitlistSignups,
  PIPELINE_STATUSES,
  type WaitlistSignupRow,
} from "@/lib/db";
import { StatusForm } from "./status-form";
import { NoteForm } from "./note-form";
import { CopyOutreachButton } from "./copy-outreach-button";
import { CsvExportButton } from "./csv-export-button";

/* ---------- types ---------- */

type IntentFilter = "all" | "standard" | "design_partner";
type LimitOption = 25 | 50 | 100;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/* ---------- helpers ---------- */

function parseIntent(raw: string | string[] | undefined): IntentFilter {
  const v = typeof raw === "string" ? raw : undefined;
  if (v === "standard" || v === "design_partner") return v;
  return "all";
}

function parseLimit(raw: string | string[] | undefined): LimitOption {
  const v = typeof raw === "string" ? Number(raw) : NaN;
  if (v === 25 || v === 50 || v === 100) return v;
  return 50;
}

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

function intentBadge(intent: string | null) {
  if (intent === "design_partner") {
    return (
      <span className="inline-block rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300">
        Design Partner
      </span>
    );
  }
  return (
    <span className="inline-block rounded-full bg-sky-500/20 px-2 py-0.5 text-xs font-semibold text-sky-300">
      Standard
    </span>
  );
}

/* ---------- page ---------- */

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminWaitlistPage({ searchParams }: PageProps) {
  const isValid = await getAdminSessionFromCookies();
  if (!isValid) redirect("/admin/login");

  const params = await searchParams;
  const intent = parseIntent(params.intent);
  const limit = parseLimit(params.limit);

  const rows = await listRecentWaitlistSignups({ limit, intent });
  const designPartnerCount = rows.filter(
    (r) => r.intent === "design_partner",
  ).length;

  return (
    <div className="min-h-screen bg-neutral-950 text-slate-100 p-6 md:p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Waitlist Triage
        </h1>
        <div className="flex items-center gap-3">
          <a
            href="/admin/audit"
            className="rounded bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/20 transition"
          >
            Audit Log
          </a>
          <a
            href="/admin/csp"
            className="rounded bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/20 transition"
          >
            CSP Reports
          </a>
          <form method="POST" action="/admin/logout">
            <button
              type="submit"
              className="rounded bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/20 transition"
            >
              Logout
            </button>
          </form>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Chip label="Total shown" value={rows.length} />
        <Chip label="Design partners" value={designPartnerCount} />
      </div>

      {/* Top actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 text-sm">
          <FilterGroup
            label="Intent"
            param="intent"
            current={intent}
            options={[
              { value: "all", label: "All" },
              { value: "design_partner", label: "Design Partner" },
              { value: "standard", label: "Standard" },
            ]}
            limit={limit}
          />
          <FilterGroup
            label="Limit"
            param="limit"
            current={String(limit)}
            options={[
              { value: "25", label: "25" },
              { value: "50", label: "50" },
              { value: "100", label: "100" },
            ]}
            limit={limit}
            intentFilter={intent}
          />
        </div>

        {/* CSV Export */}
        <CsvExportButton />
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <p className="text-slate-400">No signups found for this filter.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Intent</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Integrations</th>
                <th className="px-4 py-3">Tx Volume</th>
                <th className="px-4 py-3">Build Stage</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <SignupRow key={i} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------- sub-components ---------- */

function Chip({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-slate-100">{value}</span>
    </div>
  );
}

function FilterGroup({
  label,
  param,
  current,
  options,
  limit,
  intentFilter,
}: {
  label: string;
  param: string;
  current: string;
  options: { value: string; label: string }[];
  limit: number;
  intentFilter?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-400">{label}:</span>
      <div className="flex gap-1">
        {options.map((opt) => {
          const isActive = current === opt.value;
          const href =
            param === "intent"
              ? `?intent=${opt.value}&limit=${limit}`
              : `?intent=${intentFilter ?? "all"}&limit=${opt.value}`;
          return (
            <a
              key={opt.value}
              href={href}
              className={`rounded px-2.5 py-1 transition ${
                isActive
                  ? "bg-primary-500/20 text-primary-300 font-medium"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              {opt.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-emerald-500/20 text-emerald-300",
  contacted: "bg-sky-500/20 text-sky-300",
  qualified: "bg-violet-500/20 text-violet-300",
  closed: "bg-neutral-500/20 text-neutral-400",
};

function statusBadge(status: string) {
  const color = STATUS_COLORS[status] ?? STATUS_COLORS.new;
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}
    >
      {status}
    </span>
  );
}

function SignupRow({
  row,
}: {
  row: WaitlistSignupRow;
}) {
  const useCase = row.use_case ?? "";
  const truncated =
    useCase.length > 80 ? useCase.slice(0, 80) + "..." : useCase;
  const showExpand = useCase.length > 80;
  const colSpan = 11;

  const notes = row.admin_notes ?? "";
  const notesTruncated =
    notes.length > 100 ? notes.slice(0, 100) + "..." : notes;

  return (
    <>
      <tr className="border-b border-white/5 hover:bg-white/[0.03] transition">
        <td className="px-4 py-3 whitespace-nowrap text-slate-400 text-xs">
          {fmtDate(row.created_at)}
        </td>
        <td className="px-4 py-3">{intentBadge(row.intent)}</td>
        <td className="px-4 py-3">{statusBadge(row.status ?? "new")}</td>
        <td className="px-4 py-3 font-mono text-xs">{row.email}</td>
        <td className="px-4 py-3 text-slate-300">
          {row.project_name ?? <span className="text-slate-600">-</span>}
        </td>
        <td className="px-4 py-3 text-slate-300 text-xs">
          {row.integrations_interest?.join(", ") ?? (
            <span className="text-slate-600">-</span>
          )}
        </td>
        <td className="px-4 py-3 text-slate-300 text-xs">
          {row.tx_volume_bucket ?? <span className="text-slate-600">-</span>}
        </td>
        <td className="px-4 py-3 text-slate-300 text-xs">
          {row.build_stage ?? <span className="text-slate-600">-</span>}
        </td>
        <td className="px-4 py-3 text-slate-300 text-xs">
          {row.role ?? <span className="text-slate-600">-</span>}
        </td>
        <td className="px-4 py-3 text-xs max-w-[220px]">
          <details>
            <summary className="cursor-pointer select-none text-slate-400 hover:text-slate-200 transition">
              {notesTruncated || <span className="text-slate-600">+ Add note</span>}
            </summary>
            <div className="mt-2">
              <NoteForm
                email={row.email}
                currentNotes={notes}
              />
            </div>
          </details>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <StatusForm
              email={row.email}
              currentStatus={row.status ?? "new"}
              statuses={[...PIPELINE_STATUSES]}
            />
            {row.intent === "design_partner" && (
              <CopyOutreachButton
                name={row.project_name ?? row.email}
              />
            )}
          </div>
        </td>
      </tr>
      {useCase && (
        <tr className="border-b border-white/5">
          <td colSpan={colSpan} className="px-4 py-2 text-xs text-slate-500">
            <details>
              <summary className="cursor-pointer select-none hover:text-slate-300 transition">
                {showExpand ? truncated : useCase}
              </summary>
              {showExpand && (
                <p className="mt-1 text-slate-400 whitespace-pre-wrap">
                  {useCase}
                </p>
              )}
            </details>
          </td>
        </tr>
      )}
    </>
  );
}

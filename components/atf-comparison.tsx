import { Section } from "@/components/ui/section";

const rows = [
  {
    middleware: "Authenticates requests",
    atf: "Enforces signed permits",
  },
  {
    middleware: "Logs events",
    atf: "Generates deterministic receipts",
  },
  {
    middleware: "Post-execution audit",
    atf: "Pre-execution enforcement",
  },
  {
    middleware: "Stateless filtering",
    atf: "Policy-bound invariant evaluation",
  },
];

export function AtfComparison() {
  return (
    <Section className="border-t border-white/10 fade-in-up">
      <div className="mb-8 max-w-3xl">
        <h2 className="text-4xl font-bold tracking-tight text-[#f0a050]">
          Why ATF Is Not Just an API Gateway
        </h2>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-neutral-900/40">
        <table className="w-full min-w-[640px] text-left text-slate-200">
          <thead className="border-b border-white/10 bg-white/[0.02]">
            <tr>
              <th className="px-5 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-slate-300">
                Generic Middleware
              </th>
              <th className="px-5 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-slate-300">
                ATF
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.middleware} className="border-b border-white/10 last:border-0">
                <td className="px-5 py-4 text-base leading-relaxed">{row.middleware}</td>
                <td className="px-5 py-4 text-base font-semibold leading-relaxed text-slate-100">
                  {row.atf}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
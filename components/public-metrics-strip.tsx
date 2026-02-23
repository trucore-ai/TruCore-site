import { Card } from "@/components/ui/card";

const publicMetrics = [
  "v0.1.0 released",
  "CI enforced (lint + unit + e2e)",
  "Security headers + CSP reporting",
  "Admin audit logging + receipts posture",
  "Public roadmap + status checks",
];

export function PublicMetricsStrip() {
  return (
    <section aria-label="Public credibility signals" className="border-t border-white/10 py-10 sm:py-12">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {publicMetrics.map((item) => (
          <Card key={item} className="p-4 sm:p-5">
            <p className="text-center text-sm font-medium leading-[1.45] text-slate-200 sm:text-base">
              {item}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}

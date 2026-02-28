import { Card } from "@/components/ui/card";

export function RiskBoundaryBlock() {
  return (
    <Card>
      <h2 className="text-3xl font-bold text-[#f0a050]">Risk Boundary</h2>
      <p className="mt-4 text-xl leading-[1.5] text-slate-200">
        ATF enforces policy before execution. It does not custody funds, sign
        transactions, or hold user assets.
      </p>
    </Card>
  );
}
"use client";

/**
 * PolicyBooleanLever — segmented 3-option control for boolean policy fields.
 *
 * Replaces a plain <select> with Plan default / Require simulation / Skip simulation.
 * Designed for `require_simulation_success` but accepts any boolean field key.
 */

export interface PolicyBooleanLeverOption {
  value: "" | "true" | "false";
  label: string;
  sub?: string | null;
}

export interface PolicyBooleanLeverProps {
  fieldKey: string;
  /** Current form value: "" = plan default, "true", or "false" */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Whether policy overrides are enabled for this plan. */
  overridesEnabled?: boolean;
  /** Whether a stored override currently exists in the persisted overrides object. */
  hasStoredOverride?: boolean;
  /** Optional PIL recommendation tag: "Met" | "PIL recommends on" | null */
  pilTag?: string | null;
  /** Sub-text for Plan default option, e.g. "Currently: required" */
  planDefaultSub?: string | null;
}

const OPTION_BASE: Omit<PolicyBooleanLeverOption, "sub">[] = [
  { value: "", label: "Plan default" },
  { value: "true", label: "Require simulation" },
  { value: "false", label: "Skip simulation" },
];

const OPTION_SUB: Record<string, string> = {
  "": "Uses your plan's configured setting",
  true: "Transactions must pass before executing",
  false: "Execute without pre-check",
};

export function PolicyBooleanLever({
  fieldKey,
  value,
  onChange,
  disabled = false,
  overridesEnabled = true,
  hasStoredOverride = false,
  pilTag,
  planDefaultSub,
}: PolicyBooleanLeverProps) {
  const options: PolicyBooleanLeverOption[] = OPTION_BASE.map((o) => ({
    ...o,
    sub: o.value === "" ? (planDefaultSub ?? OPTION_SUB[""]) : OPTION_SUB[o.value],
  }));

  return (
    <div className="space-y-2" data-testid={`boolean-lever-${fieldKey}`}>
      {/* Segmented control */}
      <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] p-1.5">
        {options.map((opt) => {
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled || !overridesEnabled}
              onClick={() => onChange(opt.value)}
              className={`rounded-lg px-3 py-2.5 text-left transition-all disabled:opacity-50 ${
                isActive
                  ? opt.value === "false"
                    ? "border border-orange-500/40 bg-orange-500/10 shadow-sm"
                    : opt.value === "true"
                      ? "border border-emerald-500/30 bg-emerald-500/10 shadow-sm"
                      : "border border-white/20 bg-white/[0.06] shadow-sm"
                  : "border border-transparent hover:bg-white/[0.04]"
              }`}
              data-testid={`bool-option-${fieldKey}-${opt.value === "" ? "default" : opt.value}`}
            >
              <span
                className={`block text-[11px] font-semibold leading-tight ${
                  isActive
                    ? opt.value === "false"
                      ? "text-orange-200"
                      : opt.value === "true"
                        ? "text-emerald-200"
                        : "text-slate-100"
                    : "text-slate-400"
                }`}
              >
                {opt.label}
              </span>
              {opt.sub && (
                <span className="block mt-0.5 text-[9px] text-slate-500 leading-tight">
                  {opt.sub}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Override status row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] ${
              value !== "" ? "text-amber-400/80" : "text-slate-600"
            }`}
            data-testid={`override-status-${fieldKey}`}
          >
            {value !== "" ? "Override active" : "Using plan default"}
          </span>
          {pilTag && (
            <span
              className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium border ${
                pilTag === "Met"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
              }`}
              data-testid={`pil-tag-${fieldKey}`}
            >
              {pilTag}
            </span>
          )}
        </div>
        {value !== "" && hasStoredOverride && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange("")}
            className="text-[10px] text-slate-500 hover:text-slate-300 transition underline underline-offset-2 disabled:opacity-40"
            data-testid={`clear-override-${fieldKey}`}
          >
            Clear override
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * ATF Execution Lifecycle Diagram
 *
 * Static SVG horizontal flow showing the six lifecycle steps.
 * Responsive, dark-mode compatible, blue + orange accent glows.
 */
export function AtfLifecycleDiagram() {
  const steps = [
    { id: 1, label: "Intent\nCreation", color: "blue" },
    { id: 2, label: "Policy\nEvaluation", color: "blue" },
    { id: 3, label: "Permit\nIssuance", color: "blue" },
    { id: 4, label: "Transaction\nConstruction", color: "orange" },
    { id: 5, label: "Execution\nValidation", color: "orange" },
    { id: 6, label: "Receipt\nAnchoring", color: "blue" },
  ] as const;

  const boxW = 120;
  const boxH = 72;
  const gap = 24;
  const arrowLen = gap;
  const totalW = steps.length * boxW + (steps.length - 1) * gap;
  const svgW = totalW + 40; // 20px padding each side
  const svgH = boxH + 40;

  function boxColor(c: "blue" | "orange") {
    return c === "blue"
      ? { fill: "#349de8", stroke: "#8ed3ff", text: "#eef8ff", glow: "rgba(52,157,232,0.15)" }
      : { fill: "#d86c08", stroke: "#f08a1f", text: "#ffe0b2", glow: "rgba(240,138,31,0.15)" };
  }

  return (
    <div className="mx-auto max-w-5xl overflow-x-auto rounded-xl border border-white/10 bg-neutral-900/60 p-4 sm:p-8">
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full"
        role="img"
        aria-label="ATF execution lifecycle: Intent Creation, Policy Evaluation, Permit Issuance, Transaction Construction, Execution Validation, Receipt Anchoring"
      >
        <defs>
          <filter id="lcGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {steps.map((step, i) => {
          const x = 20 + i * (boxW + gap);
          const y = 20;
          const { fill, stroke, text, glow } = boxColor(step.color);
          const lines = step.label.split("\n");

          return (
            <g key={step.id}>
              {/* Glow rect */}
              <rect
                x={x - 2}
                y={y - 2}
                width={boxW + 4}
                height={boxH + 4}
                rx={14}
                fill={glow}
                filter="url(#lcGlow)"
              />
              {/* Box */}
              <rect
                x={x}
                y={y}
                width={boxW}
                height={boxH}
                rx={12}
                fill="#0b1220"
                stroke={stroke}
                strokeWidth={1.5}
              />
              {/* Step number */}
              <text
                x={x + boxW / 2}
                y={y + 18}
                textAnchor="middle"
                fill={fill}
                fontSize="11"
                fontWeight="700"
                fontFamily="system-ui, sans-serif"
              >
                {step.id}
              </text>
              {/* Label lines */}
              {lines.map((line, li) => (
                <text
                  key={li}
                  x={x + boxW / 2}
                  y={y + 34 + li * 16}
                  textAnchor="middle"
                  fill={text}
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="system-ui, sans-serif"
                >
                  {line}
                </text>
              ))}

              {/* Arrow to next box */}
              {i < steps.length - 1 && (
                <>
                  <line
                    x1={x + boxW + 2}
                    y1={y + boxH / 2}
                    x2={x + boxW + arrowLen - 6}
                    y2={y + boxH / 2}
                    stroke="#5cbcfb"
                    strokeWidth={1.5}
                  />
                  <polygon
                    points={`${x + boxW + arrowLen - 6},${y + boxH / 2 - 4} ${x + boxW + arrowLen},${y + boxH / 2} ${x + boxW + arrowLen - 6},${y + boxH / 2 + 4}`}
                    fill="#5cbcfb"
                  />
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

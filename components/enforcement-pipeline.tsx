"use client";

import { useEffect, useRef, useState } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/* ─── Timeline ───
   Single phase counter drives the whole animation.
   Each phase has a duration; phase 15 holds, then resets. */

const PHASE_DURATIONS: number[] = [
  700,  // 0  agent active
  480,  // 1  packet → policy
  340,  // 2  rule 1 ✓
  340,  // 3  rule 2 ✓
  340,  // 4  rule 3 ✓
  340,  // 5  rule 4 ✓
  650,  // 6  ALLOW badge
  480,  // 7  packet → probe
  1150, // 8  probe radar sweep
  480,  // 9  packet → execute
  850,  // 10 execute pulse
  480,  // 11 packet → receipt
  500,  // 12 receipt pop
  650,  // 13 hash reveal
  750,  // 14 VERIFIED badge
  2300, // 15 hold
];
const FINAL_PHASE = 14;

const CAPTIONS: Record<number, string> = {
  0: "Agent submits transaction intent",
  1: "Routing to policy engine…",
  2: "Evaluating policy rules…",
  6: "ALLOW - deterministic decision",
  7: "Passing to intelligence layer…",
  8: "Probe scanning for risk signals",
  9: "Clear - routing to execution…",
  10: "Executing on Solana",
  11: "Sealing receipt…",
  12: "Receipt materializing…",
  14: "Cryptographically verifiable by anyone",
};

function captionFor(phase: number): string {
  let caption = CAPTIONS[0];
  for (const key of Object.keys(CAPTIONS).map(Number).sort((a, b) => a - b)) {
    if (phase >= key) caption = CAPTIONS[key];
  }
  return caption;
}

function isMotionReduced(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/* ─── Inline icons ─── */

function BotIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <rect x="4" y="8" width="16" height="12" rx="3" />
      <path d="M12 8V5" />
      <circle cx="12" cy="3.5" r="1.5" />
      <circle cx="9" cy="13.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="13.5" r="1" fill="currentColor" stroke="none" />
      <path d="M9.5 17h5" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" />
      <path d="M9.5 12l2 2 3.5-3.5" />
    </svg>
  );
}

function RadarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" opacity="0.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <path d="M12 12l6-6" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <path d="M13 2L4.5 13.5H11L9.5 22 19 10h-6.5L13 2z" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <path d="M6 2h12v20l-2-1.5L14 22l-2-1.5L10 22l-2-1.5L6 22V2z" />
      <path d="M9 7h6M9 11h6M9 15h3" />
    </svg>
  );
}

/* ─── Node shell ─── */

type NodeState = "idle" | "current" | "done";

const NODE_STYLES: Record<NodeState, string> = {
  idle: "border-white/[0.08] bg-neutral-900/40",
  current: "border-accent-400/60 bg-neutral-900/70 shadow-glow-accent",
  done: "border-primary-300/30 bg-neutral-900/50",
};

const ICON_STYLES: Record<NodeState, string> = {
  idle: "border-white/10 bg-white/[0.03] text-slate-500",
  current: "border-accent-400/50 bg-accent-500/15 text-accent-300",
  done: "border-primary-300/30 bg-primary-500/10 text-primary-200",
};

interface NodeProps {
  state: NodeState;
  icon: React.ReactNode;
  label: string;
  children?: React.ReactNode;
}

function PipelineNode({ state, icon, label, children }: NodeProps) {
  return (
    <div
      className={`pipeline-node flex-1 rounded-xl border p-3 transition-all duration-300 sm:p-4 ${NODE_STYLES[state]}`}
    >
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all duration-300 ${ICON_STYLES[state]}`}
        >
          {icon}
        </div>
        <p className="text-sm font-bold text-slate-100 sm:text-[15px]">{label}</p>
      </div>
      {children && <div className="mt-3 min-h-[52px]">{children}</div>}
    </div>
  );
}

/* ─── Connector ─── */

function Connector({ packetPhase, phase }: { packetPhase: number; phase: number }) {
  const lit = phase >= packetPhase;
  const traveling = phase === packetPhase;
  return (
    <div className="pipeline-conn relative flex items-center justify-center" aria-hidden="true">
      <div
        className={`pipeline-line transition-colors duration-300 ${
          lit ? "bg-primary-300/40" : "bg-white/[0.08]"
        }`}
      />
      {traveling && <div key={packetPhase} className="pipeline-packet" />}
    </div>
  );
}

/* ─── Main component ─── */

/**
 * The Enforcement Pipeline: an animated flow diagram of the ATF
 * lifecycle: Agent → Policy Gate → Intelligent Probe → Execute →
 * Cryptographic Receipt. A glowing packet travels stage to stage;
 * each stage lights up and runs its micro-animation on arrival.
 *
 * Loops continuously. Always animates - the site animation toggle
 * only gates background effects. Only the OS-level
 * prefers-reduced-motion setting renders the completed state.
 */
export function EnforcementPipeline() {
  const [phase, setPhase] = useState(0);
  const [started, setStarted] = useState(false);
  const [reduced, setReduced] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const displayPhase = reduced ? FINAL_PHASE : phase;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const mq = window.matchMedia(REDUCED_MOTION_QUERY);
    const syncReduced = () => setReduced(mq.matches);
    syncReduced();
    mq.addEventListener("change", syncReduced);

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setStarted(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);

    return () => {
      obs.disconnect();
      mq.removeEventListener("change", syncReduced);
    };
  }, []);

  useEffect(() => {
    if (!started || reduced) return;
    timerRef.current = setTimeout(() => {
      setPhase((p) => (p >= PHASE_DURATIONS.length - 1 ? 0 : p + 1));
    }, PHASE_DURATIONS[phase]);
    return () => clearTimeout(timerRef.current);
  }, [started, reduced, phase]);

  /* Derived state */
  const p = displayPhase;
  const rulesShown = p < 2 ? 0 : Math.min(4, p - 1);
  const allowShown = p >= 6;
  const probeActive = p === 8;
  const probeDone = p > 8;
  const executeActive = p === 10;
  const executeDone = p > 10;
  const receiptShown = p >= 12;
  const hashShown = p >= 13;
  const verifiedShown = p >= 14;

  const agentState: NodeState = p === 0 ? "current" : p > 0 ? "done" : "idle";
  const policyState: NodeState = p >= 2 && p <= 6 ? "current" : p > 6 ? "done" : "idle";
  const probeState: NodeState = p === 8 ? "current" : probeDone ? "done" : "idle";
  const executeState: NodeState = p === 10 ? "current" : executeDone ? "done" : "idle";
  const receiptState: NodeState = p >= 12 ? "current" : "idle";

  const RULES = ["spend cap", "allowlist", "slippage", "ttl + nonce"];

  return (
    <div ref={rootRef} className="w-full">
      <div className="pipeline flex flex-col items-stretch gap-0 sm:flex-row sm:items-stretch">
        {/* 1 - Agent */}
        <PipelineNode state={agentState} icon={<BotIcon />} label="AI Agent">
          <p className={`text-xs leading-relaxed transition-opacity duration-300 ${p >= 0 ? "text-slate-400 opacity-100" : "opacity-0"}`}>
            submits tx intent with policy permit
          </p>
        </PipelineNode>

        <Connector packetPhase={1} phase={p} />

        {/* 2 - Policy Gate */}
        <PipelineNode state={policyState} icon={<ShieldIcon />} label="Policy Gate">
          <ul className="space-y-1">
            {RULES.map((rule, i) => (
              <li
                key={rule}
                className={`flex items-center gap-1.5 font-mono text-[11px] transition-all duration-200 ${
                  i < rulesShown ? "text-emerald-400/90 opacity-100" : "text-slate-600 opacity-40"
                }`}
              >
                <span>{i < rulesShown ? "✓" : "·"}</span>
                {rule}
              </li>
            ))}
          </ul>
          {allowShown && (
            <p className="mt-1.5 inline-block rounded-md border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-300">
              ALLOW
            </p>
          )}
        </PipelineNode>

        <Connector packetPhase={7} phase={p} />

        {/* 3 - Intelligent Probe */}
        <PipelineNode state={probeState} icon={<RadarIcon />} label="Intelligent Probe">
          <div className="flex items-center gap-2.5">
            <div className="radar-ring relative h-9 w-9 shrink-0 rounded-full border border-primary-300/25">
              <div className="absolute inset-[7px] rounded-full border border-primary-300/15" />
              <div className={`radar-sweep absolute inset-0 rounded-full ${probeActive ? "radar-sweep-active" : ""}`} />
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              {probeDone ? (
                <span className="text-emerald-400/90">no risk signals</span>
              ) : probeActive ? (
                "scanning…"
              ) : (
                "risk scan · PIL"
              )}
            </p>
          </div>
        </PipelineNode>

        <Connector packetPhase={9} phase={p} />

        {/* 4 - Execute */}
        <PipelineNode state={executeState} icon={<BoltIcon />} label="Execute">
          <div className="relative flex items-center gap-2.5">
            {(executeActive || executeDone) && <span className="pulse-ring" aria-hidden="true" />}
            <p className="text-xs leading-relaxed text-slate-400">
              {executeDone ? (
                <span className="text-emerald-400/90">confirmed on-chain</span>
              ) : executeActive ? (
                "Solana · executing…"
              ) : (
                "on-chain settlement"
              )}
            </p>
          </div>
        </PipelineNode>

        <Connector packetPhase={11} phase={p} />

        {/* 5 - Receipt */}
        <PipelineNode state={receiptState} icon={<ReceiptIcon />} label="Receipt">
          <div
            className={`transition-all duration-300 ${
              receiptShown ? "receipt-pop opacity-100" : "opacity-0"
            }`}
          >
            <p className="font-mono text-[11px] text-slate-400">
              {hashShown ? "sha256 8d41f2…a7e3" : "sealing…"}
            </p>
            {verifiedShown && (
              <p className="mt-1.5 inline-block rounded-md border border-accent-400/40 bg-accent-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-accent-300">
                ✓ VERIFIED
              </p>
            )}
          </div>
        </PipelineNode>
      </div>

      {/* Live caption */}
      <p
        className="mt-5 text-center font-mono text-sm text-slate-400"
        aria-live="polite"
      >
        <span className="text-primary-300">▸</span> {captionFor(p)}
      </p>
    </div>
  );
}

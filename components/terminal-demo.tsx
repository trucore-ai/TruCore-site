"use client";

import { useEffect, useRef, useState } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/* ─── Transcript model ─── */

interface TermLine {
  text: string;
  /** tailwind-ish semantic class */
  cls: "cmd" | "ok" | "dim" | "accent" | "head" | "plain";
  /** commands are typed char-by-char; output appears whole */
  typed?: boolean;
  /** pause after this line completes (ms) */
  pause?: number;
}

const SCRIPT: TermLine[] = [
  { text: "npm install -g @trucore/atf", cls: "cmd", typed: true, pause: 200 },
  { text: "added 1 package in 1.8s", cls: "dim", pause: 550 },

  { text: "atf trade --demo", cls: "cmd", typed: true, pause: 250 },
  { text: "◆ ATF v1.4.2 · policy: demo-default (4 rules)", cls: "head", pause: 300 },
  { text: "evaluating transaction…", cls: "dim", pause: 420 },
  { text: "✓ spend_cap     0.50 SOL ≤ 2.00 SOL max", cls: "ok", pause: 260 },
  { text: "✓ protocol      jupiter:swap · allowlisted", cls: "ok", pause: 260 },
  { text: "✓ slippage      0.42% ≤ 1.00% bound", cls: "ok", pause: 260 },
  { text: "✓ ttl_nonce     permit fresh · no replay", cls: "ok", pause: 420 },
  { text: "decision: ALLOW", cls: "accent", pause: 380 },
  { text: "executing on solana devnet…", cls: "dim", pause: 600 },
  { text: "✓ confirmed 5Kz9…fQ4m · slot 284,112,003", cls: "ok", pause: 380 },
  { text: "receipt rcp_7f3a9c2e1b4d · sha256 8d41f2…a7e3", cls: "plain", pause: 650 },

  { text: "atf setup", cls: "cmd", typed: true, pause: 250 },
  { text: "✓ api key stored · scopes: trade, verify", cls: "ok", pause: 600 },

  { text: "atf doctor", cls: "cmd", typed: true, pause: 250 },
  { text: "✓ config ok · network ok (41ms) · wallet funded", cls: "ok", pause: 300 },
  { text: "all checks passed", cls: "accent", pause: 650 },

  { text: "atf verify rcp_7f3a9c2e1b4d", cls: "cmd", typed: true, pause: 250 },
  { text: "✓ signature valid · policy hash matches", cls: "ok", pause: 300 },
  { text: "✓ on-chain anchor confirmed", cls: "ok", pause: 420 },
  { text: "VERIFIED - anyone can verify this receipt", cls: "accent", pause: 0 },
];

const CLS: Record<TermLine["cls"], string> = {
  cmd: "text-slate-100",
  ok: "text-emerald-400/90",
  dim: "text-slate-500",
  accent: "text-accent-300 font-semibold",
  head: "text-primary-200",
  plain: "text-slate-300",
};

const TYPE_MS = 26;
const LINE_MS = 95;

function isMotionReduced(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * Live terminal demo - types the ATF golden path (install, trade,
 * setup, doctor, verify) with realistic CLI output. Plays once when
 * scrolled into view, then holds the final VERIFIED state.
 *
 * Always animates (site animation toggle only gates background
 * effects); only the OS-level prefers-reduced-motion setting renders
 * the full transcript instantly.
 */
export function TerminalDemo() {
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [started, setStarted] = useState(false);
  const [reduced, setReduced] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const done = reduced || lineIdx >= SCRIPT.length;

  /* Start when visible */
  useEffect(() => {
    const el = bodyRef.current?.parentElement;
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
      { threshold: 0.35 },
    );
    obs.observe(el);

    return () => {
      obs.disconnect();
      mq.removeEventListener("change", syncReduced);
    };
  }, []);

  /* Playback engine */
  useEffect(() => {
    if (!started || reduced) return;
    if (lineIdx >= SCRIPT.length) return;

    const line = SCRIPT[lineIdx];

    if (line.typed && charIdx < line.text.length) {
      timerRef.current = setTimeout(() => setCharIdx((c) => c + 1), TYPE_MS);
    } else {
      const delay = line.typed ? (line.pause ?? 300) : LINE_MS + (line.pause ?? 0);
      timerRef.current = setTimeout(() => {
        setLineIdx((i) => i + 1);
        setCharIdx(0);
      }, delay);
    }

    return () => clearTimeout(timerRef.current);
  }, [started, reduced, lineIdx, charIdx]);

  /* Auto-scroll to bottom */
  useEffect(() => {
    const body = bodyRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  }, [lineIdx, charIdx]);

  const visibleLines = done ? SCRIPT : SCRIPT.slice(0, lineIdx);
  const currentLine = !done && SCRIPT[lineIdx]?.typed ? SCRIPT[lineIdx] : null;
  const typedText = currentLine ? currentLine.text.slice(0, charIdx) : "";

  return (
    <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-xl border border-white/10 bg-neutral-950/90 shadow-elevated">
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.03] px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" aria-hidden="true" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" aria-hidden="true" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" aria-hidden="true" />
        <span className="ml-3 font-mono text-xs text-slate-500">
          atf - golden path demo
        </span>
      </div>

      {/* Transcript */}
      <div
        ref={bodyRef}
        className="h-[380px] overflow-y-auto px-4 py-4 font-mono text-[13px] leading-[1.7] sm:text-sm"
        aria-label="Terminal demo showing the ATF golden path: install, trade, setup, doctor, verify"
      >
        {visibleLines.map((line, i) => (
          <div key={i} className={CLS[line.cls]}>
            {line.cls === "cmd" ? (
              <>
                <span className="select-none text-primary-300">$ </span>
                {line.text}
              </>
            ) : (
              <span className="whitespace-pre-wrap">{line.text}</span>
            )}
          </div>
        ))}

        {/* Currently typing command */}
        {currentLine && (
          <div className={CLS.cmd}>
            <span className="select-none text-primary-300">$ </span>
            {typedText}
            <span className="term-cursor" aria-hidden="true" />
          </div>
        )}

        {/* Idle cursor after completion */}
        {done && (
          <div className={CLS.cmd}>
            <span className="select-none text-primary-300">$ </span>
            <span className="term-cursor" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}

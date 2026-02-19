"use client";

import { useEffect, useRef, useCallback } from "react";

/* ─── Types ─── */
interface Pulse {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  lifetime: number;
  width: number;
  isOrange: boolean;
  trail: { x: number; y: number; alpha: number }[];
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  lifetime: number;
  alpha: number;
}

/* ─── Deterministic PRNG (mulberry32) ─── */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ─── Constants ─── */
const MIN_INTERVAL = 10_000; // ms between pulses
const MAX_INTERVAL = 20_000;
const PULSE_LIFETIME = 4_000; // ms for a pulse to traverse
const SPARK_CHANCE = 0.12; // per frame chance of spark per active pulse
const SPARK_LIFETIME = 600;
const TRAIL_LENGTH = 18;

export function HeroBackgroundPulses() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  /* We keep mutable state in refs so the animation loop never triggers re-renders */
  const pulsesRef = useRef<Pulse[]>([]);
  const sparksRef = useRef<Spark[]>([]);
  const nextSpawnRef = useRef<number>(0);
  const randRef = useRef(mulberry32(42));

  /** Schedule a pulse spawn between MIN and MAX interval from now */
  const scheduleNext = useCallback((now: number) => {
    const rand = randRef.current;
    nextSpawnRef.current =
      now + MIN_INTERVAL + rand() * (MAX_INTERVAL - MIN_INTERVAL);
  }, []);

  /** Spawn a new pulse */
  const spawnPulse = useCallback(
    (w: number, h: number) => {
      const rand = randRef.current;
      const fromLeft = rand() < 0.5;
      const x = fromLeft ? -20 : w + 20;
      const targetX = w * (0.35 + rand() * 0.3);
      const targetY = h * (0.3 + rand() * 0.4);
      const y = h * (0.1 + rand() * 0.5);
      const dx = targetX - x;
      const dy = targetY - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = dist / (PULSE_LIFETIME / 16.67); // px per frame at ~60fps

      const pulse: Pulse = {
        x,
        y,
        vx: (dx / dist) * speed,
        vy: (dy / dist) * speed,
        age: 0,
        lifetime: PULSE_LIFETIME,
        width: 120 + rand() * 80,
        isOrange: rand() < 0.167, // ~1 in 6
        trail: [],
      };
      pulsesRef.current.push(pulse);
    },
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    /* ── Reduced motion ── */
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = mq.matches;
    const onMqChange = (e: MediaQueryListEvent) => {
      reducedMotion = e.matches;
    };
    mq.addEventListener("change", onMqChange);

    /* ── Resize handler ── */
    let dw = 0;
    let dh = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      dw = rect.width;
      dh = rect.height;
      canvas.width = dw * dpr;
      canvas.height = dh * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    /* ── Mouse ── */
    const onMouse = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX / window.innerWidth;
      mouseRef.current.y = e.clientY / window.innerHeight;
    };
    window.addEventListener("mousemove", onMouse, { passive: true });

    /* ── Visibility ── */
    let hidden = false;
    const onVis = () => {
      hidden = document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);

    /* ── Init scheduling ── */
    const now = performance.now();
    // Spawn first pulse quickly (2–5s) so the user sees something early
    nextSpawnRef.current = now + 2000 + randRef.current() * 3000;

    /* ── Gradient precomputation ─── */
    const makeHeadGrad = (
      cx: number,
      cy: number,
      r: number,
      isOrange: boolean,
      alpha: number,
    ) => {
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      if (isOrange) {
        grad.addColorStop(0, `rgba(240, 138, 31, ${alpha * 0.9})`);
        grad.addColorStop(0.4, `rgba(216, 108, 8, ${alpha * 0.5})`);
        grad.addColorStop(1, `rgba(216, 108, 8, 0)`);
      } else {
        grad.addColorStop(0, `rgba(142, 211, 255, ${alpha * 0.85})`);
        grad.addColorStop(0.35, `rgba(52, 157, 232, ${alpha * 0.45})`);
        grad.addColorStop(1, `rgba(30, 105, 165, 0)`);
      }
      return grad;
    };

    /* ── Draw helpers ── */
    const drawPulse = (p: Pulse, dt: number) => {
      const progress = p.age / p.lifetime;
      const fadeIn = Math.min(progress * 5, 1);
      const fadeOut = 1 - Math.max((progress - 0.6) / 0.4, 0);
      const alpha = fadeIn * fadeOut;
      const shrink = 1 - progress * 0.6;
      const headRadius = p.width * 0.25 * shrink;

      /* Camera yaw influence */
      const yaw = (mouseRef.current.x - 0.5) * 12;
      const pitch = (mouseRef.current.y - 0.5) * 6;

      const px = p.x + yaw * progress;
      const py = p.y + pitch * progress;

      /* Trail */
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < p.trail.length; i++) {
        const t = p.trail[i];
        const tAlpha = t.alpha * alpha * 0.35;
        if (tAlpha < 0.005) continue;
        const tRadius = headRadius * (0.3 + (i / p.trail.length) * 0.7);
        const trailGrad = ctx.createRadialGradient(
          t.x + yaw * (progress - (i * 0.02)),
          t.y + pitch * (progress - (i * 0.02)),
          0,
          t.x + yaw * (progress - (i * 0.02)),
          t.y + pitch * (progress - (i * 0.02)),
          tRadius,
        );
        if (p.isOrange) {
          trailGrad.addColorStop(0, `rgba(240, 138, 31, ${tAlpha})`);
          trailGrad.addColorStop(1, `rgba(216, 108, 8, 0)`);
        } else {
          trailGrad.addColorStop(0, `rgba(142, 211, 255, ${tAlpha})`);
          trailGrad.addColorStop(1, `rgba(30, 105, 165, 0)`);
        }
        ctx.fillStyle = trailGrad;
        ctx.fillRect(
          t.x - tRadius + yaw * (progress - (i * 0.02)),
          t.y - tRadius + pitch * (progress - (i * 0.02)),
          tRadius * 2,
          tRadius * 2,
        );
      }

      /* Head glow */
      ctx.fillStyle = makeHeadGrad(px, py, headRadius, p.isOrange, alpha);
      ctx.fillRect(px - headRadius, py - headRadius, headRadius * 2, headRadius * 2);

      /* Bright core */
      const coreR = headRadius * 0.18;
      const coreGrad = ctx.createRadialGradient(px, py, 0, px, py, coreR);
      coreGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.9})`);
      coreGrad.addColorStop(1, `rgba(255, 255, 255, 0)`);
      ctx.fillStyle = coreGrad;
      ctx.fillRect(px - coreR, py - coreR, coreR * 2, coreR * 2);

      ctx.globalCompositeOperation = "source-over";

      /* Record trail point */
      p.trail.unshift({ x: p.x, y: p.y, alpha: 1 });
      if (p.trail.length > TRAIL_LENGTH) p.trail.length = TRAIL_LENGTH;
      for (let i = 0; i < p.trail.length; i++) {
        p.trail[i].alpha *= 0.88;
      }

      /* Maybe spawn spark */
      if (randRef.current() < SPARK_CHANCE * (dt / 16.67) && alpha > 0.3) {
        const rand = randRef.current;
        sparksRef.current.push({
          x: px,
          y: py,
          vx: (rand() - 0.5) * 1.8,
          vy: (rand() - 0.5) * 1.8,
          age: 0,
          lifetime: SPARK_LIFETIME * (0.5 + rand() * 0.5),
          alpha: 0.4 + rand() * 0.4,
        });
      }
    };

    const drawSpark = (s: Spark) => {
      const progress = s.age / s.lifetime;
      const alpha = s.alpha * (1 - progress);
      if (alpha < 0.01) return;
      const r = 1.5 * (1 - progress * 0.5);
      ctx.globalCompositeOperation = "lighter";
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r);
      grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      grad.addColorStop(1, `rgba(142, 211, 255, 0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(s.x - r, s.y - r, r * 2, r * 2);
      ctx.globalCompositeOperation = "source-over";
    };

    const drawStaticBackground = () => {
      /* Reduced motion: gentle gradient + one central glow */
      const bg = ctx.createLinearGradient(0, 0, 0, dh);
      bg.addColorStop(0, "#0b1220");
      bg.addColorStop(1, "#050a14");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, dw, dh);

      const cx = dw * 0.5;
      const cy = dh * 0.4;
      const r = Math.min(dw, dh) * 0.45;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      glow.addColorStop(0, "rgba(52, 157, 232, 0.06)");
      glow.addColorStop(1, "rgba(30, 105, 165, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, dw, dh);
    };

    /* ── Main loop ── */
    let lastTime = performance.now();

    const loop = (time: number) => {
      animRef.current = requestAnimationFrame(loop);

      if (hidden) return;

      const dt = Math.min(time - lastTime, 50); // cap at 50ms (20fps min)
      lastTime = time;

      /* Clear */
      ctx.clearRect(0, 0, dw, dh);

      if (reducedMotion) {
        drawStaticBackground();
        return;
      }

      /* Background gradient */
      const bg = ctx.createLinearGradient(0, 0, 0, dh);
      bg.addColorStop(0, "#0b1220");
      bg.addColorStop(1, "#050a14");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, dw, dh);

      /* Subtle ambient glow */
      const ambCx = dw * 0.5 + (mouseRef.current.x - 0.5) * 30;
      const ambCy = dh * 0.35 + (mouseRef.current.y - 0.5) * 15;
      const ambR = Math.min(dw, dh) * 0.5;
      const ambGrad = ctx.createRadialGradient(ambCx, ambCy, 0, ambCx, ambCy, ambR);
      ambGrad.addColorStop(0, "rgba(52, 157, 232, 0.045)");
      ambGrad.addColorStop(0.6, "rgba(30, 105, 165, 0.015)");
      ambGrad.addColorStop(1, "rgba(5, 10, 20, 0)");
      ctx.fillStyle = ambGrad;
      ctx.fillRect(0, 0, dw, dh);

      /* Spawn check */
      if (time >= nextSpawnRef.current) {
        spawnPulse(dw, dh);
        scheduleNext(time);
      }

      /* Update & draw pulses */
      const pulses = pulsesRef.current;
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.age += dt;
        p.x += p.vx * (dt / 16.67);
        p.y += p.vy * (dt / 16.67);
        if (p.age >= p.lifetime) {
          pulses.splice(i, 1);
          continue;
        }
        drawPulse(p, dt);
      }

      /* Update & draw sparks */
      const sparks = sparksRef.current;
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.age += dt;
        s.x += s.vx * (dt / 16.67);
        s.y += s.vy * (dt / 16.67);
        if (s.age >= s.lifetime) {
          sparks.splice(i, 1);
          continue;
        }
        drawSpark(s);
      }
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
      document.removeEventListener("visibilitychange", onVis);
      mq.removeEventListener("change", onMqChange);
    };
  }, [spawnPulse, scheduleNext]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      style={{ display: "block" }}
    />
  );
}

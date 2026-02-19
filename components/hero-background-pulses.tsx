"use client";

import { useEffect, useRef, useCallback } from "react";

/* ─── Types ─── */

/** A single ray that travels from the edge toward the centre vanishing point */
interface Ray {
  /* Spawn position (on the edge) */
  startX: number;
  startY: number;
  /* Vanishing-point target (centre of screen) */
  targetX: number;
  targetY: number;
  /* Normalised direction toward centre */
  dirX: number;
  dirY: number;
  /* Perpendicular (for sine displacement) */
  perpX: number;
  perpY: number;

  age: number;
  lifetime: number;

  /* Visual style */
  headSize: number;       // base head radius at spawn
  trailWidth: number;     // base lineWidth
  isOrange: boolean;

  /* Sine-pulse schedule: { startT, cycleLen } — each is one full sine cycle */
  pulseCycles: { startT: number; cycleLen: number }[];
  sinAmp: number;         // perpendicular amplitude in px

  /* Trail variety */
  trailLen: number;       // how many trail points to keep
  hasSparks: boolean;     // emits sparks?
  hasSparkleTrail: boolean; // leaves shimmering dots behind?
  trail: { x: number; y: number; alpha: number }[];

  /* Sparkle trail (persistent glitter left behind) */
  sparkles: { x: number; y: number; birth: number; lifetime: number; size: number }[];

  speed: number;          // total dist / lifetime frames
  totalDist: number;

  /* Accumulated mouse-gravity offset */
  gravX: number;
  gravY: number;
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
const MIN_INTERVAL = 180;
const MAX_INTERVAL = 700;
const MIN_LIFETIME = 3_000;
const MAX_LIFETIME = 7_000;
const SPARK_LIFETIME = 420;
const MAX_RAYS = 30;

export function HeroBackgroundPulses() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  const raysRef = useRef<Ray[]>([]);
  const sparksRef = useRef<Spark[]>([]);
  const nextSpawnRef = useRef<number>(0);
  const randRef = useRef(mulberry32(42));

  const scheduleNext = useCallback((now: number) => {
    const rand = randRef.current;
    nextSpawnRef.current =
      now + MIN_INTERVAL + rand() * (MAX_INTERVAL - MIN_INTERVAL);
  }, []);

  const spawnRay = useCallback(
    (w: number, h: number) => {
      if (raysRef.current.length >= MAX_RAYS) return;

      const rand = randRef.current;

      /* Vanishing point — centre of screen with slight jitter */
      const vpX = w * (0.48 + rand() * 0.04);
      const vpY = h * (0.42 + rand() * 0.06);

      /* Spawn on a random edge */
      let sx: number, sy: number;
      const edge = rand();
      if (edge < 0.25) {            // top
        sx = rand() * w; sy = -12;
      } else if (edge < 0.5) {      // bottom
        sx = rand() * w; sy = h + 12;
      } else if (edge < 0.75) {     // left
        sx = -12; sy = rand() * h;
      } else {                       // right
        sx = w + 12; sy = rand() * h;
      }

      const dx = vpX - sx;
      const dy = vpY - sy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const dirX = dx / dist;
      const dirY = dy / dist;

      /* Perpendicular */
      const perpX = -dirY;
      const perpY = dirX;

      /* Lifetime & speed — ray travels ~85-100% of dist to centre */
      const lifetime = MIN_LIFETIME + rand() * (MAX_LIFETIME - MIN_LIFETIME);
      const travelFrac = 0.85 + rand() * 0.15;
      const speed = (dist * travelFrac) / (lifetime / 16.67);

      /* 1-3 sine-pulse cycles, scattered along the ray — mostly short periods */
      const numCycles = 1 + Math.floor(rand() * 3); // 1, 2, or 3
      const pulseCycles: { startT: number; cycleLen: number }[] = [];
      for (let c = 0; c < numCycles; c++) {
        const startT = 0.05 + rand() * 0.7;   // normalised time [0..1]
        const cycleLen = 0.015 + rand() * 0.035; // shorter periods (was 0.04-0.12, now 0.015-0.05)
        pulseCycles.push({ startT, cycleLen });
      }
      pulseCycles.sort((a, b) => a.startT - b.startT);

      const sinAmp = 3 + rand() * 12; // 3-15 px

      /* Head size variety */
      const headSize = 4 + rand() * 14; // 4-18

      /* Trail variety — thicker at edges, perspective will thin them toward centre */
      const trailWidth = 1.5 + rand() * 5.5; // 1.5 - 7.0 (base width at edge)
      const trailLen = 15 + Math.floor(rand() * 35); // 15-50

      /* Style flags — most rays sparkle, only ~10% are solid */
      const styleRoll = rand();
      const hasSparks = styleRoll < 0.55;        // 55% emit sparks
      const hasSparkleTrail = styleRoll < 0.90;  // 90% leave sparkle trail (only bottom 10% solid)

      const ray: Ray = {
        startX: sx,
        startY: sy,
        targetX: vpX,
        targetY: vpY,
        dirX,
        dirY,
        perpX,
        perpY,
        age: 0,
        lifetime,
        headSize,
        trailWidth,
        isOrange: rand() < 0.15,
        pulseCycles,
        sinAmp,
        trailLen,
        hasSparks,
        hasSparkleTrail,
        trail: [],
        sparkles: [],
        speed,
        totalDist: dist * travelFrac,
        gravX: 0,
        gravY: 0,
      };
      raysRef.current.push(ray);
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
    nextSpawnRef.current = now + 200 + randRef.current() * 500;

    /* ── Helpers ── */

    /**
     * Compute perpendicular sine displacement for a ray at a given progress.
     * Returns 0 when between pulse cycles (straight sections).
     */
    const getSineOffset = (ray: Ray, progress: number): number => {
      for (const pc of ray.pulseCycles) {
        const end = pc.startT + pc.cycleLen;
        if (progress >= pc.startT && progress <= end) {
          const local = (progress - pc.startT) / pc.cycleLen; // 0..1 within cycle
          return ray.sinAmp * Math.sin(local * Math.PI * 2);
        }
      }
      return 0;
    };

    /** Perspective scale: 1 at edge, shrinks toward 0 at centre */
    const perspectiveScale = (progress: number): number => {
      return Math.max(0.04, 1 - progress * 0.92);
    };

    /** Thickness taper — stronger falloff so rays are clearly thicker at edges */
    const thicknessTaper = (progress: number): number => {
      return Math.max(0.06, Math.pow(1 - progress, 1.6));
    };

    /** Brightness dims as ray approaches centre */
    const perspectiveAlpha = (progress: number): number => {
      const fadeIn = Math.min(progress * 6, 1);
      const fadeDeep = 1 - Math.pow(progress, 1.8);
      return fadeIn * fadeDeep;
    };

    const drawRay = (r: Ray) => {
      const progress = r.age / r.lifetime;
      const alpha = perspectiveAlpha(progress);
      if (alpha < 0.005) return;

      const scale = perspectiveScale(progress);

      /* Current position along ray (includes accumulated gravity offset) */
      const traveled = r.speed * (r.age / 16.67);
      const baseX = r.startX + r.dirX * traveled + r.gravX;
      const baseY = r.startY + r.dirY * traveled + r.gravY;

      /* Sine displacement */
      const sinOff = getSineOffset(r, progress);

      /* Camera parallax */
      const yaw = (mouseRef.current.x - 0.5) * 12;
      const pitch = (mouseRef.current.y - 0.5) * 6;

      const px = baseX + sinOff * r.perpX + yaw * progress;
      const py = baseY + sinOff * r.perpY + pitch * progress;

      const headR = r.headSize * scale;
      const tw = r.trailWidth * thicknessTaper(progress);

      ctx.globalCompositeOperation = "lighter";

      /* ── Trail ── */
      if (r.trail.length > 1) {
        ctx.beginPath();
        const t0 = r.trail[0];
        ctx.moveTo(t0.x, t0.y);
        for (let i = 1; i < r.trail.length; i++) {
          ctx.lineTo(r.trail[i].x, r.trail[i].y);
        }
        /* Outer trail stroke */
        ctx.lineWidth = Math.max(0.3, tw);
        ctx.lineCap = "round";
        ctx.strokeStyle = r.isOrange
          ? `rgba(240, 158, 60, ${alpha * 0.45})`
          : `rgba(100, 185, 255, ${alpha * 0.45})`;
        ctx.shadowColor = r.isOrange
          ? "rgba(240, 138, 31, 0.5)"
          : "rgba(80, 170, 255, 0.5)";
        ctx.shadowBlur = headR * 0.5 * scale;
        ctx.stroke();

        /* Inner bright core filament */
        ctx.lineWidth = Math.max(0.15, tw * 0.3);
        ctx.strokeStyle = r.isOrange
          ? `rgba(255, 220, 160, ${alpha * 0.65})`
          : `rgba(200, 235, 255, ${alpha * 0.65})`;
        ctx.stroke();

        ctx.shadowBlur = 0;
      }

      /* ── Head glow ── */
      if (headR > 0.3) {
        const grad = ctx.createRadialGradient(px, py, 0, px, py, headR);
        if (r.isOrange) {
          grad.addColorStop(0, `rgba(255, 200, 100, ${alpha * 0.85})`);
          grad.addColorStop(0.35, `rgba(240, 138, 31, ${alpha * 0.4})`);
          grad.addColorStop(1, `rgba(216, 108, 8, 0)`);
        } else {
          grad.addColorStop(0, `rgba(200, 235, 255, ${alpha * 0.8})`);
          grad.addColorStop(0.35, `rgba(80, 175, 255, ${alpha * 0.35})`);
          grad.addColorStop(1, `rgba(30, 105, 165, 0)`);
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, headR, 0, Math.PI * 2);
        ctx.fill();

        /* Bright white core */
        const coreR = headR * 0.25;
        if (coreR > 0.2) {
          const coreGrad = ctx.createRadialGradient(px, py, 0, px, py, coreR);
          coreGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.9})`);
          coreGrad.addColorStop(1, `rgba(255, 255, 255, 0)`);
          ctx.fillStyle = coreGrad;
          ctx.beginPath();
          ctx.arc(px, py, coreR, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      /* ── Sparkle trail (persistent glitter dots left behind) ── */
      if (r.hasSparkleTrail && r.trail.length > 0) {
        for (const sp of r.sparkles) {
          const spAge = r.age - sp.birth;
          if (spAge > sp.lifetime) continue;
          const spAlpha = alpha * 0.6 * (1 - spAge / sp.lifetime);
          if (spAlpha < 0.01) continue;
          const spR = sp.size * scale * (1 - spAge / sp.lifetime * 0.5);
          const spGrad = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, spR);
          spGrad.addColorStop(0, `rgba(255, 255, 255, ${spAlpha})`);
          spGrad.addColorStop(1, `rgba(142, 211, 255, 0)`);
          ctx.fillStyle = spGrad;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, spR, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalCompositeOperation = "source-over";

      /* Record trail point */
      r.trail.unshift({ x: px, y: py, alpha: 1 });
      if (r.trail.length > r.trailLen) r.trail.length = r.trailLen;
      for (let i = 0; i < r.trail.length; i++) {
        r.trail[i].alpha *= 0.88;
      }

      /* Maybe drop a sparkle — higher drop rate for denser glitter */
      if (r.hasSparkleTrail && randRef.current() < 0.4) {
        r.sparkles.push({
          x: px + (randRef.current() - 0.5) * 3,
          y: py + (randRef.current() - 0.5) * 3,
          birth: r.age,
          lifetime: 600 + randRef.current() * 1200,
          size: 0.6 + randRef.current() * 1.8,
        });
      }
      /* Trim old sparkles */
      if (r.sparkles.length > 90) {
        r.sparkles.splice(0, r.sparkles.length - 90);
      }
    };

    const drawSpark = (s: Spark) => {
      const progress = s.age / s.lifetime;
      const alpha = s.alpha * (1 - progress);
      if (alpha < 0.01) return;
      const r = 1.4 * (1 - progress * 0.5);
      ctx.globalCompositeOperation = "lighter";
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r);
      grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      grad.addColorStop(1, `rgba(142, 211, 255, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    };

    const drawStaticBackground = () => {
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

      const dt = Math.min(time - lastTime, 50);
      lastTime = time;

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

      /* Subtle ambient glow at vanishing point */
      const ambCx = dw * 0.5 + (mouseRef.current.x - 0.5) * 30;
      const ambCy = dh * 0.42 + (mouseRef.current.y - 0.5) * 15;
      const ambR = Math.min(dw, dh) * 0.38;
      const ambGrad = ctx.createRadialGradient(ambCx, ambCy, 0, ambCx, ambCy, ambR);
      ambGrad.addColorStop(0, "rgba(40, 130, 210, 0.05)");
      ambGrad.addColorStop(0.5, "rgba(25, 90, 150, 0.02)");
      ambGrad.addColorStop(1, "rgba(5, 10, 20, 0)");
      ctx.fillStyle = ambGrad;
      ctx.fillRect(0, 0, dw, dh);

      /* Spawn check */
      if (time >= nextSpawnRef.current) {
        spawnRay(dw, dh);
        scheduleNext(time);
      }

      /* Update & draw rays */
      /* Mouse position in canvas coords */
      const mxCanvas = mouseRef.current.x * dw;
      const myCanvas = mouseRef.current.y * dh;

      const rays = raysRef.current;
      for (let i = rays.length - 1; i >= 0; i--) {
        const r = rays[i];
        r.age += dt;
        if (r.age >= r.lifetime) {
          rays.splice(i, 1);
          continue;
        }

        /* ── Mouse gravity: gentle attraction toward pointer ── */
        const traveled = r.speed * (r.age / 16.67);
        const curX = r.startX + r.dirX * traveled + r.gravX;
        const curY = r.startY + r.dirY * traveled + r.gravY;
        const gmx = mxCanvas - curX;
        const gmy = myCanvas - curY;
        const gDist = Math.sqrt(gmx * gmx + gmy * gmy) || 1;
        /* Strength: subtle pull that falls off with distance, scales with dt */
        const gStrength = Math.min(0.12, 800 / (gDist * gDist)) * (dt / 16.67);
        r.gravX += gmx * gStrength;
        r.gravY += gmy * gStrength;
        /* Dampen so it doesn't spiral — cap total offset */
        const maxOff = 60;
        const curOff = Math.sqrt(r.gravX * r.gravX + r.gravY * r.gravY);
        if (curOff > maxOff) {
          r.gravX *= maxOff / curOff;
          r.gravY *= maxOff / curOff;
        }

        drawRay(r);

        /* Maybe spawn spark (only for spark-enabled rays) */
        if (r.hasSparks) {
          const progress = r.age / r.lifetime;
          const pAlpha = perspectiveAlpha(progress);
          if (randRef.current() < 0.15 * (dt / 16.67) && pAlpha > 0.15) {
            const rand = randRef.current;
            const traveled = r.speed * (r.age / 16.67);
            const bx = r.startX + r.dirX * traveled + r.gravX;
            const by = r.startY + r.dirY * traveled + r.gravY;
            sparksRef.current.push({
              x: bx,
              y: by,
              vx: (rand() - 0.5) * 2.5,
              vy: (rand() - 0.5) * 2.5,
              age: 0,
              lifetime: SPARK_LIFETIME * (0.4 + rand() * 0.6),
              alpha: 0.3 + rand() * 0.5,
            });
          }
        }
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
  }, [spawnRay, scheduleNext]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      style={{ display: "block" }}
    />
  );
}

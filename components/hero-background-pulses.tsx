"use client";

import { useEffect, useRef, useCallback } from "react";

/* ─── Types ─── */

/** A single ray that travels from the edge toward the centre vanishing point */
interface Ray {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  dirX: number;
  dirY: number;
  perpX: number;
  perpY: number;

  age: number;
  lifetime: number;

  headSize: number;
  trailWidth: number;       // base lineWidth at the edge
  isOrange: boolean;

  pulseCycles: { startT: number; cycleLen: number }[];
  sinAmp: number;

  trailLen: number;          // short trail (6-18 pts)
  trail: { x: number; y: number }[];

  /* Dust trail config — every ray gets one, with varying density & speed */
  dustRate: number;          // 0-1 chance per frame to drop a dust particle
  dustSpeedMult: number;     // multiplier on initial scatter velocity
  dustLifetimeMult: number;  // multiplier on dust lifetime

  speed: number;
  totalDist: number;

  gravX: number;
  gravY: number;
}

/** Free-floating dust mote that drifts along the pulse path and fades */
interface Dust {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  lifetime: number;
  size: number;       // radius
  alpha0: number;     // starting alpha
  isOrange: boolean;
  gravityEnabled?: boolean; // disables pointer gravity after spawn
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  lifetime: number;
  alpha: number;
  isOrange: boolean;
  shade: number;
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
const MAX_DUST = 600;          // global dust particle cap

export function HeroBackgroundPulses() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  const raysRef = useRef<Ray[]>([]);
  const dustRef = useRef<Dust[]>([]);
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

      const vpX = w * (0.48 + rand() * 0.04);
      const vpY = h * (0.42 + rand() * 0.06);

      let sx: number, sy: number;
      const edge = rand();
      if (edge < 0.25) { sx = rand() * w; sy = -12; }
      else if (edge < 0.5) { sx = rand() * w; sy = h + 12; }
      else if (edge < 0.75) { sx = -12; sy = rand() * h; }
      else { sx = w + 12; sy = rand() * h; }

      const dx = vpX - sx;
      const dy = vpY - sy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const dirX = dx / dist;
      const dirY = dy / dist;
      const perpX = -dirY;
      const perpY = dirX;

      const lifetime = MIN_LIFETIME + rand() * (MAX_LIFETIME - MIN_LIFETIME);
      const travelFrac = 0.85 + rand() * 0.15;
      const speed = (dist * travelFrac) / (lifetime / 16.67);

      const numCycles = 1 + Math.floor(rand() * 3);
      const pulseCycles: { startT: number; cycleLen: number }[] = [];
      for (let c = 0; c < numCycles; c++) {
        const startT = 0.05 + rand() * 0.7;
        const cycleLen = 0.015 + rand() * 0.035;
        pulseCycles.push({ startT, cycleLen });
      }
      pulseCycles.sort((a, b) => a.startT - b.startT);

      const sinAmp = 1.5 + rand() * 6;
      const headSize = 4 + rand() * 14;

      /* Thicker base width at edge — will taper to near-zero at centre */
      const trailWidth = 2 + rand() * 6;  // 2-8

      /* Short trails */
      const trailLen = 6 + Math.floor(rand() * 12); // 6-18

      /* Dust trail variation per ray (most pulses get longer trails) */
      const longTrailProfile = rand() < 0.78;
      const dustRate = longTrailProfile
        ? 0.62 + rand() * 0.28  // 0.62-0.90 chance/frame
        : 0.28 + rand() * 0.32; // 0.28-0.60 chance/frame
      const dustSpeedMult = 0.3 + rand() * 1.4;       // scatter speed multiplier
      const dustLifetimeMult = longTrailProfile
        ? 2.1 + rand() * 2.4    // 2.1-4.5 multiplier
        : 0.9 + rand() * 1.5;   // 0.9-2.4 multiplier

      const ray: Ray = {
        startX: sx, startY: sy,
        targetX: vpX, targetY: vpY,
        dirX, dirY, perpX, perpY,
        age: 0, lifetime, headSize, trailWidth,
        isOrange: rand() < 0.15,
        pulseCycles, sinAmp,
        trailLen,
        trail: [],
        dustRate, dustSpeedMult, dustLifetimeMult,
        speed, totalDist: dist * travelFrac,
        gravX: 0, gravY: 0,
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

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = mq.matches;
    const onMqChange = (e: MediaQueryListEvent) => { reducedMotion = e.matches; };
    mq.addEventListener("change", onMqChange);

    let dw = 0;
    let dh = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      dw = rect.width; dh = rect.height;
      canvas.width = dw * dpr; canvas.height = dh * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouse = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX / window.innerWidth;
      mouseRef.current.y = e.clientY / window.innerHeight;
    };
    window.addEventListener("mousemove", onMouse, { passive: true });

    let hidden = false;
    const onVis = () => { hidden = document.hidden; };
    document.addEventListener("visibilitychange", onVis);

    const now = performance.now();
    nextSpawnRef.current = now + 200 + randRef.current() * 500;

    /* ── Helpers ── */

    const getSineOffset = (ray: Ray, progress: number): number => {
      for (const pc of ray.pulseCycles) {
        const end = pc.startT + pc.cycleLen;
        if (progress >= pc.startT && progress <= end) {
          const local = (progress - pc.startT) / pc.cycleLen;
          return ray.sinAmp * Math.sin(local * Math.PI * 2);
        }
      }
      return 0;
    };

    const perspectiveScale = (progress: number): number =>
      Math.max(0.04, 1 - progress * 0.92);

    /** Strong thickness taper: thick at edge → hairline at centre */
    const thicknessTaper = (progress: number): number =>
      Math.max(0.05, Math.pow(1 - progress, 2.2));

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
      const traveled = r.speed * (r.age / 16.67);
      // Head position: includes gravity
      const headX = r.startX + r.dirX * traveled + r.gravX;
      const headY = r.startY + r.dirY * traveled + r.gravY;
      const sinOff = getSineOffset(r, progress);
      const px = headX + sinOff * r.perpX;
      const py = headY + sinOff * r.perpY;

      const headR = r.headSize * scale;
      const tw = r.trailWidth * thicknessTaper(progress);

      // Trail points: follow the same gravity-shifted sine path as the head
      const trailX = headX + sinOff * r.perpX;
      const trailY = headY + sinOff * r.perpY;

      ctx.globalCompositeOperation = "lighter";

      /* ── Trail — drawn as individual dots/dashes, not a solid line ── */
      if (r.trail.length > 1) {
        for (let i = 0; i < r.trail.length - 1; i++) {
          const t = r.trail[i];
          const tn = r.trail[i + 1];
          const frac = i / r.trail.length;          // 0=newest, 1=oldest
          const segAlpha = alpha * (1 - frac * 0.9); // fade along trail
          if (segAlpha < 0.01) continue;

          /* Width tapers along the trail too */
          const segW = Math.max(0.2, tw * (1 - frac * 0.7));

          ctx.beginPath();
          ctx.moveTo(t.x, t.y);
          ctx.lineTo(tn.x, tn.y);
          ctx.lineWidth = segW;
          ctx.lineCap = "round";
          ctx.strokeStyle = r.isOrange
            ? `rgba(240, 158, 60, ${segAlpha * 0.5})`
            : `rgba(100, 185, 255, ${segAlpha * 0.5})`;
          ctx.stroke();
        }
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

      ctx.globalCompositeOperation = "source-over";

      /* Record trail point (no gravity) */
      r.trail.unshift({ x: trailX, y: trailY });
      if (r.trail.length > r.trailLen) r.trail.length = r.trailLen;
    };

    const drawDust = (d: Dust) => {
      const progress = d.age / d.lifetime;
      const a = d.alpha0 * Math.pow(1 - progress, 0.65);
      if (a < 0.01) return;
      const sz = d.size * (1 - progress * 0.2);
      ctx.globalCompositeOperation = "lighter";
      const grad = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, sz);
      if (d.isOrange) {
        grad.addColorStop(0, `rgba(255, 200, 120, ${a})`);
        grad.addColorStop(1, `rgba(240, 138, 31, 0)`);
      } else {
        grad.addColorStop(0, `rgba(200, 230, 255, ${a})`);
        grad.addColorStop(1, `rgba(100, 180, 255, 0)`);
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(d.x, d.y, sz, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    };

    const drawSpark = (s: Spark) => {
      const progress = s.age / s.lifetime;
      const a = s.alpha * (1 - progress);
      if (a < 0.01) return;
      const r = 1.4 * (1 - progress * 0.5);
      ctx.globalCompositeOperation = "lighter";
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r);
      if (s.isOrange) {
        const warmR = Math.round(245 + s.shade * 10);
        const warmG = Math.round(150 + s.shade * 40);
        const warmB = Math.round(70 + s.shade * 30);
        grad.addColorStop(0, `rgba(255, 245, 230, ${a})`);
        grad.addColorStop(0.6, `rgba(${warmR}, ${warmG}, ${warmB}, ${a * 0.75})`);
        grad.addColorStop(1, `rgba(228, 124, 40, 0)`);
      } else {
        const coolR = Math.round(150 + s.shade * 55);
        const coolG = Math.round(205 + s.shade * 35);
        const coolB = Math.round(245 + s.shade * 10);
        grad.addColorStop(0, `rgba(245, 252, 255, ${a})`);
        grad.addColorStop(0.6, `rgba(${coolR}, ${coolG}, ${coolB}, ${a * 0.75})`);
        grad.addColorStop(1, `rgba(90, 170, 245, 0)`);
      }
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

      if (reducedMotion) { drawStaticBackground(); return; }

      /* Background */
      const bg = ctx.createLinearGradient(0, 0, 0, dh);
      bg.addColorStop(0, "#0b1220");
      bg.addColorStop(1, "#050a14");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, dw, dh);

      const ambCx = dw * 0.5;
      const ambCy = dh * 0.42;
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

      /* Mouse in canvas coords */
      const mxCanvas = mouseRef.current.x * dw;
      const myCanvas = mouseRef.current.y * dh;
      const rand = randRef.current;

      /* ── Update & draw rays ── */
      const rays = raysRef.current;
      for (let i = rays.length - 1; i >= 0; i--) {
        const r = rays[i];
        r.age += dt;
        if (r.age >= r.lifetime) { rays.splice(i, 1); continue; }

        /* Ray mouse gravity (only head): half-screen range, stronger near pointer */
        const traveled = r.speed * (r.age / 16.67);
        const headX = r.startX + r.dirX * traveled + r.gravX;
        const headY = r.startY + r.dirY * traveled + r.gravY;
        const gmx = mxCanvas - headX;
        const gmy = myCanvas - headY;
        const gDist = Math.sqrt(gmx * gmx + gmy * gmy) || 1;
        const influenceRadius = Math.min(dw, dh) * 0.9;
        if (gDist < influenceRadius) {
          const near = 1 - gDist / influenceRadius; // 1 near pointer, 0 at edge
          const nearBoost = 1 + near * near * 2.2;
          const farLift = 0.72 + 0.48 * near;
          const gStr = Math.min(0.026, (620 / (gDist * gDist + 60000)) * nearBoost * farLift) * (dt / 16.67);
          r.gravX += gmx * gStr;
          r.gravY += gmy * gStr;
        }
        const maxOff = 28;
        const curOff = Math.sqrt(r.gravX * r.gravX + r.gravY * r.gravY);
        if (curOff > maxOff) { r.gravX *= maxOff / curOff; r.gravY *= maxOff / curOff; }

        drawRay(r);

        /* ── Spawn dust motes behind the pulse ── */
        const progress = r.age / r.lifetime;
        const pAlpha = perspectiveAlpha(progress);
        /* Fade dust spawn as ray approaches centre — almost none past 70% */
        const dustFade = progress < 0.35 ? 1 : Math.max(0, 1 - Math.pow((progress - 0.35) / 0.45, 1.8));
        if (pAlpha > 0.05 && dustRef.current.length < MAX_DUST && rand() < r.dustRate * dustFade * (dt / 16.67)) {
          /* Spawn dust along the UNPERTURBED ray path (no gravity offset) */
          const rawX = r.startX + r.dirX * traveled;
          const rawY = r.startY + r.dirY * traveled;
          const behindDist = 14 + rand() * 34; // 14-48px behind the head
          const bx = rawX - r.dirX * behindDist + (rand() - 0.5) * 0.8;
          const by = rawY - r.dirY * behindDist + (rand() - 0.5) * 0.8;
          dustRef.current.push({
            x: bx,
            y: by,
            vx: 0,
            vy: 0,
            age: 0,
            lifetime: (1600 + rand() * 3600) * r.dustLifetimeMult,
            size: 0.4 + rand() * 1.6,
            alpha0: 0.15 + rand() * 0.35,
            isOrange: r.isOrange,
            gravityEnabled: false, // dust never affected by pointer gravity
          });
        }

        /* Also spawn occasional sparks */
        if (rand() < 0.08 * (dt / 16.67) && pAlpha > 0.15) {
          sparksRef.current.push({
            x: headX, y: headY,
            vx: (rand() - 0.5) * 2.5,
            vy: (rand() - 0.5) * 2.5,
            age: 0,
            lifetime: SPARK_LIFETIME * (0.4 + rand() * 0.6),
            alpha: 0.3 + rand() * 0.5,
            isOrange: r.isOrange,
            shade: rand(),
          });
        }
      }

      /* ── Update & draw dust (stationary, fades in place) ── */
      const dusts = dustRef.current;
      for (let i = dusts.length - 1; i >= 0; i--) {
        const d = dusts[i];
        d.age += dt;
        if (d.age >= d.lifetime) { dusts.splice(i, 1); continue; }
        // Dust motes are stationary and never affected by pointer gravity
        d.gravityEnabled = false;
        drawDust(d);
      }

      /* ── Update & draw sparks (free drift, no pointer gravity) ── */
      const sparks = sparksRef.current;
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.age += dt;
        if (s.age >= s.lifetime) { sparks.splice(i, 1); continue; }
        const dtN = dt / 16.67;
        s.x += s.vx * dtN;
        s.y += s.vy * dtN;
        s.vx *= 0.985;
        s.vy *= 0.985;
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

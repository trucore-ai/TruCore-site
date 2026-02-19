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

/** Free-floating dust mote that drifts toward mouse */
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
const MAX_DUST = 600;          // global dust particle cap
const DUST_MOUSE_STRENGTH = 0.000025; // gravity pull toward mouse (gentle)

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

      const sinAmp = 3 + rand() * 12;
      const headSize = 4 + rand() * 14;

      /* Thicker base width at edge — will taper to near-zero at centre */
      const trailWidth = 2 + rand() * 6;  // 2-8

      /* Short trails */
      const trailLen = 6 + Math.floor(rand() * 12); // 6-18

      /* Dust trail variation per ray */
      const dustRate = 0.15 + rand() * 0.55;          // 0.15-0.70 chance/frame
      const dustSpeedMult = 0.3 + rand() * 1.4;       // scatter speed multiplier
      const dustLifetimeMult = 0.5 + rand() * 2.0;    // lifetime multiplier

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
      const baseX = r.startX + r.dirX * traveled + r.gravX;
      const baseY = r.startY + r.dirY * traveled + r.gravY;
      const sinOff = getSineOffset(r, progress);
      const yaw = (mouseRef.current.x - 0.5) * 12;
      const pitch = (mouseRef.current.y - 0.5) * 6;
      const px = baseX + sinOff * r.perpX + yaw * progress;
      const py = baseY + sinOff * r.perpY + pitch * progress;

      const headR = r.headSize * scale;
      const tw = r.trailWidth * thicknessTaper(progress);

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

      /* Record trail point */
      r.trail.unshift({ x: px, y: py });
      if (r.trail.length > r.trailLen) r.trail.length = r.trailLen;
    };

    const drawDust = (d: Dust) => {
      const progress = d.age / d.lifetime;
      const a = d.alpha0 * (1 - progress);
      if (a < 0.01) return;
      const sz = d.size * (1 - progress * 0.4);
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
      grad.addColorStop(0, `rgba(255, 255, 255, ${a})`);
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

      if (reducedMotion) { drawStaticBackground(); return; }

      /* Background */
      const bg = ctx.createLinearGradient(0, 0, 0, dh);
      bg.addColorStop(0, "#0b1220");
      bg.addColorStop(1, "#050a14");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, dw, dh);

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

        /* Ray mouse gravity (subtle curve) */
        const traveled = r.speed * (r.age / 16.67);
        const curX = r.startX + r.dirX * traveled + r.gravX;
        const curY = r.startY + r.dirY * traveled + r.gravY;
        const gmx = mxCanvas - curX;
        const gmy = myCanvas - curY;
        const gDist = Math.sqrt(gmx * gmx + gmy * gmy) || 1;
        const gStr = Math.min(0.12, 800 / (gDist * gDist)) * (dt / 16.67);
        r.gravX += gmx * gStr;
        r.gravY += gmy * gStr;
        const maxOff = 60;
        const curOff = Math.sqrt(r.gravX * r.gravX + r.gravY * r.gravY);
        if (curOff > maxOff) { r.gravX *= maxOff / curOff; r.gravY *= maxOff / curOff; }

        drawRay(r);

        /* ── Spawn dust motes behind the pulse ── */
        const progress = r.age / r.lifetime;
        const pAlpha = perspectiveAlpha(progress);
        /* Fade dust spawn as ray approaches centre — almost none past 70% */
        const dustFade = progress < 0.35 ? 1 : Math.max(0, 1 - Math.pow((progress - 0.35) / 0.45, 1.8));
        if (pAlpha > 0.05 && dustRef.current.length < MAX_DUST && rand() < r.dustRate * dustFade * (dt / 16.67)) {
          /* Spawn dust BEHIND the head along the ray's reverse direction */
          const headX = r.startX + r.dirX * traveled + r.gravX;
          const headY = r.startY + r.dirY * traveled + r.gravY;
          const behindDist = 8 + rand() * 20; // 8-28px behind the head
          const bx = headX - r.dirX * behindDist + (rand() - 0.5) * 3;
          const by = headY - r.dirY * behindDist + (rand() - 0.5) * 3;
          /* Initial velocity mostly along trailing direction (behind pulse) */
          const trailVx = -r.dirX * (0.3 + rand() * 0.8) * r.dustSpeedMult + (rand() - 0.5) * 0.3;
          const trailVy = -r.dirY * (0.3 + rand() * 0.8) * r.dustSpeedMult + (rand() - 0.5) * 0.3;
          dustRef.current.push({
            x: bx,
            y: by,
            vx: trailVx,
            vy: trailVy,
            age: 0,
            lifetime: (800 + rand() * 2500) * r.dustLifetimeMult,
            size: 0.4 + rand() * 1.6,
            alpha0: 0.15 + rand() * 0.35,
            isOrange: r.isOrange,
          });
        }

        /* Also spawn occasional sparks */
        if (rand() < 0.08 * (dt / 16.67) && pAlpha > 0.15) {
          sparksRef.current.push({
            x: curX, y: curY,
            vx: (rand() - 0.5) * 2.5,
            vy: (rand() - 0.5) * 2.5,
            age: 0,
            lifetime: SPARK_LIFETIME * (0.4 + rand() * 0.6),
            alpha: 0.3 + rand() * 0.5,
          });
        }
      }

      /* ── Update & draw dust (mouse-attracted) ── */
      const dusts = dustRef.current;
      for (let i = dusts.length - 1; i >= 0; i--) {
        const d = dusts[i];
        d.age += dt;
        if (d.age >= d.lifetime) { dusts.splice(i, 1); continue; }

        /* Gravity toward mouse pointer */
        const dmx = mxCanvas - d.x;
        const dmy = myCanvas - d.y;
        const dDist = Math.sqrt(dmx * dmx + dmy * dmy) || 1;
        const pull = DUST_MOUSE_STRENGTH * dt;
        d.vx += (dmx / dDist) * pull * Math.min(200, dDist);
        d.vy += (dmy / dDist) * pull * Math.min(200, dDist);

        /* Damping so dust doesn't accelerate infinitely */
        d.vx *= 0.995;
        d.vy *= 0.995;

        d.x += d.vx * (dt / 16.67);
        d.y += d.vy * (dt / 16.67);

        drawDust(d);
      }

      /* ── Update & draw sparks ── */
      const sparks = sparksRef.current;
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.age += dt;
        s.x += s.vx * (dt / 16.67);
        s.y += s.vy * (dt / 16.67);
        if (s.age >= s.lifetime) { sparks.splice(i, 1); continue; }
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

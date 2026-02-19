"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import { Color, Group, Mesh } from "three";

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type PointerTarget = { x: number; y: number };
type ShapeKind = "tetra" | "octa" | "icosa";

/* ─────────────────────────────────────────────────────────
   Lattice line batch — wraps drei <Line> with transparent
   material via ref so we get real screen-space line widths
   that vary by depth group.
   ───────────────────────────────────────────────────────── */

function LatticeBatch({
  points,
  color,
  lineWidth,
  opacity,
}: {
  points: [number, number, number][];
  color: string;
  lineWidth: number;
  opacity: number;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null);

  useEffect(() => {
    if (ref.current?.material) {
      const mat = ref.current.material;
      mat.transparent = true;
      mat.opacity = opacity;
      mat.depthWrite = false;
      mat.needsUpdate = true;
    }
  }, [opacity]);

  if (points.length === 0) return null;

  return <Line ref={ref} points={points} segments color={color} lineWidth={lineWidth} />;
}

/* ─────────────────────────────────────────────────────────
   Cubic Crystalline Lattice
   A 3-D grid of edges (like a crystal unit-cell array) that
   recedes into the screen.  Closer edges are thick & bright;
   deeper edges thin & faint.
   ───────────────────────────────────────────────────────── */

type DepthGroup = {
  blue: [number, number, number][];
  orange: [number, number, number][];
  width: number;
  blueAlpha: number;
  orangeAlpha: number;
};

function CubicLattice({ pointer }: { pointer: MutableRefObject<PointerTarget> }) {
  const ref = useRef<Group>(null);

  const groups = useMemo<DepthGroup[]>(() => {
    // Sparse crystalline grid — large cells receding deep into the screen
    const cell = 2.8;
    const nx = 6, ny = 4, nz = 18;
    const ox = (nx * cell) / 2;
    const oy = (ny * cell) / 2;

    // 6 depth bands — thick & bright up front, thread-thin at infinity
    const g: DepthGroup[] = [
      { blue: [], orange: [], width: 3.2, blueAlpha: 0.35, orangeAlpha: 0.48 },
      { blue: [], orange: [], width: 2.0, blueAlpha: 0.24, orangeAlpha: 0.32 },
      { blue: [], orange: [], width: 1.2, blueAlpha: 0.14, orangeAlpha: 0.20 },
      { blue: [], orange: [], width: 0.7, blueAlpha: 0.08, orangeAlpha: 0.11 },
      { blue: [], orange: [], width: 0.35, blueAlpha: 0.04, orangeAlpha: 0.06 },
      { blue: [], orange: [], width: 0.15, blueAlpha: 0.018, orangeAlpha: 0.025 },
    ];

    const gi = (z: number) =>
      z > -5 ? 0 : z > -10 ? 1 : z > -18 ? 2 : z > -28 ? 3 : z > -40 ? 4 : 5;

    for (let ix = 0; ix <= nx; ix++) {
      for (let iy = 0; iy <= ny; iy++) {
        for (let iz = 0; iz <= nz; iz++) {
          const x = ix * cell - ox;
          const y = iy * cell - oy;
          const z = -iz * cell - 0.5;
          const accent = (ix + iy + iz) % 7 === 0;
          const pick = (avgZ: number) => (accent ? g[gi(avgZ)].orange : g[gi(avgZ)].blue);

          if (ix < nx) pick(z).push([x, y, z], [(ix + 1) * cell - ox, y, z]);
          if (iy < ny) pick(z).push([x, y, z], [x, (iy + 1) * cell - oy, z]);
          if (iz < nz) {
            const z2 = -(iz + 1) * cell - 0.5;
            pick((z + z2) / 2).push([x, y, z], [x, y, z2]);
          }
        }
      }
    }

    return g;
  }, []);

  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    g.rotation.y += (pointer.current.x * 0.08 - g.rotation.y) * 0.03;
    g.rotation.x += (-pointer.current.y * 0.04 - g.rotation.x) * 0.03;
    state.camera.position.x += (pointer.current.x * 0.5 - state.camera.position.x) * 0.04;
    state.camera.position.y += (pointer.current.y * 0.3 - state.camera.position.y) * 0.04;
    state.camera.position.z += (3.0 - state.camera.position.z) * 0.03;
    state.camera.lookAt(0, 0, -12);
  });

  return (
    <group ref={ref}>
      {groups.map((d, i) => (
        <group key={i}>
          <LatticeBatch points={d.blue} color="#5cbcfb" lineWidth={d.width} opacity={d.blueAlpha} />
          <LatticeBatch points={d.orange} color="#d86c08" lineWidth={d.width} opacity={d.orangeAlpha} />
        </group>
      ))}
    </group>
  );
}

/* ─────────────────────────────────────────────────────────
   Bouncing Wireframe Shapes
   Velocity-driven polyhedra that freely float through the
   3-D lattice space, bouncing off invisible boundaries.
   ───────────────────────────────────────────────────────── */

type ShapeState = { px: number; py: number; pz: number; vx: number; vy: number; vz: number };

const BX = 9, BY = 6, BZ_MIN = -45, BZ_MAX = -0.5;

function BouncingShapes({ pointer }: { pointer: MutableRefObject<PointerTarget> }) {
  const meshes = useRef<Array<Mesh | null>>([]);
  const COUNT = 20;

  const defs = useMemo(() => {
    const rand = mulberry32(42);
    const kinds: ShapeKind[] = ["tetra", "octa", "icosa"];

    return Array.from({ length: COUNT }, (_, i) => {
      const isAccent = i % 5 === 0;
      const base = isAccent ? "#d86c08" : "#5cbcfb";
      const tint = new Color(base).offsetHSL(
        (rand() - 0.5) * 0.02,
        (rand() - 0.5) * 0.08,
        (rand() - 0.5) * 0.07,
      );

      return {
        px: (rand() - 0.5) * 16,
        py: (rand() - 0.5) * 10,
        pz: -1 - rand() * 40,
        vx: (rand() - 0.5) * 1.6,
        vy: (rand() - 0.5) * 1.6,
        vz: (rand() - 0.5) * 1.2,
        baseScale: 0.08 + rand() * 0.28,
        rotSpeed: 0.3 + rand() * 0.55,
        opacity: 0.15 + rand() * 0.30,
        color: `#${tint.getHexString()}`,
        kind: kinds[i % 3],
      };
    });
  }, []);

  const live = useRef<ShapeState[]>(
    defs.map((d) => ({ px: d.px, py: d.py, pz: d.pz, vx: d.vx, vy: d.vy, vz: d.vz })),
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    defs.forEach((shape, i) => {
      const m = meshes.current[i];
      const s = live.current[i];
      if (!m || !s) return;

      /* velocity integration */
      s.px += s.vx * dt;
      s.py += s.vy * dt;
      s.pz += s.vz * dt;

      /* boundary bounce */
      if (s.px > BX)     { s.px = BX;     s.vx *= -1; }
      if (s.px < -BX)    { s.px = -BX;    s.vx *= -1; }
      if (s.py > BY)     { s.py = BY;     s.vy *= -1; }
      if (s.py < -BY)    { s.py = -BY;    s.vy *= -1; }
      if (s.pz > BZ_MAX) { s.pz = BZ_MAX; s.vz *= -1; }
      if (s.pz < BZ_MIN) { s.pz = BZ_MIN; s.vz *= -1; }

      /* position with pointer parallax */
      const df = (Math.abs(s.pz) + 0.5) / 40;
      m.position.x = s.px + pointer.current.x * 0.4 * df;
      m.position.y = s.py + pointer.current.y * 0.25 * df;
      m.position.z = s.pz;

      /* depth-based scale */
      const zn = (s.pz - BZ_MIN) / (BZ_MAX - BZ_MIN);
      m.scale.setScalar(shape.baseScale * (0.25 + zn * 0.85));

      /* slow rotation */
      m.rotation.x += dt * shape.rotSpeed * 0.5;
      m.rotation.y += dt * shape.rotSpeed * 0.6;
    });
  });

  return (
    <group>
      {defs.map((shape, i) => (
        <mesh
          key={i}
          ref={(m) => {
            meshes.current[i] = m;
          }}
          position={[shape.px, shape.py, shape.pz]}
        >
          {shape.kind === "tetra" && <tetrahedronGeometry args={[1, 0]} />}
          {shape.kind === "octa" && <octahedronGeometry args={[1, 0]} />}
          {shape.kind === "icosa" && <icosahedronGeometry args={[1, 0]} />}
          <meshBasicMaterial color={shape.color} wireframe transparent opacity={shape.opacity} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ─────────────────────────────────────────────────────────
   Hero Background — exported wrapper
   ───────────────────────────────────────────────────────── */

export function HeroBackground3D() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pointerRef = useRef<PointerTarget>({ x: 0, y: 0 });

  useEffect(() => {
    const motionQ = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQ = window.matchMedia("(max-width: 768px)");

    const updateMotion = () => setReducedMotion(motionQ.matches);
    const updateMobile = () => setIsMobile(mobileQ.matches);

    updateMotion();
    updateMobile();

    const onPointer = (e: PointerEvent) => {
      pointerRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2.5;
      pointerRef.current.y = (0.5 - e.clientY / window.innerHeight) * 2.3;
    };

    motionQ.addEventListener("change", updateMotion);
    mobileQ.addEventListener("change", updateMobile);
    window.addEventListener("pointermove", onPointer, { passive: true });

    return () => {
      motionQ.removeEventListener("change", updateMotion);
      mobileQ.removeEventListener("change", updateMobile);
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  const dpr = useMemo<[number, number]>(() => (isMobile ? [0.75, 1] : [1, 1.25]), [isMobile]);

  if (reducedMotion) {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_40%_20%,rgba(92,188,251,0.12),transparent_55%)]"
      />
    );
  }

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 60 }}
        dpr={dpr}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      >
        <CubicLattice pointer={pointerRef} />
        <BouncingShapes pointer={pointerRef} />
      </Canvas>
    </div>
  );
}

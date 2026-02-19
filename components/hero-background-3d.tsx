"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import {
  Color,
  FrontSide,
  BackSide,
  Mesh,
  ShaderMaterial,
  Vector2,
  Vector3,
} from "three";

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type PointerTarget = { x: number; y: number };

const NUM_BALLS = 8;
const ROOM_W = 16;
const ROOM_H = 10;
const ROOM_D = 28;
const HW = ROOM_W / 2;
const HH = ROOM_H / 2;
const GRID_DENSITY = 1.2;

type BallPhysics = {
  px: number; py: number; pz: number;
  vx: number; vy: number; vz: number;
  radius: number;
};

const GRID_VERT = `
  uniform vec3 uBalls[${NUM_BALLS}];
  uniform float uRadii[${NUM_BALLS}];
  varying vec2 vUv;
  varying float vWarp;
  varying float vDepth;

  void main() {
    vUv = uv;
    vec4 wPos = modelMatrix * vec4(position, 1.0);
    float warp = 0.0;
    for (int i = 0; i < ${NUM_BALLS}; i++) {
      vec3 d = uBalls[i] - wPos.xyz;
      float dist = length(d);
      float r = uRadii[i] * 7.0;
      if (dist < r && dist > 0.001) {
        float t = 1.0 - dist / r;
        float s = t * t * t;
        wPos.xyz -= normalize(d) * s * uRadii[i] * 3.8;
        warp += s;
      }
    }
    vWarp = clamp(warp, 0.0, 1.0);
    vec4 viewPos = viewMatrix * wPos;
    vDepth = -viewPos.z;
    gl_Position = projectionMatrix * viewPos;
  }
`;

const GRID_FRAG = `
  uniform vec3 uColor;
  uniform vec2 uGridCount;
  uniform float uOpacity;
  varying vec2 vUv;
  varying float vWarp;
  varying float vDepth;

  void main() {
    vec2 coord = vUv * uGridCount;
    vec2 grid = abs(fract(coord - 0.5) - 0.5);
    vec2 dv = fwidth(coord);

    float depthNorm = smoothstep(2.0, 35.0, vDepth);
    float lineScale = mix(5.0, 1.0, depthNorm * depthNorm);
    float warpScale = 1.0 + vWarp * 2.0;
    vec2 halfWidth = dv * lineScale * warpScale;

    vec2 nd = grid / max(halfWidth, vec2(0.0001));
    float dX = nd.x;
    float dY = nd.y;
    float closest = min(dX, dY);

    float tube = 0.0;
    if (closest < 1.0) {
      float d = clamp(closest, 0.0, 0.999);
      tube = sqrt(1.0 - d * d);
    }

    float nodeX = max(0.0, 1.0 - dX);
    float nodeY = max(0.0, 1.0 - dY);
    float node = nodeX * nodeY * 0.5;

    float spec = 0.0;
    if (closest < 0.25) {
      float s = 1.0 - closest / 0.25;
      spec = s * s * s * 0.7;
    }

    float bloom = exp(-closest * 1.2) * 0.2;
    float intensity = tube + node + spec + bloom;

    float edge = 0.0;
    edge += smoothstep(0.025, 0.0, vUv.x) + smoothstep(0.975, 1.0, vUv.x);
    edge += smoothstep(0.025, 0.0, vUv.y) + smoothstep(0.975, 1.0, vUv.y);
    edge = min(edge, 1.0);

    float fog = smoothstep(3.0, 34.0, vDepth);
    float alpha = intensity * (uOpacity * 1.8 + vWarp * 0.6) + edge * 0.3;
    alpha *= mix(1.0, 0.08, fog);
    if (alpha < 0.003) discard;

    vec3 col = uColor * tube * (1.0 + vWarp * 0.7);
    col += vec3(0.75, 0.92, 1.0) * spec;
    col += uColor * 0.6 * bloom;
    col += uColor * node * 1.2;
    col += vec3(0.1, 0.22, 0.16) * edge;
    gl_FragColor = vec4(col, alpha);
  }
`;

const SHAPE_VERT = `
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const SHAPE_FRAG = `
  uniform vec3 uBaseColor;
  uniform float uOpacity;
  uniform float uIsFront;

  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vec3 N = normalize(vNormal);
    if (uIsFront < 0.5) N = -N;
    vec3 V = normalize(vViewDir);

    vec3 L1 = normalize(vec3(0.5, 0.8, 0.3));
    vec3 L2 = normalize(vec3(-0.4, -0.2, 0.7));

    float diff1 = max(dot(N, L1), 0.0) * 0.6;
    float diff2 = max(dot(N, L2), 0.0) * 0.35;
    float diffuse = 0.18 + diff1 + diff2;

    vec3 H1 = normalize(L1 + V);
    vec3 H2 = normalize(L2 + V);
    float spec1 = pow(max(dot(N, H1), 0.0), 48.0) * 0.8;
    float spec2 = pow(max(dot(N, H2), 0.0), 32.0) * 0.4;

    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.5);
    float rim = fresnel * 0.65;

    float scatter = pow(max(dot(-N, L1), 0.0), 2.5) * 0.2;

    vec3 col = uBaseColor * diffuse;
    col += vec3(0.85, 0.95, 1.0) * (spec1 + spec2);
    col += uBaseColor * rim * 0.7 + vec3(0.5, 0.7, 1.0) * rim * 0.3;
    col += uBaseColor * scatter;

    float alphaOut = uOpacity + rim * 0.35 + (spec1 + spec2) * 0.15;
    if (uIsFront < 0.5) alphaOut *= 0.5;

    gl_FragColor = vec4(col, alphaOut);
  }
`;

function GridPanel({
  position,
  rotation,
  size,
  gridCount,
  opacity,
  segments,
  ballsRef,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number];
  gridCount: [number, number];
  opacity: number;
  segments: number;
  ballsRef: MutableRefObject<BallPhysics[]>;
}) {
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uColor: { value: new Vector3(0, 0.82, 1.0) },
          uBalls: {
            value: Array.from({ length: NUM_BALLS }, () => new Vector3()),
          },
          uRadii: { value: new Float32Array(NUM_BALLS) },
          uGridCount: { value: new Vector2(gridCount[0], gridCount[1]) },
          uOpacity: { value: opacity },
        },
        vertexShader: GRID_VERT,
        fragmentShader: GRID_FRAG,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame(() => {
    const balls = ballsRef.current;
    const vecs = mat.uniforms.uBalls.value as Vector3[];
    const radii = mat.uniforms.uRadii.value as Float32Array;
    for (let i = 0; i < NUM_BALLS; i++) {
      const b = balls[i];
      if (b) {
        vecs[i].set(b.px, b.py, b.pz);
        radii[i] = b.radius;
      }
    }
  });

  return (
    <mesh position={position} rotation={rotation} material={mat}>
      <planeGeometry args={[size[0], size[1], segments, segments]} />
    </mesh>
  );
}

function makeShapeMat(color: string, opacity: number, isFront: boolean): ShaderMaterial {
  const c = new Color(color);
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: isFront ? FrontSide : BackSide,
    uniforms: {
      uBaseColor: { value: new Vector3(c.r, c.g, c.b) },
      uOpacity: { value: opacity },
      uIsFront: { value: isFront ? 1.0 : 0.0 },
    },
    vertexShader: SHAPE_VERT,
    fragmentShader: SHAPE_FRAG,
  });
}

type BallKind = "sphere" | "octa" | "icosa";
const KINDS: BallKind[] = ["sphere", "sphere", "sphere", "sphere", "sphere", "sphere", "sphere", "sphere"];

function BouncingBalls({
  pointer,
  ballsRef,
}: {
  pointer: MutableRefObject<PointerTarget>;
  ballsRef: MutableRefObject<BallPhysics[]>;
}) {
  const fronts = useRef<Array<Mesh | null>>([]);
  const backsRef = useRef<Array<Mesh | null>>([]);

  const defs = useMemo(() => {
    const rand = mulberry32(77);
    return Array.from({ length: NUM_BALLS }, (_, i) => {
      const accent = i % 3 === 0;
      const r = 0.4 + rand() * 0.6;
      return {
        px: (rand() - 0.5) * (ROOM_W - 4),
        py: (rand() - 0.5) * (ROOM_H - 3),
        pz: -2 - rand() * (ROOM_D - 6),
        vx: (rand() - 0.5) * 2.4,
        vy: (rand() - 0.5) * 2.4,
        vz: (rand() - 0.5) * 1.8,
        radius: r,
        color: accent ? "#f09428" : "#1e90ff",
        opacity: 0.22 + rand() * 0.18,
        kind: KINDS[i % KINDS.length] as BallKind,
        rotSpeed: 0.15 + rand() * 0.45,
      };
    });
  }, []);

  const materials = useMemo(
    () =>
      defs.map((d) => ({
        back: makeShapeMat(d.color, d.opacity, false),
        front: makeShapeMat(d.color, d.opacity, true),
      })),
    [defs],
  );

  useEffect(() => {
    ballsRef.current = defs.map((d) => ({
      px: d.px, py: d.py, pz: d.pz,
      vx: d.vx, vy: d.vy, vz: d.vz,
      radius: d.radius,
    }));
  }, [defs, ballsRef]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const balls = ballsRef.current;
    const elapsed = state.clock.elapsedTime;

    defs.forEach((def, i) => {
      const b = balls[i];
      const front = fronts.current[i];
      const back = backsRef.current[i];
      if (!b || !front) return;

      // Integrate position
      b.px += b.vx * dt;
      b.py += b.vy * dt;
      b.pz += b.vz * dt;

      // Spring membrane wall physics
      const SPRING_K = 22.0;
      const SPRING_DAMP = 3.5;
      const MAX_PEN = 1.2;
      const DEFLECT = 0.6;

      const bw = HW - b.radius;
      const bh = HH - b.radius;
      const zMax = -0.5;
      const zMin = -(ROOM_D - 0.5);

      let pen: number;

      // Right wall – ball pushes into grid, decelerates, grid springs it back
      pen = b.px - bw;
      if (pen > 0) {
        b.vx -= SPRING_K * pen * dt;
        b.vx *= Math.max(0, 1 - SPRING_DAMP * dt);
        b.vy += DEFLECT * pen * dt * Math.sin(elapsed * 1.3 + i * 5.7);
        b.vz += DEFLECT * pen * dt * Math.cos(elapsed * 1.7 + i * 3.3);
        if (pen > MAX_PEN) b.px = bw + MAX_PEN;
      }

      // Left wall
      pen = -bw - b.px;
      if (pen > 0) {
        b.vx += SPRING_K * pen * dt;
        b.vx *= Math.max(0, 1 - SPRING_DAMP * dt);
        b.vy += DEFLECT * pen * dt * Math.sin(elapsed * 1.1 + i * 4.3);
        b.vz += DEFLECT * pen * dt * Math.cos(elapsed * 1.5 + i * 6.1);
        if (pen > MAX_PEN) b.px = -bw - MAX_PEN;
      }

      // Top wall
      pen = b.py - bh;
      if (pen > 0) {
        b.vy -= SPRING_K * pen * dt;
        b.vy *= Math.max(0, 1 - SPRING_DAMP * dt);
        b.vx += DEFLECT * pen * dt * Math.sin(elapsed * 1.4 + i * 7.1);
        b.vz += DEFLECT * pen * dt * Math.cos(elapsed * 0.9 + i * 2.9);
        if (pen > MAX_PEN) b.py = bh + MAX_PEN;
      }

      // Bottom wall
      pen = -bh - b.py;
      if (pen > 0) {
        b.vy += SPRING_K * pen * dt;
        b.vy *= Math.max(0, 1 - SPRING_DAMP * dt);
        b.vx += DEFLECT * pen * dt * Math.sin(elapsed * 1.2 + i * 3.7);
        b.vz += DEFLECT * pen * dt * Math.cos(elapsed * 1.8 + i * 5.3);
        if (pen > MAX_PEN) b.py = -bh - MAX_PEN;
      }

      // Front wall
      pen = b.pz - zMax;
      if (pen > 0) {
        b.vz -= SPRING_K * pen * dt;
        b.vz *= Math.max(0, 1 - SPRING_DAMP * dt);
        b.vx += DEFLECT * pen * dt * Math.sin(elapsed * 0.8 + i * 4.1);
        b.vy += DEFLECT * pen * dt * Math.cos(elapsed * 1.6 + i * 2.3);
        if (pen > MAX_PEN) b.pz = zMax + MAX_PEN;
      }

      // Back wall
      pen = zMin - b.pz;
      if (pen > 0) {
        b.vz += SPRING_K * pen * dt;
        b.vz *= Math.max(0, 1 - SPRING_DAMP * dt);
        b.vx += DEFLECT * pen * dt * Math.sin(elapsed * 1.0 + i * 6.7);
        b.vy += DEFLECT * pen * dt * Math.cos(elapsed * 1.4 + i * 3.9);
        if (pen > MAX_PEN) b.pz = zMin - MAX_PEN;
      }

      // Mouse gravitational pull — attract balls toward pointer in world space
      const GRAV_STRENGTH = 12.0;
      const GRAV_RADIUS = 8.0;
      const mouseWorldX = pointer.current.x * HW * 0.9;
      const mouseWorldY = pointer.current.y * HH * 0.9;
      const mdx = mouseWorldX - b.px;
      const mdy = mouseWorldY - b.py;
      const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mDist > 0.1 && mDist < GRAV_RADIUS) {
        const falloff = 1.0 - mDist / GRAV_RADIUS;
        const force = GRAV_STRENGTH * falloff * falloff * dt;
        b.vx += (mdx / mDist) * force;
        b.vy += (mdy / mDist) * force;
      }

      // Gentle drag to keep things stable
      b.vx *= 1 - 0.3 * dt;
      b.vy *= 1 - 0.3 * dt;
      b.vz *= 1 - 0.3 * dt;

      const df = (Math.abs(b.pz) + 1) / ROOM_D;
      const px = b.px;
      const py = b.py;

      front.position.set(px, py, b.pz);
      front.rotation.x += dt * def.rotSpeed * 0.5;
      front.rotation.y += dt * def.rotSpeed * 0.7;

      if (back) {
        back.position.set(px, py, b.pz);
        back.rotation.copy(front.rotation);
      }
    });
  });

  return (
    <group>
      {defs.map((d, i) => (
        <group key={i}>
          <mesh
            ref={(m) => { backsRef.current[i] = m; }}
            position={[d.px, d.py, d.pz]}
            material={materials[i].back}
          >
            {d.kind === "sphere" && <sphereGeometry args={[d.radius, 64, 48]} />}
            {d.kind === "octa" && <octahedronGeometry args={[d.radius, 6]} />}
            {d.kind === "icosa" && <icosahedronGeometry args={[d.radius, 6]} />}
          </mesh>
          <mesh
            ref={(m) => { fronts.current[i] = m; }}
            position={[d.px, d.py, d.pz]}
            material={materials[i].front}
          >
            {d.kind === "sphere" && <sphereGeometry args={[d.radius, 64, 48]} />}
            {d.kind === "octa" && <octahedronGeometry args={[d.radius, 6]} />}
            {d.kind === "icosa" && <icosahedronGeometry args={[d.radius, 6]} />}
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Scene({ pointer }: { pointer: MutableRefObject<PointerTarget> }) {
  const ballsRef = useRef<BallPhysics[]>([]);

  useFrame((state) => {
    const cx = pointer.current.x * 0.7;
    const cy = pointer.current.y * 0.4;
    state.camera.position.x += (cx - state.camera.position.x) * 0.035;
    state.camera.position.y += (cy - state.camera.position.y) * 0.035;
    state.camera.lookAt(0, 0, -(ROOM_D / 2));
  });

  const seg = 64;
  const floorGrid: [number, number] = [ROOM_W * GRID_DENSITY, ROOM_D * GRID_DENSITY];
  const sideGrid: [number, number] = [ROOM_D * GRID_DENSITY, ROOM_H * GRID_DENSITY];
  const backGrid: [number, number] = [ROOM_W * GRID_DENSITY, ROOM_H * GRID_DENSITY];

  return (
    <>
      <GridPanel
        position={[0, -HH, -(ROOM_D / 2)]}
        rotation={[-Math.PI / 2, 0, 0]}
        size={[ROOM_W, ROOM_D]}
        gridCount={floorGrid}
        opacity={0.25}
        segments={seg}
        ballsRef={ballsRef}
      />
      <GridPanel
        position={[0, HH, -(ROOM_D / 2)]}
        rotation={[Math.PI / 2, 0, 0]}
        size={[ROOM_W, ROOM_D]}
        gridCount={floorGrid}
        opacity={0.14}
        segments={seg}
        ballsRef={ballsRef}
      />
      <GridPanel
        position={[-HW, 0, -(ROOM_D / 2)]}
        rotation={[0, Math.PI / 2, 0]}
        size={[ROOM_D, ROOM_H]}
        gridCount={sideGrid}
        opacity={0.20}
        segments={seg}
        ballsRef={ballsRef}
      />
      <GridPanel
        position={[HW, 0, -(ROOM_D / 2)]}
        rotation={[0, -Math.PI / 2, 0]}
        size={[ROOM_D, ROOM_H]}
        gridCount={sideGrid}
        opacity={0.20}
        segments={seg}
        ballsRef={ballsRef}
      />
      <GridPanel
        position={[0, 0, -ROOM_D]}
        rotation={[0, 0, 0]}
        size={[ROOM_W, ROOM_H]}
        gridCount={backGrid}
        opacity={0.32}
        segments={seg}
        ballsRef={ballsRef}
      />
      <BouncingBalls pointer={pointer} ballsRef={ballsRef} />
    </>
  );
}

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

  const dpr = useMemo<[number, number]>(
    () => (isMobile ? [0.6, 0.85] : [1, 1.5]),
    [isMobile],
  );

  if (reducedMotion) {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_40%_20%,rgba(0,212,255,0.1),transparent_55%)]"
      />
    );
  }

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 2], fov: 65 }}
        dpr={dpr}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Scene pointer={pointerRef} />
      </Canvas>
    </div>
  );
}

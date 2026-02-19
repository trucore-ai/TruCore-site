"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import { Color, Group, Mesh } from "three";

const MIN_Z = -5.6;
const MAX_Z = -0.8;

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type PointerTarget = {
  x: number;
  y: number;
};

type ShapeKind = "tetra" | "octa" | "icosa";

type ShapeSeed = {
  x: number;
  y: number;
  z: number;
  baseScale: number;
  speed: number;
  drift: number;
  offset: number;
  opacity: number;
  color: string;
  kind: ShapeKind;
};

function LatticeTunnel({ pointer }: { pointer: MutableRefObject<PointerTarget> }) {
  const groupRef = useRef<Group>(null);
  const layerRefs = useRef<Array<Mesh | null>>([]);
  const timeRef = useRef(0);

  const layers = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => {
      const t = index / 11;

      return {
        z: -0.2 - index * 0.78,
        scale: 1 - t * 0.06,
        color: index % 5 === 0 ? "#d86c08" : "#5cbcfb",
        opacity: 0.38 * (1 - t * 0.82),
        lineWidth: 2.6 * (1 - t * 0.7),
        segments: 6 as const,
      };
    });
  }, []);

  useFrame((state, delta) => {
    const group = groupRef.current;

    if (!group) {
      return;
    }

    group.rotation.y += (pointer.current.x * 0.2 - group.rotation.y) * 0.08;
    group.rotation.x += (-pointer.current.y * 0.12 - group.rotation.x) * 0.08;

    state.camera.position.x += (pointer.current.x * 0.4 - state.camera.position.x) * 0.06;
    state.camera.position.y += (pointer.current.y * 0.26 - state.camera.position.y) * 0.06;
    state.camera.position.z += (2.4 - state.camera.position.z) * 0.04;
    state.camera.lookAt(0, 0, -2);

    timeRef.current += delta;
    const t = timeRef.current;

    layerRefs.current.forEach((mesh, layerIndex) => {
      if (!mesh) {
        return;
      }

      const depth = 1 - layerIndex / layers.length;
      const bob = Math.sin(t * 0.7 + layerIndex * 0.6) * 0.02 * depth;
      const sway = Math.cos(t * 0.55 + layerIndex * 0.4) * 0.018 * depth;

      mesh.position.x += (pointer.current.x * 0.15 * depth + sway - mesh.position.x) * 0.05;
      mesh.position.y += (pointer.current.y * 0.1 * depth + bob - mesh.position.y) * 0.05;
    });
  });

  return (
    <group ref={groupRef}>
      {layers.map((layer, index) => (
        <mesh
          key={index}
          ref={(mesh) => {
            layerRefs.current[index] = mesh;
          }}
          position={[0, 0, layer.z]}
          scale={layer.scale}
        >
          <planeGeometry args={[12, 6.8, layer.segments, layer.segments]} />
          <meshBasicMaterial
            color={layer.color}
            wireframe
            wireframeLinewidth={layer.lineWidth}
            transparent
            opacity={Math.max(layer.opacity, 0.025)}
          />
        </mesh>
      ))}
    </group>
  );
}

function FloatingShapes({ pointer }: { pointer: MutableRefObject<PointerTarget> }) {
  const shapeRefs = useRef<Array<Mesh | null>>([]);
  const COUNT = 18;
  const blue = "#5cbcfb";
  const orange = "#d86c08";

  const shapes = useMemo<ShapeSeed[]>(() => {
    const kinds: ShapeKind[] = ["tetra", "octa", "icosa"];
    const rand = mulberry32(1337);

    return Array.from({ length: COUNT }, (_, index) => {
      const kind = kinds[index % 3];
      const colorValue = index % 5 === 0 ? orange : blue;
      const tint = new Color(colorValue).offsetHSL((rand() - 0.5) * 0.02, (rand() - 0.5) * 0.08, (rand() - 0.5) * 0.07);

      return {
        x: (rand() - 0.5) * 12,
        y: (rand() - 0.5) * 6.6,
        z: -0.8 - rand() * 4.8,
        baseScale: 0.05 + rand() * 0.18,
        speed: 0.35 + rand() * 0.6,
        drift: 0.18 + rand() * 0.5,
        offset: rand() * Math.PI * 2,
        opacity: 0.2 + rand() * 0.24,
        color: `#${tint.getHexString()}`,
        kind,
      };
    });
  }, [orange, blue]);

  useFrame((_, delta) => {
    const t = performance.now() * 0.001;

    shapes.forEach((shape, index) => {
      const mesh = shapeRefs.current[index];

      if (!mesh) {
        return;
      }

      const depthFactor = (Math.abs(shape.z) + 0.8) / 6;
      const orbitX = Math.sin(t * shape.speed + shape.offset) * shape.drift;
      const orbitY = Math.cos(t * shape.speed * 0.8 + shape.offset) * shape.drift * 0.65;
      const pointerX = pointer.current.x * (0.95 + depthFactor * 0.55);
      const pointerY = pointer.current.y * (0.7 + depthFactor * 0.4);

      const targetX = shape.x + orbitX + pointerX;
      const targetY = shape.y + orbitY + pointerY;
      const targetZ = shape.z + Math.sin(t * shape.speed * 0.6 + shape.offset) * 0.55;
      const zNorm = (targetZ - MIN_Z) / (MAX_Z - MIN_Z);
      const depthScale = 0.28 + zNorm * 0.82;
      const targetScale = shape.baseScale * Math.min(Math.max(depthScale, 0.22), 1.15);

      mesh.position.x += (targetX - mesh.position.x) * 0.085;
      mesh.position.y += (targetY - mesh.position.y) * 0.085;
      mesh.position.z += (targetZ - mesh.position.z) * 0.06;
      mesh.scale.setScalar(mesh.scale.x + (targetScale - mesh.scale.x) * 0.1);

      mesh.rotation.x += delta * (0.38 + shape.speed * 0.3);
      mesh.rotation.y += delta * (0.44 + shape.speed * 0.22);
    });
  });

  return (
    <group>
      {shapes.map((shape, index) => (
        <mesh
          key={index}
          ref={(mesh) => {
            shapeRefs.current[index] = mesh;
          }}
          position={[shape.x, shape.y, shape.z]}
        >
          {shape.kind === "tetra" && <tetrahedronGeometry args={[1, 0]} />}
          {shape.kind === "octa" && <octahedronGeometry args={[1, 0]} />}
          {shape.kind === "icosa" && <icosahedronGeometry args={[1, 0]} />}
          <meshBasicMaterial color={shape.color} wireframe transparent opacity={shape.opacity} />
        </mesh>
      ))}
    </group>
  );
}

export function HeroBackground3D() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pointerRef = useRef<PointerTarget>({ x: 0, y: 0 });

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia("(max-width: 768px)");

    const updateMotion = () => setReducedMotion(motionQuery.matches);
    const updateMobile = () => setIsMobile(mobileQuery.matches);

    updateMotion();
    updateMobile();

    const onPointerMove = (event: PointerEvent) => {
      const normalizedX = event.clientX / window.innerWidth;
      const normalizedY = event.clientY / window.innerHeight;

      pointerRef.current.x = (normalizedX - 0.5) * 2.5;
      pointerRef.current.y = (0.5 - normalizedY) * 2.3;
    };

    motionQuery.addEventListener("change", updateMotion);
    mobileQuery.addEventListener("change", updateMobile);
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      motionQuery.removeEventListener("change", updateMotion);
      mobileQuery.removeEventListener("change", updateMobile);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  const dpr = useMemo<[number, number]>(() => {
    return isMobile ? [0.75, 1] : [1, 1.25];
  }, [isMobile]);

  if (reducedMotion) {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_40%_20%,rgba(92,188,251,0.12),transparent_55%)]"
      />
    );
  }

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 2.4], fov: 48 }}
        dpr={dpr}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      >
        <LatticeTunnel pointer={pointerRef} />
        <FloatingShapes pointer={pointerRef} />
      </Canvas>
    </div>
  );
}

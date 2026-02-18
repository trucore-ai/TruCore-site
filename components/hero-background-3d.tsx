"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import { BufferAttribute, Group, Mesh } from "three";

type PointerTarget = {
  x: number;
  y: number;
};

function WaveField({ pointer }: { pointer: MutableRefObject<PointerTarget> }) {
  const groupRef = useRef<Group>(null);
  const primaryRef = useRef<Mesh>(null);
  const accentRef = useRef<Mesh>(null);
  const initialPositions = useRef<Float32Array | null>(null);
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    const group = groupRef.current;
    const primary = primaryRef.current;
    const accent = accentRef.current;

    if (!group || !primary || !accent) {
      return;
    }

    group.rotation.y += (pointer.current.x * 0.12 - group.rotation.y) * 0.06;
    group.rotation.x += (-pointer.current.y * 0.06 - group.rotation.x) * 0.06;

    state.camera.position.x += (pointer.current.x * 0.2 - state.camera.position.x) * 0.045;
    state.camera.position.y += (pointer.current.y * 0.14 - state.camera.position.y) * 0.045;
    state.camera.lookAt(0, 0, 0);

    const positionAttribute = primary.geometry.attributes.position as BufferAttribute;

    if (!initialPositions.current) {
      initialPositions.current = positionAttribute.array.slice() as Float32Array;
    }

    const sourcePositions = initialPositions.current;
    const targetPositions = positionAttribute.array as Float32Array;

    timeRef.current += delta;
    const t = timeRef.current;

    for (let index = 0; index < targetPositions.length; index += 3) {
      const x = sourcePositions[index];
      const y = sourcePositions[index + 1];

      const wave =
        Math.sin((x + t * 0.9) * 1.2) * 0.045 +
        Math.cos((y + t * 0.75) * 1.5) * 0.03;

      targetPositions[index + 2] = wave;
    }

    positionAttribute.needsUpdate = true;

    const accentRotationTarget = pointer.current.x * 0.04;
    accent.rotation.z += (accentRotationTarget - accent.rotation.z) * 0.06;
  });

  return (
    <group ref={groupRef}>
      <mesh ref={primaryRef} position={[0, 0, -0.6]}>
        <planeGeometry args={[11, 5.8, 42, 20]} />
        <meshBasicMaterial
          color="#5cbcfb"
          wireframe
          transparent
          opacity={0.17}
        />
      </mesh>

      <mesh ref={accentRef} position={[0, 0, -0.7]}>
        <planeGeometry args={[11, 5.8, 12, 6]} />
        <meshBasicMaterial
          color="#ff9b2f"
          wireframe
          transparent
          opacity={0.05}
        />
      </mesh>
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

      pointerRef.current.x = (normalizedX - 0.5) * 2;
      pointerRef.current.y = (0.5 - normalizedY) * 2;
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
        <WaveField pointer={pointerRef} />
      </Canvas>
    </div>
  );
}

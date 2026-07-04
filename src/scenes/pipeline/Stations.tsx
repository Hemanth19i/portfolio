"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { color } from "@/lib/tokens";
import { pipelineCurve, STATIONS } from "./curve";

/* Module-scope scratch — zero per-frame allocations (Reference §6). */
const UNIT_Z = new THREE.Vector3(0, 0, 1);
const camPos = new THREE.Vector3();

const PULSE_PERIOD = 2.2; // s, sine
const PROX_NEAR = 3.5; // world units — full brightness inside this
const PROX_FAR = 9; // world units — dim beyond this

/**
 * The four stations (Phase 2.5): a glowing --current torus ring encircles
 * the pipe at each station fraction. It pulses (scale 1→1.06, 2.2s sine)
 * and brightens as the camera approaches. Under reduced motion the pulse
 * is frozen; proximity brightening remains (it tracks scroll, not time).
 */
export function Stations({ reducedMotion }: { reducedMotion: boolean }) {
  const meshes = useRef<Array<THREE.Mesh | null>>([]);
  const t = useRef(0);

  // fixed transforms per station — computed once
  const placements = useMemo(
    () =>
      STATIONS.map((f) => {
        const pos = pipelineCurve.getPointAt(f);
        const tan = pipelineCurve.getTangentAt(f);
        const quat = new THREE.Quaternion().setFromUnitVectors(UNIT_Z, tan);
        return { pos, quat };
      }),
    [],
  );

  useFrame((state, delta) => {
    if (!reducedMotion) t.current += delta;
    state.camera.getWorldPosition(camPos);

    for (let i = 0; i < meshes.current.length; i++) {
      const mesh = meshes.current[i];
      if (!mesh) continue;

      // proximity 0..1 (1 = near)
      const d = camPos.distanceTo(placements[i].pos);
      const prox = 1 - THREE.MathUtils.clamp((d - PROX_NEAR) / (PROX_FAR - PROX_NEAR), 0, 1);

      const pulse = reducedMotion
        ? 0
        : Math.sin((t.current / PULSE_PERIOD) * Math.PI * 2) * 0.5 + 0.5;

      const s = 1 + pulse * 0.06;
      mesh.scale.setScalar(s);

      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.6 + prox * 2.2 + pulse * 0.4;
    }
  });

  return (
    <>
      {placements.map((p, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshes.current[i] = el;
          }}
          position={p.pos}
          quaternion={p.quat}
        >
          <torusGeometry args={[0.16, 0.02, 12, 40]} />
          <meshStandardMaterial
            color="#000000"
            emissive={color.current}
            emissiveIntensity={0.9}
            roughness={1}
            metalness={0}
            toneMapped={false}
          />
        </mesh>
      ))}
    </>
  );
}

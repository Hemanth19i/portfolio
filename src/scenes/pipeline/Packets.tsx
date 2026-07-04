"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { color } from "@/lib/tokens";
import { motion } from "@/lib/motion";
import { pipelineCurve, curveLength } from "./curve";

/* Module-scope scratch — zero per-frame allocations (Reference §6). */
const dummy = new THREE.Object3D();
const scratchPos = new THREE.Vector3();
const scratchTan = new THREE.Vector3();
const UNIT_Z = new THREE.Vector3(0, 0, 1);

/* Camera sits ~this far from the curve (see CameraRig CAM_OFFSET); used to
   convert the px/s speed ceiling into world units without per-frame alloc. */
const CAM_DIST = 5.4;

/**
 * Data advected along the curve (Phase 2.5): additive, bright --signal
 * emissive instances with per-instance size + speed variance, stretched
 * along the direction of travel for a motion-trail feel. One InstancedMesh,
 * count set by GPU tier; trails only on tiers that can afford the tangent
 * sample (Reference §6 tiers).
 */
export function Packets({ count, trails }: { count: number; trails: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const t = useRef(0);

  // per-instance: [u offset, speed scale, x jitter, z jitter, size, stretch]
  const params = useMemo(() => {
    const a = new Float32Array(count * 6);
    for (let i = 0; i < count; i++) {
      a[i * 6] = Math.random(); // u offset
      a[i * 6 + 1] = 0.5 + Math.random() * 0.6; // speed scale 0.5–1.1
      const ang = Math.random() * Math.PI * 2;
      const r = 0.04 + Math.random() * 0.09;
      a[i * 6 + 2] = Math.cos(ang) * r; // x jitter
      a[i * 6 + 3] = Math.sin(ang) * r; // z jitter
      a[i * 6 + 4] = 0.7 + Math.random() * 0.7; // size 0.7–1.4x
      a[i * 6 + 5] = 1.6 + Math.random() * 1.8; // stretch 1.6–3.4x
    }
    return a;
  }, [count]);

  useFrame((state, delta) => {
    const m = mesh.current;
    if (!m) return;

    // demand frameloop: clamp the gap so packets never teleport after idle
    t.current += Math.min(delta, 1 / 30);

    // perceived speed ceiling: motion.flow.maxSpeedPx, converted at curve depth
    const cam = state.camera as THREE.PerspectiveCamera;
    const worldH = 2 * CAM_DIST * Math.tan((cam.fov * Math.PI) / 360);
    const pxPerWorld = state.size.height / worldH;
    const uPerSec = motion.flow.maxSpeedPx / pxPerWorld / curveLength;

    for (let i = 0; i < count; i++) {
      const u = (params[i * 6] + t.current * uPerSec * params[i * 6 + 1]) % 1;
      pipelineCurve.getPointAt(u, scratchPos);
      dummy.position.set(
        scratchPos.x + params[i * 6 + 2],
        scratchPos.y,
        scratchPos.z + params[i * 6 + 3],
      );

      const size = params[i * 6 + 4];
      if (trails) {
        // orient the elongated instance along the curve tangent
        pipelineCurve.getTangentAt(u, scratchTan);
        dummy.quaternion.setFromUnitVectors(UNIT_Z, scratchTan);
        dummy.scale.set(size, size, size * params[i * 6 + 5]);
      } else {
        dummy.quaternion.identity();
        dummy.scale.set(size, size, size);
      }

      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      key={`${count}-${trails}`}
      ref={mesh}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      {/* base is slightly elongated on +Z so stretch reads as a trail */}
      <boxGeometry args={[0.03, 0.03, 0.05]} />
      <meshBasicMaterial
        color={color.signal}
        transparent
        opacity={0.95}
        blending={2 /* THREE.AdditiveBlending */}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

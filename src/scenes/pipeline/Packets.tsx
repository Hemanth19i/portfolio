"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { color } from "@/lib/tokens";
import { motion } from "@/lib/motion";
import { pipelineCurve, curveLength } from "./curve";

/* Module-scope scratch objects — zero per-frame allocations (Reference §6). */
const dummy = new THREE.Object3D();
const scratch = new THREE.Vector3();

/* Camera sits ~this far from the curve (see CameraRig CAM_OFFSET); used to
   convert the px/s speed ceiling into world units without per-frame alloc. */
const CAM_DIST = 5.4;

/** Data advected along the curve — one InstancedMesh, count set by GPU tier. */
export function Packets({ count }: { count: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const t = useRef(0);

  // per-instance: phase offset, speed scale (0.55–1 of the ceiling), radial jitter
  const params = useMemo(() => {
    const a = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      a[i * 4] = Math.random(); // u offset
      a[i * 4 + 1] = 0.55 + Math.random() * 0.45; // speed scale
      const ang = Math.random() * Math.PI * 2;
      const r = 0.04 + Math.random() * 0.09;
      a[i * 4 + 2] = Math.cos(ang) * r; // x jitter
      a[i * 4 + 3] = Math.sin(ang) * r; // z jitter
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
      const u =
        (params[i * 4] + t.current * uPerSec * params[i * 4 + 1]) % 1;
      pipelineCurve.getPointAt(u, scratch);
      dummy.position.set(
        scratch.x + params[i * 4 + 2],
        scratch.y,
        scratch.z + params[i * 4 + 3],
      );
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      key={count}
      ref={mesh}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      <boxGeometry args={[0.03, 0.03, 0.03]} />
      <meshBasicMaterial color={color.signal} />
    </instancedMesh>
  );
}

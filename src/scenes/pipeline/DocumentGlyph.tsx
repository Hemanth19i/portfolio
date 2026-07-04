"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { color } from "@/lib/tokens";
import { damp } from "maath/easing";
import { pipelineCurve } from "./curve";
import { scroll } from "./signals";

/* Module-scope scratch — zero per-frame allocations (Reference §6). */
const FLOAT_AMP = 0.05;
const FLOAT_PERIOD = 4; // s
const TIP = THREE.MathUtils.degToRad(15);

/** A rounded-rectangle outline as a closed line loop of points. */
function roundedRectPoints(w: number, h: number, r: number, seg = 6) {
  const pts: THREE.Vector3[] = [];
  const hw = w / 2 - r;
  const hh = h / 2 - r;
  // corner centres, CCW from bottom-right
  const corners = [
    [hw, -hh, -Math.PI / 2, 0],
    [hw, hh, 0, Math.PI / 2],
    [-hw, hh, Math.PI / 2, Math.PI],
    [-hw, -hh, Math.PI, (3 * Math.PI) / 2],
  ] as const;
  for (const [cx, cy, a0, a1] of corners) {
    for (let i = 0; i <= seg; i++) {
      const a = a0 + ((a1 - a0) * i) / seg;
      pts.push(new THREE.Vector3(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0));
    }
  }
  pts.push(pts[0].clone()); // close
  return pts;
}

/**
 * THE DOCUMENT GLYPH (Phase 2.5): a wireframe rounded-rect in --signal
 * floating just above the curve head — the visitor's own packet, about to
 * enter the pipeline. Gentle float (±0.05, 4s); tips forward 15° once the
 * visitor starts scrolling (scroll.progress > 0.02). Reduced motion: no
 * float; tip is applied statically from scroll position.
 */
export function DocumentGlyph({ reducedMotion }: { reducedMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  const tip = useRef(0);
  const t = useRef(0);

  const basePos = useMemo(() => {
    const head = pipelineCurve.getPointAt(0);
    return new THREE.Vector3(head.x, head.y + 0.35, head.z + 0.7);
  }, []);

  const line = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints(
      roundedRectPoints(0.5, 0.64, 0.08),
    );
    const mat = new THREE.LineBasicMaterial({
      color: color.signal,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    return new THREE.Line(geom, mat);
  }, []);

  useEffect(
    () => () => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    },
    [line],
  );

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;

    const wantTip = scroll.progress > 0.02 ? TIP : 0;
    if (reducedMotion) {
      g.position.copy(basePos);
      g.rotation.x = wantTip;
    } else {
      t.current += delta;
      g.position.set(
        basePos.x,
        basePos.y + Math.sin((t.current / FLOAT_PERIOD) * Math.PI * 2) * FLOAT_AMP,
        basePos.z,
      );
      damp(tip, "current", wantTip, 0.25, delta);
      g.rotation.x = tip.current;
    }
  });

  return (
    <group ref={group}>
      <primitive object={line} />
    </group>
  );
}

"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { color } from "@/lib/tokens";
import { pipelineCurve } from "./curve";

/**
 * Reduced-motion stand-in for the packet flow (Reference §3 mapping):
 * a static dashed path in --signal. No animation, ever.
 */
export function DashedFlow() {
  const line = useMemo(() => {
    // nudged toward the camera so the dashes read on top of the tube
    const points = pipelineCurve.getPoints(240);
    for (const p of points) p.z += 0.08;
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineDashedMaterial({
      color: color.signal,
      dashSize: 0.18,
      gapSize: 0.14,
      transparent: true,
      opacity: 0.9,
    });
    const l = new THREE.Line(geom, mat);
    l.computeLineDistances();
    return l;
  }, []);

  // r3f does not auto-dispose <primitive> objects
  useEffect(() => {
    return () => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    };
  }, [line]);

  return <primitive object={line} />;
}

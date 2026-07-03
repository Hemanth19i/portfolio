"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { damp3 } from "maath/easing";
import { motion } from "@/lib/motion";
import { pipelineCurve, nearestStation } from "./curve";

/* Module-scope scratch vectors — zero per-frame allocations (Reference §6). */
const targetPos = new THREE.Vector3();
const targetLook = new THREE.Vector3();

const CAM_OFFSET = new THREE.Vector3(0, 0.4, 5.4);
const LOOK_AHEAD = 0.03;

/* motion.spring.damping is a lambda; maath damp takes smoothTime ≈ 1/λ. */
const SMOOTH_TIME = 1 / motion.spring.damping;

/**
 * Camera position = f(native scroll progress), damped with maath.
 * We READ scroll — never own it (Reference §4: never hijack wheel events).
 * frameloop is "demand": invalidate() fires on scroll/resize only, and the
 * rig keeps invalidating until the damp settles.
 *
 * Reduced motion: the camera CUTS between station positions instead of
 * traveling the curve.
 */
export function CameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  const progress = useRef(0);
  const look = useMemo(
    () => pipelineCurve.getPointAt(LOOK_AHEAD).clone(),
    [],
  );
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    const onScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      let p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (reducedMotion) p = nearestStation(p);
      progress.current = p;
      invalidate();
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reducedMotion, invalidate]);

  useFrame((state, delta) => {
    const p = progress.current;
    pipelineCurve.getPointAt(p, targetPos).add(CAM_OFFSET);
    pipelineCurve.getPointAt(Math.min(1, p + LOOK_AHEAD), targetLook);

    if (reducedMotion) {
      state.camera.position.copy(targetPos);
      look.copy(targetLook);
    } else {
      const moving = damp3(state.camera.position, targetPos, SMOOTH_TIME, delta);
      const turning = damp3(look, targetLook, SMOOTH_TIME, delta);
      if (moving || turning) state.invalidate();
    }
    state.camera.lookAt(look);
  });

  return null;
}

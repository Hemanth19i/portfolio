"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { damp3 } from "maath/easing";
import { motion } from "@/lib/motion";
import { pipelineCurve, nearestStation } from "./curve";
import { scroll, pointer } from "./signals";

/* Module-scope scratch vectors — zero per-frame allocations (Reference §6). */
const targetPos = new THREE.Vector3();
const targetLook = new THREE.Vector3();
const tangent = new THREE.Vector3();
const parallaxCur = new THREE.Vector3();
const parallaxTarget = new THREE.Vector3();

const CAM_OFFSET = new THREE.Vector3(0, 0.4, 5.4);
const LOOK_AHEAD = 0.045; // look further down the pipe → travel feels like flight
const PARALLAX = 0.15; // world units, max lateral drift

/* motion.spring.damping is a lambda; maath damp takes smoothTime ≈ 1/λ. */
const SMOOTH_TIME = 1 / motion.spring.damping;

/**
 * Camera position = f(native scroll progress), damped with maath. We READ
 * scroll — never own it (Reference §4: never hijack wheel events).
 * Phase 2.5 adds damped mouse parallax and a tangent-aligned look-ahead so
 * travel reads as flight, not a slide. frameloop stays "demand".
 *
 * Reduced motion: the camera CUTS between station positions (no travel);
 * parallax is disabled.
 */
export function CameraRig({
  reducedMotion,
  parallax,
}: {
  reducedMotion: boolean;
  parallax: boolean;
}) {
  const look = useMemo(() => pipelineCurve.getPointAt(LOOK_AHEAD).clone(), []);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    const onScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      let p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (reducedMotion) p = nearestStation(p);
      scroll.progress = p;
      invalidate();
    };
    const onPointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
      if (parallax && !reducedMotion) invalidate();
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    if (parallax && !reducedMotion)
      window.addEventListener("pointermove", onPointer, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pointermove", onPointer);
    };
  }, [reducedMotion, parallax, invalidate]);

  useFrame((state, delta) => {
    const p = scroll.progress;
    pipelineCurve.getPointAt(p, targetPos).add(CAM_OFFSET);
    pipelineCurve.getPointAt(Math.min(1, p + LOOK_AHEAD), targetLook);

    // look-ahead biased along the curve tangent for a sense of flight
    pipelineCurve.getTangentAt(p, tangent);
    targetLook.addScaledVector(tangent, 0.6);

    // damped mouse parallax (lateral drift only)
    if (parallax && !reducedMotion) {
      parallaxTarget.set(pointer.x * PARALLAX, pointer.y * PARALLAX, 0);
    } else {
      parallaxTarget.set(0, 0, 0);
    }
    damp3(parallaxCur, parallaxTarget, SMOOTH_TIME, delta);
    targetPos.add(parallaxCur);

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

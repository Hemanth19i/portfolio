"use client";

import { Canvas } from "@react-three/fiber";
import { color } from "@/lib/tokens";
import { MAX_DPR, PACKET_COUNT, type QualityTier } from "@/lib/gpu";
import { PipelineTube } from "./PipelineTube";
import { Packets } from "./Packets";
import { DashedFlow } from "./DashedFlow";
import { CameraRig } from "./CameraRig";

/**
 * The canvas layer (Reference §6). aria-hidden scenery at z-0 — the DOM
 * carries every word. frameloop="demand"; the rig invalidates on scroll.
 */
export default function Scene({
  tier,
  reducedMotion,
  onReady,
}: {
  tier: Exclude<QualityTier, 0>;
  reducedMotion: boolean;
  onReady: () => void;
}) {
  return (
    <Canvas
      gl={{ antialias: true, powerPreference: "high-performance" }}
      dpr={[1, MAX_DPR[tier]]}
      frameloop="demand"
      camera={{ fov: 42, position: [0, 6.4, 5.4] }}
      onCreated={onReady}
    >
      <color attach="background" args={[color.graphite]} />
      <fog attach="fog" args={[color.graphite, 8, 26]} />
      <PipelineTube />
      {reducedMotion ? <DashedFlow /> : <Packets count={PACKET_COUNT[tier]} />}
      <CameraRig reducedMotion={reducedMotion} />
    </Canvas>
  );
}

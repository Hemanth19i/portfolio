"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useState, type ComponentType } from "react";
import { color } from "@/lib/tokens";
import { MAX_DPR, PACKET_COUNT, caps, type QualityTier } from "@/lib/gpu";
import { PipelineTube } from "./PipelineTube";
import { Packets } from "./Packets";
import { DashedFlow } from "./DashedFlow";
import { CameraRig } from "./CameraRig";
import { Stations } from "./Stations";
import { DocumentGlyph } from "./DocumentGlyph";
import { Backdrop } from "./Backdrop";
import { Effects } from "./Effects";
import { AmbientTicker } from "./AmbientTicker";

/**
 * The canvas layer (Reference §6). aria-hidden scenery at z-0 — the DOM
 * carries every word. frameloop="demand"; the rig invalidates on scroll,
 * and AmbientTicker drives continuous life when motion is allowed
 * (ADR-004). Phase 2.5 adds bloom, station rings, the document glyph, a
 * depth backdrop and mouse parallax, all tier-gated.
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
  const cap = caps(tier);

  // B2 fluid field — T3 desktop, motion allowed, fine pointer only. Loaded
  // via a separate dynamic import so T2-and-below never download it. Kill-
  // gated by frame time on real hardware (ADR-008).
  const [fluid, setFluid] = useState<ComponentType | null>(null);
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (tier !== 3 || reducedMotion || !fine) return;
    let alive = true;
    import("./fluid/FluidField").then((m) => {
      if (alive) setFluid(() => m.FluidField as ComponentType);
    });
    return () => {
      alive = false;
    };
  }, [tier, reducedMotion]);

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

      <Backdrop />
      <PipelineTube />
      <Stations reducedMotion={reducedMotion} />
      <DocumentGlyph reducedMotion={reducedMotion} />
      {reducedMotion ? (
        <DashedFlow />
      ) : (
        <Packets count={PACKET_COUNT[tier]} trails={cap.trails} />
      )}

      <CameraRig reducedMotion={reducedMotion} parallax={cap.parallax} />
      {!reducedMotion && <AmbientTicker />}
      {cap.bloom && <Effects fluid={fluid} />}
    </Canvas>
  );
}

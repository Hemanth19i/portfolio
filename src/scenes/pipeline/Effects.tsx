"use client";

import type { ComponentType } from "react";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

/**
 * BLOOM (Phase 2.5), desktop T2+ only. A high luminance threshold means
 * only the bright emissive elements bloom; the dark backdrop/grid sit below
 * threshold and never glow, and the DOM is a separate layer entirely
 * (Reference §6: emissive-only, never the page).
 *
 * FluidField (Phase 2.6b B2, T3 only) is passed in already-loaded and
 * rendered as the LAST pass — after Bloom, so its faint dye is never
 * bloomed. It arrives via a dynamic import so T2-and-below never download
 * it (see Scene.tsx). `null` when not applicable.
 */
export function Effects({
  fluid: Fluid,
}: {
  fluid?: ComponentType | null;
}) {
  const passes = [
    <Bloom
      key="bloom"
      mipmapBlur
      luminanceThreshold={0.6}
      luminanceSmoothing={0.2}
      intensity={0.9}
      radius={0.7}
    />,
  ];
  if (Fluid) passes.push(<Fluid key="fluid" />);

  // Remount the composer when the (lazily-loaded) fluid pass appears, so it
  // rebuilds its pass list and actually collects the effect.
  return <EffectComposer key={Fluid ? "with-fluid" : "bloom-only"}>{passes}</EffectComposer>;
}

"use client";

import { EffectComposer, Bloom } from "@react-three/postprocessing";

/**
 * BLOOM (Phase 2.5), desktop T2+ only. A high luminance threshold means
 * only the bright emissive elements — the tube core, packets, station
 * rings, glyph (all rendered with toneMapped=false so they exceed 1.0) —
 * bloom. The dark backdrop and grid sit below threshold and never glow;
 * the DOM is a separate layer entirely, so text can never bloom
 * (Reference §6: emissive-only, never the page).
 */
export function Effects() {
  return (
    <EffectComposer>
      <Bloom
        mipmapBlur
        luminanceThreshold={0.6}
        luminanceSmoothing={0.2}
        intensity={0.9}
        radius={0.7}
      />
    </EffectComposer>
  );
}

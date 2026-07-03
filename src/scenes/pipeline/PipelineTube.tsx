"use client";

import { color } from "@/lib/tokens";
import { pipelineCurve } from "./curve";

/**
 * The pipe itself: one TubeGeometry over THE curve, r≈0.02, in --current.
 * Thin on purpose — --current stays scarce (Reference §1).
 */
export function PipelineTube() {
  return (
    <mesh frustumCulled={false}>
      <tubeGeometry args={[pipelineCurve, 220, 0.02, 8, false]} />
      <meshBasicMaterial color={color.current} transparent opacity={0.85} />
    </mesh>
  );
}

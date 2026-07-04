"use client";

import { color } from "@/lib/tokens";
import { pipelineCurve } from "./curve";

/**
 * The pipe itself (Phase 2.5): a solid emissive core in --current at
 * r=0.06 so it carries presence and feeds bloom, wrapped in a faint
 * additive wireframe halo tube (r=0.09) for a sense of field around it.
 * --current stays scarce — the halo is nearly invisible (Reference §1).
 */
export function PipelineTube() {
  return (
    <group frustumCulled={false}>
      {/* emissive core — layer-1 bright element, blooms */}
      <mesh>
        <tubeGeometry args={[pipelineCurve, 240, 0.06, 12, false]} />
        <meshStandardMaterial
          color="#000000"
          emissive={color.current}
          emissiveIntensity={1.8}
          roughness={1}
          metalness={0}
          toneMapped={false}
        />
      </mesh>

      {/* additive wireframe halo — depth field around the pipe */}
      <mesh>
        <tubeGeometry args={[pipelineCurve, 160, 0.09, 8, false]} />
        <meshBasicMaterial
          color={color.current}
          wireframe
          transparent
          opacity={0.12}
          depthWrite={false}
          blending={2 /* THREE.AdditiveBlending */}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

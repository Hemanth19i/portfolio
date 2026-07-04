"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { color } from "@/lib/tokens";

/**
 * DEPTH (Phase 2.5): one large plane far behind the pipe carrying a very
 * faint procedural grid in --line over --graphite, so the scene reads as
 * sitting in a space rather than floating in void. Barely perceptible and
 * well below the bloom threshold — depth, not decoration (Reference §6).
 */
export function Backdrop() {
  const mesh = useMemo(() => {
    const geom = new THREE.PlaneGeometry(90, 90);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uBase: { value: new THREE.Color(color.graphite) },
        uLine: { value: new THREE.Color(color.line) },
        uScale: { value: 24 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        uniform vec3 uBase;
        uniform vec3 uLine;
        uniform float uScale;
        void main() {
          vec2 g = abs(fract(vUv * uScale - 0.5) - 0.5) / fwidth(vUv * uScale);
          float line = 1.0 - min(min(g.x, g.y), 1.0);
          // fade grid out toward the edges so it dissolves into the fog
          float vignette = smoothstep(0.0, 0.35, vUv.x) * smoothstep(1.0, 0.65, vUv.x)
                         * smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.65, vUv.y);
          vec3 col = mix(uBase, uLine, line * 0.5);
          gl_FragColor = vec4(col, (0.10 + line * 0.10) * vignette);
        }
      `,
    });
    const m = new THREE.Mesh(geom, mat);
    m.position.set(0, -4.5, -11);
    m.renderOrder = -1;
    return m;
  }, []);

  useEffect(
    () => () => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    },
    [mesh],
  );

  return <primitive object={mesh} />;
}

"use client";

import * as THREE from "three";
import { Effect, BlendFunction } from "postprocessing";
import { wrapEffect } from "@react-three/postprocessing";
import { color } from "@/lib/tokens";
import { FluidSim } from "./FluidSim";

/**
 * Fluid FIELD (Phase 2.6b B2) — the last postprocessing pass. It stirs a
 * ping-pong fluid sim with the pointer and (a) offsets the SCENE texture's
 * UVs by the velocity field (clamped to ≤8px) and (b) adds a faint --signal
 * dye. It distorts ONLY the WebGL canvas render; the DOM/text lives on a
 * separate HTML layer above the canvas and is architecturally untouchable
 * by any pass. T3-desktop only, dynamically imported, disposable (ADR-008).
 *
 * The sim ticks only while the pointer has moved in the last 2s; otherwise
 * update() early-returns and the field costs nothing.
 */

/* ---- live-tunable dials (iterate these with Hemanth in the preview) ---- */
const STRENGTH = 0.00006; // velocity → UV offset (capped by uMaxOffset)
const DYE_STRENGTH = 0.12; // additive dye opacity (≤0.15, below bloom)
const SIM_RES = 128;
const ITERATIONS = 6; // Jacobi pressure iterations
const IDLE_MS = 2000; // stop stepping after this long without pointer motion

const FRAG = /* glsl */ `
  uniform sampler2D uVelocity;
  uniform sampler2D uDye;
  uniform float uStrength;
  uniform float uDyeStrength;
  uniform vec2 uMaxOffset;

  void mainUv(inout vec2 uv) {
    vec2 off = texture2D(uVelocity, uv).xy * uStrength;
    off = clamp(off, -uMaxOffset, uMaxOffset);
    uv += off;
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 dye = texture2D(uDye, uv).rgb;
    outputColor = vec4(inputColor.rgb + dye * uDyeStrength, inputColor.a);
  }
`;

type Pointer = { x: number; y: number; dx: number; dy: number; lastMove: number };

class FluidEffect extends Effect {
  private pointer: Pointer = { x: 0.5, y: 0.5, dx: 0, dy: 0, lastMove: -1e9 };
  private sim = new FluidSim(SIM_RES, ITERATIONS);
  private size = new THREE.Vector2();

  constructor() {
    super("FluidEffect", FRAG, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform>([
        ["uVelocity", new THREE.Uniform(null)],
        ["uDye", new THREE.Uniform(null)],
        ["uStrength", new THREE.Uniform(STRENGTH)],
        ["uDyeStrength", new THREE.Uniform(DYE_STRENGTH)],
        ["uMaxOffset", new THREE.Uniform(new THREE.Vector2(0.007, 0.007))],
      ]),
    });
    this.sim.dyeColor.set(color.signal); // dye colour from tokens, no hex literal
    if (typeof window !== "undefined") {
      window.addEventListener("pointermove", this.onMove, { passive: true });
    }
  }

  private onMove = (e: PointerEvent) => {
    const p = this.pointer;
    const x = e.clientX / window.innerWidth;
    const y = 1 - e.clientY / window.innerHeight; // GL-oriented UV
    p.dx += x - p.x;
    p.dy += y - p.y;
    p.x = x;
    p.y = y;
    p.lastMove = performance.now();
  };

  update(renderer: THREE.WebGLRenderer, _input: THREE.WebGLRenderTarget, dt: number) {
    if (performance.now() - this.pointer.lastMove > IDLE_MS) return; // idle: free

    renderer.getDrawingBufferSize(this.size);
    const prevTarget = renderer.getRenderTarget();
    const prevAutoClear = renderer.autoClear;
    renderer.autoClear = false;

    this.sim.setAspect(this.size.x, this.size.y);
    this.sim.step(renderer, dt, this.pointer);

    renderer.setRenderTarget(prevTarget);
    renderer.autoClear = prevAutoClear;

    this.pointer.dx = 0;
    this.pointer.dy = 0;

    this.uniforms.get("uVelocity")!.value = this.sim.velocityTexture;
    this.uniforms.get("uDye")!.value = this.sim.dyeTexture;
    (this.uniforms.get("uMaxOffset")!.value as THREE.Vector2).set(
      8 / this.size.x,
      8 / this.size.y,
    );
  }

  dispose() {
    if (typeof window !== "undefined") {
      window.removeEventListener("pointermove", this.onMove);
    }
    this.sim.dispose();
    super.dispose();
  }
}

export const FluidField = wrapEffect(FluidEffect);

export default FluidField;

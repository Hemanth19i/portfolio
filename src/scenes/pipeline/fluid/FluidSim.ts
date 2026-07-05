import * as THREE from "three";

/**
 * Minimal GPU stable-fluids solver (Phase 2.6b B2) — velocity + dye on a
 * ping-pong FBO grid. Classic Stam/Dobryakov passes: advect → splat →
 * divergence → Jacobi pressure → gradient-subtract → advect dye. Kept low
 * res and low iteration on purpose; this is disposable garnish (ADR-008).
 *
 * Nothing here touches the DOM: it renders to off-screen render targets and
 * exposes velocity/dye textures for the FluidEffect to sample.
 */

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const ADVECT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uSource;
  uniform sampler2D uVelocity;
  uniform vec2 uTexel;
  uniform float uDt;
  uniform float uDissipation;
  void main() {
    vec2 vel = texture2D(uVelocity, vUv).xy;
    vec2 coord = vUv - uDt * vel * uTexel;
    gl_FragColor = uDissipation * texture2D(uSource, coord);
  }
`;

const SPLAT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTarget;
  uniform vec3 uColor;
  uniform vec2 uPoint;
  uniform float uRadius;
  uniform float uAspect;
  void main() {
    vec2 p = vUv - uPoint;
    p.x *= uAspect;
    float f = exp(-dot(p, p) / uRadius);
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + f * uColor, 1.0);
  }
`;

const DIVERGENCE = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform vec2 uTexel;
  void main() {
    float l = texture2D(uVelocity, vUv - vec2(uTexel.x, 0.0)).x;
    float r = texture2D(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
    float b = texture2D(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
    float t = texture2D(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
    gl_FragColor = vec4(0.5 * (r - l + t - b), 0.0, 0.0, 1.0);
  }
`;

const PRESSURE = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  uniform vec2 uTexel;
  void main() {
    float l = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
    float r = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
    float b = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
    float t = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
    float d = texture2D(uDivergence, vUv).x;
    gl_FragColor = vec4((l + r + b + t - d) * 0.25, 0.0, 0.0, 1.0);
  }
`;

const GRADIENT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;
  uniform vec2 uTexel;
  void main() {
    float l = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
    float r = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
    float b = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
    float t = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
    vec2 vel = texture2D(uVelocity, vUv).xy - 0.5 * vec2(r - l, t - b);
    gl_FragColor = vec4(vel, 0.0, 1.0);
  }
`;

type Pointer = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  lastMove: number;
};

function makeRT(res: number) {
  return new THREE.WebGLRenderTarget(res, res, {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
    stencilBuffer: false,
  });
}

export class FluidSim {
  private res: number;
  private iterations: number;
  private velocity: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget];
  private dye: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget];
  private pressure: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget];
  private divergence: THREE.WebGLRenderTarget;
  private scene = new THREE.Scene();
  private cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private quad: THREE.Mesh;
  private mats: Record<string, THREE.RawShaderMaterial | THREE.ShaderMaterial>;
  private aspect = 1;
  /** --signal dye colour, injected once (set by the effect from tokens). */
  dyeColor = new THREE.Color(0.49, 0.89, 0.96);
  velDissipation = 0.985;
  dyeDissipation = 0.975;
  forceScale = 6000;

  constructor(res = 128, iterations = 6) {
    this.res = res;
    this.iterations = iterations;
    this.velocity = [makeRT(res), makeRT(res)];
    this.dye = [makeRT(res), makeRT(res)];
    this.pressure = [makeRT(res), makeRT(res)];
    this.divergence = makeRT(res);

    const geo = new THREE.PlaneGeometry(2, 2);
    const mk = (fs: string, uniforms: Record<string, THREE.IUniform>) =>
      new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: fs, uniforms, depthTest: false });
    const texel = new THREE.Vector2(1 / res, 1 / res);
    this.mats = {
      advect: mk(ADVECT, {
        uSource: { value: null },
        uVelocity: { value: null },
        uTexel: { value: texel },
        uDt: { value: 1 },
        uDissipation: { value: 1 },
      }),
      splat: mk(SPLAT, {
        uTarget: { value: null },
        uColor: { value: new THREE.Vector3() },
        uPoint: { value: new THREE.Vector2() },
        uRadius: { value: 0.0002 },
        uAspect: { value: 1 },
      }),
      divergence: mk(DIVERGENCE, { uVelocity: { value: null }, uTexel: { value: texel } }),
      pressure: mk(PRESSURE, {
        uPressure: { value: null },
        uDivergence: { value: null },
        uTexel: { value: texel },
      }),
      gradient: mk(GRADIENT, {
        uPressure: { value: null },
        uVelocity: { value: null },
        uTexel: { value: texel },
      }),
    };
    this.quad = new THREE.Mesh(geo, this.mats.advect);
    this.scene.add(this.quad);
  }

  setAspect(width: number, height: number) {
    this.aspect = width / height;
  }

  get velocityTexture() {
    return this.velocity[0].texture;
  }
  get dyeTexture() {
    return this.dye[0].texture;
  }

  private render(
    renderer: THREE.WebGLRenderer,
    mat: THREE.ShaderMaterial | THREE.RawShaderMaterial,
    target: THREE.WebGLRenderTarget,
  ) {
    this.quad.material = mat;
    renderer.setRenderTarget(target);
    renderer.render(this.scene, this.cam);
  }

  private swap(pair: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget]) {
    const t = pair[0];
    pair[0] = pair[1];
    pair[1] = t;
  }

  /** Advance one step. Assumes caller saved/restored renderer target. */
  step(renderer: THREE.WebGLRenderer, dt: number, pointer: Pointer) {
    const m = this.mats;

    // advect velocity
    m.advect.uniforms.uVelocity.value = this.velocity[0].texture;
    m.advect.uniforms.uSource.value = this.velocity[0].texture;
    m.advect.uniforms.uDt.value = dt * 60;
    m.advect.uniforms.uDissipation.value = this.velDissipation;
    this.render(renderer, m.advect, this.velocity[1]);
    this.swap(this.velocity);

    // splat pointer force + dye
    const speed = Math.hypot(pointer.dx, pointer.dy);
    if (speed > 0) {
      m.splat.uniforms.uAspect.value = this.aspect;
      m.splat.uniforms.uPoint.value.set(pointer.x, pointer.y);
      // velocity splat
      m.splat.uniforms.uTarget.value = this.velocity[0].texture;
      (m.splat.uniforms.uColor.value as THREE.Vector3).set(
        pointer.dx * this.forceScale,
        pointer.dy * this.forceScale,
        0,
      );
      this.render(renderer, m.splat, this.velocity[1]);
      this.swap(this.velocity);
      // dye splat, scaled by speed
      m.splat.uniforms.uTarget.value = this.dye[0].texture;
      const d = Math.min(speed * 40, 1);
      (m.splat.uniforms.uColor.value as THREE.Vector3).set(
        this.dyeColor.r * d,
        this.dyeColor.g * d,
        this.dyeColor.b * d,
      );
      this.render(renderer, m.splat, this.dye[1]);
      this.swap(this.dye);
    }

    // divergence
    m.divergence.uniforms.uVelocity.value = this.velocity[0].texture;
    this.render(renderer, m.divergence, this.divergence);

    // Jacobi pressure
    for (let i = 0; i < this.iterations; i++) {
      m.pressure.uniforms.uPressure.value = this.pressure[0].texture;
      m.pressure.uniforms.uDivergence.value = this.divergence.texture;
      this.render(renderer, m.pressure, this.pressure[1]);
      this.swap(this.pressure);
    }

    // subtract pressure gradient → divergence-free velocity
    m.gradient.uniforms.uPressure.value = this.pressure[0].texture;
    m.gradient.uniforms.uVelocity.value = this.velocity[0].texture;
    this.render(renderer, m.gradient, this.velocity[1]);
    this.swap(this.velocity);

    // advect dye
    m.advect.uniforms.uVelocity.value = this.velocity[0].texture;
    m.advect.uniforms.uSource.value = this.dye[0].texture;
    m.advect.uniforms.uDissipation.value = this.dyeDissipation;
    this.render(renderer, m.advect, this.dye[1]);
    this.swap(this.dye);
  }

  dispose() {
    [...this.velocity, ...this.dye, ...this.pressure, this.divergence].forEach((rt) =>
      rt.dispose(),
    );
    this.quad.geometry.dispose();
    Object.values(this.mats).forEach((mm) => mm.dispose());
  }
}

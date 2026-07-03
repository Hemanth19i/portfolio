import * as THREE from "three";

/**
 * THE pipeline — one CatmullRomCurve3 (Reference §6). It descends in -y
 * mirroring the vertical flow of the DOM stations, with lateral meanders
 * so the camera ride has parallax without ever leaving the story's axis.
 */
const CONTROL_POINTS: ReadonlyArray<readonly [number, number, number]> = [
  [0.0, 6.0, 0.0], // claim
  [1.6, 4.2, -0.6],
  [2.4, 2.2, 0.4],
  [1.2, 0.4, 1.0],
  [-0.8, -1.2, 0.2], // verify
  [-2.2, -3.0, -0.8],
  [-1.6, -5.2, 0.6],
  [0.4, -7.0, 1.1], // telemetry
  [2.0, -9.0, 0.2],
  [1.0, -11.2, -0.9],
  [-0.9, -13.0, 0.3],
  [0.0, -15.0, 0.0], // verdict
];

export const pipelineCurve = new THREE.CatmullRomCurve3(
  CONTROL_POINTS.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
  false,
  "centripetal",
);

/** Arc length, computed once — packet advection converts px/s → u/s with it. */
export const curveLength = pipelineCurve.getLength();

/**
 * Scroll fractions where the DOM stations sit (claim / verify / telemetry /
 * verdict). Under prefers-reduced-motion the camera CUTS between these
 * instead of traveling (Reference §3 mapping).
 */
export const STATIONS = [0, 0.34, 0.67, 1] as const;

export function nearestStation(progress: number): number {
  let best: number = STATIONS[0];
  for (const s of STATIONS) {
    if (Math.abs(s - progress) < Math.abs(best - progress)) best = s;
  }
  return best;
}

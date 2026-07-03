/**
 * Quality tier resolution (Reference §6):
 *   T3 full · T2 packets 1200 · T1/mobile packets 400, dpr ≤1.5 ·
 *   T0 → the canvas never mounts; the 2D page IS the fallback.
 * `?fallback=1` forces T0 for testing/sharing.
 */
import { getGPUTier } from "detect-gpu";

export type QualityTier = 0 | 1 | 2 | 3;

export const PACKET_COUNT: Record<Exclude<QualityTier, 0>, number> = {
  1: 400,
  2: 1200,
  3: 2000,
};

export const MAX_DPR: Record<Exclude<QualityTier, 0>, number> = {
  1: 1.5,
  2: 2,
  3: 2,
};

function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (c.getContext("webgl2") || c.getContext("webgl")),
    );
  } catch {
    return false;
  }
}

export async function resolveTier(): Promise<QualityTier> {
  if (typeof window === "undefined") return 0;
  if (new URLSearchParams(window.location.search).get("fallback") === "1")
    return 0;
  // prefers-reduced-data users get the 2D page — it is complete on its own
  if (window.matchMedia("(prefers-reduced-data: reduce)").matches) return 0;
  if (!webglAvailable()) return 0;

  try {
    // benchmarks self-hosted (copied from detect-gpu/dist) — no CDN call
    const gpu = await getGPUTier({ benchmarksURL: "/benchmarks" });
    if (!gpu.tier) return 0;
    if (gpu.isMobile) return 1;
    return Math.min(gpu.tier, 3) as QualityTier;
  } catch {
    return 0; // detection failure → safest tier: no canvas at all
  }
}

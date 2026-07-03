"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { resolveTier, type QualityTier } from "@/lib/gpu";
import { motion } from "@/lib/motion";

/* The three.js chunk loads only after the tier resolves ≥1 — T0 devices
   never download it, and it never blocks the DOM-first page. */
const Scene = dynamic(() => import("./Scene"), { ssr: false });

/**
 * Cold open (panel ruling: NO boot screen of any kind): the hero HTML is
 * the first paint; when the canvas is ready it fades in behind the page
 * (opacity, motion.dur.dock). If it never mounts, the 2D page IS the site.
 */
export function PipelineCanvas() {
  const [tier, setTier] = useState<QualityTier>(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    resolveTier().then((t) => {
      if (alive) setTier(t);
    });
    return () => {
      alive = false;
      mq.removeEventListener("change", onChange);
    };
  }, []);

  if (tier === 0) return null;

  return (
    <div
      className="canvas-root"
      aria-hidden="true"
      style={{
        opacity: ready ? 1 : 0,
        transition: `opacity ${motion.dur.dock}s cubic-bezier(${motion.ease.out.join(",")})`,
      }}
    >
      <Scene
        tier={tier}
        reducedMotion={reducedMotion}
        onReady={() => setReady(true)}
      />
    </div>
  );
}

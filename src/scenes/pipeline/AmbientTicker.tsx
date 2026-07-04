"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

/**
 * Ambient life under a demand frameloop (Reference §6 keeps frameloop
 * "demand"; the app owns invalidation — see ADR-004). This drives the
 * continuous motions (packet flow, station pulse, glyph float) by calling
 * invalidate() each animation frame — but ONLY when motion is allowed and
 * the tab is visible. Under reduced motion it never mounts, so the scene
 * renders zero ambient frames and only reacts to scroll.
 */
export function AmbientTicker() {
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    let raf = 0;
    let running = true;

    const loop = () => {
      if (!running) return;
      invalidate();
      raf = requestAnimationFrame(loop);
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };

    raf = requestAnimationFrame(loop);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [invalidate]);

  return null;
}

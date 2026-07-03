"use client";

import { useEffect } from "react";

/**
 * The typographic signature (Reference §2): writes --type-load (0..1)
 * from scroll progress; display type's width axis compresses under
 * "pipeline load". Frozen under prefers-reduced-motion (handled in CSS —
 * this component simply never writes in that case).
 */
export function TypeLoad() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.body.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
        document.documentElement.style.setProperty(
          "--type-load",
          p.toFixed(3),
        );
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}

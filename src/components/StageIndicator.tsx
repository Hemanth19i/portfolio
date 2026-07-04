"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fixed mono stage indicator (Phase 2.6). As native scroll crosses the DOM
 * station boundaries it crossfades the current stage label — orientation
 * that doubles as a transition. Reads scroll; never owns it (Reference §4).
 * Reduced motion: instant swap (no crossfade — handled in CSS).
 */
const STAGES = ["CLAIM", "VERIFY 01", "TELEMETRY", "VERDICT"] as const;

export function StageIndicator() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const raf = useRef(0);

  useEffect(() => {
    const sections = () =>
      Array.from(document.querySelectorAll<HTMLElement>("main .station"));

    const onScroll = () => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        const els = sections();
        if (!els.length) return;
        const mid = window.innerHeight * 0.4;
        let next = 0;
        els.forEach((el, i) => {
          if (el.getBoundingClientRect().top <= mid) next = i;
        });
        setIndex(Math.min(next, STAGES.length - 1));
        setVisible(window.scrollY > 40);
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div
      className="stage-indicator mono"
      aria-hidden="true"
      data-visible={visible}
    >
      {STAGES.map((s, i) => (
        <span key={s} className="stage-indicator__item" data-active={i === index}>
          {s}
        </span>
      ))}
    </div>
  );
}

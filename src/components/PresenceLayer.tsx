"use client";

import { useEffect, useRef, useState } from "react";
import { playClick, playHover } from "@/lib/sound";

/* Interactive selector shared by the cursor morph and the sound ticks. */
const INTERACTIVE = "a, button, .btn, .card, [data-cursor]";

/* Spring feel derived from motion.spring — slight overshoot is intentional. */
const STIFFNESS = 0.18;
const DAMPING = 0.72;
const MAGNET_RADIUS = 40; // px — .btn pull range
const MAGNET_MAX = 6; // px — max pull

type Mode = "dot" | "ring" | "label" | "crosshair";

/**
 * Presence layer (Phase 2.6): a damped follower cursor with a contextual
 * morph, magnetic buttons, and synthesized UI ticks — all delegated from
 * one place (elements opt in via `data-cursor`). See ADR-005.
 *
 * Gating:
 *  - Cursor/morph/magnetism: `(pointer: fine)` AND not reduced-motion. The
 *    native cursor is never hidden; this is an additive layer.
 *  - Sound ticks: always wired but silent until the user enables sound;
 *    hover ticks self-suppress under reduced motion (sound.ts).
 */
export function PresenceLayer() {
  const [cursorOn, setCursorOn] = useState(false);
  const dot = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  // --- sound ticks: wired regardless of pointer type ---
  useEffect(() => {
    let last: EventTarget | null = null;
    const onOver = (e: PointerEvent) => {
      const el = (e.target as Element)?.closest?.(INTERACTIVE);
      if (el && el !== last) {
        last = el;
        playHover();
      } else if (!el) {
        last = null;
      }
    };
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element)?.closest?.(INTERACTIVE)) playClick();
    };
    document.addEventListener("pointerover", onOver);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("click", onClick);
    };
  }, []);

  // --- cursor + magnetism: fine pointers, motion allowed ---
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    setCursorOn(true);

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { ...target };
    const vel = { x: 0, y: 0 };
    let mode: Mode = "dot";
    let magnet: HTMLElement | null = null;
    let raf = 0;

    const setMode = (next: Mode, text = "") => {
      if (next === mode && !text) return;
      mode = next;
      const el = dot.current;
      if (!el) return;
      el.dataset.mode = next;
      if (label.current) label.current.textContent = next === "label" ? text : "";
    };

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;

      const hit = (e.target as Element)?.closest?.("[data-cursor], a, button, .btn, .card") as
        | HTMLElement
        | null;
      if (!hit) {
        setMode("dot");
      } else {
        const word = hit.getAttribute("data-cursor");
        if (word === "crosshair") setMode("crosshair");
        else if (word) setMode("label", word);
        else setMode("ring");
      }

      // magnetic buttons — pull the nearest .btn within range
      const btn = (e.target as Element)?.closest?.(".btn") as HTMLElement | null;
      if (btn) {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const dist = Math.hypot(dx, dy);
        if (dist < MAGNET_RADIUS + Math.max(r.width, r.height) / 2) {
          if (magnet && magnet !== btn) clearMagnet();
          magnet = btn;
          const k = MAGNET_MAX / (MAGNET_RADIUS + 20);
          btn.style.setProperty("--mag-x", `${(dx * k).toFixed(2)}px`);
          btn.style.setProperty("--mag-y", `${(dy * k).toFixed(2)}px`);
        }
      } else if (magnet) {
        clearMagnet();
      }
    };

    const clearMagnet = () => {
      if (!magnet) return;
      magnet.style.setProperty("--mag-x", "0px");
      magnet.style.setProperty("--mag-y", "0px");
      magnet = null;
    };

    const tick = () => {
      vel.x = (vel.x + (target.x - pos.x) * STIFFNESS) * DAMPING;
      vel.y = (vel.y + (target.y - pos.y) * STIFFNESS) * DAMPING;
      pos.x += vel.x;
      pos.y += vel.y;
      const el = dot.current;
      if (el) el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
      clearMagnet();
    };
  }, []);

  if (!cursorOn) return null;

  return (
    <div ref={dot} className="cursor" data-mode="dot" aria-hidden="true">
      <span ref={label} className="cursor__label mono" />
    </div>
  );
}

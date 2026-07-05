"use client";

import { useEffect, useRef, useState } from "react";
import { playClick, playHover } from "@/lib/sound";

/* Interactive selector shared by the cursor morph and the sound ticks. */
const INTERACTIVE = "a, button, .btn, .card, [data-cursor]";

/* Spring feel (tuned 2.6b): slightly lazy follow with soft overshoot. */
const STIFFNESS = 0.14;
const DAMPING = 0.66;
const MAGNET_RADIUS = 52; // px — .btn pull range
const MAGNET_MAX = 8; // px — max pull

/* Liquid droplet (2.6b B1): squash & stretch along velocity. */
const SPEED_MAX = 32; // px/frame → full stretch
const STRETCH_MAX = 0.8; // scaleX up to 1 + 0.8 = 1.8, scaleY compensates
const MORPH_POP = 1.08; // elastic overshoot on morph transitions
const TAIL_STIFF = STIFFNESS * 0.6; // trailing dot lags at ~60% spring speed

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
  const tail = useRef<HTMLDivElement>(null);
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
    const tailPos = { ...target };
    const tailVel = { x: 0, y: 0 };
    let mode: Mode = "dot";
    let magnet: HTMLElement | null = null;
    let morphPop = 1; // decays toward 1 after each morph
    let angle = 0; // last significant movement angle
    let raf = 0;

    const setMode = (next: Mode, text = "") => {
      if (next === mode && !text) return;
      mode = next;
      morphPop = MORPH_POP; // elastic pop on every state change
      const el = dot.current;
      if (!el) return;
      el.dataset.mode = next;
      if (label.current) label.current.textContent = next === "label" ? text : "";
      // the trailing droplet reads only in the plain dot state
      if (tail.current) tail.current.style.opacity = next === "dot" ? "" : "0";
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
      // main dot spring
      vel.x = (vel.x + (target.x - pos.x) * STIFFNESS) * DAMPING;
      vel.y = (vel.y + (target.y - pos.y) * STIFFNESS) * DAMPING;
      pos.x += vel.x;
      pos.y += vel.y;

      // squash & stretch along velocity, area-preserving; spring back at rest
      const speed = Math.hypot(vel.x, vel.y);
      const sx = 1 + Math.min(speed / SPEED_MAX, 1) * STRETCH_MAX;
      const sy = 1 / sx;
      if (speed > 0.5) angle = Math.atan2(vel.y, vel.x);
      morphPop += (1 - morphPop) * 0.18; // ease the elastic pop back to 1

      const el = dot.current;
      if (el) {
        el.style.transform =
          `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) ` +
          `rotate(${angle}rad) scale(${(sx * morphPop).toFixed(3)}, ${(sy * morphPop).toFixed(3)})`;
      }

      // trailing droplet — slower spring toward the main dot
      tailVel.x = (tailVel.x + (pos.x - tailPos.x) * TAIL_STIFF) * DAMPING;
      tailVel.y = (tailVel.y + (pos.y - tailPos.y) * TAIL_STIFF) * DAMPING;
      tailPos.x += tailVel.x;
      tailPos.y += tailVel.y;
      const t = tail.current;
      if (t) {
        t.style.transform =
          `translate3d(${tailPos.x}px, ${tailPos.y}px, 0) translate(-50%, -50%) scale(0.7)`;
      }

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
    <>
      <div ref={tail} className="cursor-tail" aria-hidden="true" />
      <div ref={dot} className="cursor" data-mode="dot" aria-hidden="true">
        <span ref={label} className="cursor__label mono" />
      </div>
    </>
  );
}

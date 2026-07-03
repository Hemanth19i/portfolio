/**
 * The motion grammar — one file, two engines (CSS/Framer + R3F).
 * If a duration or curve isn't in this file, it doesn't exist.
 * (Design Engineering Reference §3)
 */
export const motion = {
  ease: {
    out: [0.22, 1, 0.36, 1], // dock arrivals
    inOut: [0.65, 0, 0.35, 1], // focus transitions
    linear: [0, 0, 1, 1], // flow only
  },
  dur: {
    micro: 0.15, // hover in
    out: 0.25, // hover out, small exits
    dock: 0.35, // panel/chip arrival
    focus: 0.7, // camera-adjacent, one at a time
    beat: 2.5, // ending sequence hard cap
  },
  dist: {
    micro: 12, // px — max hover travel
    dock: 16, // px — max arrival travel
  },
  spring: { damping: 4 }, // maath camera lambda (Phase 2)
  flow: { maxSpeedPx: 120 }, // packet speed ceiling
} as const;

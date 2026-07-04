# ADR-004 — Ambient life under a demand frameloop

## Context

Reference §6 mandates `frameloop="demand"`: the canvas renders only when
the app calls `invalidate()` (on scroll/interaction), so an idle page burns
zero GPU and battery. Phase 2.5 introduces continuous ambient motion —
packet flow, station-ring pulse, glyph float — which by definition needs
frames while the page sits still. That is a direct conflict with a
demand-only loop, and the instruction is that the reference wins unless the
conflict is surfaced and resolved.

## Decision

Keep `frameloop="demand"` exactly as §6 requires; do **not** switch to
`"always"`. Drive ambient motion with an app-owned `AmbientTicker` that
calls `invalidate()` once per animation frame — but only when motion is
permitted: it never mounts under `prefers-reduced-motion`, and it stops on
`visibilitychange` when the tab is hidden. Reduced-motion and backgrounded
tabs therefore still render zero ambient frames and react only to scroll.

## Alternatives

- **`frameloop="always"`**: simplest, but abandons the §6 contract wholesale
  and keeps rendering even when we'd rather be idle; harder to prove the
  reduced-motion "zero frames" property.
- **Bake motion into shaders driven by `u_time`**: still needs frames to
  advance time — same problem, more complexity.
- **Drop ambient motion, animate on scroll only**: satisfies §6 trivially
  but fails the Phase 2.5 goal of a scene that feels alive.

## Trade-offs

The ticker costs the same per-frame work as `"always"` while active, so the
win is control, not raw efficiency: invalidation stays app-owned (the exact
pattern §6 describes), and the accessibility guarantee is explicit and
testable — reduced motion means the ticker is absent, not merely throttled.

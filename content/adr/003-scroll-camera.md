# ADR-003 — Scroll-driven camera, never scroll hijacking

## Context

The camera must travel the pipeline as the visitor moves through the
stations. Most 3D portfolios hijack the wheel — they intercept events and
re-emit synthetic scrolling. That breaks keyboard paging, find-in-page,
anchor links, screen-reader navigation, and scroll restoration, and it
makes the DOM page hostage to the canvas. Governance says the canvas is
scenery; the reference (§4) says native scroll drives everything.

## Decision

Native scroll on the document is the single source of truth. A passive
`scroll` listener computes progress 0–1, stores it in a ref, and calls
`invalidate()` (frameloop stays `"demand"`). Each rendered frame the
camera position damps toward `curve.getPointAt(progress) + offset` with
`maath damp3` (`motion.spring.damping` as λ, smoothTime = 1/λ), and keeps
invalidating until the damp settles. Under `prefers-reduced-motion` the
progress snaps to the nearest station — the camera cuts, never travels.

## Alternatives

- **Wheel hijacking (Lenis, locomotive-scroll)**: smoother marketing feel;
  rejected — breaks accessibility and violates §4 outright.
- **GSAP ScrollTrigger pinning**: powerful, but adds a dependency and its
  own scroll math for what one listener does.
- **Continuous rAF loop**: simpler damping, but burns battery while idle.

## Trade-offs

Damping-until-settled costs a few extra frames after each scroll stop;
in exchange the page scrolls like a document, works from the keyboard,
and renders zero frames when nothing moves.

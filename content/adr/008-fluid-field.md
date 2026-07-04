# ADR-008 — The fluid field is postprocessing garnish: gated, disposable, never load-bearing

## Context

Phase 2.6b B2 adds a Lusion-style fluid the pointer stirs, distorting the
pipeline. It is the single most expensive visual on the site: a real-time
ping-pong FBO stable-fluids sim plus an extra full-screen postprocessing
pass. The 2.6 spec set hard kill-gates — **> ~12 ms frame time on T3** or
**> 25 KB gz** added to the lazy chunk — and the rule is explicit: if a gate
trips, delete B2, keep B1, and record the measurement. The gate is not to be
negotiated with.

## Decision

Treat the fluid field as pure garnish with no product dependency:

- **Distorts only the WebGL layer.** It runs inside the existing
  `EffectComposer` as the *last* pass, sampling the scene framebuffer. The
  DOM (all text) is a separate HTML layer above the `aria-hidden` canvas, so
  no pass can ever touch it — DOM-first is preserved by construction, not by
  care. UV offset is clamped to ≤8px; dye is ≤0.15 additive, after Bloom so
  it never flares.
- **T3-desktop, fine-pointer, motion-allowed only**, loaded through a
  dedicated `import('./fluid/FluidField')` so T2/mobile/reduced-motion/
  no-WebGL/`?fallback=1` never download or mount it.
- **Idle = free.** The sim steps only while the pointer has moved in the
  last 2s; otherwise `update()` early-returns (extends the ADR-004
  demand-frameloop discipline).
- **Disposable.** Nothing else references the sim or its textures. Removing
  the dynamic import and the `fluid` prop deletes the feature with zero
  fallout; B1 (the droplet cursor) is independent and ships regardless.

## Alternatives

- **Distort the DOM too (canvas-over-content):** rejected outright —
  violates DOM-first and would smear text.
- **Always-on sim:** rejected — burns GPU while the visitor reads; the
  2s-idle gate makes rest free.
- **Skip pressure projection for speed:** kept a low-iteration projection
  (6) for the "stable-fluids" character; iteration count is a tunable if the
  frame-time gate is tight.

## Trade-offs

Even gated, B2 is the most likely thing to be cut. The frame-time gate can
only be judged on real T3 hardware (a software renderer is meaningless), so
the keep/kill decision is made against measured numbers on Hemanth's
machine, recorded in the PR — not asserted. If it trips either gate, it is
removed without argument and this ADR records why.

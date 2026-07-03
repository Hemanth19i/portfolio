# ADR-002 — All text lives in the DOM; the canvas is scenery

**Status:** accepted · Phase 1

## Context
3D portfolios commonly render text inside WebGL, which makes content
invisible to search engines, screen readers, and Ctrl+F, and couples copy
to the render loop.

## Decision
Every piece of content is semantic HTML. The (future) canvas mounts at z-0,
`aria-hidden`, behind a `<main>` that already works without it. Phase 1
ships the complete DOM layer first; the 3D pipeline is additive.

## Alternatives considered
drei `<Text>` for headlines (rejected: SEO/a11y cost), hybrid per-scene
(rejected: two content sources drift).

## Trade-offs accepted
Some visual integration work in Phase 2 to make DOM panels feel "inside"
the scene (parallax, lighting-matched glass).

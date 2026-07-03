# ADR-001 — Why react-three-fiber

## Context

Phase 2 puts a 3D pipeline behind the DOM-first page. The reference doc
(§6) demands: demand-driven frameloop, zero per-frame allocations, colors
read from `tokens.ts`, GPU quality tiers, and a canvas that is pure
`aria-hidden` scenery. The scene graph is small (one curve, one tube, one
instanced mesh, a camera rig) but must live inside a React/Next app whose
content, routing, and state are React-owned.

## Decision

Use three.js through **@react-three/fiber**, with **maath** for damping
and **detect-gpu** for tiering. The canvas mounts via `next/dynamic` after
the tier resolves, so the three chunk never blocks first paint and T0
devices never download it.

## Alternatives

- **Imperative three.js** in a `useEffect`: no reconciler overhead, but we
  re-invent mount/unmount, prop diffing, and disposal — the exact bugs r3f
  already solved. More code, same bundle.
- **CSS/SVG only**: honors DOM-first but cannot deliver the camera ride or
  thousands of advected packets.
- **Spline / embed tools**: opaque runtimes, no token discipline, budget
  risk.

## Trade-offs

r3f adds ~30 kB gz over raw three and a reconciler between us and the
render loop. In exchange: declarative mounting per tier, `frameloop="demand"`
built in, automatic disposal, and `useFrame` refs that keep the
zero-allocation rule auditable. The chunk stays lazy; the 2D page remains
the complete fallback product.

# ADR-005 — Cursor & presence architecture

## Context

Phase 2.6 adds a follower cursor with a contextual morph, magnetic buttons,
and synthesized UI ticks. Done naively this scatters pointer math and audio
calls across every interactive component, fights the existing CSS `:hover`
transforms, and re-renders React on every `pointermove`. It also has hard
constraints: the native cursor must never be hidden, touch and
reduced-motion users must get zero cursor code, first-load JS must stay
tiny, and nothing may play sound before an explicit opt-in.

## Decision

One `<PresenceLayer>` client component owns everything via **event
delegation**, and elements **opt in with a `data-cursor` attribute** rather
than bespoke handlers:

- **Cursor**: a single fixed element positioned every frame through a small
  spring integrator, mutated **imperatively** (transform, `data-mode`,
  label text) so `pointermove` never triggers a React render. Morph mode is
  read from `closest('[data-cursor]')` — `crosshair` over the hero,
  `verify`/`open`/`read`/`drag` → a labelled `--current` disc over cards,
  and a plain ring over other links/buttons.
- **Magnetism**: the layer writes `--mag-x/--mag-y` CSS variables on the
  nearest `.btn`; the button's existing `transform`/transition consume them,
  so pull composes with the hover lift and springs back for free — no
  transform conflict.
- **Sound**: `src/lib/sound.ts` is a tiny store (Web Audio, two synthesized
  blips, localStorage-persisted) shared by the header `<SoundToggle>` and
  the delegated hover/click listeners.

Gating lives in one place: cursor/magnetism run only under `(pointer: fine)`
and no reduced-motion; hover ticks self-suppress under reduced motion; sound
stays silent until the toggle (the user gesture that unlocks the
AudioContext).

## Alternatives

- **Per-component cursor/sound props**: colocated but viral — every new
  interactive element must remember to wire it; easy to drift.
- **React state for cursor position**: idiomatic but re-renders on every
  move; needless pressure for a transform-only visual.
- **Library (e.g. a cursor package)**: more weight and opinion than an 8px
  dot needs; first-load budget forbids it.

## Trade-offs

Imperative DOM mutation and document-level delegation are less "Reacty" and
need explicit listener cleanup, but they keep the hot path allocation- and
render-free, keep opt-in declarative (`data-cursor`), and keep the whole
feature within ~1 kB of first-load JS. The native cursor is untouched; every
gate degrades to simply not running.

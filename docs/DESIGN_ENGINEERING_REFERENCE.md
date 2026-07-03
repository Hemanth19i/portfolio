# DESIGN ENGINEERING REFERENCE
### The Living Pipeline · canonical implementation reference · v1.0

**What this is:** the single source of truth while building. Design documents
(v1–v4, panel, final review) explain *why*; this document defines *exactly
what*. When any document conflicts with this one, this one wins. When code
conflicts with this one, the code is wrong or this doc gets a versioned edit —
never silent drift.

---

## 0. Governance (non-negotiable, from the final review)

1. **Proof before motion.** No motion/polish work is scheduled while any proof
   mechanism (the Moment, evidence links, live data, /engineering) is
   unfinished.
2. **DOM-first.** All text lives in the DOM. The canvas is `aria-hidden`
   scenery. No exceptions, ever, including "it would look cooler in-canvas."
3. **Truthfulness by architecture.** Live data renders from verified sources
   or the row hides. Replayed computation is labeled `replay`. Nothing
   hand-faked, no invented metrics, no stale timestamps.
4. **Every interaction gathers, verifies, explains, challenges, or concludes
   evidence.** If it does none of these, it doesn't ship.
5. **One in-progress node** on the deployment timeline at any time.
6. **User experience wins over this specification.** If following any rule in
   this document demonstrably harms usability, the specification must be
   updated — through an ADR recording what broke, what changed, and why.
   Specs guide the product; they never trap it. (This rule cannot be used to
   waive rules 1–4 for convenience: "demonstrably" means an observed failure
   with a real user, device, or measurement — not a preference.)

---

## 1. Design Tokens

Single file: `src/styles/tokens.css` (CSS custom properties) mirrored by
`src/lib/tokens.ts` (typed exports for R3F/Framer). CI fails if they diverge
(simple parse-and-compare script).

```css
:root {
  /* ---------- color ---------- */
  --void:      #070B14;   /* page background, deepest layer            */
  --graphite:  #0D1321;   /* scene background, fog color               */
  --panel:     #131B2E;   /* glass base — applied at 72% + blur        */
  --line:      #243049;   /* hairlines, borders, wireframe edges       */
  --text-hi:   #E8EDF7;   /* headlines, primary text                   */
  --text-lo:   #8B96AD;   /* secondary text, mono labels (≥12px only)  */
  --current:   #3D8BFF;   /* THE color: pipeline, primary actions      */
  --signal:    #7DE3F4;   /* packets, live values, ok states           */
  --depth:     #8B7CF6;   /* hover glow, secondary accent              */
  --threat:    #F4756B;   /* SecureRAG scene ONLY — lint-enforced      */
  --ok:        #4ADE80;   /* availability dot, CI-green, verdict       */

  /* ---------- surfaces ---------- */
  --glass-bg: color-mix(in srgb, var(--panel) 72%, transparent);
  --glass-blur: 20px;
  --glass-highlight: rgba(255,255,255,0.08); /* 1px top inner edge */
  --radius-s: 8px;  --radius-m: 16px;  --radius-l: 24px;

  /* ---------- spacing (4px base) ---------- */
  --s-1: 4px; --s-2: 8px; --s-3: 12px; --s-4: 16px; --s-6: 24px;
  --s-8: 32px; --s-12: 48px; --s-16: 64px; --s-24: 96px;

  /* ---------- z-layers ---------- */
  --z-canvas: 0; --z-content: 10; --z-rail: 20; --z-ask: 30;
  --z-dossier: 40; --z-overlay: 50;

  /* ---------- glow (emissive twins for DOM) ---------- */
  --glow-current: 0 0 24px rgba(61,139,255,0.35);
  --glow-signal:  0 0 16px rgba(125,227,244,0.30);
}
```

**Color rules (enforced by review, two by lint):**
- `--current` ≤ ~5% of any viewport. It is scarce or it is nothing.
- `--threat` may only appear in files under `scenes/analyze/` — add a stylelint
  restriction.
- `--text-lo` never below 12px, never for body copy.
- No pure black, no pure white, anywhere.
- All canvas materials read colors from `tokens.ts` — no hex literals in
  scene code.

---

## 2. Typography

Panel correction applied: Clash Display is retired (template-default of the
era). The identity risk moves into *treatment*, not a trendy face.

| Role | Face | File | Notes |
|---|---|---|---|
| Display | **Archivo Variable** | self-hosted woff2, `wght` 500–800 + `wdth` 62–125 axes | The signature: axes are data-driven (below) |
| Body | **Instrument Sans** | woff2, 400/500 | 15–17px, line-height 1.6, max 68ch |
| Mono | **IBM Plex Mono** | woff2, 400/500 | labels, stage tags, data, ADR numbers |

**The typographic signature — data-driven axes:** the hero name and stage
titles bind `font-variation-settings` to pipeline state: `wdth` eases
110→82 as the local stage's packet-flow intensity rises (more data = type
compresses, like load). Subtle — max delta perceived as "alive," never as
animation. Implementation: one CSS variable `--type-load` (0–1) written by
the scene, consumed by `font-variation-settings: "wdth" calc(110 - var(--type-load) * 28)`.
Reduced motion: `--type-load` frozen at 0.5.

**Scale (fluid):**
```css
--fs-hero:  clamp(56px, 8vw, 128px);   /* Archivo 750, track -0.02em */
--fs-h2:    clamp(28px, 4vw, 48px);    /* Archivo 650 */
--fs-h3:    clamp(20px, 2.5vw, 28px);  /* Archivo 600 */
--fs-body:  clamp(15px, 1.1vw, 17px);  /* Instrument 400 */
--fs-mono:  12px;                      /* Plex Mono 400, uppercase, +0.08em */
```
`font-display: swap`; subsets: latin only; preload display + mono.

---

## 3. Motion Tokens (one grammar, two engines)

`src/lib/motion.ts` — consumed by BOTH Framer Motion and R3F springs. If a
duration or curve isn't in this file, it doesn't exist.

```ts
export const motion = {
  ease: {
    out:    [0.22, 1, 0.36, 1],      // dock arrivals (ease-out-quint feel)
    inOut:  [0.65, 0, 0.35, 1],      // focus / camera-adjacent DOM moves
    linear: [0, 0, 1, 1],            // flow only
  },
  dur: {
    micro: 0.15,   // hover in
    out:   0.25,   // hover out, small exits
    dock:  0.35,   // panel/chip arrival
    focus: 0.7,    // dolly-adjacent transitions (max one at a time)
    beat:  2.5,    // the ending sequence, hard cap
  },
  dist: {
    micro: 12,     // px — max hover travel
    dock:  16,     // px — max arrival travel
  },
  spring: { damping: 4 },            // maath camera lambda
  flow:   { maxSpeedPx: 120 },       // perceived packet speed ceiling
} as const;
```

**The three verbs — the only allowed motions:**
- **flow** — continuous, linear, ambient (packets, timeline pulse)
- **dock** — arrival: `dur.dock`, `ease.out`, ≤ `dist.dock`
- **focus** — camera dolly + DOF: `dur.focus`, one at a time, ever

**Reduced-motion mapping (must be implemented, not approximated):**
| Full | `prefers-reduced-motion` |
|---|---|
| Camera travels curve | Camera cuts between stations |
| Packet flow | Static dashed path |
| Type axes breathe | Frozen at midpoint |
| Docking panels | Opacity fade 0.2s |
| Ending typed beat | Instant render |
| Parallax / tilt | Removed |

---

## 4. Layout & Layering

```
<body>
  <Canvas>            z-0   aria-hidden, pointer-events per-object only
  <main>              z-10  ALL content, semantic HTML, scroll container
  <PipelineRail>      z-20  fixed right, nav landmarks
  <AskLauncher>       z-30  fixed bottom-right (v1.1)
  <DossierLayer>      z-40  portal
  <OverlayLayer>      z-50  ending beat, modals
```
- Breakpoints: `sm 640 / md 768 / lg 1024 / xl 1440`. 3D full experience
  ≥1024 + GPU tier ≥2; vertical-pipeline mobile variant <768; 2D fallback
  otherwise (and always at `?fallback=1` for testing/sharing).
- Grid: 12-col, `max-w 1200px` content, gutter `--s-6`.
- Scroll: native scroll on `<main>` drives everything. **Never hijack wheel
  events.** `useScroll` reads progress; camera = f(progress) through
  `motion.spring`.

---

## 5. Component Specs

**GlassPanel** — `--glass-bg`, `backdrop-filter: blur(var(--glass-blur))`,
1px border `--line`, top inner highlight, `--radius-m`. Props: `elevated`
(adds `--glow-current` at 40%), `dense` (padding `--s-4` vs `--s-6`).
Never nest glass in glass.

**StageLabel** — mono 12, uppercase: `VERIFY 02 — PROFILE`. Position
top-left of each stage, `--text-lo`. (Wording per final narrative: stages
are `CLAIM / VERIFY 01..04 / TELEMETRY / VERDICT`.)

**ActionButton** — min-height 44px, radius `--radius-s`. Primary: `--current`
bg, `--void` text. Secondary: glass + `--line` border. Focus-visible: 2px
`--signal` ring, offset 2px — on EVERY interactive element, no `outline:none`
without replacement.

**Dossier** — right sheet, width `min(480px, 92vw)`, portal at `--z-dossier`,
docks with `dur.dock`. Template fixed: Overview → Stack → Challenge →
Lessons → CTA row (sticky). Esc + click-outside close; focus-trapped;
returns focus to invoker.

**PipelineRail** — 6 nodes, 8px dots, active = `--current` + glow; `<nav>`
with `aria-label="Stages"`, arrow-key navigable, Enter jumps (smooth scroll,
instant under reduced motion).

**StatBadge** — mono value + 10px label. Data-bound only; renders `null` on
missing/stale source (Governance §3).

**EvidenceLink** — the atom of the whole site: inline link with a commit-hash
or repo glyph suffix, `--current`, underline on hover only. Every claim on
the site should terminate in one of these.

**ReportArtifact** (ending) — the morph target. A GlassPanel styled as a
document: verdict line, evidence list (EvidenceLinks), resume download as
primary ActionButton. No TTY styling (panel ruling).

---

## 6. R3F / Canvas Architecture

```
<Canvas gl={{ antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 2]} frameloop="demand"  // invalidate() on scroll/interact
        camera={{ fov: 42 }}>
  <color attach="background" args={[tokens.graphite]} />
  <fog attach="fog" args={[tokens.graphite, 8, 26]} />
  <PipelineCurve />      // ONE CatmullRomCurve3, ~12 pts, TubeGeometry r=0.02
  <Packets />            // ONE InstancedMesh ≤2000 (mobile 400), advected on curve
  <Stations />           // per-stage groups, mounted by proximity (lazy)
  <CameraRig />          // position = curve.getPointAt(damp(progress))
  <Effects />            // desktop tier ≥2 only: selective bloom (emissive
                         // layer 1, threshold high), DOF during focus only
</Canvas>
```

Rules:
- Zero per-frame allocations: module-scope scratch `Vector3`s, reuse.
- No `useState` in `useFrame` paths; refs + direct mutation.
- All emissive materials on layer 1 → bloom never touches text/UI meshes.
- Quality tiers via `detect-gpu`: T3 full · T2 no DOF, packets 1200 ·
  T1/mobile no post, packets 400, dpr ≤1.5 · T0 → 2D fallback route.
- The Moment's computation: sample-file runs may be **precomputed replays**
  (labeled `replay · precomputed`) with one live path (labeled `live`).
  Both labels are mono, visible, non-negotiable.

---

## 7. Performance Budget (CI-enforced, numbers are contracts)

| Metric | Budget | Enforcement |
|---|---|---|
| JS (initial route, gz) | ≤ 450 KB | `size-limit` in CI, hard fail |
| LCP (hero = HTML) | < 2.0 s | Lighthouse CI assert |
| CLS | < 0.05 | Lighthouse CI |
| TTI | < 3.0 s | Lighthouse CI |
| FPS desktop / mid-mobile | 60 / 40 | manual + r3f-perf in dev builds only |
| Fallback Lighthouse | ≥ 90 all categories | Lighthouse CI on `?fallback=1` |
| Font payload | ≤ 120 KB total | size-limit group |
| Any screenshot | ≤ 150 KB AVIF | build script check |

Measured numbers publish to `/engineering` header automatically. If a budget
slips, the public number slips with it — that's the incentive design.

---

## 8. Accessibility Requirements (ship-blockers, not nice-to-haves)

- Contrast: `--text-hi`/`--graphite` ≈ 13:1 ✓; `--text-lo` only ≥12px mono
  (≈4.6:1) ✓; `--current` on `--void` for text ≥ 18px only. axe clean in CI.
- Full keyboard path: rail → stages → evidence links → dossiers → the Moment
  (artifact selection = radio group, "process" = button, result = live
  region + real text) → form. Tab order equals visual order.
- Canvas `aria-hidden="true"`; every 3D interactive has a DOM twin.
- `aria-live="polite"` for: processing states, form result, verdict beat.
- Reduced-motion table (§3) implemented before any scene ships.
- Form: real `<label>`s, error text inline, success announced.
- Never color-only meaning (threat packets carry a shape tag; ok states
  carry text).

---

## 9. Data & Truthfulness Architecture

`site.config.ts` (single hand-edited file):
```ts
export const site = {
  availability: true,               // drives dot + verdict line
  currentProject: 'AI Personal OS · M2 ✓',
  learningNow: ['GraphRAG', 'Kùzu'],
  releases: [                        // future nodes only; shipped = git tags
    { v: '1.1', name: 'ASK', state: 'planned' },
    { v: '1.2', name: 'THE LAB', state: 'planned' },
    { v: '2.0', name: 'AI SANDBOX', state: 'exploring' },
  ],
}
```
- Shipped releases derive from git tags at build (`v*` → date + release note).
- GitHub data: build-time fetch, ISR 1h; on fetch failure components return
  `null` (StatBadge contract).
- Deployment stamp: `VERCEL_GIT_COMMIT_SHA` + build time.
- ASK (v1.1): chunks + embeddings generated at build from `content/**/*.md`;
  retrieval client-side; generation via `/api/ask` (key server-side, per-IP
  rate limit, monthly cap, static fallback answers). Red-team notes ship as
  ADR-013 the same day ASK ships.

---

## 10. Repo Structure & Conventions

```
portfolio/
├── content/            # ALL copy as markdown — scenes render it, ASK embeds it
│   ├── claim.md  profile.md  projects/*.md  adr/*.md
├── src/
│   ├── styles/tokens.css
│   ├── lib/tokens.ts  motion.ts  gpu.ts  data/
│   ├── components/    # specs §5, one folder per component + test
│   ├── scenes/        # claim/ verify-profile/ analyze/ correlate/
│   │                  # telemetry/ verdict/  (+ lab/ later)
│   └── app/           # routes: / , /engineering, /projects/[slug], /api/ask
├── scripts/           # token-sync check, embed-content, size guards
└── .github/workflows/ # ci: lint, typecheck, test, size-limit, lighthouse
```
Conventions: TypeScript strict; conventional commits; PR per phase; every PR
updates or adds an ADR if it makes a decision; `content/` markdown is the
single source for both rendered copy and ASK's knowledge — they can never
disagree because they're the same files.

---

## 11. Definition of Done — per phase

A phase is done when: deployed · budgets green in CI · keyboard path works ·
reduced-motion works · no console errors · relevant ADR written · the
deployed site is coherent to a first-time visitor. Not before.

---

## 12. Recruiter Success Criteria (the point of everything above)

A recruiter must be able to:

| # | Criterion | Clock |
|---|---|---|
| R1 | Know who I am and what I claim | ≤ 5 seconds |
| R2 | Open a real project (live code or demo) | ≤ 15 seconds |
| R3 | Reach my resume | 1 click, from anywhere |
| R4 | Understand what SecureRAG is and that it works | ≤ 45 seconds |
| R5 | Leave remembering one unique thing | — (the Moment) |

**Everything else in this document exists to support these five lines.**
Every token, budget, and governance rule is subordinate to them; if any rule
and any criterion ever conflict, the criterion wins (Governance §0.6 is the
mechanism).

**These are tests, not aspirations.** Before every release: one person who
has never seen the site, one stopwatch, five checkboxes. R1–R4 measured
cold, on a mid-range device, on hotel-grade wifi. R5 verified the cruel way —
ask them the next day what they remember. Any failure is a ship-blocker with
the same weight as a broken build.

---

*This document is versioned. Change it by PR with an ADR reference, like
everything else. Now — first commit.*

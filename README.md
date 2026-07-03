# portfolio — The Living Pipeline

Personal site of **Hemanth A R** · Software Engineer — AI × Security × Full Stack.

> Don't read my resume. Verify it.

The site is structured as a pipeline the visitor travels — claim in,
evidence gathered, verdict out — mirroring the retrieval systems I build
([SecureRAG](https://github.com/Hemanth19i/SecureRAG),
[AI Personal OS](https://github.com/Hemanth19i/AI-Personal-OS)).

## Status — deployment timeline

- [x] **v0.1 — Phase 1**: DOM-first core. Tokens, typography (data-driven
      width axis), 2D pipeline, evidence, live telemetry, CI.
- [ ] v1.0 — 3D pipeline (R3F): scroll-driven camera on a curve, packet flow
- [ ] v1.1 — ASK: a real RAG over this site's own content
- [ ] v1.2 — THE LAB: operable project artifacts

## Principles (from the Design Engineering Reference)

1. Proof before motion — no polish while a proof mechanism is unfinished
2. DOM-first — all text is semantic HTML; the canvas is `aria-hidden` scenery
3. Truthfulness by architecture — live data renders from verified sources or hides
4. UX wins over the spec — changes recorded as ADRs (see `content/adr/`)

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck
npm run check:tokens
npm run build
```

## Before deploying

- Drop your resume at `public/resume.pdf`
- Fill `linkedin` and `email` in `src/lib/site.config.ts`

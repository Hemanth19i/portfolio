# ADR-012 — The pipeline metaphor, with a verification narrative

**Status:** accepted · Phase 1

## Context
Nine unrelated portfolio sections need one spine. The subject's actual work
is retrieval pipelines (ingestion → embedding → retrieval → analysis).

## Decision
The site is structured as a pipeline the visitor travels: CLAIM → VERIFY →
TELEMETRY → VERDICT. In Phase 1 this exists as a 2D hairline with stations;
in Phase 2 it becomes a 3D curve the camera follows. The narrative frame is
verification: the site opens with a claim and ends with evidence-backed
conclusions, not self-description.

## Alternatives considered
Portfolio-as-OS (owned by dustinbrett.com), free-roam 3D world (wrong
audience: recruiters need a zero-learning-curve path), investigation-console
framing (kept as narrative tone, rejected as literal UI).

## Trade-offs accepted
A linear spine limits exploration; mitigated by the persistent header
(resume/GitHub always one click) and future free-interaction islands.

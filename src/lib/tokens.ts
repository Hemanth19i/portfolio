/**
 * Typed mirror of src/styles/tokens.css — the canvas and any JS
 * consumer read colors from HERE, never as hex literals in scene
 * code (Governance §1). `npm run check:tokens` verifies sync.
 */
export const color = {
  void: "#070b14",
  graphite: "#0d1321",
  panel: "#131b2e",
  line: "#243049",
  textHi: "#e8edf7",
  textLo: "#8b96ad",
  current: "#3d8bff",
  signal: "#7de3f4",
  depth: "#8b7cf6",
  threat: "#f4756b", // SecureRAG scene only — enforced by review
  ok: "#4ade80",
} as const;

export type ColorToken = keyof typeof color;

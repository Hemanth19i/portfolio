/**
 * Fails if src/styles/tokens.css and src/lib/tokens.ts disagree
 * on any color value. (Design Engineering Reference §1)
 */
import { readFileSync } from "node:fs";

const css = readFileSync("src/styles/tokens.css", "utf8");
const ts = readFileSync("src/lib/tokens.ts", "utf8");

const cssColors = Object.fromEntries(
  [...css.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [
    m[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase()),
    m[2].toLowerCase(),
  ]),
);
const tsColors = Object.fromEntries(
  [...ts.matchAll(/([a-zA-Z]+):\s*"(#[0-9a-f]{6})"/gi)].map((m) => [
    m[1],
    m[2].toLowerCase(),
  ]),
);

let failed = false;
for (const [k, v] of Object.entries(tsColors)) {
  if (cssColors[k] && cssColors[k] !== v) {
    console.error(`✗ token mismatch: ${k} css=${cssColors[k]} ts=${v}`);
    failed = true;
  }
  if (!cssColors[k]) {
    console.error(`✗ token ${k} exists in tokens.ts but not tokens.css`);
    failed = true;
  }
}
if (failed) process.exit(1);
console.log(`✓ ${Object.keys(tsColors).length} color tokens in sync`);

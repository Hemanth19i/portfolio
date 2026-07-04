/**
 * Subtle synthesized UI ticks (Phase 2.6). Two sounds only — a quiet hover
 * tick and a slightly brighter click blip — generated with the Web Audio
 * API (no audio files, no ambient loop).
 *
 * Hard rules:
 *  - OFF by default, always. Nothing plays until the user opts in via the
 *    header toggle (which is a user gesture — the only moment we may create
 *    or resume the AudioContext).
 *  - Preference persisted in localStorage.
 *  - prefers-reduced-motion is treated as a sensory-sensitivity proxy: even
 *    when sound is ON, hover ticks are suppressed (click blips only), and
 *    the default stays off.
 */
const STORAGE_KEY = "sound-enabled";

let enabled = false;
let ctx: AudioContext | null = null;
const listeners = new Set<(v: boolean) => void>();

function reducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Read persisted preference — call once on the client after mount. */
export function initSound(): boolean {
  try {
    enabled = window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    enabled = false;
  }
  return enabled;
}

export function isEnabled(): boolean {
  return enabled;
}

export function subscribe(fn: (v: boolean) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Toggle sound. MUST be called from a user gesture (creates/resumes ctx). */
export function setEnabled(next: boolean): void {
  enabled = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  } catch {
    /* private mode — non-fatal */
  }
  if (next && !ctx) {
    try {
      ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    } catch {
      ctx = null;
    }
  }
  if (next && ctx?.state === "suspended") void ctx.resume();
  listeners.forEach((fn) => fn(next));
}

/** One short filtered blip. freq/gain/duration tuned per sound. */
function blip(freq: number, gain: number, dur: number, type: OscillatorType) {
  if (!enabled || !ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 2600;
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.setValueAtTime(0, now);
  amp.gain.linearRampToValueAtTime(gain, now + 0.002);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(lp).connect(amp).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

/** Hover tick — very quiet, suppressed under reduced motion. */
export function playHover(): void {
  if (reducedMotion()) return;
  blip(420, 0.03, 0.03, "sine");
}

/** Click blip — a touch brighter; allowed even under reduced motion. */
export function playClick(): void {
  blip(720, 0.06, 0.05, "triangle");
}

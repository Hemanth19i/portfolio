"use client";

import { useEffect, useState } from "react";
import { initSound, isEnabled, setEnabled, subscribe } from "@/lib/sound";

/**
 * Header speaker toggle (Phase 2.6). Mono style, keyboard operable,
 * aria-pressed. Sound stays off until this is pressed — the press is the
 * user gesture that unlocks the AudioContext (see sound.ts).
 */
export function SoundToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(initSound());
    return subscribe(setOn);
  }, []);

  return (
    <button
      type="button"
      className="mono sound-toggle"
      aria-pressed={on}
      aria-label={on ? "Sound on — mute UI sounds" : "Sound off — enable UI sounds"}
      title={on ? "Sound on" : "Sound off"}
      onClick={() => setEnabled(!isEnabled())}
    >
      <span aria-hidden="true" className="sound-toggle__icon">
        {on ? "♪" : "♪̸"}
      </span>
      <span aria-hidden="true">{on ? "sound on" : "sound off"}</span>
    </button>
  );
}

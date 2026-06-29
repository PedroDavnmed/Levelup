"use client";

import { useEffect, useState } from "react";
import { isSoundEnabled, setSoundEnabled } from "@/lib/sound";

export default function SoundToggle() {
  // Default to the visual "on" state; sync to the stored value after mount
  // (localStorage isn't available during SSR).
  const [on, setOn] = useState(true);

  useEffect(() => {
    setOn(isSoundEnabled());
  }, []);

  function toggle() {
    const next = !on;
    setOn(next);
    setSoundEnabled(next);
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={on}
      className="btn-ghost w-full justify-start text-xs"
    >
      {on ? "🔊 Sound on" : "🔇 Sound off"}
    </button>
  );
}

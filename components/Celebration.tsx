"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { isSoundEnabled, playChime } from "@/lib/sound";

const COLORS = ["#4D7CFF", "#3DD68C", "#FFB454", "#FF8A7A", "#8FA8FF"];

// Fixed set of confetti pieces with randomized position/timing.
const PIECES = Array.from({ length: 42 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  color: COLORS[i % COLORS.length],
  delay: Math.random() * 0.3,
  duration: 1.1 + Math.random() * 0.8,
}));

/** Reacts to the store's celebration signal: a confetti burst on any big
 *  moment, plus a centered banner (and chime) for level-ups. */
export default function Celebration() {
  const { celebration } = useStore();
  const [burst, setBurst] = useState<number | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    if (!celebration) return;
    if (isSoundEnabled()) playChime();

    // Respect users who prefer reduced motion: keep the chime + banner but skip
    // the confetti animation.
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const timers: ReturnType<typeof setTimeout>[] = [];
    if (!reduceMotion) {
      setBurst(celebration.nonce);
      // Longest piece runs delay(≤0.3s) + duration(≤1.9s) ≈ 2.2s; clear after.
      timers.push(setTimeout(() => setBurst(null), 2400));
    }
    if (celebration.kind === "level" && celebration.label) {
      setBanner(celebration.label);
      timers.push(setTimeout(() => setBanner(null), 2500));
    }
    return () => timers.forEach(clearTimeout);
  }, [celebration]);

  return (
    <>
      {burst != null && (
        <div
          className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
          aria-hidden
        >
          {PIECES.map((p) => (
            <span
              key={`${burst}-${p.id}`}
              className="absolute top-0 h-2.5 w-1.5 rounded-sm animate-confettiFall"
              style={{
                left: `${p.left}%`,
                backgroundColor: p.color,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
              }}
            />
          ))}
        </div>
      )}

      {banner && (
        <div
          className="pointer-events-none fixed inset-0 z-[60] grid place-items-center"
          aria-hidden
        >
          <div className="animate-fadeIn rounded-2xl bg-brand-600 px-8 py-5 text-center text-white glow">
            <p className="text-3xl font-extrabold">🎉 {banner}!</p>
            <p className="text-sm opacity-90">You leveled up</p>
          </div>
        </div>
      )}
    </>
  );
}

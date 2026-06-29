"use client";

import { useStore } from "@/lib/store";

const STYLES: Record<string, string> = {
  level: "border-amber/40 bg-amber/10",
  badge: "border-lilac/50 bg-lilac/10",
  xp: "border-mint/50 bg-mint/10",
  rank: "border-peach/50 bg-peach/10",
};

export default function Toasts() {
  const { toasts, dismissToast } = useStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-72">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismissToast(t.id)}
          className={`card flex items-center gap-3 border px-4 py-3 text-left animate-[fadeIn_0.2s_ease-out] ${
            STYLES[t.kind] ?? ""
          }`}
        >
          <span className="text-2xl" aria-hidden>
            {t.icon}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-ink">
              {t.title}
            </span>
            {t.detail && (
              <span className="block text-xs text-muted truncate">
                {t.detail}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

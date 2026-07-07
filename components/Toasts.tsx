"use client";

import { useStore } from "@/lib/store";

const STYLES: Record<string, string> = {
  level: "border-amber/40 bg-amber/10",
  badge: "border-lilac/50 bg-lilac/10",
  xp: "border-mint/50 bg-mint/10",
  rank: "border-peach/50 bg-peach/10",
  info: "border-line bg-surface-2",
};

export default function Toasts() {
  const { toasts, dismissToast } = useStore();

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-72"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`card flex items-center gap-3 border px-4 py-3 text-left animate-fadeIn ${
            STYLES[t.kind] ?? ""
          }`}
        >
          {/* Body dismisses on click (matches prior behaviour for all toasts). */}
          <button
            onClick={() => dismissToast(t.id)}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-lg"
              aria-hidden
            >
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
          {t.action && (
            <button
              onClick={() => {
                t.action!.onAct();
                dismissToast(t.id);
              }}
              className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-brand-400 transition hover:bg-brand-50"
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

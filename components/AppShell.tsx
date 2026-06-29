"use client";

import { useStore } from "@/lib/store";
import { levelProgress } from "@/lib/gamification";
import NavLinks from "@/components/NavLinks";
import Toasts from "@/components/Toasts";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { state, hydrated, resetAll } = useStore();
  const { displayName, totalXp } = state.profile;
  const prog = levelProgress(totalXp);

  function handleReset() {
    if (
      confirm(
        "Reset all your local data (activities, logs, habits, goals, XP)? This can't be undone."
      )
    ) {
      resetAll();
    }
  }

  return (
    <div className="min-h-screen flex flex-col sm:flex-row">
      <aside className="sm:w-64 shrink-0 border-b sm:border-b-0 sm:border-r border-line bg-surface sm:min-h-screen p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2 font-bold text-ink text-lg">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-white">
            ⚡
          </span>
          LevelUp
        </div>

        {/* Profile / level card */}
        <div className="hidden sm:block rounded-xl bg-brand-50 px-3.5 py-3">
          <p className="text-sm font-semibold text-ink truncate">
            {hydrated ? displayName : "…"}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="font-medium text-brand-600">
              Level {hydrated ? prog.level : 1}
            </span>
            <span className="text-muted">
              {hydrated ? `${prog.into}/${prog.span} XP` : ""}
            </span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-white overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-500"
              style={{ width: `${hydrated ? prog.pct : 0}%` }}
            />
          </div>
        </div>

        <NavLinks />

        <div className="mt-auto hidden sm:block">
          <button
            onClick={handleReset}
            className="btn-ghost w-full justify-start text-xs"
          >
            ↺ Reset data
          </button>
        </div>
      </aside>

      <main className="flex-1 p-5 sm:p-8 max-w-5xl w-full mx-auto">
        {children}
      </main>

      <Toasts />
    </div>
  );
}

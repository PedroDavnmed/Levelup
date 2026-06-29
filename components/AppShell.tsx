"use client";

import { useStore } from "@/lib/store";
import { levelProgress } from "@/lib/gamification";
import { rankForCount } from "@/lib/ranks";
import NavLinks from "@/components/NavLinks";
import Toasts from "@/components/Toasts";
import Celebration from "@/components/Celebration";
import ThemeToggle from "@/components/ThemeToggle";
import SoundToggle from "@/components/SoundToggle";
import ResetAccount from "@/components/ResetAccount";
import DataBackup from "@/components/DataBackup";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { state, hydrated } = useStore();
  const { displayName, totalXp } = state.profile;
  const prog = levelProgress(totalXp);
  const { rank } = rankForCount(state.achievements.length);

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
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink truncate">
              {hydrated ? displayName : "…"}
            </p>
            {hydrated && (
              <span
                className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{ backgroundColor: `${rank.color}22`, color: rank.color }}
                title={`${rank.name} rank`}
              >
                {rank.icon} {rank.name}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="font-medium text-brand-600">
              Level {hydrated ? prog.level : 1}
            </span>
            <span className="text-muted">
              {hydrated ? `${prog.into}/${prog.span} XP` : ""}
            </span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-bg overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-500"
              style={{ width: `${hydrated ? prog.pct : 0}%` }}
            />
          </div>
        </div>

        <NavLinks />

        <div className="mt-auto hidden sm:flex flex-col gap-1">
          <ThemeToggle />
          <SoundToggle />
          <DataBackup />
          <ResetAccount />
        </div>
        {/* Mobile: theme toggle + data + reset stay reachable */}
        <div className="sm:hidden flex flex-col gap-1">
          <ThemeToggle />
          <SoundToggle />
          <DataBackup />
          <ResetAccount />
        </div>
      </aside>

      <main className="flex-1 p-5 sm:p-8 max-w-5xl w-full mx-auto">
        {children}
      </main>

      <Toasts />
      <Celebration />
    </div>
  );
}

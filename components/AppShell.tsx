"use client";

import { Timer, Zap } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { levelProgress } from "@/lib/gamification";
import { rankForCount } from "@/lib/ranks";
import { fmtClock, useNow } from "@/components/FocusTimer";
import NavLinks from "@/components/NavLinks";
import Toasts from "@/components/Toasts";
import Celebration from "@/components/Celebration";
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
      <aside className="sm:w-60 shrink-0 border-b sm:border-b-0 sm:border-r border-line bg-surface sm:min-h-screen p-4 flex flex-col gap-5">
        <div className="flex items-center gap-2.5 font-display font-bold tracking-tight text-ink text-lg">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-white">
            <Zap size={16} aria-hidden />
          </span>
          LevelUp
        </div>

        {/* Player card — level, rank, and the XP bar (earned light). */}
        <div className="hidden sm:block rounded-xl border border-line bg-brand-50 px-3.5 py-3">
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
          <div className="mt-2 flex items-baseline justify-between text-xs">
            <span className="font-display font-bold text-brand-400">
              LVL {hydrated ? prog.level : 1}
            </span>
            <span className="font-mono text-[11px] text-muted">
              {hydrated ? `${prog.into}/${prog.span} XP` : ""}
            </span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-bg overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 glow transition-all duration-500 ease-spring"
              style={{ width: `${hydrated ? prog.pct : 0}%` }}
            />
          </div>
        </div>

        <RunningFocusPill />

        <NavLinks />

        <div className="mt-auto hidden sm:flex flex-col gap-1 border-t border-line pt-3">
          <SoundToggle />
          <DataBackup />
          <ResetAccount />
        </div>
        {/* Mobile: sound + data + reset stay reachable */}
        <div className="sm:hidden flex flex-col gap-1">
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

/** Sidebar indicator for a running focus session — the visible proof that the
 *  timer survives leaving the Study page. Links back to it. */
function RunningFocusPill() {
  const { focus } = useStore();
  const now = useNow(focus.running, 1000);
  if (!focus.running || focus.endAt === null) return null;
  return (
    <Link
      href="/study"
      className="flex items-center gap-2 rounded-xl border border-brand-500/50 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-400 animate-breathe"
      aria-label="Focus session running — open Study"
    >
      <Timer size={15} aria-hidden />
      <span className="font-mono tabular-nums">
        {fmtClock(Math.max(0, focus.endAt - now))}
      </span>
      <span className="text-xs text-muted">focusing</span>
    </Link>
  );
}

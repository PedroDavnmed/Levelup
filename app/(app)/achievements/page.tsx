"use client";

import { useStore } from "@/lib/store";
import { ACHIEVEMENTS } from "@/lib/achievements";
import PageHeader from "@/components/PageHeader";

export default function AchievementsPage() {
  const { state, hydrated } = useStore();
  const unlocked = new Map(
    state.achievements.map((a) => [a.key, a.unlockedAt])
  );
  const count = unlocked.size;

  if (!hydrated) return null;

  return (
    <div>
      <PageHeader
        title="Achievements"
        icon="🏆"
        subtitle={`${count} / ${ACHIEVEMENTS.length} unlocked`}
      />

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
        {ACHIEVEMENTS.map((a) => {
          const isUnlocked = unlocked.has(a.key);
          return (
            <div
              key={a.key}
              className={`card p-4 text-center transition ${
                isUnlocked ? "" : "opacity-50 grayscale"
              }`}
            >
              <div className="text-4xl mb-2">{isUnlocked ? a.icon : "🔒"}</div>
              <p className="text-sm font-semibold text-ink">{a.name}</p>
              <p className="mt-0.5 text-xs text-muted">{a.description}</p>
              {isUnlocked && (
                <p className="mt-2 text-[10px] uppercase tracking-wide text-mint font-medium">
                  Unlocked
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

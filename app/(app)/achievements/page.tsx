"use client";

import { useStore } from "@/lib/store";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { rankForCount, RANKS } from "@/lib/ranks";
import PageHeader from "@/components/PageHeader";

export default function AchievementsPage() {
  const { state, hydrated } = useStore();
  const unlocked = new Map(
    state.achievements.map((a) => [a.key, a.unlockedAt])
  );
  const count = unlocked.size;
  const rankInfo = rankForCount(count);

  if (!hydrated) return null;

  return (
    <div>
      <PageHeader
        title="Achievements"
        icon="🏆"
        subtitle={`${count} / ${ACHIEVEMENTS.length} unlocked`}
      />

      {/* Rank banner */}
      <section className="card p-6 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="grid h-14 w-14 place-items-center rounded-2xl text-3xl"
              style={{ backgroundColor: `${rankInfo.rank.color}22` }}
            >
              {rankInfo.rank.icon}
            </span>
            <div>
              <p className="text-lg font-bold text-ink">{rankInfo.rank.name}</p>
              <p className="text-xs text-muted">
                {rankInfo.next
                  ? `${rankInfo.toNext} more achievement${rankInfo.toNext === 1 ? "" : "s"} to reach ${rankInfo.next.name}`
                  : "Top rank — you've unlocked everything!"}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 h-2.5 rounded-full bg-bg overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${rankInfo.pct}%`,
              backgroundColor: rankInfo.rank.color,
            }}
          />
        </div>
        {/* Rank ladder */}
        <div className="mt-4 flex flex-wrap gap-2">
          {RANKS.map((r) => {
            const reached = count >= r.minAchievements;
            const isCurrent = r.name === rankInfo.rank.name;
            return (
              <span
                key={r.name}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border ${
                  isCurrent ? "border-transparent" : "border-line"
                } ${reached ? "" : "opacity-40"}`}
                style={
                  isCurrent
                    ? { backgroundColor: `${r.color}22`, color: r.color }
                    : undefined
                }
                title={`${r.minAchievements}+ achievements`}
              >
                {r.icon} {r.name}
              </span>
            );
          })}
        </div>
      </section>

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

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Dumbbell,
  BookOpen,
  Flame,
  Target,
  BarChart3,
  Trophy,
  type LucideIcon,
} from "lucide-react";

const GROUPS: { label: string; links: { href: string; label: string; icon: LucideIcon }[] }[] = [
  {
    label: "Overview",
    links: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/calendar", label: "Calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Track",
    links: [
      { href: "/training", label: "Training", icon: Dumbbell },
      { href: "/study", label: "Study", icon: BookOpen },
      { href: "/habits", label: "Habits", icon: Flame },
      { href: "/goals", label: "Goals", icon: Target },
    ],
  },
  {
    label: "Progress",
    links: [
      { href: "/stats", label: "Stats", icon: BarChart3 },
      { href: "/achievements", label: "Achievements", icon: Trophy },
    ],
  },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex sm:flex-col gap-1 sm:gap-4 overflow-x-auto sm:overflow-visible">
      {GROUPS.map((g) => (
        <div key={g.label} className="flex sm:flex-col gap-1">
          <p className="hidden sm:block px-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-muted/70">
            {g.label}
          </p>
          {g.links.map((l) => {
            const active =
              pathname === l.href || pathname.startsWith(l.href + "/");
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap transition duration-150 ${
                  active
                    ? "bg-brand-50 text-ink"
                    : "text-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                {/* Active rail — the one loud cue; icon tint seconds it. */}
                {active && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand-500"
                  />
                )}
                <Icon
                  size={18}
                  aria-hidden
                  className={active ? "text-brand-400" : ""}
                />
                {l.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

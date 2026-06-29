"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/training", label: "Training", icon: "💪" },
  { href: "/study", label: "Study", icon: "📚" },
  { href: "/habits", label: "Habits", icon: "🔥" },
  { href: "/goals", label: "Goals", icon: "🎯" },
  { href: "/achievements", label: "Achievements", icon: "🏆" },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible">
      {LINKS.map((l) => {
        const active = pathname === l.href || pathname.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition ${
              active
                ? "bg-brand-50 text-brand-600"
                : "text-muted hover:bg-brand-50/60 hover:text-ink"
            }`}
          >
            <span aria-hidden>{l.icon}</span>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

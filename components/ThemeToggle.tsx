"use client";

import { useTheme } from "@/components/ThemeProvider";

export default function ThemeToggle() {
  const { isDark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="btn-ghost w-full justify-start text-sm"
      aria-label="Toggle dark mode"
    >
      {isDark ? "☀️ Light mode" : "🌙 Dark mode"}
    </button>
  );
}

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic tokens — CSS-var driven (see globals.css). Dark-only.
        bg: "rgb(var(--c-bg) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        "surface-2": "rgb(var(--c-surface-2) / <alpha-value>)",
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        muted: "rgb(var(--c-muted) / <alpha-value>)",
        line: "rgb(var(--c-line) / <alpha-value>)",
        "line-bright": "rgb(var(--c-line-bright) / <alpha-value>)",
        brand: {
          50: "rgb(var(--c-brand-50) / <alpha-value>)",
          100: "#16213D",
          400: "#7AA5FF",
          500: "#4D7CFF",
          600: "#2E5BFF",
        },
        // Semantic accents, tuned for dark surfaces.
        mint: "#3DD68C", // success
        peach: "#FF8A7A", // soft danger
        lilac: "#8FA8FF", // info
        amber: "#FFB454", // warning / streak fire
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        confetti: {
          "0%": { transform: "translateY(-10vh) rotate(0deg)", opacity: "1" },
          "100%": {
            transform: "translateY(105vh) rotate(720deg)",
            opacity: "0",
          },
        },
        // One-shot highlight sweep across a progress bar on XP gain.
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(300%)" },
        },
        // Ambient breathing glow — earned only while the focus timer runs.
        breathe: {
          "0%, 100%": { boxShadow: "0 0 12px rgba(77,124,255,0.15)" },
          "50%": { boxShadow: "0 0 32px rgba(77,124,255,0.35)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.2s ease-out",
        confettiFall: "confetti 1.4s ease-in forwards",
        shimmer: "shimmer 0.9s cubic-bezier(0.22,1,0.36,1)",
        breathe: "breathe 2.5s ease-in-out infinite",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;

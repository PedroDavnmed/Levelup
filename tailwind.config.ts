import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Clean & minimal: light surfaces, soft pastel accents
        bg: "#f7f8fa",
        surface: "#ffffff",
        ink: "#1f2430",
        muted: "#6b7280",
        line: "#e7e9ee",
        brand: {
          50: "#eef4ff",
          100: "#dbe6ff",
          400: "#7b9cff",
          500: "#5b7cfa",
          600: "#4763e6",
        },
        mint: "#7fd1ae",
        peach: "#ffb59e",
        lilac: "#c3b4f5",
        amber: "#f6c66b",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16,24,40,0.04), 0 8px 24px rgba(16,24,40,0.06)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

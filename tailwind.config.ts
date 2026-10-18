import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        tijori: {
          bg: "#0B0F19",
          surface: "#111827",
          subtle: "#161F30",
          border: "#1E293B",
          borderLight: "#334155",
          gold: "#F59E0B",
          goldLight: "#FBBF24",
          goldDark: "#B45309",
          emerald: "#10B981",
          emeraldLight: "#34D399",
          rose: "#F43F5E",
          roseLight: "#FB7185",
          muted: "#94A3B8",
          dim: "#64748B",
        },
      },
      boxShadow: {
        glowGold: "0 0 25px -5px rgba(245, 158, 11, 0.25)",
        glowEmerald: "0 0 25px -5px rgba(16, 185, 129, 0.25)",
        glowRose: "0 0 25px -5px rgba(244, 63, 94, 0.25)",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;

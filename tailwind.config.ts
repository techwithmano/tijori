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
          bg: "#F8FAFC",
          surface: "#FFFFFF",
          subtle: "#F1F5F9",
          border: "#E2E8F0",
          borderLight: "#CBD5E1",
          primary: "#0F172A",
          secondary: "#475569",
          muted: "#94A3B8",
          gold: "#D97706",
          goldLight: "#F59E0B",
          goldBg: "#FFFBEB",
          goldBorder: "#FDE68A",
          sage: "#059669",
          sageLight: "#10B981",
          sageBg: "#ECFDF5",
          sageBorder: "#A7F3D0",
          rose: "#E11D48",
          roseLight: "#F43F5E",
          roseBg: "#FFF1F2",
          roseBorder: "#FECDD3",
        },
      },
      boxShadow: {
        card: "0 10px 30px -5px rgba(15, 23, 42, 0.04), 0 0 0 1px rgba(226, 232, 240, 0.8)",
        cardHover: "0 20px 35px -5px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(217, 119, 6, 0.3)",
        glowGold: "0 10px 25px -5px rgba(217, 119, 6, 0.15)",
        glowSage: "0 10px 25px -5px rgba(5, 150, 105, 0.15)",
        glowRose: "0 10px 25px -5px rgba(225, 29, 72, 0.15)",
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

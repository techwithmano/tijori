import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "#0B0A14",
        surface: "#15131F",
        raised: "#1E1B2B",
        line: "#2A2639",
        text: "#F5F3FF",
        muted: "#A29DB8",
        accent: {
          DEFAULT: "#C6FF3D",
          foreground: "#0B0A14",
        },
        violet: {
          DEFAULT: "#7C5CFF",
          glow: "rgba(124, 92, 255, 0.25)",
        },
        coral: {
          DEFAULT: "#FF5C7A",
        },
        mint: {
          DEFAULT: "#3DFFB0",
        },
        // Keep tijori namespace mapped for backward compatibility while migrating
        tijori: {
          bg: "#0B0A14",
          surface: "#15131F",
          subtle: "#1E1B2B",
          border: "#2A2639",
          borderLight: "#2A2639",
          primary: "#F5F3FF",
          secondary: "#A29DB8",
          muted: "#A29DB8",
        },
      },
      borderRadius: {
        card: "20px",
        btn: "999px",
      },
      boxShadow: {
        violetGlow: "0 0 35px -5px rgba(124, 92, 255, 0.25)",
        violetSubtle: "0 0 20px -3px rgba(124, 92, 255, 0.15)",
        limeGlow: "0 0 30px -5px rgba(198, 255, 61, 0.3)",
        coralGlow: "0 0 30px -5px rgba(255, 92, 122, 0.25)",
        card: "0 0 25px -5px rgba(124, 92, 255, 0.12), 0 0 0 1px rgba(42, 38, 57, 0.9)",
        cardHover: "0 0 35px -5px rgba(124, 92, 255, 0.22), 0 0 0 1px rgba(124, 92, 255, 0.4)",
      },
      fontSize: {
        xs: ["13px", { lineHeight: "1.25rem" }],
      },
      fontFamily: {
        heading: ["var(--font-heading)", "var(--font-arabic)", "sans-serif"],
        body: ["var(--font-body)", "var(--font-arabic)", "sans-serif"],
        arabic: ["var(--font-arabic)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

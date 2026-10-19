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
        bg: "#13121A",
        surface: "#1E1D2A",
        raised: "#282637",
        line: "#343245",
        text: "#F8F7FF",
        muted: "#ACA7C2",
        accent: {
          DEFAULT: "#D4FF00",
          foreground: "#13121A",
        },
        violet: {
          DEFAULT: "#8B6DFF",
          glow: "rgba(139, 109, 255, 0.25)",
        },
        coral: {
          DEFAULT: "#FF5773",
        },
        mint: {
          DEFAULT: "#00E599",
        },
        // Keep tijori namespace mapped for backward compatibility while migrating
        tijori: {
          bg: "#13121A",
          surface: "#1E1D2A",
          subtle: "#282637",
          border: "#343245",
          borderLight: "#343245",
          primary: "#F8F7FF",
          secondary: "#ACA7C2",
          muted: "#ACA7C2",
        },
      },
      borderRadius: {
        card: "22px",
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

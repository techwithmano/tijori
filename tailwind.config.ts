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
        bg: "var(--bg)",
        "bg-warm": "var(--bg-warm)",
        surface: "var(--surface)",
        raised: "var(--raised)",
        line: "var(--line)",
        text: "var(--text)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        violet: {
          DEFAULT: "var(--violet)",
          light: "#886BFF",
        },
        lime: {
          DEFAULT: "var(--lime)",
        },
        coral: {
          DEFAULT: "var(--coral)",
        },
        sun: {
          DEFAULT: "var(--sun)",
        },
        mint: {
          DEFAULT: "var(--mint)",
        },
        accent: {
          DEFAULT: "var(--lime)",
          foreground: "var(--ink)",
        },
        // tijori namespace
        tijori: {
          bg: "var(--bg)",
          surface: "var(--surface)",
          subtle: "var(--raised)",
          border: "var(--line)",
          borderLight: "var(--line)",
          primary: "var(--ink)",
          secondary: "var(--muted)",
          muted: "var(--muted)",
        },
      },
      borderRadius: {
        card: "24px",
        btn: "999px",
      },
      boxShadow: {
        hard: "4px 4px 0 var(--ink)",
        hardLg: "6px 6px 0 var(--ink)",
        hardSm: "2px 2px 0 var(--ink)",
        hardHover: "2px 2px 0 var(--ink)",
        none: "0 0 0 transparent",
        // legacy compat
        violetGlow: "4px 4px 0 var(--ink)",
        violetSubtle: "2px 2px 0 var(--ink)",
        limeGlow: "4px 4px 0 var(--ink)",
        coralGlow: "4px 4px 0 var(--ink)",
        card: "4px 4px 0 var(--ink)",
        cardHover: "2px 2px 0 var(--ink)",
      },
      fontSize: {
        xs: ["13px", { lineHeight: "1.25rem" }],
        sm: ["14px", { lineHeight: "1.25rem" }],
        base: ["16px", { lineHeight: "1.5rem" }],
        lg: ["18px", { lineHeight: "1.65rem" }],
        xl: ["20px", { lineHeight: "1.75rem" }],
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

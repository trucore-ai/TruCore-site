import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
        xl: "2.5rem",
        "2xl": "3rem",
      },
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      colors: {
        primary: {
          50: "#eef8ff",
          100: "#d8efff",
          200: "#b8e3ff",
          300: "#8ed3ff",
          400: "#5cbcfb",
          500: "#349de8",
          600: "#2582cb",
          700: "#2069a5",
        },
        accent: {
          200: "#ffe0b2",
          300: "#f0a050",
          400: "#f08a1f",
          500: "#d86c08",
          600: "#b85700",
        },
        neutral: {
          950: "#050a14",
          900: "#0b1220",
          800: "#162236",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      spacing: {
        section: "5rem",
      },
      borderRadius: {
        xl: "0.875rem",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.15)",
        elevated: "0 12px 32px rgba(0,0,0,0.4), 0 4px 8px rgba(0,0,0,0.25)",
        glow: "0 0 24px rgba(52,157,232,0.12), 0 0 8px rgba(52,157,232,0.08)",
        "glow-accent": "0 0 24px rgba(240,138,31,0.12), 0 0 8px rgba(240,138,31,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
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
          400: "#ffb347",
          500: "#ff9b2f",
          600: "#f07f18",
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
    },
  },
  plugins: [],
};

export default config;
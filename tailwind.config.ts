import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Primary - Sage Green
        sage: {
          DEFAULT: "#7D9A78",
          light: "#A8C4A2",
          dark: "#5C7A56",
          50: "#f3f6f2",
          100: "#e4ebe3",
          200: "#c9d7c6",
          300: "#A8C4A2",
          400: "#7D9A78",
          500: "#5C7A56",
          600: "#4a6245",
          700: "#3d5039",
          800: "#334230",
          900: "#2b3729",
        },
        // Secondary - Terracotta
        terracotta: {
          DEFAULT: "#C4704B",
          light: "#E09070",
          dark: "#A85A3A",
          50: "#fdf6f3",
          100: "#fceae3",
          200: "#f9d5c7",
          300: "#E09070",
          400: "#C4704B",
          500: "#A85A3A",
          600: "#8f4a30",
          700: "#763d28",
          800: "#623425",
          900: "#522e22",
        },
        // Accent - Mustard
        mustard: {
          DEFAULT: "#D4A84B",
          light: "#E8C878",
          dark: "#B8923A",
          50: "#fdfaf2",
          100: "#faf3de",
          200: "#f4e5bb",
          300: "#E8C878",
          400: "#D4A84B",
          500: "#B8923A",
          600: "#9a7730",
          700: "#7d5e28",
          800: "#684d26",
          900: "#594123",
        },
        // Deep/Grounding
        earth: {
          DEFAULT: "#3D3229",
          deep: "#3D3229",
          warm: "#6B5B4F",
        },
        // Neutrals
        cream: {
          DEFAULT: "#FAF7F2",
          50: "#FFFEF9",
          100: "#FAF7F2",
          200: "#E8E4DE",
        },
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Quicksand", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#12161D",
          soft: "#1B212B",
          line: "#2A3240",
        },
        paper: "#F7F5F0",
        card: "#FFFFFF",
        border: {
          DEFAULT: "#E6E1D6",
          soft: "#EEEAE0",
        },
        text: {
          DEFAULT: "#1A1F27",
          muted: "#6B7280",
          faint: "#9CA3AF",
        },
        brand: {
          DEFAULT: "#AD7A2E",
          dark: "#8F6524",
          soft: "#F3E7D2",
          50: "#FBF6EC",
        },
        success: {
          DEFAULT: "#2F9E6E",
          soft: "#E1F2EA",
        },
        danger: {
          DEFAULT: "#C6564A",
          soft: "#FBE8E5",
        },
        info: {
          DEFAULT: "#3B6E99",
          soft: "#E7EFF5",
        },
      },
      fontFamily: {
        display: [
          "Fraunces",
          "Georgia",
          "'Iowan Old Style'",
          "'Palatino Linotype'",
          "Palatino",
          "serif",
        ],
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "'IBM Plex Mono'",
          "'SFMono-Regular'",
          "Consolas",
          "'Liberation Mono'",
          "Menlo",
          "monospace",
        ],
      },
      borderRadius: {
        xl: "0.85rem",
        "2xl": "1.1rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(18, 22, 29, 0.04), 0 1px 12px rgba(18, 22, 29, 0.03)",
        popover: "0 8px 30px rgba(18, 22, 29, 0.12)",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(47, 158, 110, 0.55)" },
          "70%": { boxShadow: "0 0 0 8px rgba(47, 158, 110, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(47, 158, 110, 0)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 2s infinite",
        "fade-up": "fade-up 0.35s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;

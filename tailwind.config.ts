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
        ink: { DEFAULT: "#0B1220", soft: "#131C30", line: "#25324A" },
        paper: "#F6F7FA",
        card: "#FFFFFF",
        border: { DEFAULT: "#E5E7EB", soft: "#EEF0F3" },
        text: { DEFAULT: "#0B1220", muted: "#5B6472", faint: "#9AA3B2" },
        brand: {
          DEFAULT: "#2563EB",
          dark: "#1D4ED8",
          light: "#60A5FA",
          soft: "#E9F0FE",
          50: "#F3F7FF",
        },
        success: { DEFAULT: "#16A34A", soft: "#E5F6EA" },
        danger: { DEFAULT: "#DC2626", soft: "#FBE9E8" },
        info: { DEFAULT: "#60A5FA", soft: "#EAF2FE" },
      },
      fontFamily: {
        display: ["Inter", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "Helvetica", "Arial", "sans-serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "Helvetica", "Arial", "sans-serif"],
        mono: ["'IBM Plex Mono'", "'SFMono-Regular'", "Consolas", "'Liberation Mono'", "Menlo", "monospace"],
      },
      borderRadius: { xl: "0.85rem", "2xl": "1.1rem" },
      boxShadow: {
        card: "0 1px 2px rgba(11, 18, 32, 0.04), 0 1px 12px rgba(11, 18, 32, 0.04)",
        popover: "0 8px 30px rgba(11, 18, 32, 0.14)",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(22, 163, 74, 0.55)" },
          "70%": { boxShadow: "0 0 0 8px rgba(22, 163, 74, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(22, 163, 74, 0)" },
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

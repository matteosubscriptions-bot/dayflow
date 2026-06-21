import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--color-ink)",
        canvas: "var(--color-canvas)",
        mist: "var(--color-mist)",
        focus: "var(--color-focus)",
        achieved: "var(--color-achieved)",
        attention: "var(--color-attention)",
        low: "var(--color-low)",
        mood: {
          1: "var(--mood-1)",
          2: "var(--mood-2)",
          3: "var(--mood-3)",
          4: "var(--mood-4)",
          5: "var(--mood-5)",
        },
      },
      fontFamily: {
        display: ["var(--font-lora)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        sheet: "20px",
      },
      maxWidth: {
        content: "640px",
      },
      keyframes: {
        "slide-in": {
          "0%": { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.3)", opacity: "0" },
          "100%": { transform: "scale(1.3)", opacity: "0" },
        },
        "wave": {
          "0%, 100%": { transform: "scaleY(0.4)" },
          "50%": { transform: "scaleY(1)" },
        },
        "pop": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.15)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "slide-in": "slide-in 0.32s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "pulse-ring": "pulse-ring 1.6s cubic-bezier(0.215, 0.61, 0.355, 1) infinite",
        "wave": "wave 1s ease-in-out infinite",
        "pop": "pop 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;

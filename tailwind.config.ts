import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        blush: {
          50: "#fff5f6",
          100: "#ffe9ec",
          200: "#ffd1d9",
          300: "#ffaebb",
          400: "#fb7d94",
          500: "#f0526f",
          600: "#d93a58",
          700: "#b62c46",
          800: "#95263c",
          900: "#7c2436",
        },
        cream: "#fffaf3",
      },
      fontFamily: {
        sans: ["Nunito", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        shake: {
          "10%, 90%": { transform: "translateX(-1px)" },
          "20%, 80%": { transform: "translateX(2px)" },
          "30%, 50%, 70%": { transform: "translateX(-4px)" },
          "40%, 60%": { transform: "translateX(4px)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        shake: "shake 0.5s",
        "pop-in": "pop-in 0.15s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;

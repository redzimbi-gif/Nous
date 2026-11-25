import type { Config } from "tailwindcss";

// Les couleurs « sémantiques » lisent des variables CSS (voir globals.css).
// Les échelles d'origine (blush, grape, cream) restent disponibles : le code
// existant continue donc de fonctionner pendant la migration vers le nouveau visuel.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: token("bg"),
        surface: { DEFAULT: token("surface"), 2: token("surface-2") },
        ink: token("ink"),
        muted: token("muted"),
        subtle: token("subtle"),
        primary: { DEFAULT: token("primary"), ink: token("primary-ink"), on: token("on-primary") },
        tint: { DEFAULT: token("tint"), ink: token("on-tint") },
        accent: token("accent"),
        warm: { DEFAULT: token("warm"), ink: token("on-warm") },
        ok: { DEFAULT: token("ok"), ink: token("on-ok") },
        danger: { DEFAULT: token("danger"), soft: token("danger-soft") },
        tone: { bg: token("tone-bg"), ink: token("tone-ink") },
        cat: { bg: token("cat-bg"), ink: token("cat-ink") },
        line: "rgb(var(--ink) / 0.08)",
        blush: {
          50: "#fff5f6", 100: "#ffe9ec", 200: "#ffd1d9", 300: "#ffaebb", 400: "#fb7d94",
          500: "#f0526f", 600: "#d93a58", 700: "#b62c46", 800: "#95263c", 900: "#7c2436",
        },
        cream: "#fffaf3",
        grape: {
          50: "#f7f1fb", 100: "#ecdcf7", 200: "#dcbdef", 300: "#c896e3", 400: "#af6dd2",
          500: "#8f52ba", 600: "#763f9c", 700: "#602f81", 800: "#4d2568", 900: "#3f1f54",
        },
      },
      fontFamily: {
        sans: ["Nunito Variable", "Nunito", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Fredoka Variable", "Fredoka", "ui-rounded", "system-ui", "sans-serif"],
      },
      borderRadius: { "4xl": "2rem" },
      boxShadow: {
        card: "0 1px 2px rgb(var(--ink) / .04), 0 10px 30px -14px rgb(var(--ink) / .16)",
        float: "0 10px 32px -8px rgb(var(--ink) / .30), 0 2px 6px rgb(var(--ink) / .08)",
        sheet: "0 -16px 48px -12px rgb(var(--ink) / .30)",
        press: "inset 0 1px 0 rgb(255 255 255 / .22), 0 6px 16px -6px rgb(var(--primary) / .55)",
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
        "float-up": {
          "0%": { opacity: "0", transform: "translateY(0) scale(0.5)" },
          "15%": { opacity: "1", transform: "translateY(-10px) scale(1.15)" },
          "80%": { opacity: "1", transform: "translateY(-100px) scale(1)" },
          "100%": { opacity: "0", transform: "translateY(-130px) scale(0.9)" },
        },
        rise: { from: { opacity: "0", transform: "translateY(10px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        fade: { from: { opacity: "0" }, to: { opacity: "1" } },
        "sheet-up": { from: { transform: "translateY(100%)" }, to: { transform: "translateY(0)" } },
        flash: { "0%": { backgroundColor: "rgb(var(--tint))" }, "100%": { backgroundColor: "transparent" } },
      },
      animation: {
        shake: "shake 0.5s",
        "pop-in": "pop-in 0.15s ease-out",
        "float-up": "float-up 1.6s ease-out forwards",
        // « backwards » et non « both » : un transform qui reste appliqué après l'animation ferait de l'écran
        // le repère des éléments « fixed » (visionneuses, caméra, réactions) au lieu de la fenêtre.
        rise: "rise .38s cubic-bezier(.2,.8,.2,1) backwards",
        fade: "fade .25s ease-out both",
        "sheet-up": "sheet-up .32s cubic-bezier(.2,.8,.2,1) both",
        flash: "flash 1.4s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;

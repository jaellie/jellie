/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/sidepanel/**/*.{html,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warm, editorial neutrals — the base surface of the app.
        cream: {
          50: "#fbfaf7",
          100: "#f6f3ed",
          200: "#efeae1",
          300: "#e3ddd0",
        },
        ink: {
          900: "#211f1d", // primary text — warm charcoal, not pure black
          700: "#4a453f",
          500: "#7a746b", // secondary/muted text
          300: "#a39d92",
          200: "#d8d2c6",
        },
        // Restrained accent used for the brand mark / primary actions only
        // — never for journey identity (see the `journey` palette below).
        paw: {
          50: "#f8f4ee",
          100: "#efe6d8",
          400: "#a9834f",
          500: "#8f6c3d",
          600: "#725430",
          700: "#5b4326",
        },
        // Per-journey identity colors. Muted, low-saturation, accessible —
        // color marks *context*, never website type (see journeyColor.ts).
        journey: {
          blue: { bg: "#eaeff4", text: "#3f5872", dot: "#6c88a3" },
          sage: { bg: "#eef1e7", text: "#556b45", dot: "#84996f" },
          terracotta: { bg: "#f5ece5", text: "#8a5738", dot: "#bd8156" },
          lavender: { bg: "#f0eef4", text: "#655a80", dot: "#948aab" },
          rose: { bg: "#f5eaec", text: "#8a4a56", dot: "#bd7986" },
          amber: { bg: "#f6f0e2", text: "#8a6a25", dot: "#c4a24f" },
        },
      },
      fontFamily: {
        // A single editorial serif for headings/titles, a plain system sans
        // for everything else — no remote font fetches (offline, CSP-safe).
        serif: [
          "Iowan Old Style",
          "Palatino Linotype",
          "URW Palladio L",
          "P052",
          "Georgia",
          "serif",
        ],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(33, 31, 29, 0.04)",
      },
    },
  },
  plugins: [],
};

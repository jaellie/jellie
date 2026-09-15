/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/sidepanel/**/*.{html,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paw: {
          50: "#fefaf3",
          100: "#fdf1de",
          200: "#fbe0b8",
          300: "#f7c983",
          400: "#f2a94d",
          500: "#ec8d28",
          600: "#d9770f",
          700: "#b45f0e",
          800: "#8f4c13",
          900: "#743f13",
        },
      },
      fontFamily: {
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
    },
  },
  plugins: [],
};

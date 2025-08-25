/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        rose: "#b2455f",
        "rose-soft": "#d97a90",
        off: "#fbf8f6",
        ink: "#2b2b2b",
      },
      fontFamily: {
        heading: ["Playfair Display", "serif"],
        body: ["Cairo", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

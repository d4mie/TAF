/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./dist/**/*.{html,js}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        nothingyoucoulddo: ["Nothing You Could Do", "cursive"],
        signika: ["Montserrat", "system-ui", "sans-serif"],
        montserrat: ["Montserrat", "system-ui", "sans-serif"],
        sans: ["Montserrat", "system-ui", "sans-serif"],
        serif: ["Montserrat", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

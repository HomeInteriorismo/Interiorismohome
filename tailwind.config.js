/** @type {import('tailwindcss').Config} */
module.exports = {
  // :hover solo en mouse; en celular no se queda "pegado" después de tocar
  future: { hoverOnlyWhenSupported: true },
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

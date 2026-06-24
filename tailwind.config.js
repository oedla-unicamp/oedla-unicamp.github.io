/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: '#ffbf00',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        'archivo-narrow': ['"Archivo Narrow"', 'sans-serif'],
        'archivo-black': ['"Archivo Black"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

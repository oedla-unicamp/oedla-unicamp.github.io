/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './index.html',
    './pages/**/*.html',
    './components/**/*.html',
    './js/**/*.js',
    './script.js',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ffbf00',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
        'archivo-narrow': ['"Archivo Narrow"', 'sans-serif'],
        'archivo-black': ['"Archivo Black"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

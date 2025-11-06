/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        pico: {
          primary: {
            DEFAULT: '#1095c1',
            hover: '#0d7ea2',
          },
          secondary: {
            DEFAULT: '#5a6c7d',
            hover: '#4a5867',
          },
          contrast: {
            DEFAULT: '#0f172a',
          },
        },
      },
    },
  },
  plugins: [],
}


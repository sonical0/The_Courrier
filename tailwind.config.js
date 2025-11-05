// tailwind.config.js — breakpoints alignés à tes médias
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      screens: {
        // Mobile: ≤ 576px -> classes "de base" (pas de prefixe)
        sm: "577px",      // Tablette 577–768
        md: "769px",      // Petit laptop 769–992
        xl: "1200px",     // Desktop ≥1200
        "2xl": "1400px",  // Grand écran ≥1400
      },
    },
  },
  plugins: [],
};

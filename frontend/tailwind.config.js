/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          200: '#c3d9eb',
          300: '#95bedc',
          400: '#609dc9',
          500: '#3b80b3',
          600: '#2b6695',
          700: '#245279',
          800: '#204665',
          900: '#0f2438', // Deep navy
        },
        slate: {
          850: '#172033',
        }
      },
    },
  },
  plugins: [],
}


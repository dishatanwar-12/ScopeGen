/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['Playfair Display', 'Cormorant Garamond', 'Newsreader', 'Georgia', 'serif'],
      },
      colors: {
        obsidian: {
          DEFAULT: '#111215',
          dark: '#0D0E11',
          card: '#16181D',
          border: '#23262D',
          hover: '#1B1D23',
        },
        stone: {
          50: '#FAF8F5',
          100: '#F3EFEA',
          200: '#E7E2D8',
          300: '#D5CFC3',
          400: '#A39D90',
          500: '#73706B',
          800: '#2A2927',
          900: '#1A1A1A',
        },
        brand: {
          50: '#f8f8f8',
          100: '#ebebeb',
          200: '#d6d6d6',
          700: '#2a2b2e',
          800: '#1c1d20',
          900: '#111215',
        }
      },
    },
  },
  plugins: [],
}


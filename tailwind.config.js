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
          royal: '#123E91',
          'royal-dark': '#0B2963',
          'royal-light': '#1A53BF',
          medical: '#087DBA',
          'medical-light': '#0A94DC',
          cyan: '#16B7D8',
          'cyan-light': '#E6F8FB',
          lime: '#B5CB00',
          'lime-dark': '#94A600',
          'lime-light': '#F4F8D4',
          dark: '#172B43',
          darker: '#0F1D2D',
          muted: '#627D98',
          subtle: '#8FA0B5',
          bg: '#F5F8FC',
          card: '#FFFFFF',
          border: '#E2E8F0',
        }
      },
      fontFamily: {
        arabic: ['"Alexandria"', '"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        heading: ['"Alexandria"', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(18, 62, 145, 0.06)',
        'elevated': '0 10px 30px -5px rgba(18, 62, 145, 0.1)',
        'hover': '0 20px 40px -10px rgba(18, 62, 145, 0.15)',
        'card': '0 2px 12px 0 rgba(18, 62, 145, 0.04)',
        'inner-light': 'inset 0 1px 2px rgba(255, 255, 255, 0.4)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}

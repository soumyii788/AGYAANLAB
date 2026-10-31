/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0B1120',
          sidebar: '#101827',
          card: '#172235',
          border: '#1E293B',
          hover: '#1F2E45',
          muted: '#94A3B8',
        },
        accent: {
          DEFAULT: '#38BDF8',
          hover: '#0EA5E9',
          light: '#BAE6FD',
          dark: '#0369A1',
        },
        slate: {
          text: '#F8FAFC',
          secondary: '#CBD5E1',
          subtle: '#64748B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

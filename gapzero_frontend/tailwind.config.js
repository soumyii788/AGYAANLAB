/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#080C15', // Canvas dark navy background
          900: '#0E1626', // Surface / Card container
          850: '#141F36', // Elevated surface / Modal / Hover state
          800: '#1E2C4A', // Subtle navy border
          700: '#2A3C63', // Active border
          text: '#F8FAFC', // Primary text
          muted: '#94A3B8', // Secondary muted text
          accent: '#3B82F6', // Cobalt blue accent
          accentGlow: 'rgba(59, 130, 246, 0.15)',
        },
        brand: {
          bg: '#080C15',
          surface: '#0E1626',
          ink: '#F8FAFC',
          muted: '#94A3B8',
          border: '#1E2C4A',
          cobalt: {
            DEFAULT: '#3B82F6',
            hover: '#2563EB',
            light: 'rgba(59, 130, 246, 0.15)',
            dark: '#1D4ED8',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

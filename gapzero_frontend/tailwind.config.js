/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kaggle: {
          bg: '#FFFFFF',
          subtle: '#F8F9FA',
          cream: '#F9F8F4',
          surface: '#FFFFFF',
          card: '#FFFFFF',
          dark: '#202124',
          black: '#121212',
          blue: '#20BEFF',      // Kaggle cyan
          googleBlue: '#1A73E8',// Google / Kaggle action blue
          gold: '#F9AB00',      // Kaggle leaderboard gold
          green: '#1E8E3E',
          red: '#D93025',
          border: '#E0E0E0',
          borderLight: '#F1F3F4',
          text: '#202124',
          muted: '#5F6368',
          secondary: '#80868B',
        },
        navy: {
          950: '#F8F9FA', // Page background
          900: '#FFFFFF', // Card container
          850: '#FFFFFF', // Hover state
          800: '#E8EAED', // Border
          700: '#DADCE0', // Active border
          text: '#202124', // Primary text
          muted: '#5F6368', // Secondary muted text
          accent: '#20BEFF', // Kaggle cyan
          accentGlow: 'rgba(32, 190, 255, 0.15)',
        },
        brand: {
          bg: '#F8F9FA',
          surface: '#FFFFFF',
          ink: '#202124',
          muted: '#5F6368',
          border: '#E8EAED',
          cobalt: {
            DEFAULT: '#202124',
            hover: '#000000',
            light: 'rgba(32, 190, 255, 0.1)',
            dark: '#121212',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'Google Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Roboto Mono', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'kaggle': '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)',
        'kaggle-card': '0 1px 2px 0 rgba(60,64,67,0.1), 0 1px 3px 1px rgba(60,64,67,0.05)',
      }
    },
  },
  plugins: [],
}

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
          bg: '#F9F9FB',        // Soft, low-contrast off-white (60%)
          surface: '#FFFFFF',   // Pure white for cards, containers
          ink: '#1E2022',       // Ink Black primary text
          muted: '#4A4D55',     // Charcoal Gray for secondary text & labels
          border: '#E5E7EB',    // Subtle panel borders
          cobalt: {             // Intentional Accent (10%)
            DEFAULT: '#3B82F6',
            hover: '#2563EB',
            light: '#EFF6FF',
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

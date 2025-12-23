/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        radar: {
          bg: '#0f0f1a',
          panel: '#1a1a2e',
          border: '#2d2d44',
          accent: '#ef4444',
          player: {
            local: '#3b82f6',
            teammate: '#22c55e',
            pmc: '#ef4444',
            scav: '#f97316',
            bot: '#fbbf24',
            dead: '#555555',
          }
        }
      }
    },
  },
  plugins: [],
}

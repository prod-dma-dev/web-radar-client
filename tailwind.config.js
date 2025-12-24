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
          bg: '#0a0a12',
          panel: '#12121e',
          'panel-light': '#1a1a2e',
          border: '#2d2d44',
          'border-light': '#3d3d5c',
          accent: '#6366f1',
          'accent-hover': '#818cf8',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          muted: '#6b7280',
          player: {
            local: '#3b82f6',
            teammate: '#22c55e',
            pmc: '#ef4444',
            scav: '#f97316',
            bot: '#fbbf24',
            dead: '#555555',
          }
        }
      },
      boxShadow: {
        'glow': '0 0 20px rgba(99, 102, 241, 0.15)',
        'glow-sm': '0 0 10px rgba(99, 102, 241, 0.1)',
      }
    },
  },
  plugins: [],
}

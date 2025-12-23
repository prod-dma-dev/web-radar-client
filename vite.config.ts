import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Set base to repo name for GitHub Pages
  // Leave as '/' for custom domain or local dev
  base: process.env.GITHUB_PAGES ? '/web-radar-client/' : '/',
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
  },
})

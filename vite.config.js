import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // Relative asset URLs, so the build works from any path (e.g. GitHub Pages
  // serves it from /integration-designer/)
  base: './',
  server: {
    port: 3000
  },
  preview: {
    port: 3000
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.js']
  }
})

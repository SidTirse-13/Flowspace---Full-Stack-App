import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 3000, // always runs on :3000 (matches backend CORS)

    proxy: {
      // Any request starting with /api goes to the backend
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // No rewrite needed — keeps /api prefix as-is
      },
    },
  },
})
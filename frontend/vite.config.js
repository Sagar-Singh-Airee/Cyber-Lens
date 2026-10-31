import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Keep local and preview ports predictable for the README, Docker Compose, and
// CORS allow-list. The API is deliberately not proxied to hide its boundary.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  preview: { port: 4173 }
})

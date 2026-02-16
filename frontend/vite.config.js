import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
<<<<<<< HEAD
  server: {
    hmr: {
      // Use WebSocket for HMR instead of eval() when possible
      protocol: 'ws',
    },
  },
  build: {
    // Disable eval in production builds
    target: 'esnext',
    minify: 'esbuild',
  },
=======
>>>>>>> aab06bff0fb9ea60069218971278a7b761ccd9c6
})

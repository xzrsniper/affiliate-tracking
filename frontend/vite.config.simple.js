import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Simplified config without esbuild bundling
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    strictPort: false,
    hmr: {
      protocol: 'ws',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/track': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/pixel.js': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  // Disable esbuild optimizations that cause EPERM errors
  optimizeDeps: {
    disabled: true,
  },
  build: {
    target: 'esnext',
    minify: false,
  },
})

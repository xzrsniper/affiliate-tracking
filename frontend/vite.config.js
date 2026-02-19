import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
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
  // Skip config file bundling to avoid esbuild EPERM
  clearScreen: false,
  optimizeDeps: {
    force: false,
  },
  build: {
    target: 'esnext',
    minify: false,
  },
  define: {
    __BUILD_ID__: JSON.stringify(Date.now()),
  },
})

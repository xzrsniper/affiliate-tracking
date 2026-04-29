import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Non-blocking load for hashed /assets/*.css (Lighthouse «render-blocking resources»). */
function deferBundledCss() {
  return {
    name: 'defer-bundled-css',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        /<link rel="stylesheet"([^>]*)>/g,
        (full, attrs) => {
          if (!/href="\/assets\/[^"]+\.css"/.test(attrs)) return full
          return `<link rel="stylesheet"${attrs} media="print" onload="this.media='all'"><noscript><link rel="stylesheet"${attrs}></noscript>`
        }
      )
    }
  }
}

export default defineConfig({
  plugins: [react(), deferBundledCss()],
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
  clearScreen: false,
  optimizeDeps: {
    force: false,
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'charts': ['recharts'],
          'icons': ['lucide-react'],
          'dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          'i18n': ['i18next', 'react-i18next'],
        },
      },
    },
  },
  define: {
    __BUILD_ID__: JSON.stringify(Date.now()),
  },
})

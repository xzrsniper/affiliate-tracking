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

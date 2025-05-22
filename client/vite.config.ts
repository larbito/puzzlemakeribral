import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  base: '/',
  plugins: [
    react({
      tsDecorators: true,
      jsxImportSource: '@emotion/react'
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5177,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['framer-motion', 'styled-components'],
          radix: [
            '@radix-ui/react-radio-group',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            '@radix-ui/react-slider'
          ],
          utils: ['@react-pdf/renderer']
        }
      },
      external: [] // Leave external empty to properly bundle all dependencies
    },
    minify: true,
    target: 'es2015',
    chunkSizeWarningLimit: 2000,
    reportCompressedSize: true,
    assetsDir: 'assets',
    emptyOutDir: true
  },
  esbuild: {
    drop: ['console', 'debugger'],
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  logLevel: 'info',
  clearScreen: false
}); 